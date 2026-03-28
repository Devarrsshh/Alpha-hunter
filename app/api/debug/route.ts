import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '@/lib/supabase';

const TEST_HUNTERS = ['Airdropalertcom', 'jakefromweb3', 'DeFiMinty', 'mztacat', 'DefiIgnas'];

export async function GET() {
  const log: Record<string, unknown> = {};

  // ── 1. Fetch tweets from 5 active crypto hunters ──
  const fetches = await Promise.all(
    TEST_HUNTERS.map(async (username) => {
      const res = await fetch(
        `https://api.twitterapi.io/twitter/user/last_tweets?userName=${username}&limit=5`,
        { headers: { 'X-API-Key': process.env.TWITTER_API_KEY! } }
      );
      const json = await res.json();
      const tweets: Array<{ text?: string; url?: string }> = json?.data?.tweets ?? [];
      return { username, tweets, http_status: res.status, count: tweets.length };
    })
  );

  const tweetLines: string[] = [];
  for (const { username, tweets } of fetches) {
    for (const t of tweets) {
      tweetLines.push(`[@${username}] ${t.text ?? ''} | URL: ${t.url ?? ''}`);
    }
  }

  log.step1_twitter = {
    hunters_tested: TEST_HUNTERS,
    per_user: fetches.map(({ username, http_status, count }) => ({ username, http_status, count })),
    total_tweets: tweetLines.length,
    sample_tweets: tweetLines.slice(0, 5),
  };

  if (tweetLines.length === 0) {
    return NextResponse.json({ log, failed_at: 'twitter_fetch' });
  }

  // ── 2. Claude extraction ──
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let claudeRaw = '';
  let claudeParsed: unknown = null;
  let claudeParseError = '';

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      system: `You are a crypto alpha detector. Analyze these tweets from known alpha hunters and identify any that are sharing early project information. Alpha signals include: mentioning a new or early stage project, token, NFT collection, airdrop opportunity, DeFi protocol, or any 'you should look into this' type signal — even if no ticker is mentioned. Ignore tweets that are: personal opinions with no project mention, memes, price commentary on major coins (BTC/ETH), or general market talk.

For each alpha tweet found, return a JSON array with:
- project_name (best guess if not explicit)
- chain (solana/base/eth/arbitrum/unknown)
- summary (one line explaining the alpha)
- verdict (legit/sus/needs more signal)
- mentioned_by (array of usernames who posted about it)
- tweet_urls (array of source tweet links)
- alpha_type (airdrop/new token/NFT/DeFi/other)

Return only valid JSON, no extra text.`,
      messages: [{
        role: 'user',
        content: `Here are ${tweetLines.length} recent tweets from crypto alpha hunters. Extract all alpha signals:\n\n${tweetLines.join('\n\n')}`,
      }],
    });

    claudeRaw = msg.content[0].type === 'text' ? msg.content[0].text : '[non-text]';
    const cleaned = claudeRaw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

    try {
      claudeParsed = JSON.parse(cleaned);
    } catch (e) {
      claudeParseError = String(e);
    }

    log.step2_claude = {
      input_tokens: msg.usage.input_tokens,
      output_tokens: msg.usage.output_tokens,
      raw_response: claudeRaw,
      parsed_ok: claudeParseError === '',
      parsed_count: Array.isArray(claudeParsed) ? claudeParsed.length : 'not an array',
      parsed_projects: claudeParsed,
      parse_error: claudeParseError || null,
    };
  } catch (e) {
    log.step2_claude = { error: String(e) };
    return NextResponse.json({ log, failed_at: 'claude_api' });
  }

  if (!Array.isArray(claudeParsed) || claudeParsed.length === 0) {
    // ── 2b. Supabase test with synthetic project (to isolate DB issues) ──
    const synthetic = {
      name: '__debug_test_project__',
      chain: 'base',
      summary: 'Debug test — safe to delete',
      verdict: 'needs more signal',
      alpha_type: 'other',
      mention_count: 1,
      first_spotted: new Date().toISOString(),
      tweet_links: ['https://twitter.com/test/status/1'],
      mentioned_by: ['testuser'],
      score: 1,
    };

    const { data: insData, error: insErr } = await supabase
      .from('projects')
      .insert(synthetic)
      .select();

    // Clean up immediately
    if (insData?.[0]?.id) {
      await supabase.from('projects').delete().eq('id', insData[0].id);
    }

    log.step3_supabase_synthetic = {
      insert_ok: !insErr,
      error: insErr ? { message: insErr.message, code: insErr.code, details: insErr.details, hint: insErr.hint } : null,
    };

    return NextResponse.json({
      log,
      diagnosis: 'Claude returned no alpha in these tweets (may be non-alpha content). Supabase insert tested separately above.',
    });
  }

  // ── 3. Real Supabase insert with Claude's first result ──
  const first = claudeParsed[0] as Record<string, unknown>;
  const payload = {
    name: first.project_name,
    chain: first.chain,
    summary: first.summary,
    verdict: first.verdict,
    alpha_type: first.alpha_type,
    mention_count: 1,
    first_spotted: new Date().toISOString(),
    tweet_links: first.tweet_urls ?? [],
    mentioned_by: first.mentioned_by ?? [],
    score: 50,
  };

  const { data: insData, error: insErr } = await supabase
    .from('projects')
    .insert(payload)
    .select();

  // Clean up test row
  if (insData?.[0]?.id) {
    await supabase.from('projects').delete().eq('id', insData[0].id);
  }

  log.step3_supabase = {
    payload,
    insert_ok: !insErr,
    error: insErr ? { message: insErr.message, code: insErr.code, details: insErr.details, hint: insErr.hint } : null,
  };

  return NextResponse.json({ log, success: !insErr });
}

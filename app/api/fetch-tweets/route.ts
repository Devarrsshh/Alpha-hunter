import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '@/lib/supabase';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const HUNTERS = [
  'CrypSaf', 'Tma_420', '0itsali0', 'supraEVM', 'imho_nft',
  'BR4ted', 'Airdropalertcom', 'CryptoTeluguO', 'mztacat', 'DeFiMinty',
  'GuarEmperor', 'steveyun', '0xCygaar', 'functi0nZer0', '0xSisyphus',
  'cryptunez', 'g_dip', '0xkakashi', 'Defi0xJeff', 'SmolPoulet',
  '0x_Kun', 'alpha_pls', 'dingalingts', 'thedefiedge', '0xmughal',
  'route2fi', 'SmartestMoney_', 'jack_crypto_ox', 'CryptoKaleo', 'Duo9x',
  '0xLouisT', 'MustStopMurad', 'Rewkang',
];

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type RawTweet = {
  id?: string;
  text?: string;
  url?: string;
  twitterUrl?: string;
  createdAt?: string;
  likeCount?: number;
  retweetCount?: number;
  bookmarkCount?: number;
  viewCount?: number;
};

type TweetApiResponse = {
  status?: string;
  data?: {
    tweets?: RawTweet[];
    pin_tweet?: RawTweet | null;
  };
};

type TweetEngagement = {
  likes: number;
  retweets: number;
};

type AlphaProject = {
  project_name: string;
  chain: string;
  summary: string;
  mentioned_by: string[];
  tweet_urls: string[];
  alpha_type: string;
  project_twitter?: string;
  project_website?: string;
  contract_address?: string;
  hype_level?: number;
  is_shill?: boolean;
};

// ─────────────────────────────────────────────
// Part 1: Scoring formula
// ─────────────────────────────────────────────

function calculateScore(params: {
  mentionCount: number;
  tweetUrls: string[];
  engagementMap: Map<string, TweetEngagement>;
  firstSpotted: string;
  buzzCount: number;
}): number {
  const { mentionCount, tweetUrls, engagementMap, firstSpotted, buzzCount } = params;

  let score = 50; // base

  // +15 per additional hunter mention (beyond the first)
  score += (mentionCount - 1) * 15;

  // engagement bonus: sum likes + retweets across all source tweets
  let totalLikes = 0;
  let totalRetweets = 0;
  for (const url of tweetUrls) {
    const eng = engagementMap.get(url);
    if (eng) {
      totalLikes    += eng.likes;
      totalRetweets += eng.retweets;
    }
  }
  score += Math.floor(totalLikes    / 100) * 5;
  score += Math.floor(totalRetweets / 50)  * 5;

  // buzz bonus: broader Twitter chatter in last 48h
  if      (buzzCount >= 50) score += 15;
  else if (buzzCount >= 20) score += 10;
  else if (buzzCount >=  5) score += 5;

  // staleness penalty: -10 if first_spotted > 48h ago
  const ageHours = (Date.now() - new Date(firstSpotted).getTime()) / 36e5;
  if (ageHours > 48) score -= 10;

  // clamp 0–100
  return Math.min(100, Math.max(0, Math.round(score)));
}

// ─────────────────────────────────────────────
// Twitter fetching
// ─────────────────────────────────────────────

type FetchResult = {
  username: string;
  tweetLines: string[];
};

async function fetchTweetsForUser(
  username: string,
  engagementMap: Map<string, TweetEngagement>
): Promise<FetchResult> {
  const apiUrl = `https://api.twitterapi.io/twitter/user/last_tweets?userName=${username}&limit=25`;

  try {
    const res = await fetch(apiUrl, {
      headers: { 'X-API-Key': process.env.TWITTER_API_KEY! },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[${username}] HTTP ${res.status}: ${body.slice(0, 200)}`);
      return { username, tweetLines: [] };
    }

    const data: TweetApiResponse = await res.json();
    const rawTweets = data.data?.tweets ?? [];

    console.log(`[${username}] fetched ${rawTweets.length} tweets`);

    const cutoff = Date.now() - 72 * 60 * 60 * 1000; // 72 hours ago
    const tweetLines: string[] = [];
    let skipped = 0;

    for (const t of rawTweets) {
      // Skip tweets older than 72 hours
      if (t.createdAt) {
        const tweetAge = new Date(t.createdAt).getTime();
        if (isNaN(tweetAge) || tweetAge < cutoff) {
          skipped++;
          continue;
        }
      }

      const tweetUrl = t.url ?? t.twitterUrl ?? `https://twitter.com/${username}/status/${t.id}`;

      // Populate engagement map for scoring later
      engagementMap.set(tweetUrl, {
        likes:    t.likeCount    ?? 0,
        retweets: t.retweetCount ?? 0,
      });

      // Include engagement in the text sent to Claude so it can gauge hype_level
      tweetLines.push(
        `[@${username}] ${t.text ?? ''} | likes:${t.likeCount ?? 0} rts:${t.retweetCount ?? 0} | URL: ${tweetUrl}`
      );
    }

    if (skipped > 0) console.log(`[${username}] skipped ${skipped} tweets older than 72h`);

    return { username, tweetLines };
  } catch (err) {
    console.error(`Error fetching tweets for ${username}:`, err);
    return { username, tweetLines: [] };
  }
}

async function fetchInBatches(
  hunters: string[],
  engagementMap: Map<string, TweetEngagement>,
  batchSize = 3,
  delayMs = 1000
): Promise<FetchResult[]> {
  const results: FetchResult[] = [];
  for (let i = 0; i < hunters.length; i += batchSize) {
    const batch = hunters.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((u) => fetchTweetsForUser(u, engagementMap)));
    results.push(...batchResults);
    if (i + batchSize < hunters.length) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return results;
}

// ─────────────────────────────────────────────
// Buzz verification: search Twitter for project name
// ─────────────────────────────────────────────

async function searchProjectBuzz(projectName: string): Promise<number> {
  const query = encodeURIComponent(`"${projectName}"`);
  const url   = `https://api.twitterapi.io/twitter/tweet/search?query=${query}&queryType=Latest&count=100`;

  try {
    const res = await fetch(url, {
      headers: { 'X-API-Key': process.env.TWITTER_API_KEY! },
    });
    if (!res.ok) return 0;

    const data = await res.json();
    const tweets: RawTweet[] = data.data?.tweets ?? data.tweets ?? [];
    const cutoff = Date.now() - 48 * 60 * 60 * 1000;

    return tweets.filter((t) => {
      if (!t.createdAt) return true; // no date → include to avoid false negatives
      const ts = new Date(t.createdAt).getTime();
      return !isNaN(ts) && ts >= cutoff;
    }).length;
  } catch {
    return 0;
  }
}

async function fetchBuzzInBatches(
  projectNames: string[],
  batchSize = 5,
  delayMs = 500
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  for (let i = 0; i < projectNames.length; i += batchSize) {
    const batch = projectNames.slice(i, i + batchSize);
    const counts = await Promise.all(batch.map((name) => searchProjectBuzz(name)));
    batch.forEach((name, idx) => result.set(name, counts[idx]));
    if (i + batchSize < projectNames.length) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return result;
}

// ─────────────────────────────────────────────
// Part 2: Claude system prompt with new fields
// ─────────────────────────────────────────────

const CLAUDE_SYSTEM_PROMPT = `You are a strict early-stage crypto project detector. Your only job is to surface genuinely new and niche projects that almost nobody has heard of yet.

EXTRACTION RULES — a project must pass ALL of these to be included:

INCLUDE only if:
- The project appears to have launched in 2024 or later (or launch date is unknown but context suggests it is very new)
- It is niche, early-stage, or obscure — not something a casual crypto follower would recognise
- It is one of: a new token launch, new NFT collection, new airdrop/points campaign, new DeFi protocol, new launchpad, new testnet, or new L2/appchain that is not yet widely known

SKIP unconditionally if ANY of the following are true:
- The project launched before 2024
- It has a Wikipedia page (indicator of mainstream recognition)
- It is in the CoinGecko top 500 by market cap
- It is commonly covered in mainstream crypto media (CoinDesk, Decrypt, The Block, Cointelegraph) as an established project
- It is a major L1 blockchain (Bitcoin, Ethereum, Solana, Avalanche, Cardano, Tron, Polkadot, Cosmos, Near, Aptos, Sui, Sei, etc.)
- It is a major L2 (Arbitrum, Optimism, Polygon, zkSync, Starknet, Linea, Scroll, Mantle, Base as a chain, etc.)
- It is a top 100 DeFi protocol (Uniswap, Aave, Compound, Curve, MakerDAO, Lido, EigenLayer, Pendle, Jupiter, Raydium, etc.)
- It is a well-known CEX or its native token (Binance/BNB, Coinbase, OKX, Bybit, etc.)
- General market commentary, price opinions, or news about already-established projects

When in doubt about whether a project is early or established — include it, but set hype_level to 3 or lower.
If nothing in the tweets qualifies, return an empty array [].

For each qualifying project, return a JSON array. Each object must have exactly these fields:
- project_name: string — best guess name if not explicit
- chain: string — use the closest match from this exact list (lowercase): solana, eth, base, arbitrum, bnb, polygon, avalanche, sui, aptos, ton, blast, scroll, zksync, linea, mantle, berachain, sonic, megaeth, abstract, hyperliquid, unknown
- summary: string — one sentence explaining the alpha signal
- mentioned_by: string[] — array of @usernames who posted about it
- tweet_urls: string[] — array of source tweet URLs
- alpha_type: string — one of: airdrop/new token/NFT/DeFi/other
- project_twitter: string — the project's Twitter/X handle (e.g. "@projectname"), or "" if not mentioned
- project_website: string — the project's website URL if mentioned, or "" if not found
- contract_address: string — any contract/wallet address mentioned, or "" if none
- hype_level: number — integer 1–10 rating how excited hunters sound (10 = extremely hyped)
- is_shill: boolean — true if this looks like a paid promotion or sponsored post, false if genuine alpha

Return only a valid JSON array, no extra text, no markdown fences.`;

// ─────────────────────────────────────────────
// Part 3: Upsert with dedup, merge, and scoring
// ─────────────────────────────────────────────

async function upsertProject(
  project: AlphaProject,
  engagementMap: Map<string, TweetEngagement>,
  buzzCount: number
) {
  const nameLower = project.project_name.toLowerCase().trim();

  const { data: existing, error: fetchErr } = await supabase
    .from('projects')
    .select('id, mention_count, tweet_links, mentioned_by, first_spotted, verdict, project_twitter, project_website, contract_address')
    .ilike('name', nameLower)
    .maybeSingle();

  if (fetchErr) {
    console.error(`Supabase fetch error for "${project.project_name}":`, fetchErr.message);
    return;
  }

  const now = new Date().toISOString();

  if (existing) {
    // ── Merge arrays (dedup) ──
    const mergedLinks       = Array.from(new Set([...(existing.tweet_links ?? []),    ...project.tweet_urls]));
    const mergedMentionedBy = Array.from(new Set([...(existing.mentioned_by ?? []),   ...project.mentioned_by]));
    const newMentionCount   = mergedMentionedBy.length;

    // ── Keep earliest first_spotted ──
    const existingDate = new Date(existing.first_spotted ?? now);
    const keepSpotted  = existingDate < new Date(now) ? existing.first_spotted : now;

    // ── Recalculate score with updated data ──
    const newScore = calculateScore({
      mentionCount:  newMentionCount,
      tweetUrls:     mergedLinks,
      engagementMap,
      firstSpotted:  keepSpotted,
      buzzCount,
    });

    const { error: updateErr } = await supabase
      .from('projects')
      .update({
        mention_count:    newMentionCount,
        tweet_links:      mergedLinks,
        mentioned_by:     mergedMentionedBy,
        first_spotted:    keepSpotted,
        score:            newScore,
        buzz_count:       buzzCount,
        project_twitter:  project.project_twitter  || existing.project_twitter  || '',
        project_website:  project.project_website  || existing.project_website  || '',
        contract_address: project.contract_address || existing.contract_address || '',
      })
      .eq('id', existing.id);

    if (updateErr) console.error(`Supabase update error for "${project.project_name}":`, updateErr.message);
  } else {
    // ── New project — calculate initial score ──
    const initialScore = calculateScore({
      mentionCount:  1,
      tweetUrls:     project.tweet_urls,
      engagementMap,
      firstSpotted:  now,
      buzzCount,
    });

    const { error: insertErr } = await supabase.from('projects').insert({
      name:             project.project_name,
      chain:            project.chain,
      summary:          project.summary,
      alpha_type:       project.alpha_type,
      mention_count:    1,
      first_spotted:    now,
      tweet_links:      project.tweet_urls,
      mentioned_by:     project.mentioned_by,
      score:            initialScore,
      buzz_count:       buzzCount,
      project_twitter:  project.project_twitter  ?? '',
      project_website:  project.project_website  ?? '',
      contract_address: project.contract_address ?? '',
      hype_level:       project.hype_level        ?? 5,
      is_shill:         project.is_shill          ?? false,
    });

    if (insertErr) console.error(`Supabase insert error for "${project.project_name}":`, insertErr.message);
  }
}

// ─────────────────────────────────────────────
// Cleanup: rolling 7-day window
// ─────────────────────────────────────────────

export async function runCleanup(): Promise<{ deleted: number; error: string | null }> {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Only archive projects that are BOTH old AND low-signal:
  // older than 7 days + hype ≤ 3 + buzz < 5 + only 1 hunter mention
  const { data, error } = await supabase
    .from('projects')
    .delete()
    .lt('first_spotted', cutoff)
    .lte('hype_level', 3)
    .lt('buzz_count', 5)
    .lte('mention_count', 1)
    .select('id');

  if (error) {
    console.error('Cleanup error:', error.message);
    return { deleted: 0, error: error.message };
  }

  const deleted = data?.length ?? 0;
  console.log(`Cleanup: archived ${deleted} low-signal projects older than 7 days (cutoff: ${cutoff})`);
  return { deleted, error: null };
}

// ─────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // Auth logic:
  // - If CRON_SECRET is not set in env vars → allow all requests (cron + browser)
  // - If CRON_SECRET is set AND request sends an Authorization header → validate it
  // - If CRON_SECRET is set AND no Authorization header → allow (browser button calls)
  const cronSecret = process.env.CRON_SECRET;
  const auth       = request.headers.get('authorization');

  if (cronSecret && auth && auth !== `Bearer ${cronSecret}`) {
    console.warn('[auth] Rejected request with invalid CRON_SECRET');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log(`[auth] Request allowed — CRON_SECRET configured: ${!!cronSecret}, auth header present: ${!!auth}`);

  try {
    const engagementMap = new Map<string, TweetEngagement>();

    // Step 0: purge projects older than 7 days
    const cleanup = await runCleanup();

    // Step 1: fetch tweets (batched to avoid 429s)
    const results      = await fetchInBatches(HUNTERS, engagementMap, 3, 1000);
    const allTweets    = results.flatMap((r) => r.tweetLines);
    const totalFetched = allTweets.length;

    const perUser = results.map(({ username, tweetLines }) => ({ username, count: tweetLines.length }));
    console.log('Tweet counts per hunter:', perUser);

    if (allTweets.length === 0) {
      return NextResponse.json({ error: 'No tweets fetched', perUser }, { status: 502 });
    }

    // Step 2: single Claude call with all tweets
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model:      'claude-haiku-4-5',
      max_tokens: 4096,
      system:     CLAUDE_SYSTEM_PROMPT,
      messages: [{
        role:    'user',
        content: `Here are ${allTweets.length} recent tweets from crypto alpha hunters. Extract all alpha signals:\n\n${allTweets.join('\n\n')}`,
      }],
    });

    const rawContent = message.content[0];
    if (rawContent.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected Claude response type' }, { status: 500 });
    }

    // Strip markdown fences if Claude adds them despite instructions
    const jsonText = rawContent.text
      .replace(/^```(?:json)?\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim();

    let projects: AlphaProject[] = [];
    try {
      const parsed = JSON.parse(jsonText);
      projects = Array.isArray(parsed) ? parsed : [];
    } catch {
      console.error('Failed to parse Claude JSON:', jsonText.slice(0, 500));
      return NextResponse.json(
        { error: 'Claude returned invalid JSON', raw: jsonText.slice(0, 500) },
        { status: 500 }
      );
    }

    // Step 3: buzz verification — search Twitter for each extracted project
    const buzzMap = await fetchBuzzInBatches(projects.map((p) => p.project_name));
    console.log('Buzz counts:', Object.fromEntries(buzzMap));

    // Step 4: upsert projects sequentially to avoid race conditions on dedup
    for (const project of projects) {
      const buzzCount = buzzMap.get(project.project_name) ?? 0;
      await upsertProject(project, engagementMap, buzzCount);
    }

    // Write scan timestamp for LAST SCAN display and 2-hour cooldown
    const scanTime = new Date().toISOString();
    const { error: settingsErr } = await supabase
      .from('settings')
      .upsert({ key: 'last_scan_at', value: scanTime });
    if (settingsErr) {
      console.error('[LAST SCAN] Failed to write to settings table:', settingsErr.message, settingsErr.code);
    } else {
      console.log('[LAST SCAN] Saved to settings table:', scanTime);
    }

    return NextResponse.json({
      success:         true,
      cleaned_up:      cleanup.deleted,
      tweets_fetched:  totalFetched,
      projects_found:  projects.length,
      per_user:        perUser,
      projects,
      usage:           message.usage,
    });
  } catch (err) {
    console.error('fetch-tweets error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const HUNTERS = [
  { username: 'CrypSaf',        display_name: 'CrypSaf' },
  { username: 'Tma_420',        display_name: 'Tma 420' },
  { username: '0itsali0',       display_name: '0itsali0' },
  { username: 'CryptoKaleo',    display_name: 'Crypto Kaleo' },
  { username: 'Duo9x',          display_name: 'Duo9x' },
  { username: 'supraEVM',       display_name: 'SupraEVM' },
  { username: 'imho_nft',       display_name: 'IMHO NFT' },
  { username: 'BR4ted',         display_name: 'BR4ted' },
  { username: 'Airdropalertcom',display_name: 'Airdrop Alert' },
  { username: 'CryptoTeluguO',  display_name: 'Crypto Telugu' },
  { username: 'mztacat',        display_name: 'Mztacat' },
  { username: 'DeFiMinty',      display_name: 'DeFi Minty' },
  { username: 'GuarEmperor',    display_name: 'Guar Emperor' },
  { username: 'steveyun',       display_name: 'Steve Yun' },
  { username: '0xCygaar',       display_name: '0xCygaar' },
  { username: 'functi0nZer0',   display_name: 'functi0nZer0' },
  { username: '0xSisyphus',     display_name: '0xSisyphus' },
  { username: 'cryptunez',      display_name: 'Cryptunez' },
  { username: 'g_dip',          display_name: 'g_dip' },
  { username: '0xkakashi',      display_name: '0xKakashi' },
  { username: 'Defi0xJeff',     display_name: 'DeFi 0xJeff' },
  { username: 'SmolPoulet',     display_name: 'SmolPoulet' },
  { username: '0x_Kun',         display_name: '0x Kun' },
  { username: 'alpha_pls',      display_name: 'Alpha Pls' },
  { username: 'dingalingts',    display_name: 'Dingalingts' },
  { username: 'thedefiedge',    display_name: 'The DeFi Edge' },
  { username: '0xmughal',       display_name: '0xMughal' },
  { username: 'route2fi',       display_name: 'Route 2 Fi' },
  { username: 'SmartestMoney_', display_name: 'Smartest Money' },
  { username: 'jack_crypto_ox', display_name: 'Jack Crypto' },
  { username: '0xLouisT',       display_name: '0xLouisT' },
  { username: 'MustStopMurad',  display_name: 'Murad' },
  { username: 'Rewkang',        display_name: 'Rewkang' },
];

export async function POST() {
  const { data, error } = await supabase
    .from('hunters')
    .upsert(HUNTERS, { onConflict: 'username' })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, inserted: data?.length ?? 0, hunters: data });
}

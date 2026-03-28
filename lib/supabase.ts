import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Project = {
  id: string;
  name: string;
  chain: string;
  summary: string;
  mention_count: number;
  first_spotted: string;
  tweet_links: string[];
  mentioned_by: string[];
  alpha_type: string;
  score: number;
  project_twitter: string;
  project_website: string;
  contract_address: string;
  hype_level: number;
  is_shill: boolean;
  buzz_count: number;
};

export type Hunter = {
  id: string;
  username: string;
  display_name: string;
};

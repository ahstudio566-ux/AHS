import { createClient } from '@supabase/supabase-js';
import fetch from 'cross-fetch';

const rawUrl = process.env.VITE_SUPABASE_URL || '';
const rawKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const isOldOrBroken = !rawUrl || rawUrl.includes('awhumsiqbicqhfpjjahv');

export const supabaseUrl = isOldOrBroken ? 'https://bonwogmnnwjphkxzvetp.supabase.co' : rawUrl;
export const supabaseAnonKey = isOldOrBroken ? 'sb_publishable_w-y2MEGxK7a_qEM96auELg_h68UuiBX' : rawKey;

if (isOldOrBroken) {
  console.log(`[SUPABASE] Self-healing: Detected old or missing Supabase URL "${rawUrl}". Falling back to working project "bonwogmnnwjphkxzvetp".`);
  process.env.VITE_SUPABASE_URL = supabaseUrl;
  process.env.VITE_SUPABASE_ANON_KEY = supabaseAnonKey;
}

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: (url, options) => fetch(url as string, options),
      },
    })
  : null;

if (!supabase) {
  console.warn('Supabase URL or Anon Key is missing. Database persistence will not work.');
}

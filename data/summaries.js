import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://wytipsmhzgrtxhpojvjt.supabase.co';
const supabaseKey = 'sb_publishable_95Eiuz84ZNZxm83jTGrF-Q_GS6uViKk';
const supabase = createClient(supabaseUrl, supabaseKey);

const { data, error } = await supabase
  .from('summaries')
  .select('*')
  .order('date', { ascending: false });

if (error) {
  console.error("Failed to fetch from Supabase:", error);
}

export const masterSummaries = data ? data.map(meeting => {
  meeting.date = String(meeting.date).substring(0, 10);
  return meeting;
}) : [];

console.log("Supabase data securely loaded into masterSummaries!", masterSummaries);
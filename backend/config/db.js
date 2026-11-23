import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured');
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const connectDB = async () => {
  const { error } = await supabase.from('users').select('id').limit(1);
  if (error) {
    const cause = error.cause?.message;
    throw new Error(`Supabase connection failed: ${error.message}${cause ? ` (${cause})` : ''}`);
  }

  console.log('Supabase connected');
};

export default connectDB;

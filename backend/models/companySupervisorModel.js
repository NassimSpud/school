import { supabase } from '../config/db.js';

export const findCompanySupervisorByEmail = async (email) => {
  const { data, error } = await supabase
    .from('company_supervisors')
    .select('id,company_id,user_id,name,email,phone,accepted_at')
    .eq('email', email)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const findCompanySupervisorByUserId = async (userId) => {
  const { data, error } = await supabase
    .from('company_supervisors')
    .select('id,company_id,user_id,name,email,phone,accepted_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const hasCurrentPlacement = async (companySupervisorId) => {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('placements')
    .select('id')
    .eq('company_supervisor_id', companySupervisorId)
    .eq('status', 'active')
    .lte('start_date', today)
    .gte('end_date', today)
    .limit(1);

  if (error) throw error;
  return data.length > 0;
};

export const markCompanySupervisorAccepted = async (companySupervisorId) => {
  const { error } = await supabase
    .from('company_supervisors')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', companySupervisorId)
    .is('accepted_at', null);

  if (error) throw error;
};

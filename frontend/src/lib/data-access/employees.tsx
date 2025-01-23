import { supabase } from './supabase-client';
import { getUserSession } from '@/lib/auth/user';

interface Employee {
  id?: string;        // Optional for new employees
  first_name: string;
  last_name: string;
  email: string;
  hourly_rate: number;
  client_id?: string; // We'll set this from session
  created_at?: string;
  updated_at?: string;
}

export const fetchAllEmployees = async () => {
  const session = await getUserSession();
  if (!session) throw new Error('No active session');

  const { data, error } = await supabase
    .from('employee')
    .select('*')
    .eq('client_id', session.clientId)
    .or('is_deleted.is.null,is_deleted.eq.false');  // Show both null and false

  if (error) throw error;
  return data;
};


export const deleteEmployee = async (id: string) => {
  const session = await getUserSession();
  if (!session) throw new Error('No active session');

  const { error } = await supabase
    .from('employee')
    .update({ is_deleted: true })
    .eq('id', id)
    .eq('client_id', session.clientId);

  if (error) throw error;
  return true;
};

export const upsertEmployees = async (employees: Employee[]) => {
  const session = await getUserSession();
  if (!session) throw new Error('No active session');

  const now = new Date().toISOString();

  // Ensure client_id is set and generate ids for new employees
  const employeesWithClientId = employees.map(emp => ({
    ...emp,
    id: emp.id || crypto.randomUUID(),  // Generate new id if none exists
    client_id: session.clientId,
    created_at: emp.id ? emp.created_at : now,  // Set created_at for new employees
    updated_at: now  // Always update updated_at
  }));

  console.log('Upserting employees:', employeesWithClientId);

  const { data, error } = await supabase
    .from('employee')
    .upsert(employeesWithClientId, {
      onConflict: 'id',
      ignoreDuplicates: false
    })
    .select();

  if (error) throw error;
  return data;
};



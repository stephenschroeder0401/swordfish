import { supabase } from './supabase-client';
import { getUserSession } from '@/lib/auth/user';

interface Employee {
  id?: string;        // Optional for new employees
  first_name: string;
  last_name: string;
  email: string;
  hourly_rate: number;
  client_id?: string; // We'll set this from session
}

export const fetchAllEmployees = async () => {
  const session = await getUserSession();
  if (!session) throw new Error('No active session');

  const { data, error } = await supabase
    .from('employee')
    .select("*")
    .eq('client_id', session.clientId);

  if (error) throw error;
  return data;
};

export const upsertEmployees = async (employees: Employee[]) => {
  const session = await getUserSession();
  if (!session) throw new Error('No active session');

  // Ensure client_id is set for all employees
  const employeesWithClientId = employees.map(emp => ({
    ...emp,
    client_id: session.clientId
  }));

  const { data, error } = await supabase
    .from('employee')
    .upsert(employeesWithClientId, {
      onConflict: 'id',  // Update when id matches
      ignoreDuplicates: false
    })
    .select();

  if (error) throw error;
  return data;
};



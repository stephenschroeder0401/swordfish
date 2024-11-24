import { supabase } from './supabase-client';
import { getUserSession } from '@/lib/auth/user';

interface BillingAccount {
  id?: string;
  name: string;
  code: string;
  isbilledback: boolean;
  client_id?: string;
}

export const fetchAllBillingAccounts = async (page = 0, pageSize = 10) => {
  const session = getUserSession();
  if (!session) throw new Error('No active session');

  const start = page * pageSize;
  const end = start + pageSize - 1;

  const { data, error, count } = await supabase
    .from('billing_account')
    .select('*', { count: 'exact' })
    .eq('client_id', session.clientId)
    .range(start, end);

  if (error) throw error;

  const formattedData = data?.map(account => ({
    ...account,
    isbilledback: Boolean(account.isbilledback)
  }));

  return { data: formattedData || [], count: count || 0 };
};

export const fetchAllBillingAccountsNoPagination = async () => {
  const session = getUserSession();
  if (!session) throw new Error('No active session');

  const { data, error } = await supabase
    .from('billing_account')
    .select('*')
    .eq('client_id', session.clientId)
    .order('name');

  if (error) {
    console.error("Error fetching all billing accounts:", error);
    throw error;
  }

  return data || [];
};

export const upsertBillingAccounts = async (billingAccounts: BillingAccount[]) => {
  const session = getUserSession();
  if (!session) throw new Error('No active session');

  const accountsWithClientId = billingAccounts.map(account => ({
    ...account,
    client_id: session.clientId
  }));

  const { data, error } = await supabase
    .from('billing_account')
    .upsert(accountsWithClientId, {
      onConflict: 'id'
    })
    .select();

  if (error) throw error;
  return data;
};

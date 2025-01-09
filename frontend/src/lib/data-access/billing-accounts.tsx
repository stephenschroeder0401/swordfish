import { supabase } from './supabase-client';
import { getUserSession } from '@/lib/auth/user';

interface BillingAccount {
  id?: string;
  name: string;
  code: string;
  isbilledback: boolean;
  client_id?: string;
  billing_type: 'hourly' | 'monthly';
}

const getAuthenticatedSession = async () => {
  const session = await getUserSession();
  if (!session) throw new Error('No active session');
  return session;
};

export const fetchAllBillingAccounts = async (
  page = 0, 
  pageSize = 10, 
  billingType?: 'hourly' | 'monthly'
) => {
  try {
    const session = await getAuthenticatedSession();
    
    const start = page * pageSize;
    const end = start + pageSize - 1;

    let query = supabase
      .from('billing_account')
      .select('*', { count: 'exact' })
      .eq('client_id', session.clientId)
      .or('is_deleted.is.null,is_deleted.eq.false');

    if (billingType) {
      query = query.eq('billing_type', billingType);
    }

    const { data, error, count } = await query.range(start, end);

    if (error) throw error;

    const formattedData = data?.map(account => ({
      ...account,
      billing_type: account.billing_type || 'hourly'
    })) || [];

    return { data: formattedData, count };
  } catch (error) {
    console.error("Error fetching billing accounts:", error);
    throw error;
  }
};

export const fetchAllBillingAccountsNoPagination = async (
  billingType?: 'hourly' | 'monthly'
) => {
  try {
    const session = await getAuthenticatedSession();
    
    let query = supabase
      .from('billing_account')
      .select('*')
      .eq('client_id', session.clientId)
      .or('is_deleted.is.null,is_deleted.eq.false');

    if (billingType) {
      query = query.eq('billing_type', billingType);
    }

    const { data, error } = await query.order('name');

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching billing accounts:", error);
    throw error;
  }
};

export const upsertBillingAccounts = async (billingAccounts: BillingAccount[]) => {
  try {
    const session = await getAuthenticatedSession();
    
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
  } catch (error) {
    console.error("Error upserting billing accounts:", error);
    throw error;
  }
};

export const deleteBillingAccount = async (id: string) => {
  try {
    const session = await getAuthenticatedSession();
    
    const { error } = await supabase
      .from('billing_account')
      .update({ is_deleted: true })
      .eq('id', id)
      .eq('client_id', session.clientId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting billing account:", error);
    throw error;
  }
};

export const fetchAllBillingAccountsIncludingDeleted = async (
  billingType?: 'hourly' | 'monthly'
) => {
  try {
    const session = await getAuthenticatedSession();
    
    let query = supabase
      .from('billing_account')
      .select('*')
      .eq('client_id', session.clientId);

    if (billingType) {
      query = query.eq('billing_type', billingType);
    }

    const { data, error } = await query.order('name');

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching billing accounts:", error);
    throw error;
  }
};

import { supabase } from './supabase-client';
import { getUserSession } from '../auth/user';

export interface BillingPeriod {
  id: string;
  startdate: string;
  enddate: string;
  client_id: string;
}

export const fetchAllBillingPeriods = async (): Promise<BillingPeriod[]> => {
  const session = await getUserSession();

  console.log("getting session billing periods: ", session);
  
  const { data, error } = await supabase
    .from('billing_period')
    .select("*")
    .eq('client_id', session.clientId)
    .eq('is_deleted', false);

  if (error) {
    console.error("Error fetching billing periods:", error);
    throw error;
  }

  return data;
};

export const upsertBillingPeriods = async (billingPeriods: Partial<BillingPeriod>[]): Promise<BillingPeriod[]> => {
  const { clientId } = await getUserSession();
  
  const periodsWithClientId = billingPeriods.map(period => ({
    ...period,
    client_id: clientId
  }));

  const { data, error } = await supabase
    .from('billing_period')
    .upsert(periodsWithClientId, {
      onConflict: 'id'
    });

  if (error) {
    console.error("Error upserting billing periods:", error);
    throw error;
  }

  return data;
};

export const deleteBillingPeriod = async (id: string) => {
  try {
    const session = await getUserSession();
    
    const { error } = await supabase
      .from('billing_period')
      .update({ is_deleted: true })
      .eq('id', id)
      .eq('client_id', session.clientId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting billing period:', error);
    throw error;
  }
};

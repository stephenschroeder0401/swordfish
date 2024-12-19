import { supabase } from './supabase-client';
import { getUserSession } from '@/lib/auth/user';

export const getPropertyUnits = async () => {
  const session = await getUserSession();
  if (!session) throw new Error('No active session');

  const { data, error } = await supabase
    .from('property_unit')
    .select('*, property!inner(*, entity!inner(*))')
    .eq('property.entity.client_id', session.clientId);
  
  if (error) throw error;
  return data;
};

export const createPropertyUnit = async (propertyUnit) => {
  const { data, error } = await supabase
    .from('property_unit')
    .insert([propertyUnit])
    .select();

  if (error) throw error;
  return data[0];
};

export const updatePropertyUnit = async (id, updates) => {
  const { data, error } = await supabase
    .from('property_unit')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data[0];
};

export const deletePropertyUnit = async (id) => {
  const { error } = await supabase
    .from('property_unit')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const upsertPropertyUnits = async (propertyUnits) => {
  const { data, error } = await supabase
    .from('property_unit')
    .upsert(propertyUnits)
    .select();

  if (error) throw error;
  return data;
};

export const getPropertyRevenue = async (propertyId: string, clientId: string) => {
  const { data, error } = await supabase
    .from('property_unit')
    .select(`
      rent,
      property!inner (
        client_id
      )
    `)
    .eq('property_id', propertyId)
    .eq('property.client_id', clientId);

  if (error) throw error;

  // Sum up all the rent values
  const totalRevenue = data?.reduce((sum, unit) => sum + (parseFloat(unit.rent) || 0), 0);
  
  return totalRevenue || 0;
};

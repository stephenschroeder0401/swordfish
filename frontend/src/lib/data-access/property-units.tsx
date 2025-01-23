import { supabase } from './supabase-client';
import { getUserSession } from '@/lib/auth/user';

export const getPropertyUnits = async () => {
  const session = await getUserSession();
  if (!session) throw new Error('No active session');

  const { data, error } = await supabase
    .from('property_unit')
    .select(`
      *,
      property:property_id!inner (
        *,
        entity:entityid!inner (*)
      )
    `)
    .eq('property.entity.client_id', session.clientId)
    .eq('property.is_deleted', false)
    .or('is_deleted.is.null,is_deleted.eq.false');
  
  if (error) throw error;
  return data;
};

export const createPropertyUnit = async (propertyUnit) => {
  console.log('Creating unit:', propertyUnit);  // Debug log

  const { data, error } = await supabase
    .from('property_unit')
    .insert([propertyUnit])
    .select();

  console.log('Insert result:', { data, error });  // Debug log

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

export const deletePropertyUnit = async (id: string) => {
  const session = await getUserSession();
  
  // First get the property unit to check client_id
  const { data: unit, error: fetchError } = await supabase
    .from('property_unit')
    .select('*, property!inner(*, entity!inner(client_id))')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;
  
  // Verify client_id
  if (unit?.property?.entity?.client_id !== session.clientId) {
    throw new Error('Unauthorized');
  }

  // Then perform the soft delete
  const { error } = await supabase
    .from('property_unit')
    .update({ is_deleted: true })
    .eq('id', id);

  if (error) throw error;
  return true;
};

export const upsertPropertyUnits = async (propertyUnits) => {
  const now = new Date().toISOString();
  const unitsWithDates = propertyUnits.map(unit => ({
    ...unit,
    updated_at: now,
    created_at: unit.id ? unit.created_at : now,
    is_deleted: false
  }));

  const { data, error } = await supabase
    .from('property_unit')
    .upsert(unitsWithDates)
    .select();

  if (error) throw error;
  return data;
};

export const getPropertyRevenue = async (propertyId: string) => {
  const session = await getUserSession();

  const { data, error } = await supabase
    .from('property_unit')
    .select(`
      rent,
      property!inner (
        *, 
        entity!inner(*)
      )
    `)
    .eq('property_id', propertyId)
    .eq('property.entity.client_id', session.clientId)
    .eq('property.is_deleted', false)
    .or('is_deleted.is.null,is_deleted.eq.false');

  if (error) throw error;

  // Sum up all the rent values
  const totalRevenue = data?.reduce((sum, unit) => sum + (parseFloat(unit.rent) || 0), 0);
  
  return totalRevenue || 0;
};

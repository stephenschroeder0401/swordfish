import { supabase } from './supabase-client';

export const getPropertyUnits = async () => {
  const { data, error } = await supabase
    .from('property_unit')
    .select('*');
  
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

export const getPropertyRevenue = async (propertyId: string) => {
  const { data, error } = await supabase
    .from('property_unit')
    .select('rent')
    .eq('property_id', propertyId);

  if (error) throw error;

  // Sum up all the rent values
  const totalRevenue = data?.reduce((sum, unit) => sum + (parseFloat(unit.rent) || 0), 0);
  
  return totalRevenue || 0;
};

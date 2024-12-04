import { supabase } from './supabase-client';
import { getUserSession } from '@/lib/auth/user';

interface Property {
  id?: string;
  name: string;
  code: string;
  unit?: string;
  entityid: string;
  entity?: {
    name: string;
    client_id: string;
  };
}

export const fetchAllProperties = async (
  limit: number = 40, 
  offset: number = 0,
  searchTerm: string = ''
) => {
  const session = await getUserSession();
  const clientId = session?.clientId;

  console.log("properties for: ", clientId);
  let query = supabase
    .from('property')
    .select(`
      *,
      entity:entityid!inner(
        id,
        name, 
        client_id
      )
    `, { count: 'exact' })
    .eq('entity.client_id', clientId);

  // Add search filter if searchTerm exists
  if (searchTerm) {
    query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`);
  }

  const { data, error, count } = await query
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return { data, count };
};

export const fetchAllPropertiesNoPagination = async () => {
  const session = await getUserSession();
  if (!session) throw new Error('No active session');

  const { data, error } = await supabase
    .from('property')
    .select(`
      *,
      entity:entityid!inner (
        name,
        client_id
      )
    `)
    .eq('entity.client_id', session.clientId)
    .order('name');

  if (error) throw error;

  return data.map(item => ({
    ...item,
    entityName: item.entity?.name
  }));
};

export const searchProperties = async (
  searchTerm: string = '', 
  pageSize: number = 40, 
  startIndex: number = 0
) => {
  const session = await getUserSession();
  if (!session) throw new Error('No active session');

  let query = supabase
    .from('property')
    .select(`
      id,
      name,
      code,
      unit,
      entityid,
      entity:entityid!inner (
        name,
        client_id
      )
    `, { count: 'exact' })
    .eq('entity.client_id', session.clientId);

  if (searchTerm) {
    query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`);
  }

  const { data, error, count } = await query.range(startIndex, startIndex + pageSize - 1);
  
  if (error) throw error;
  return { 
    data: data?.map(item => ({
      ...item,
      entityName: item.entity[0]?.name
    })) ?? [],
    count: count ?? 0
  };
};

export const upsertProperties = async (properties: Property[]) => {
  const session = await getUserSession();
  if (!session) throw new Error('No active session');

  console.log('Original properties data:', properties); // Debug log

  // Keep only the fields we need for the property table
  const cleanedProperties = properties.map(prop => ({
    id: prop.id,
    name: prop.name,
    code: prop.code,
    unit: prop.unit,
    entityid: prop.entityid // Only keep entityid, remove client_id
  }));

  console.log('Cleaned properties for save:', cleanedProperties); // Debug log

  const { data, error } = await supabase
    .from('property')
    .upsert(cleanedProperties, {
      onConflict: 'id'
    })
    .select(`
      *,
      entity:entityid (
        name,
        client_id
      )
    `);

  if (error) throw error;
  
  // Format the returned data to match our expected structure
  const formattedData = data.map(item => ({
    ...item,
    entityName: item.entity?.name
  }));

  return formattedData;
};

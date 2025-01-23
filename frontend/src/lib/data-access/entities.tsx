import { supabase } from './supabase-client';
import { getUserSession } from '@/lib/auth/user';

interface Entity {
  id?: string;
  name: string;
  client_id?: string;
}

export const fetchAllEntities = async () => {
  const session = await getUserSession();
  if (!session) throw new Error('No active session');

  let query = supabase
    .from('entity')
    .select('*')
    .eq('client_id', session.clientId)
    .or('is_deleted.is.null,is_deleted.eq.false');

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

export const upsertEntities = async (entities: Entity[]) => {
  const session = await getUserSession();
  if (!session) throw new Error('No active session');

  // Ensure client_id is set for all entities
  const entitiesWithClientId = entities.map(entity => ({
    ...entity,
    client_id: session.clientId
  }));

  const { data, error } = await supabase
    .from('entity')
    .upsert(entitiesWithClientId, {
      onConflict: 'id',
      ignoreDuplicates: false
    })
    .select();

  if (error) throw error;
  return data;
};


export const deleteEntity = async (id: string) => {
  const { error } = await supabase
    .from('entity')
    .update({ is_deleted: true })
    .eq('id', id);
};

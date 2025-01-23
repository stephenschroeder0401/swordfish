import { supabase } from './supabase-client';
import { getUserSession } from '@/lib/auth/user';

const getAuthenticatedSession = async () => {
  const session = await getUserSession();
  if (!session) throw new Error('No active session');
  return session;
};

export const upsertPropertyGroup = async (group: {
  id: string;
  name: string;
  allocationType: 'custom' | 'revenue';
  properties: Array<{
    id: string;
    percentage: number;
  }>;
  billingAccounts: string[];
}) => {
  try {
    const session = await getAuthenticatedSession();
    
    // Remove UI-only fields and add client_id
    const groupToSave = {
      id: group.id,
      name: group.name,
      client_id: session.clientId,
      allocation_type: group.allocationType
    };

    const { data: groupData, error: groupError } = await supabase
      .from('property_group')
      .upsert(groupToSave)
      .select()
      .single();

    if (groupError) throw groupError;

    // 2. Delete existing property allocations
    const { data: deletePropsData, error: deletePropsError } = await supabase
      .from('property_group_property')
      .delete()
      .eq('property_group_id', group.id);

    console.log('After deleting property allocations:', { deletePropsData, deletePropsError });
    if (deletePropsError) throw deletePropsError;

    // 3. Insert new property allocations
    if (group.properties.length > 0) {
      const propertyAllocations = group.properties.map(prop => ({
        property_group_id: group.id,
        property_id: prop.id,
        percentage: prop.percentage
      }));
      console.log('Inserting property allocations:', propertyAllocations);

      const { data: propData, error: propError } = await supabase
        .from('property_group_property')
        .insert(propertyAllocations);

      console.log('After inserting property allocations:', { propData, propError });
      if (propError) throw propError;
    }

    // 4. Delete existing billing account allocations
    const { data: deleteBillingData, error: deleteBillingError } = await supabase
      .from('property_group_gl')
      .delete()
      .eq('property_group_id', group.id);

    console.log('After deleting billing allocations:', { deleteBillingData, deleteBillingError });
    if (deleteBillingError) throw deleteBillingError;

    // 5. Insert new billing account allocations
    if (group.billingAccounts.length > 0) {
      const billingAllocations = group.billingAccounts.map(accountId => ({
        property_group_id: group.id,
        billing_account_id: accountId
      }));
      console.log('Inserting billing allocations:', billingAllocations);

      const { data: billingData, error: billingError } = await supabase
        .from('property_group_gl')
        .insert(billingAllocations);

      console.log('After inserting billing allocations:', { billingData, billingError });
      if (billingError) throw billingError;
    }

    return groupData;
  } catch (error) {
    console.error('Error in upsertPropertyGroup:', error);
    throw error;
  }
};

export const saveAllPropertyGroups = async (groups: Array<{
  id: string;
  name: string;
  allocationType: 'custom' | 'revenue';
  properties: Array<{
    id: string;
    percentage: number;
  }>;
  billingAccounts: string[];
}>) => {
  try {
    for (const group of groups) {
      await upsertPropertyGroup(group);
    }
    return true;
  } catch (error) {
    console.error('Error in saveAllPropertyGroups:', error);
    throw error;
  }
};

export const fetchAllPropertyGroups = async () => {
  try {
    const session = await getAuthenticatedSession();

    const { data: groups, error: groupError } = await supabase
      .from('property_group')
      .select(`
        id,
        name,
        client_id,
        allocation_type,
        property_group_property (
          property_id,
          percentage
        ),
        property_group_gl (
          billing_account_id
        )
      `)
      .eq('client_id', session.clientId)
      .eq('is_deleted', false);

    if (groupError) throw groupError;

    return groups?.map(group => ({
      id: group.id,
      name: group.name,
      client_id: group.client_id,
      allocationType: group.allocation_type || 'custom',
      properties: group.property_group_property.map(prop => ({
        id: prop.property_id,
        percentage: prop.percentage
      })),
      billingAccounts: group.property_group_gl.map(gl => gl.billing_account_id),
      isExpanded: false
    })) || [];
  } catch (error) {
    console.error('Error fetching property groups:', error);
    throw error;
  }
};

export const fetchMonthlyBillingItems = async () => {
  const session = await getUserSession();
  if (!session) throw new Error('No active session');

  const { data: monthlyItems, error } = await supabase
    .from('billing_account')
    .select(`
      id,
      glcode,
      description,
      rate,
      property_group_gl!inner (
        property_group!inner (
          id,
          client_id,
          property_group_property!inner (
            percentage,
            property!inner (
              code,
              entity!inner (
                name
              )
            )
          )
        )
      )
    `)
    .eq('billing_type', 'Monthly')
    .eq('isbilledback', true)
    .eq('property_group_gl.property_group.client_id', session.clientId)
    .not('property_group_gl.property_group.is_deleted', 'is', true)
    .not('property_group_gl.property_group.property_group_property.property.is_deleted', 'is', true)
    .throwOnError();

  if (error) throw error;
  return monthlyItems || [];
};

export const deletePropertyGroup = async (id: string) => {
  try {
    const session = await getAuthenticatedSession();
    
    const { error } = await supabase
      .from('property_group')
      .update({ is_deleted: true })
      .eq('id', id)
      .eq('client_id', session.clientId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting property group:', error);
    throw error;
  }
};
import { supabase } from './supabase-client';

export const upsertPropertyGroup = async (group: {
  id: string;
  name: string;
  properties: Array<{
    id: string;
    percentage: number;
  }>;
  billingAccounts: string[];
}) => {
  try {
    console.log('Starting upsert for group:', group);

    // 1. Upsert the property group
    const { data: groupData, error: groupError } = await supabase
      .from('property_group')
      .upsert({
        id: group.id,
        name: group.name
      })
      .select()
      .single();

    console.log('After property group upsert:', { groupData, groupError });
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
  properties: Array<{
    id: string;
    percentage: number;
  }>;
  billingAccounts: string[];
}>) => {
  try {
    console.log("groups: ", groups);
    // Save each group sequentially to maintain data consistency
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
    const { data: groups, error: groupError } = await supabase
      .from('property_group')
      .select(`
        id,
        name,
        property_group_property (
          property_id,
          percentage
        ),
        property_group_gl (
          billing_account_id
        )
      `);

    console.log('Raw groups data:', groups);

    if (groupError) throw groupError;

    const formattedGroups = groups?.map(group => {
      console.log('Formatting group:', group);
      return {
        id: group.id,
        name: group.name,
        properties: group.property_group_property.map(prop => ({
          id: prop.property_id,
          percentage: prop.percentage
        })),
        billingAccounts: group.property_group_gl.map(gl => gl.billing_account_id),
        isExpanded: false
      };
    }) || [];

    console.log('Formatted groups:', formattedGroups);
    return formattedGroups;
  } catch (error) {
    console.error('Error fetching property groups:', error);
    throw error;
  }
};

// @ts-nocheck
import { AuthClient, createClient } from "@supabase/supabase-js";
import { CallHistoryEntry } from "../../types/call-history-entry";
import { BillingJob } from "../../types/billing-types";
import { getUserSession, setUserSession, clearUserSession } from '../auth/user';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");

// Replace the direct access with a function to safely get clientId
const getCurrentClientId = async () => {
  const session = await getUserSession();
  if (!session) throw new Error('No active session');
  return session.clientId;
};


export const fetchCallHistory = async (
  query: string,
  variables: Record<string, any>,
) => {
  const response = await fetch(`${supabaseUrl}/graphql/v1`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    } as HeadersInit,
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const data = await response.json();
  return data;
};


export const saveJobs = async (entries, billingPeriod) => {


  // Helper function to validate and format date/time fields
  const validateDate = (date) => {
    return date && !isNaN(Date.parse(date)) ? date : null;
  };

  const formattedEntries = entries.map(entry => ({
    employee_id: entry.employeeId,
    entity_id: entry.entityId || null, // Set to null if empty
    property_id: entry.propertyId,
    billing_account_id: entry.billingAccountId,
    billing_period_id: billingPeriod,
    job_date: validateDate(entry.job_date), // Validate job_date
    start_time: validateDate(entry.startTime), // Validate start_time
    end_time: validateDate(entry.endTime), // Validate end_time
    billed_miles: entry.billedmiles,
    milage_rate: entry.mileageRate, // Ensure this key is spelled correctly
    milage_total: entry.mileageTotal,
    billed_hours: parseFloat(entry.hours), // Convert string to float if necessary
    hourly_rate: entry.rate,
    hourly_total: entry.total,
    total: entry.total
  }));

  // Begin transaction
  const { data: deleteData, error: deleteError } = await supabase
    .from("billing_job")
    .delete()
    .eq('billing_period_id', billingPeriod);

  if (deleteError) {
    console.error("Error deleting existing billing job entries:", deleteError);
    throw deleteError;
  }

  // Insert new entries
  const { data: insertData, error: insertError } = await supabase
    .from("billing_job")
    .insert(formattedEntries);

  if (insertError) {
    console.error("Error inserting billing job entries:", insertError);
    throw insertError;
  }

  return insertData;
};

export const fetchJobsAsBillingJob = async (billingPeriod: string, clientId: string): Promise<BillingJob[]> => {
  const { data, error } = await supabase
    .from('billing_job')
    .select("*")
    .eq('billing_period_id', billingPeriod);

  if (error) throw error;
  return data as BillingJob[];
};

export const saveEmployeeAllocations = async (allocations: Record<string, Array<{billing_account: string, percentage: string}>>) => {
  console.log("Saving employee allocations:", allocations);
  
  // Get all employee IDs from the allocations object
  const employeeIds = Object.keys(allocations);
  
  // Start by deleting all existing allocations for these employees
  const { error: deleteError } = await supabase
    .from('employee_gl_allocation')
    .delete()
    .in('employee_id', employeeIds);

  if (deleteError) {
    console.error("Error deleting existing allocations:", deleteError);
    throw deleteError;
  }

  // Format and insert the new allocations
  const formattedAllocations = Object.entries(allocations).flatMap(([employeeId, allocs]) => 
    allocs.map(alloc => ({
      employee_id: employeeId,
      billing_account_id: alloc.billing_account,
      percentage: parseFloat(alloc.percentage)
    }))
  );

  // Only insert if there are allocations to insert
  if (formattedAllocations.length > 0) {
    const { data, error } = await supabase
      .from('employee_gl_allocation')
      .insert(formattedAllocations);

    if (error) {
      console.error("Error saving employee allocations:", error);
      throw error;
    }

    return data;
  }
  
  return [];
};

export const fetchAllEmployeeGlAllocations = async () => {
  const { data, error } = await supabase
    .from('employee_gl_allocation')
    .select(`
      *,
      employee:employee_id (id, name),
      billing_account:billing_account_id (id, name)
    `)
    .eq('employee.client_id', getCurrentClientId());

  if (error) {
    console.error("Error fetching employee GL allocations:", error);
    throw error;
  }

  return data;
};

export const fetchTableData = async (tableName: string, selectColumns: string = '*') => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select(selectColumns);
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching data from ${tableName}:`, error);
    throw error;
  }
};

// For saving table changes
export const upsertTableData = async (tableName: string, data: any[]) => {
  try {
    const { data: result, error } = await supabase
      .from(tableName)
      .upsert(data, {
        onConflict: 'id'
      });
      
    if (error) throw error;
    return result;
  } catch (error) {
    console.error(`Error upserting ${tableName} data:`, error);
    throw error;
  }
};

export const fetchTableDataWithPagination = async (
  tableName: string, 
  page: number = 0, 
  pageSize: number = 10,
  selectColumns: string = '*'
) => {
  const start = page * pageSize;
  const end = start + pageSize - 1;

  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select(selectColumns, { count: 'exact' })
      .range(start, end);
      
    if (error) throw error;
    return { data, count };
  } catch (error) {
    console.error(`Error fetching data from ${tableName}:`, error);
    throw error;
  }
};

export const deleteTableData = async (tableName: string, conditions: Record<string, any>) => {
  try {
    let query = supabase.from(tableName).delete();
    
    // Apply all conditions
    Object.entries(conditions).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error deleting from ${tableName}:`, error);
    throw error;
  }
};


export const upsertBillbackUpload = async (uploadData: any, billingPeriodId: string) => {
  const { data, error } = await supabase
    .from('billback_upload')
    .upsert([
      {
        billing_period_id: billingPeriodId,
        upload_data: uploadData,
        client_id: getCurrentClientId()
      }
    ], {
      onConflict: ['billing_period_id'] // Specify the column for conflict resolution
    });

  if (error) {
    console.error("Error upserting billback upload:", error);
    throw error;
  }

  return data;
};


export const fetchBillbackUpload = async (billingPeriodId: string) => {
  const { data, error } = await supabase
    .from('billback_upload')
    .select("*")
    .eq('billing_period_id', billingPeriodId)
    .eq('client_id', getCurrentClientId())
    .maybeSingle();

  if (error) {
    console.error("Error fetching billback upload:", error);
    throw error;
  }
  return data;
};

export * from './billing-periods';


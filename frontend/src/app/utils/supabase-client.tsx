// @ts-nocheck
import { createClient } from "@supabase/supabase-js";
import { CallHistoryEntry } from "../types/call-history-entry";
import { BillingJob } from "../types/billing-types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");

export const saveCallHistoryEntry = async (entry: CallHistoryEntry) => {
  const { data, error } = await supabase.from("call_history").insert([entry]);

  if (error) {
    console.error("Error inserting call history entry:", error);
    throw error;
  }

  return data;
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
  console.log('Entries!');
  console.log(entries);
  console.log('Billing Period!');
  console.log(billingPeriod);

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

export const fetchJobsAsBillingJob = async (billingPeriod): Promise<BillingJob[]> => {
  const { data, error } = await supabase
    .from('billing_job')
    .select("*")
    .eq('billing_period_id', billingPeriod);

  if (error) {
    console.error("Error fetching jobs:", error);
    throw error;
  }

  //foreach record in data, set the the 

  return data as BillingJob[];
};

export const fetchAllBillingAccounts = async (page = 0, pageSize = 10) => {
  const start = page * pageSize;
  const end = start + pageSize - 1;

  console.log('Fetching accounts with:', { start, end });

  const { data, error, count } = await supabase
    .from('billing_account')
    .select('*', { count: 'exact' })
    .range(start, end);

  if (error) {
    console.error("Error fetching billing accounts:", error);
    throw error;
  }

  console.log('Fetched accounts:', data);

  return { 
    data: data || [],
    count: count || 0
  };
};

export const fetchAllBillingAccountsNoPagination = async () => {
  const { data, error } = await supabase
    .from('billing_account')
    .select('*')
    .order('name');

  if (error) {
    console.error("Error fetching all billing accounts:", error);
    throw error;
  }

  return data || [];
};

export const fetchAllEmployees = async () => {
  const { data, error } = await supabase
    .from('employee')
    .select("*");

  if (error) {
    console.error("Error fetching employees:", error);
    throw error;
  }

  return data; // Returns the array of employees
};

export const fetchAllBillingProperties = async (page = 0, pageSize = 10) => {
  const start = page * pageSize;
  const end = start + pageSize - 1;

  const { data, error, count } = await supabase
    .from('property')
    .select(`
      *,
      entity:entityid (
        name
      )
    `, { count: 'exact' })
    .range(start, end);

  if (error) {
    console.error("Error fetching properties with entity names:", error);
    throw error;
  }

  const formattedData = data.map(item => ({
    ...item,
    entityName: item.entity?.name
  }));

  return { 
    data: formattedData,
    count: count || 0
  };
};


export const upsertBillbackUpload = async (uploadData: any, billingPeriodId: string) => {
  const { data, error } = await supabase
    .from('billback_upload')
    .upsert([
      {
        billing_period_id: billingPeriodId,
        upload_data: uploadData
      }
    ], {
      onConflict: ['billing_period_id'] // Specify the column for conflict resolution
    });

  if (error) {
    console.error("Error upserting billback upload:", error);
    throw error;
  }

  return data; // Returns the upserted data
};


export const fetchBillbackUpload = async (billingPeriodId: string) => {
  
  const { data, error } = await supabase
    .from('billback_upload')
    .select("*")
    .eq('billing_period_id', billingPeriodId)
    .maybeSingle(); // This will return null if no rows are found

  if (error) {
    console.error("Error fetching billback upload:", error);
    throw error;
  }
  console.log("returning: ", data)
  return data; 
};




export const fetchAllBillingPeriods = async () => {
  const { data, error } = await supabase
    .from('billing_period')
    .select("*");

  if (error) {
    console.error("Error fetching billing periods:", error);
    throw error;
  }

  return data; // Returns the array of billing periods
};

export const fetchAllEntities = async () => {
  const { data, error } = await supabase
    .from('entity')
    .select("*");

  if (error) {
    console.error("Error fetching entities:", error);
    throw error;
  }

  return data; // Returns the array of entities
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
    `);

  if (error) {
    console.error("Error fetching employee GL allocations:", error);
    throw error;
  }

  return data;
};

export const fetchEmployeeTimeAllocations = async (employeeId: string) => {
  const { data, error } = await supabase
    .from('employee_gl_allocation')
    .select(`
      *,
      billing_account:billing_account_id (id, name)
    `)
    .eq('employee_id', employeeId);

  if (error) {
    console.error("Error fetching employee time allocations:", error);
    throw error;
  }

  return data;
};

export const fetchEmployeeAllocations = async (employeeId: string) => {
  const { data, error } = await supabase
    .from('employee_gl_allocation')
    .select(`
      billing_account_id,
      percentage,
      billing_account:billing_account_id (
        name
      )
    `)
    .eq('employee_id', employeeId);
    
  if (error) {
    console.error("Error fetching employee allocations:", error);
    throw error;
  }

  return data.map(allocation => ({
    billing_account: allocation.billing_account_id, // Keep the ID for the select value
    percentage: allocation.percentage.toString()
  }));
};

export const fetchAllBillingPropertiesNoPagination = async () => {
  const { data, error } = await supabase
    .from('property')
    .select(`
      *,
      entity:entityid (
        name
      )
    `)
    .order('name');

  if (error) {
    console.error("Error fetching properties with entity names:", error);
    throw error;
  }

  const formattedData = data.map(item => ({
    ...item,
    entityName: item.entity?.name
  }));

  return formattedData || [];
};

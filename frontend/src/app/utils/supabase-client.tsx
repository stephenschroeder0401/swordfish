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


export const saveJobs = async (entries: any, billingPeriod: any) => {
  console.log('Entries!');
  console.log(entries);
  console.log('Billing Period!');
  console.log(billingPeriod);

  // Format the entries for insertion
  const formattedEntries = entries.map(entry => ({
    employee_id: entry.employeeId,
    entity_id: entry.entityId,
    property_id: entry.propertyId,
    billing_account_id: entry.billingAccountId,
    billing_period_id: billingPeriod,
    job_date: entry.date,
    start_time: entry.startTime,
    end_time: entry.endTime,
    billed_miles: entry.billedmiles,
    milage_rate: entry.milageRate, // Ensure this key is spelled correctly if it's 'mileageRate'
    milage_total: entry.milageTotal,
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

export const fetchAllBillingAccounts = async () => {
  const { data, error } = await supabase
    .from('billing_account')
    .select("*");

  if (error) {
    console.error("Error fetching billing accounts:", error);
    throw error;
  }

  return data; // Returns the array of billing accounts
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

export const fetchAllBillingProperties = async () => {
  const { data, error } = await supabase
    .from('property')
    .select(`
      *,
      entity:entityid (
        name
      )
    `);  // 'entity' is the foreign table name, and 'entity_id' is the column in the 'property' table

  if (error) {
    console.error("Error fetching properties with entity names:", error);
    throw error;
  }

  // Optionally, you can map over the data to simplify the structure
  // This would flatten the data, making it easier to use in the frontend
  const formattedData = data.map(item => ({
    ...item,
    entityName: item.entity.name  // Assuming 'entity' is not null
  }));

  return formattedData; // Returns the array of properties with entity names included
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

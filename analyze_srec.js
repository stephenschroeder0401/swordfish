const fs = require('fs');

// Read the billback data
const rawData = fs.readFileSync('billback_full.json', 'utf8');
const jsonData = JSON.parse(rawData);

// Extract the upload_data array
const uploadData = JSON.parse(jsonData.upload_data);

// Filter for SREC rows with non-billable categories that are marked as errors
const srecErrorRows = uploadData.filter(row => {
  return row.property && 
         row.property.includes('SREC') && 
         row.category && 
         row.category.includes('Non-Billable') && 
         row.isError === true;
});

console.log(`Found ${srecErrorRows.length} SREC rows with non-billable categories marked as errors`);

// Print detailed information about these rows
srecErrorRows.forEach((row, index) => {
  console.log(`\nRow ${index + 1}:`);
  console.log(`  rowId: ${row.rowId}`);
  console.log(`  property: ${row.property}`);
  console.log(`  propertyId: ${row.propertyId || 'MISSING'}`);
  console.log(`  category: ${row.category}`);
  console.log(`  billingAccountId: ${row.billingAccountId || 'MISSING'}`);
  console.log(`  employee: ${row.employee}`);
  console.log(`  employeeId: ${row.employeeId || 'MISSING'}`);
  console.log(`  hours: ${row.hours}`);
  console.log(`  job_date: ${row.job_date}`);
  console.log(`  notes: ${row.notes}`);
  
  // List all potential reasons for error
  const errorReasons = [];
  if (!row.propertyId) errorReasons.push('Missing propertyId');
  if (!row.billingAccountId) errorReasons.push('Missing billingAccountId');
  if (!row.employeeId) errorReasons.push('Missing employeeId');
  if (!row.hours) errorReasons.push('Missing hours');
  if (row.hours && isNaN(Number(row.hours))) errorReasons.push('Invalid hours format');
  
  console.log(`  Potential error reasons: ${errorReasons.length > 0 ? errorReasons.join(', ') : 'None identified'}`);
}); 
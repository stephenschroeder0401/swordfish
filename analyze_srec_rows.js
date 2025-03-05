const fs = require('fs');

// Read the fixed JSON file
const data = JSON.parse(fs.readFileSync('billback_fixed.json', 'utf8'));

// Filter for SREC rows with Non-Billable category
const srecNonBillableRows = data.filter(row => 
  row.property === 'SREC' && 
  row.category === 'Non-Billable'
);

console.log(`Total SREC Non-Billable rows: ${srecNonBillableRows.length}`);

// Group by error status
const errorRows = srecNonBillableRows.filter(row => row.isError);
const nonErrorRows = srecNonBillableRows.filter(row => !row.isError);

console.log(`SREC Non-Billable rows with errors: ${errorRows.length}`);
console.log(`SREC Non-Billable rows without errors: ${nonErrorRows.length}`);

// Analyze error rows
console.log('\nError rows details:');
errorRows.forEach(row => {
  console.log(`\nRow ID: ${row.rowId}`);
  console.log(`Employee: ${row.employee}`);
  console.log(`Date: ${row.job_date}`);
  console.log(`Hours: ${row.hours}`);
  console.log(`Notes: ${row.notes}`);
  console.log(`Total: ${row.total}`);
});

// Look for patterns in error rows
console.log('\nPossible error patterns:');

// Check for zero hours
const zeroHoursErrors = errorRows.filter(row => row.hours === 0);
console.log(`Error rows with zero hours: ${zeroHoursErrors.length} out of ${errorRows.length}`);

// Check for specific notes
const dayOffNotes = errorRows.filter(row => row.notes.includes('Day Off'));
console.log(`Error rows with "Day Off" in notes: ${dayOffNotes.length} out of ${errorRows.length}`);

// Compare with non-error rows
console.log('\nNon-error rows summary:');
const nonErrorHours = nonErrorRows.map(row => row.hours);
const avgNonErrorHours = nonErrorHours.reduce((sum, hours) => sum + hours, 0) / nonErrorHours.length;
console.log(`Average hours for non-error rows: ${avgNonErrorHours.toFixed(2)}`);

// Check if all error rows are from the same employee
const errorEmployees = [...new Set(errorRows.map(row => row.employee))];
console.log(`Employees with error rows: ${errorEmployees.join(', ')}`); 
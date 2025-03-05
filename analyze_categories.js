const fs = require('fs');

// Read the fixed JSON file
try {
  const data = JSON.parse(fs.readFileSync('billback_fixed.json', 'utf8'));
  console.log(`Successfully parsed JSON with ${data.length} entries`);
  
  // Get all unique categories
  const categories = [...new Set(data.map(row => row.category))];
  console.log('\nUnique categories in the data:');
  categories.forEach(cat => console.log(`- "${cat}"`));
  
  // Look specifically for SREC properties
  const srecRows = data.filter(row => row.property && row.property.includes('SREC'));
  console.log(`\nFound ${srecRows.length} rows with SREC in the property name`);
  
  // Get categories used with SREC properties
  const srecCategories = [...new Set(srecRows.map(row => row.category))];
  console.log('\nCategories used with SREC properties:');
  srecCategories.forEach(cat => console.log(`- "${cat}"`));
  
  // Check for rows with Non-Billable category (case insensitive)
  const nonBillableRows = data.filter(row => 
    row.category && 
    row.category.toLowerCase().includes('non-billable')
  );
  console.log(`\nFound ${nonBillableRows.length} rows with Non-Billable category (case insensitive)`);
  
  // Check for rows with Non-Billable category (exact match)
  const exactNonBillableRows = data.filter(row => row.category === 'Non-Billable');
  console.log(`Found ${exactNonBillableRows.length} rows with exact 'Non-Billable' category`);
  
  // Check how categories are mapped to billingAccountId
  console.log('\nCategory to billingAccountId mapping examples:');
  const categoryMapping = {};
  data.forEach(row => {
    if (row.category && row.billingAccountId && !categoryMapping[row.category]) {
      categoryMapping[row.category] = row.billingAccountId;
    }
  });
  
  Object.entries(categoryMapping).forEach(([category, id]) => {
    console.log(`- "${category}" => ${id}`);
  });
  
  // Check for rows with missing billingAccountId
  const missingAccountIdRows = data.filter(row => !row.billingAccountId);
  console.log(`\nFound ${missingAccountIdRows.length} rows with missing billingAccountId`);
  
  // Check for SREC rows with missing billingAccountId
  const srecMissingAccountIdRows = srecRows.filter(row => !row.billingAccountId);
  console.log(`Found ${srecMissingAccountIdRows.length} SREC rows with missing billingAccountId`);
  
  // Print a few examples of SREC rows with issues
  if (srecMissingAccountIdRows.length > 0) {
    console.log('\nExample SREC rows with missing billingAccountId:');
    srecMissingAccountIdRows.slice(0, 3).forEach((row, i) => {
      console.log(`\nExample ${i+1}:`);
      console.log(`  Property: ${row.property}`);
      console.log(`  Category: ${row.category}`);
      console.log(`  Employee: ${row.employee}`);
      console.log(`  Date: ${row.job_date}`);
      console.log(`  Hours: ${row.hours}`);
      console.log(`  Notes: ${row.notes}`);
      console.log(`  isError: ${row.isError}`);
    });
  }
  
} catch (error) {
  console.error('Error analyzing the JSON file:', error.message);
} 
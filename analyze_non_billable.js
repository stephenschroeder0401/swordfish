const fs = require('fs');

// Read the billback data
try {
  const data = fs.readFileSync('billback_fixed.json', 'utf8');
  
  try {
    const billbacks = JSON.parse(data);
    console.log(`Total entries in billback data: ${billbacks.length}`);
    
    // Check for SREC properties
    const srecEntries = billbacks.filter(item => item.property === 'SREC');
    console.log(`\nTotal SREC property entries: ${srecEntries.length}`);
    
    if (srecEntries.length > 0) {
      // Count categories for SREC properties
      const srecCategories = {};
      srecEntries.forEach(item => {
        const category = item.category || 'undefined';
        srecCategories[category] = (srecCategories[category] || 0) + 1;
      });
      
      console.log('\nCategories for SREC properties:');
      console.log(srecCategories);
      
      // Check for originalCategory field
      const hasOriginalCategory = srecEntries.some(item => item.originalCategory !== undefined);
      console.log(`\nSREC entries have originalCategory field: ${hasOriginalCategory}`);
      
      if (hasOriginalCategory) {
        const srecOriginalCategories = {};
        srecEntries.forEach(item => {
          const originalCategory = item.originalCategory || 'undefined';
          srecOriginalCategories[originalCategory] = (srecOriginalCategories[originalCategory] || 0) + 1;
        });
        
        console.log('\nOriginal categories for SREC properties:');
        console.log(srecOriginalCategories);
      }
      
      // Sample SREC entry
      console.log('\nSample SREC entry:');
      console.log(JSON.stringify(srecEntries[0], null, 2));
    }
    
    // Check for Non-Billable categories
    const nonBillableEntries = billbacks.filter(item => 
      item.category === 'Non-Billable' || item.originalCategory === 'Non-Billable'
    );
    console.log(`\nTotal entries with Non-Billable category: ${nonBillableEntries.length}`);
    
    if (nonBillableEntries.length > 0) {
      // Count properties for Non-Billable categories
      const nonBillableProperties = {};
      nonBillableEntries.forEach(item => {
        const property = item.property || 'undefined';
        nonBillableProperties[property] = (nonBillableProperties[property] || 0) + 1;
      });
      
      console.log('\nProperties for Non-Billable categories:');
      console.log(nonBillableProperties);
      
      // Sample Non-Billable entry
      console.log('\nSample Non-Billable entry:');
      console.log(JSON.stringify(nonBillableEntries[0], null, 2));
    }
    
    // Check for entries with isError=true
    const errorEntries = billbacks.filter(item => item.isError === true);
    console.log(`\nTotal entries with isError=true: ${errorEntries.length}`);
    
    if (errorEntries.length > 0) {
      // Count properties for error entries
      const errorProperties = {};
      errorEntries.forEach(item => {
        const property = item.property || 'undefined';
        errorProperties[property] = (errorProperties[property] || 0) + 1;
      });
      
      console.log('\nProperties for error entries:');
      console.log(errorProperties);
      
      // Count categories for error entries
      const errorCategories = {};
      errorEntries.forEach(item => {
        const category = item.category || 'undefined';
        errorCategories[category] = (errorCategories[category] || 0) + 1;
      });
      
      console.log('\nCategories for error entries:');
      console.log(errorCategories);
      
      // Sample error entry
      console.log('\nSample error entry:');
      console.log(JSON.stringify(errorEntries[0], null, 2));
    }
    
  } catch (parseError) {
    console.error('Error parsing JSON:', parseError);
    
    // Try to identify where the JSON is malformed
    console.log('\nAttempting to diagnose JSON format issues...');
    
    // Check if the file starts with '[' and ends with ']'
    if (!data.trim().startsWith('[') || !data.trim().endsWith(']')) {
      console.log('JSON file is not properly formatted as an array. It should start with "[" and end with "]"');
    }
    
    // Check for common JSON syntax errors
    if (data.includes('undefined') || data.includes('NaN')) {
      console.log('JSON contains invalid JavaScript values like undefined or NaN');
    }
    
    // Print the first 200 characters to see the format
    console.log('\nFirst 200 characters of the file:');
    console.log(data.substring(0, 200));
    
    // Print the last 200 characters to see the format
    console.log('\nLast 200 characters of the file:');
    console.log(data.substring(data.length - 200));
  }
} catch (fileError) {
  console.error('Error reading file:', fileError);
} 
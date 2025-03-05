const fs = require('fs');

// Read the billback data
try {
  const data = fs.readFileSync('billback_fixed.json', 'utf8');
  
  try {
    const billbacks = JSON.parse(data);
    console.log(`Total entries in billback data: ${billbacks.length}`);
    
    // Find the specific entry
    const specificEntry = billbacks.find(item => 
      item.rowId === "4298d216-f5b4-4422-a364-1669e4674710"
    );
    
    if (specificEntry) {
      console.log('\nFound the specific entry:');
      console.log(JSON.stringify(specificEntry, null, 2));
      
      // Check if there are other entries with the same characteristics
      const similarEntries = billbacks.filter(item => 
        item.property === "SREC" && 
        item.category === "Non-Billable" && 
        item.hours === 0 &&
        item.rowId !== specificEntry.rowId
      );
      
      console.log(`\nFound ${similarEntries.length} similar entries (SREC, Non-Billable, 0 hours)`);
      
      // Check how many of these similar entries are marked as errors
      const similarErrorEntries = similarEntries.filter(item => item.isError === true);
      console.log(`Of these, ${similarErrorEntries.length} are marked as errors`);
      
      // Check if there are any Non-Billable entries with hours > 0
      const nonBillableWithHours = billbacks.filter(item => 
        item.category === "Non-Billable" && 
        item.hours > 0
      );
      
      console.log(`\nFound ${nonBillableWithHours.length} Non-Billable entries with hours > 0`);
      console.log(`Of these, ${nonBillableWithHours.filter(item => item.isError === true).length} are marked as errors`);
      
      // Check if there are any SREC entries with hours > 0
      const srecWithHours = billbacks.filter(item => 
        item.property === "SREC" && 
        item.hours > 0
      );
      
      console.log(`\nFound ${srecWithHours.length} SREC entries with hours > 0`);
      console.log(`Of these, ${srecWithHours.filter(item => item.isError === true).length} are marked as errors`);
      
      // Look at the validation logic in the code
      console.log('\nPossible reasons for error:');
      
      // Check if hours = 0 is a validation issue
      if (specificEntry.hours === 0) {
        console.log('- Hours is set to 0, which might be invalid for billable entries');
      }
      
      // Check if the billingAccountId exists in the system
      console.log(`- The billingAccountId "${specificEntry.billingAccountId}" might not be recognized as a valid Non-Billable account`);
      
      // Check if there's a mismatch between category and billingAccountId
      console.log('- There might be a mismatch between the "Non-Billable" category text and the actual billing account type');
      
      // Check for any entries with the same billingAccountId that are not errors
      const sameAccountNonErrors = billbacks.filter(item => 
        item.billingAccountId === specificEntry.billingAccountId && 
        item.isError !== true
      );
      
      console.log(`\nFound ${sameAccountNonErrors.length} entries with the same billingAccountId that are not errors`);
      
      if (sameAccountNonErrors.length > 0) {
        console.log('\nExample of non-error entry with same billingAccountId:');
        console.log(JSON.stringify(sameAccountNonErrors[0], null, 2));
      }
    } else {
      console.log('\nCould not find the specific entry with rowId 4298d216-f5b4-4422-a364-1669e4674710');
      
      // Try to find entries with similar characteristics
      const similarEntries = billbacks.filter(item => 
        item.property === "SREC" && 
        item.category === "Non-Billable"
      );
      
      console.log(`\nFound ${similarEntries.length} entries with property=SREC and category=Non-Billable`);
      
      if (similarEntries.length > 0) {
        console.log('\nFirst similar entry:');
        console.log(JSON.stringify(similarEntries[0], null, 2));
      }
    }
    
  } catch (parseError) {
    console.error('Error parsing JSON:', parseError);
  }
} catch (fileError) {
  console.error('Error reading file:', fileError);
} 
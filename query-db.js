const { execSync } = require('child_process');

/**
 * Query the local Supabase database
 * @param {string} query - SQL query to execute
 * @returns {string} - Query results as a string
 */
function queryDatabase(query) {
  try {
    // Escape single quotes in the query for shell safety
    const escapedQuery = query.replace(/'/g, "'\\''");
    
    // Execute the query using Docker exec and the Postgres container
    const command = `docker exec -i supabase_db_database psql -U postgres -c '${escapedQuery}' -t`;
    const result = execSync(command).toString();
    
    return result;
  } catch (error) {
    return `Error executing query: ${error.message}\n${error.stderr ? error.stderr.toString() : ''}`;
  }
}

// Get the query from command line arguments
const query = process.argv[2];

if (!query) {
  console.log('Please provide a SQL query as an argument');
  console.log('Example: node query-db.js "SELECT * FROM auth.users LIMIT 5"');
  process.exit(1);
}

// Execute the query and print the results
const result = queryDatabase(query);
console.log(result); 
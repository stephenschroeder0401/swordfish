const { execSync } = require('child_process');
const fs = require('fs');

/**
 * Query the local Supabase database
 * @param {string} query - SQL query to execute
 * @param {boolean} formatAsTable - Whether to format the output as a table
 * @returns {string} - Query results
 */
function queryDatabase(query, formatAsTable = true) {
  try {
    // Escape single quotes in the query for shell safety
    const escapedQuery = query.replace(/'/g, "'\\''");
    
    // Build the command with appropriate formatting options
    let command = `docker exec -i supabase_db_database psql -U postgres`;
    
    if (formatAsTable) {
      command += ` -c '${escapedQuery}'`; // Default table format
    } else {
      command += ` -t -c '${escapedQuery}'`; // Plain text format
    }
    
    const result = execSync(command).toString();
    return result;
  } catch (error) {
    return `Error executing query: ${error.message}\n${error.stderr ? error.stderr.toString() : ''}`;
  }
}

/**
 * List all tables in a schema
 * @param {string} schema - Schema name (default: public)
 * @returns {string} - List of tables
 */
function listTables(schema = 'public') {
  const query = `
    SELECT table_name, 
           pg_size_pretty(pg_total_relation_size('"' || table_schema || '"."' || table_name || '"')) as size,
           pg_total_relation_size('"' || table_schema || '"."' || table_name || '"') as raw_size
    FROM information_schema.tables 
    WHERE table_schema = '${schema}'
    ORDER BY raw_size DESC;
  `;
  return queryDatabase(query);
}

/**
 * Describe a table's structure
 * @param {string} tableName - Table name
 * @param {string} schema - Schema name (default: public)
 * @returns {string} - Table structure
 */
function describeTable(tableName, schema = 'public') {
  const query = `
    SELECT column_name, 
           data_type, 
           is_nullable, 
           column_default
    FROM information_schema.columns 
    WHERE table_schema = '${schema}' 
    AND table_name = '${tableName}'
    ORDER BY ordinal_position;
  `;
  return queryDatabase(query);
}

/**
 * Count rows in a table
 * @param {string} tableName - Table name
 * @param {string} schema - Schema name (default: public)
 * @returns {string} - Row count
 */
function countRows(tableName, schema = 'public') {
  const query = `SELECT COUNT(*) FROM "${schema}"."${tableName}";`;
  return queryDatabase(query);
}

/**
 * Sample data from a table
 * @param {string} tableName - Table name
 * @param {number} limit - Number of rows to return
 * @param {string} schema - Schema name (default: public)
 * @returns {string} - Sample data
 */
function sampleData(tableName, limit = 5, schema = 'public') {
  const query = `SELECT * FROM "${schema}"."${tableName}" LIMIT ${limit};`;
  return queryDatabase(query);
}

/**
 * Execute a custom query
 * @param {string} query - SQL query
 * @param {boolean} formatAsTable - Whether to format as table
 * @returns {string} - Query results
 */
function customQuery(query, formatAsTable = true) {
  return queryDatabase(query, formatAsTable);
}

/**
 * Save query results to a file
 * @param {string} query - SQL query
 * @param {string} filePath - Path to save results
 * @returns {string} - Success message
 */
function saveQueryToFile(query, filePath) {
  try {
    const result = queryDatabase(query, false);
    fs.writeFileSync(filePath, result);
    return `Results saved to ${filePath}`;
  } catch (error) {
    return `Error saving results: ${error.message}`;
  }
}

// Command line interface
const command = process.argv[2];
const args = process.argv.slice(3);

if (!command) {
  console.log(`
Database Helper Commands:
  list-tables [schema]              - List all tables in schema (default: public)
  describe-table <table> [schema]   - Describe table structure
  count-rows <table> [schema]       - Count rows in a table
  sample-data <table> [limit] [schema] - Sample data from a table
  query "<sql-query>"               - Execute a custom SQL query
  save-query "<sql-query>" <file>   - Save query results to a file
  `);
  process.exit(0);
}

let result = '';

switch (command) {
  case 'list-tables':
    result = listTables(args[0]);
    break;
  case 'describe-table':
    if (!args[0]) {
      console.log('Error: Table name is required');
      process.exit(1);
    }
    result = describeTable(args[0], args[1]);
    break;
  case 'count-rows':
    if (!args[0]) {
      console.log('Error: Table name is required');
      process.exit(1);
    }
    result = countRows(args[0], args[1]);
    break;
  case 'sample-data':
    if (!args[0]) {
      console.log('Error: Table name is required');
      process.exit(1);
    }
    result = sampleData(args[0], args[1] || 5, args[2]);
    break;
  case 'query':
    if (!args[0]) {
      console.log('Error: SQL query is required');
      process.exit(1);
    }
    result = customQuery(args[0]);
    break;
  case 'save-query':
    if (!args[0] || !args[1]) {
      console.log('Error: SQL query and file path are required');
      process.exit(1);
    }
    result = saveQueryToFile(args[0], args[1]);
    break;
  default:
    console.log(`Unknown command: ${command}`);
    process.exit(1);
}

console.log(result); 
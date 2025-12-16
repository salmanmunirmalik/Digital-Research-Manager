/**
 * Database Operations Test Script
 * Tests all database CRUD operations for forms and data storage
 */

import pool from '../database/config.js';

interface TestResult {
  test: string;
  passed: boolean;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

async function testDatabaseOperation(name: string, operation: () => Promise<any>): Promise<void> {
  try {
    const data = await operation();
    results.push({ test: name, passed: true, data });
    console.log(`✅ ${name}`);
  } catch (error: any) {
    results.push({ test: name, passed: false, error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

async function runTests() {
  console.log('🧪 Testing Database Operations...\n');

  // Test 1: Users table
  await testDatabaseOperation('Test Users Table Read', async () => {
    const result = await pool.query('SELECT id, email, first_name, last_name FROM users LIMIT 5');
    return { count: result.rows.length, sample: result.rows[0] };
  });

  // Test 2: Personal NoteBook Entries
  await testDatabaseOperation('Test Personal NoteBook Entries Read', async () => {
    const result = await pool.query('SELECT id, title, content FROM lab_notebook_entries LIMIT 5');
    return { count: result.rows.length };
  });

  await testDatabaseOperation('Test Personal NoteBook Entry Create', async () => {
    const result = await pool.query(`
      INSERT INTO lab_notebook_entries (author_id, title, content, date)
      VALUES ($1, $2, $3, $4)
      RETURNING id, title
    `, [
      'demo-user-0001',
      'Test Notebook Entry',
      'This is a test entry created during database testing',
      new Date()
    ]);
    return result.rows[0];
  });

  // Test 3: Protocols
  await testDatabaseOperation('Test Protocols Read', async () => {
    const result = await pool.query('SELECT id, title, description FROM protocols LIMIT 5');
    return { count: result.rows.length };
  });

  await testDatabaseOperation('Test Protocol Create', async () => {
    const result = await pool.query(`
      INSERT INTO protocols (author_id, title, description, content)
      VALUES ($1, $2, $3, $4)
      RETURNING id, title
    `, [
      'demo-user-0001',
      'Test Protocol',
      'Test protocol description',
      'Test protocol content'
    ]);
    return result.rows[0];
  });

  // Test 4: Experiments
  await testDatabaseOperation('Test Experiments Read', async () => {
    const result = await pool.query('SELECT id, title, description FROM experiments LIMIT 5');
    return { count: result.rows.length };
  });

  // Test 5: Safety Systems Tables
  await testDatabaseOperation('Test Approval Requests Table', async () => {
    const result = await pool.query('SELECT COUNT(*) as count FROM approval_requests');
    return { count: parseInt(result.rows[0].count) };
  });

  await testDatabaseOperation('Test Audit Logs Table', async () => {
    const result = await pool.query('SELECT COUNT(*) as count FROM audit_logs');
    return { count: parseInt(result.rows[0].count) };
  });

  await testDatabaseOperation('Test Action Snapshots Table', async () => {
    const result = await pool.query('SELECT COUNT(*) as count FROM action_snapshots');
    return { count: parseInt(result.rows[0].count) };
  });

  await testDatabaseOperation('Test Rollback Requests Table', async () => {
    const result = await pool.query('SELECT COUNT(*) as count FROM rollback_requests');
    return { count: parseInt(result.rows[0].count) };
  });

  // Test 6: AI Provider Keys
  await testDatabaseOperation('Test AI Provider Keys Table', async () => {
    const result = await pool.query('SELECT COUNT(*) as count FROM ai_provider_keys');
    return { count: parseInt(result.rows[0].count) };
  });

  // Test 7: API Task Assignments
  await testDatabaseOperation('Test API Task Assignments Table', async () => {
    const result = await pool.query('SELECT COUNT(*) as count FROM api_task_assignments');
    return { count: parseInt(result.rows[0].count) };
  });

  // Test 8: Workflows
  await testDatabaseOperation('Test Workflows Table', async () => {
    const result = await pool.query('SELECT COUNT(*) as count FROM workflows');
    return { count: parseInt(result.rows[0].count) };
  });

  // Test 9: User AI Content
  await testDatabaseOperation('Test User AI Content Table', async () => {
    const result = await pool.query('SELECT COUNT(*) as count FROM user_ai_content');
    return { count: parseInt(result.rows[0].count) };
  });

  // Test 10: Papers
  await testDatabaseOperation('Test Papers Table', async () => {
    const result = await pool.query('SELECT COUNT(*) as count FROM papers');
    return { count: parseInt(result.rows[0].count) };
  });

  // Test 11: Write and Read Test
  await testDatabaseOperation('Test Write-Read Cycle (Personal NoteBook)', async () => {
    // Write
    const insertResult = await pool.query(`
      INSERT INTO lab_notebook_entries (author_id, title, content, date)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [
      'demo-user-0001',
      'Write-Read Test Entry',
      'Testing write and read operations',
      new Date()
    ]);
    
    const entryId = insertResult.rows[0].id;
    
    // Read
    const readResult = await pool.query('SELECT id, title, content FROM lab_notebook_entries WHERE id = $1', [entryId]);
    
    if (readResult.rows.length === 0) {
      throw new Error('Failed to read inserted entry');
    }
    
    return { written: true, read: true, id: entryId };
  });

  // Test 12: Update Test
  await testDatabaseOperation('Test Update Operation (Personal NoteBook)', async () => {
    const result = await pool.query(`
      UPDATE lab_notebook_entries
      SET title = $1, updated_at = CURRENT_TIMESTAMP
      WHERE title = 'Write-Read Test Entry'
      RETURNING id, title
    `, ['Updated Test Entry']);
    
    if (result.rows.length === 0) {
      throw new Error('No entry found to update');
    }
    
    return result.rows[0];
  });

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${results.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (failed > 0) {
    console.log('Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.test}: ${r.error}`);
    });
  }

  await pool.end();
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});


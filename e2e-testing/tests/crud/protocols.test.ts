import { testData } from '../setup/test-config';

describe('Protocols CRUD Tests', () => {
  let testProtocolId: string;

  beforeEach(async () => {
    await global.crudHelpers.resetTestData();
  });

  test('CREATE: Should create new protocol', async () => {
    const protocolData = {
      name: `Test Protocol ${Date.now()}`,
      description: 'A test protocol for E2E testing',
      steps: ['Step 1', 'Step 2', 'Step 3'],
      category: 'Laboratory',
      user_id: 1,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await global.crudHelpers.createTestRecord('protocols', protocolData);
    
    expect(result).toBeDefined();
    expect(result.name).toBe(protocolData.name);
    expect(result.description).toBe(protocolData.description);
    expect(result.steps).toEqual(protocolData.steps);
    expect(result.category).toBe(protocolData.category);
    
    testProtocolId = result.id;
  });

  test('READ: Should read protocol', async () => {
    // First create a protocol
    const protocolData = {
      name: `Test Protocol ${Date.now()}`,
      description: 'A test protocol for E2E testing',
      steps: ['Step 1', 'Step 2', 'Step 3'],
      category: 'Laboratory',
      user_id: 1,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const createdProtocol = await global.crudHelpers.createTestRecord('protocols', protocolData);
    
    // Then read it
    const readProtocol = await global.crudHelpers.readTestRecord('protocols', createdProtocol.id);
    
    expect(readProtocol).toBeDefined();
    expect(readProtocol.id).toBe(createdProtocol.id);
    expect(readProtocol.name).toBe(protocolData.name);
    expect(readProtocol.description).toBe(protocolData.description);
  });

  test('UPDATE: Should update protocol', async () => {
    // First create a protocol
    const protocolData = {
      name: `Test Protocol ${Date.now()}`,
      description: 'A test protocol for E2E testing',
      steps: ['Step 1', 'Step 2', 'Step 3'],
      category: 'Laboratory',
      user_id: 1,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const createdProtocol = await global.crudHelpers.createTestRecord('protocols', protocolData);
    
    // Then update it
    const updateData = {
      name: 'Updated Protocol Name',
      description: 'Updated protocol description',
      steps: ['Updated Step 1', 'Updated Step 2'],
      updated_at: new Date(),
    };

    const updatedProtocol = await global.crudHelpers.updateTestRecord('protocols', createdProtocol.id, updateData);
    
    expect(updatedProtocol).toBeDefined();
    expect(updatedProtocol.id).toBe(createdProtocol.id);
    expect(updatedProtocol.name).toBe(updateData.name);
    expect(updatedProtocol.description).toBe(updateData.description);
    expect(updatedProtocol.steps).toEqual(updateData.steps);
  });

  test('DELETE: Should delete protocol', async () => {
    // First create a protocol
    const protocolData = {
      name: `Test Protocol ${Date.now()}`,
      description: 'A test protocol for E2E testing',
      steps: ['Step 1', 'Step 2', 'Step 3'],
      category: 'Laboratory',
      user_id: 1,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const createdProtocol = await global.crudHelpers.createTestRecord('protocols', protocolData);
    
    // Then delete it
    const deletedProtocol = await global.crudHelpers.deleteTestRecord('protocols', createdProtocol.id);
    
    expect(deletedProtocol).toBeDefined();
    expect(deletedProtocol.id).toBe(createdProtocol.id);
    
    // Verify it's deleted
    try {
      await global.crudHelpers.readTestRecord('protocols', createdProtocol.id);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).toContain('not found');
    }
  });

  test('SEARCH: Should search protocols by name', async () => {
    // Create test protocols
    const protocols = [];
    for (let i = 0; i < 3; i++) {
      const protocolData = {
        name: `Search Test Protocol ${i}`,
        description: `Description ${i}`,
        steps: [`Step ${i}`],
        category: 'Laboratory',
        user_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const protocol = await global.crudHelpers.createTestRecord('protocols', protocolData);
      protocols.push(protocol);
    }
    
    // Search for protocols
    const searchQuery = `
      SELECT * FROM protocols 
      WHERE name ILIKE '%Search Test%'
      ORDER BY created_at DESC
    `;
    
    const result = await global.crudHelpers.executeQuery(searchQuery);
    
    expect(result.rows.length).toBe(3);
    expect(result.rows[0].name).toContain('Search Test Protocol');
  });

  test('CATEGORIES: Should filter protocols by category', async () => {
    // Create protocols with different categories
    const categories = ['Laboratory', 'Analysis', 'Equipment'];
    const protocols = [];
    
    for (const category of categories) {
      const protocolData = {
        name: `Protocol for ${category}`,
        description: `Description for ${category}`,
        steps: ['Step 1'],
        category: category,
        user_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const protocol = await global.crudHelpers.createTestRecord('protocols', protocolData);
      protocols.push(protocol);
    }
    
    // Filter by category
    const filterQuery = `
      SELECT * FROM protocols 
      WHERE category = $1
    `;
    
    const result = await global.crudHelpers.executeQuery(filterQuery, ['Laboratory']);
    
    expect(result.rows.length).toBe(1);
    expect(result.rows[0].category).toBe('Laboratory');
  });

  test('VERSIONING: Should handle protocol versions', async () => {
    // Create initial protocol
    const protocolData = {
      name: 'Versioned Protocol',
      description: 'Initial version',
      steps: ['Step 1'],
      category: 'Laboratory',
      version: '1.0',
      user_id: 1,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const protocol = await global.crudHelpers.createTestRecord('protocols', protocolData);
    
    // Create new version
    const versionData = {
      name: 'Versioned Protocol',
      description: 'Updated version',
      steps: ['Step 1', 'Step 2'],
      category: 'Laboratory',
      version: '2.0',
      parent_id: protocol.id,
      user_id: 1,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const newVersion = await global.crudHelpers.createTestRecord('protocols', versionData);
    
    expect(newVersion.version).toBe('2.0');
    expect(newVersion.parent_id).toBe(protocol.id);
    
    // Get all versions
    const versionsQuery = `
      SELECT * FROM protocols 
      WHERE name = $1 OR parent_id = $2
      ORDER BY version
    `;
    
    const versions = await global.crudHelpers.executeQuery(versionsQuery, [protocol.name, protocol.id]);
    
    expect(versions.rows.length).toBe(2);
  });
});

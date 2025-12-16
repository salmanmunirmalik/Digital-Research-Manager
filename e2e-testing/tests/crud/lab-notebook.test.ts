import { testData } from '../setup/test-config';

describe('Personal NoteBook CRUD Tests', () => {
  let testEntryId: string;

  beforeEach(async () => {
    await global.crudHelpers.resetTestData();
  });

  test('CREATE: Should create new Personal NoteBook entry', async () => {
    const entryData = {
      title: `Test Entry ${Date.now()}`,
      content: 'This is a test entry content',
      category: 'Biology',
      tags: ['test', 'experiment'],
      user_id: 1,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await global.crudHelpers.createTestRecord('lab_notebook_entries', entryData);
    
    expect(result).toBeDefined();
    expect(result.title).toBe(entryData.title);
    expect(result.content).toBe(entryData.content);
    expect(result.category).toBe(entryData.category);
    expect(result.tags).toEqual(entryData.tags);
    
    testEntryId = result.id;
  });

  test('READ: Should read Personal NoteBook entry', async () => {
    // First create an entry
    const entryData = {
      title: `Test Entry ${Date.now()}`,
      content: 'This is a test entry content',
      category: 'Biology',
      tags: ['test', 'experiment'],
      user_id: 1,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const createdEntry = await global.crudHelpers.createTestRecord('lab_notebook_entries', entryData);
    
    // Then read it
    const readEntry = await global.crudHelpers.readTestRecord('lab_notebook_entries', createdEntry.id);
    
    expect(readEntry).toBeDefined();
    expect(readEntry.id).toBe(createdEntry.id);
    expect(readEntry.title).toBe(entryData.title);
    expect(readEntry.content).toBe(entryData.content);
  });

  test('UPDATE: Should update Personal NoteBook entry', async () => {
    // First create an entry
    const entryData = {
      title: `Test Entry ${Date.now()}`,
      content: 'This is a test entry content',
      category: 'Biology',
      tags: ['test', 'experiment'],
      user_id: 1,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const createdEntry = await global.crudHelpers.createTestRecord('lab_notebook_entries', entryData);
    
    // Then update it
    const updateData = {
      title: 'Updated Title',
      content: 'Updated content',
      updated_at: new Date(),
    };

    const updatedEntry = await global.crudHelpers.updateTestRecord('lab_notebook_entries', createdEntry.id, updateData);
    
    expect(updatedEntry).toBeDefined();
    expect(updatedEntry.id).toBe(createdEntry.id);
    expect(updatedEntry.title).toBe(updateData.title);
    expect(updatedEntry.content).toBe(updateData.content);
  });

  test('DELETE: Should delete Personal NoteBook entry', async () => {
    // First create an entry
    const entryData = {
      title: `Test Entry ${Date.now()}`,
      content: 'This is a test entry content',
      category: 'Biology',
      tags: ['test', 'experiment'],
      user_id: 1,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const createdEntry = await global.crudHelpers.createTestRecord('lab_notebook_entries', entryData);
    
    // Then delete it
    const deletedEntry = await global.crudHelpers.deleteTestRecord('lab_notebook_entries', createdEntry.id);
    
    expect(deletedEntry).toBeDefined();
    expect(deletedEntry.id).toBe(createdEntry.id);
    
    // Verify it's deleted
    try {
      await global.crudHelpers.readTestRecord('lab_notebook_entries', createdEntry.id);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).toContain('not found');
    }
  });

  test('BULK OPERATIONS: Should handle multiple entries', async () => {
    const entries = [];
    
    // Create multiple entries
    for (let i = 0; i < 5; i++) {
      const entryData = {
        title: `Bulk Test Entry ${i}`,
        content: `This is bulk test entry content ${i}`,
        category: 'Biology',
        tags: ['bulk', 'test'],
        user_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      const entry = await global.crudHelpers.createTestRecord('lab_notebook_entries', entryData);
      entries.push(entry);
    }
    
    // Verify all entries were created
    expect(entries.length).toBe(5);
    
    // Test bulk read
    for (const entry of entries) {
      const readEntry = await global.crudHelpers.readTestRecord('lab_notebook_entries', entry.id);
      expect(readEntry).toBeDefined();
      expect(readEntry.id).toBe(entry.id);
    }
    
    // Test bulk update
    for (const entry of entries) {
      const updateData = { title: `Updated ${entry.title}`, updated_at: new Date() };
      const updatedEntry = await global.crudHelpers.updateTestRecord('lab_notebook_entries', entry.id, updateData);
      expect(updatedEntry.title).toBe(updateData.title);
    }
    
    // Test bulk delete
    for (const entry of entries) {
      await global.crudHelpers.deleteTestRecord('lab_notebook_entries', entry.id);
    }
  });

  test('DATA INTEGRITY: Should maintain referential integrity', async () => {
    // Test foreign key constraints
    const entryData = {
      title: 'Test Entry',
      content: 'Test content',
      category: 'Biology',
      tags: ['test'],
      user_id: 999, // Non-existent user
      created_at: new Date(),
      updated_at: new Date(),
    };

    try {
      await global.crudHelpers.createTestRecord('lab_notebook_entries', entryData);
      fail('Should have thrown an error for invalid user_id');
    } catch (error) {
      expect(error.message).toContain('foreign key');
    }
  });

  test('VALIDATION: Should enforce required fields', async () => {
    const invalidEntryData = {
      // Missing required title and content
      category: 'Biology',
      user_id: 1,
      created_at: new Date(),
      updated_at: new Date(),
    };

    try {
      await global.crudHelpers.createTestRecord('lab_notebook_entries', invalidEntryData);
      fail('Should have thrown an error for missing required fields');
    } catch (error) {
      expect(error.message).toContain('null value');
    }
  });
});

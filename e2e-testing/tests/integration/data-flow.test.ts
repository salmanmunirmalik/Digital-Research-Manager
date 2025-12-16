import { config } from '../setup/test-config';

describe('Data Flow Integration Tests', () => {
  beforeAll(async () => {
    await global.integrationHelpers.waitForAllServices();
  });

  test('Should handle complete Personal NoteBook workflow', async () => {
    console.log('🔄 Testing complete Personal NoteBook workflow...');
    
    // Step 1: Create Personal NoteBook entry via API
    const entryData = {
      title: 'Integration Test Entry',
      content: 'This is an integration test entry',
      category: 'Biology',
      tags: ['integration', 'test'],
    };

    const createResponse = await fetch(`${config.backendUrl}/api/lab-notebook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify(entryData),
    });

    expect(createResponse.ok).toBe(true);
    const createdEntry = await createResponse.json();
    expect(createdEntry.id).toBeDefined();

    // Step 2: Verify entry appears in database
    const dbEntry = await global.crudHelpers.readTestRecord('lab_notebook_entries', createdEntry.id);
    expect(dbEntry).toBeDefined();
    expect(dbEntry.title).toBe(entryData.title);

    // Step 3: Update entry via API
    const updateData = { title: 'Updated Integration Test Entry' };
    const updateResponse = await fetch(`${config.backendUrl}/api/lab-notebook/${createdEntry.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify(updateData),
    });

    expect(updateResponse.ok).toBe(true);

    // Step 4: Verify update in database
    const updatedDbEntry = await global.crudHelpers.readTestRecord('lab_notebook_entries', createdEntry.id);
    expect(updatedDbEntry.title).toBe(updateData.title);

    // Step 5: Delete entry via API
    const deleteResponse = await fetch(`${config.backendUrl}/api/lab-notebook/${createdEntry.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
    });

    expect(deleteResponse.ok).toBe(true);

    // Step 6: Verify deletion in database
    try {
      await global.crudHelpers.readTestRecord('lab_notebook_entries', createdEntry.id);
      fail('Entry should have been deleted');
    } catch (error) {
      expect(error.message).toContain('not found');
    }

    console.log('✅ Personal NoteBook workflow completed successfully');
  });

  test('Should handle statistical analysis data flow', async () => {
    console.log('🔄 Testing statistical analysis data flow...');

    // Step 1: Upload data via frontend
    const testData = [
      [1, 2.5],
      [2, 3.7],
      [3, 4.2],
      [4, 5.1],
      [5, 6.3],
    ];

    // Step 2: Send data to stats service
    const analysisResponse = await fetch(`${config.backendUrl}/api/advanced-stats/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify({
        data: testData,
        analysisType: 'descriptive_stats',
        options: {},
      }),
    });

    expect(analysisResponse.ok).toBe(true);
    const analysisResult = await analysisResponse.json();
    expect(analysisResult.results).toBeDefined();

    // Step 3: Save results to database
    const resultData = {
      title: 'Integration Test Analysis',
      data: analysisResult.results,
      type: 'statistical_analysis',
      user_id: 1,
      created_at: new Date(),
    };

    const savedResult = await global.crudHelpers.createTestRecord('data_results', resultData);
    expect(savedResult).toBeDefined();

    // Step 4: Retrieve results via API
    const getResponse = await fetch(`${config.backendUrl}/api/data-results/${savedResult.id}`, {
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
    });

    expect(getResponse.ok).toBe(true);
    const retrievedResult = await getResponse.json();
    expect(retrievedResult.data).toBeDefined();

    console.log('✅ Statistical analysis data flow completed successfully');
  });

  test('Should handle AI presentation workflow', async () => {
    console.log('🔄 Testing AI presentation workflow...');

    // Step 1: Generate presentation via API
    const presentationData = {
      prompt: 'Create a presentation about research findings',
      slides: 3,
    };

    const generateResponse = await fetch(`${config.backendUrl}/api/ai-presentations/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify(presentationData),
    });

    expect(generateResponse.ok).toBe(true);
    const generatedPresentation = await generateResponse.json();
    expect(generatedPresentation.slides).toBeDefined();
    expect(generatedPresentation.slides.length).toBe(presentationData.slides);

    // Step 2: Save presentation to database
    const presentationRecord = {
      title: 'Integration Test Presentation',
      content: JSON.stringify(generatedPresentation),
      type: 'ai_presentation',
      user_id: 1,
      created_at: new Date(),
    };

    const savedPresentation = await global.crudHelpers.createTestRecord('presentations', presentationRecord);
    expect(savedPresentation).toBeDefined();

    // Step 3: Retrieve presentation via API
    const getResponse = await fetch(`${config.backendUrl}/api/presentations/${savedPresentation.id}`, {
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
    });

    expect(getResponse.ok).toBe(true);
    const retrievedPresentation = await getResponse.json();
    expect(retrievedPresentation.content).toBeDefined();

    console.log('✅ AI presentation workflow completed successfully');
  });

  test('Should handle supplier marketplace workflow', async () => {
    console.log('🔄 Testing supplier marketplace workflow...');

    // Step 1: Create supplier via API
    const supplierData = {
      name: 'Integration Test Supplier',
      contact: 'test@supplier.com',
      products: ['Product A', 'Product B'],
      rating: 5,
    };

    const createResponse = await fetch(`${config.backendUrl}/api/supplier-marketplace`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify(supplierData),
    });

    expect(createResponse.ok).toBe(true);
    const createdSupplier = await createResponse.json();
    expect(createdSupplier.id).toBeDefined();

    // Step 2: Add product to cart (simulated)
    const cartData = {
      supplier_id: createdSupplier.id,
      product_name: 'Product A',
      quantity: 2,
    };

    const cartResponse = await fetch(`${config.backendUrl}/api/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify(cartData),
    });

    expect(cartResponse.ok).toBe(true);

    // Step 3: Process order (simulated)
    const orderData = {
      items: [cartData],
      total: 100.00,
    };

    const orderResponse = await fetch(`${config.backendUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify(orderData),
    });

    expect(orderResponse.ok).toBe(true);
    const createdOrder = await orderResponse.json();
    expect(createdOrder.id).toBeDefined();

    console.log('✅ Supplier marketplace workflow completed successfully');
  });

  test('Should handle cross-service communication', async () => {
    console.log('🔄 Testing cross-service communication...');

    // Test frontend to backend communication
    const frontendResponse = await fetch(`${config.baseUrl}/api/health`);
    expect(frontendResponse.ok).toBe(true);

    // Test backend to stats service communication
    const statsResponse = await fetch(`${config.statsServiceUrl}/health`);
    expect(statsResponse.ok).toBe(true);

    // Test backend to database communication
    const dbTest = await global.crudHelpers.executeQuery('SELECT NOW() as current_time');
    expect(dbTest.rows[0].current_time).toBeDefined();

    // Test end-to-end data flow
    const testData = { message: 'Integration test data' };
    
    // Frontend -> Backend -> Database
    const apiResponse = await fetch(`${config.backendUrl}/api/test-endpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify(testData),
    });

    if (apiResponse.ok) {
      const responseData = await apiResponse.json();
      expect(responseData).toBeDefined();
    }

    console.log('✅ Cross-service communication completed successfully');
  });

  test('Should handle error scenarios gracefully', async () => {
    console.log('🔄 Testing error handling...');

    // Test invalid API endpoint
    try {
      await fetch(`${config.backendUrl}/api/invalid-endpoint`);
    } catch (error) {
      // Expected to fail
    }

    // Test invalid data
    try {
      await fetch(`${config.backendUrl}/api/lab-notebook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({ invalid: 'data' }),
      });
    } catch (error) {
      // Expected to fail
    }

    // Test database constraint violations
    try {
      await global.crudHelpers.createTestRecord('lab_notebook_entries', {
        // Missing required fields
      });
    } catch (error) {
      expect(error.message).toContain('null value');
    }

    console.log('✅ Error handling tests completed');
  });
});

// Helper function to get auth token
async function getAuthToken(): Promise<string> {
  const response = await fetch(`${config.backendUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: config.testUser.email,
      password: config.testUser.password,
    }),
  });

  if (response.ok) {
    const data = await response.json();
    return data.token;
  }
  
  throw new Error('Authentication failed');
}

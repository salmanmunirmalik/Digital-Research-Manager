import { config } from './test-config';

beforeAll(async () => {
  console.log('🔄 Starting Integration Tests');
  console.log(`Environment: ${config.environment}`);
  console.log(`Frontend: ${config.baseUrl}`);
  console.log(`Backend: ${config.backendUrl}`);
  console.log(`Stats Service: ${config.statsServiceUrl}`);
});

afterAll(async () => {
  console.log('✅ Integration Tests Completed');
});

// Integration test helpers
global.integrationHelpers = {
  async waitForAllServices() {
    console.log('⏳ Waiting for all services to be ready...');
    
    const services = [
      { name: 'Frontend', url: config.baseUrl },
      { name: 'Backend', url: `${config.backendUrl}/health` },
      { name: 'Stats Service', url: `${config.statsServiceUrl}/health` },
    ];

    for (const service of services) {
      console.log(`Checking ${service.name} at ${service.url}`);
      await this.waitForService(service.url, 30);
      console.log(`✅ ${service.name} is ready`);
    }
  },

  async waitForService(url: string, maxRetries: number = 30) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, { 
          method: 'GET',
          timeout: 5000 
        });
        if (response.ok) {
          return true;
        }
      } catch (error) {
        if (i === maxRetries - 1) {
          throw new Error(`Service at ${url} is not responding after ${maxRetries} attempts`);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    return false;
  },

  async testDataFlow(source: string, destination: string, data: any) {
    console.log(`Testing data flow from ${source} to ${destination}`);
    
    // Step 1: Create data at source
    const createResponse = await fetch(`${config.backendUrl}${source}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!createResponse.ok) {
      throw new Error(`Failed to create data at ${source}`);
    }
    
    const createdData = await createResponse.json();
    console.log(`✅ Data created at ${source}:`, createdData.id);
    
    // Step 2: Verify data exists at destination
    const getResponse = await fetch(`${config.backendUrl}${destination}/${createdData.id}`);
    
    if (!getResponse.ok) {
      throw new Error(`Failed to retrieve data from ${destination}`);
    }
    
    const retrievedData = await getResponse.json();
    console.log(`✅ Data retrieved from ${destination}:`, retrievedData.id);
    
    return { created: createdData, retrieved: retrievedData };
  },

  async testCrossServiceCommunication() {
    console.log('🔄 Testing cross-service communication...');
    
    const testCases = [
      {
        name: 'Frontend to Backend',
        test: async () => {
          const response = await fetch(`${config.baseUrl}/api/health`);
          return response.ok;
        }
      },
      {
        name: 'Backend to Stats Service',
        test: async () => {
          const response = await fetch(`${config.backendUrl}/api/advanced-stats/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: [[1, 2], [2, 3], [3, 4]],
              analysisType: 'descriptive_stats',
              options: {}
            }),
          });
          return response.ok;
        }
      },
    ];

    for (const testCase of testCases) {
      try {
        const result = await testCase.test();
        console.log(`✅ ${testCase.name}: ${result ? 'PASS' : 'FAIL'}`);
      } catch (error) {
        console.log(`❌ ${testCase.name}: FAIL - ${error.message}`);
      }
    }
  },

  async testPerformanceMetrics() {
    console.log('📊 Testing performance metrics...');
    
    const metrics = {
      frontendLoadTime: 0,
      apiResponseTime: 0,
      databaseQueryTime: 0,
    };

    // Test frontend load time
    const frontendStart = Date.now();
    try {
      await fetch(config.baseUrl);
      metrics.frontendLoadTime = Date.now() - frontendStart;
    } catch (error) {
      console.log('Frontend load test failed');
    }

    // Test API response time
    const apiStart = Date.now();
    try {
      await fetch(`${config.backendUrl}/health`);
      metrics.apiResponseTime = Date.now() - apiStart;
    } catch (error) {
      console.log('API response test failed');
    }

    console.log('Performance Metrics:', metrics);
    return metrics;
  },
};

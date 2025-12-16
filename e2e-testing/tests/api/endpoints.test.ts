import { config, endpoints, testData } from '../setup/test-config';

describe('API Endpoints Tests', () => {
  beforeEach(async () => {
    await global.apiHelpers.authenticate();
  });

  describe('Personal NoteBook API', () => {
    test('GET /api/lab-notebook should return entries', async () => {
      const response = await global.apiClient.get(endpoints.labNotebook);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    test('POST /api/lab-notebook should create entry', async () => {
      const entryData = {
        ...testData.labNotebookEntry,
        title: `Test Entry ${Date.now()}`,
      };

      const response = await global.apiClient.post(endpoints.labNotebook, entryData);
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.title).toBe(entryData.title);
    });

    test('PUT /api/lab-notebook/:id should update entry', async () => {
      // First create an entry
      const createResponse = await global.apiClient.post(endpoints.labNotebook, testData.labNotebookEntry);
      const entryId = createResponse.data.id;

      // Then update it
      const updateData = { title: 'Updated Title' };
      const response = await global.apiClient.put(`${endpoints.labNotebook}/${entryId}`, updateData);
      
      expect(response.status).toBe(200);
      expect(response.data.title).toBe(updateData.title);
    });

    test('DELETE /api/lab-notebook/:id should delete entry', async () => {
      // First create an entry
      const createResponse = await global.apiClient.post(endpoints.labNotebook, testData.labNotebookEntry);
      const entryId = createResponse.data.id;

      // Then delete it
      const response = await global.apiClient.delete(`${endpoints.labNotebook}/${entryId}`);
      expect(response.status).toBe(200);

      // Verify it's deleted
      try {
        await global.apiClient.get(`${endpoints.labNotebook}/${entryId}`);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  describe('Protocols API', () => {
    test('GET /api/protocols should return protocols', async () => {
      const response = await global.apiClient.get(endpoints.protocols);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    test('POST /api/protocols should create protocol', async () => {
      const protocolData = {
        ...testData.protocol,
        name: `Test Protocol ${Date.now()}`,
      };

      const response = await global.apiClient.post(endpoints.protocols, protocolData);
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.name).toBe(protocolData.name);
    });
  });

  describe('Data Results API', () => {
    test('GET /api/data-results should return results', async () => {
      const response = await global.apiClient.get(endpoints.dataResults);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    test('POST /api/data-results should create result', async () => {
      const resultData = {
        title: `Test Result ${Date.now()}`,
        data: { value: 42 },
        type: 'experiment',
      };

      const response = await global.apiClient.post(endpoints.dataResults, resultData);
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
    });
  });

  describe('Supplier Marketplace API', () => {
    test('GET /api/supplier-marketplace should return suppliers', async () => {
      const response = await global.apiClient.get(endpoints.supplierMarketplace);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    test('POST /api/supplier-marketplace should create supplier', async () => {
      const supplierData = {
        ...testData.supplier,
        name: `Test Supplier ${Date.now()}`,
      };

      const response = await global.apiClient.post(endpoints.supplierMarketplace, supplierData);
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.name).toBe(supplierData.name);
    });
  });

  describe('Advanced Features API', () => {
    test('AI Presentations API should work', async () => {
      const presentationData = {
        prompt: 'Create a presentation about test results',
        slides: 5,
      };

      const response = await global.apiClient.post(endpoints.aiPresentations + '/generate', presentationData);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('slides');
    });

    test('Statistical Analysis API should work', async () => {
      const analysisData = {
        data: [[1, 2], [2, 3], [3, 4], [4, 5]],
        analysisType: 'descriptive_stats',
        options: {},
      };

      const response = await global.apiClient.post(endpoints.statisticalAnalysis + '/analyze', analysisData);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('results');
    });
  });
});

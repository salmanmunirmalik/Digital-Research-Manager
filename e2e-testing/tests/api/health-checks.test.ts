import { config, endpoints } from '../setup/test-config';

describe('API Health Checks', () => {
  beforeAll(async () => {
    await global.apiHelpers.waitForService(config.backendUrl + endpoints.health);
  });

  test('Backend health check should return 200', async () => {
    const response = await global.apiClient.get(endpoints.health);
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status');
    expect(response.data.status).toBe('ok');
  });

  test('Stats service health check should return 200', async () => {
    const response = await axios.get(config.statsServiceUrl + endpoints.statsHealth);
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status');
  });

  test('Frontend should be accessible', async () => {
    const response = await axios.get(config.baseUrl);
    expect(response.status).toBe(200);
  });
});

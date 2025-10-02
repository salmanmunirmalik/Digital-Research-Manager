import { config, endpoints, testData } from '../setup/test-config';

describe('Authentication API Tests', () => {
  beforeEach(() => {
    global.apiHelpers.clearAuth();
  });

  test('User registration should work', async () => {
    const userData = {
      email: global.testUtils.generateTestEmail(),
      password: 'testpassword123',
      username: global.testUtils.generateTestUsername(),
    };

    const response = await global.apiHelpers.testEndpoint(
      'POST',
      endpoints.auth.register,
      201,
      userData
    );

    expect(response).toHaveProperty('user');
    expect(response.user.email).toBe(userData.email);
  });

  test('User login should work with valid credentials', async () => {
    const authData = await global.apiHelpers.authenticate();
    
    expect(authData).toHaveProperty('token');
    expect(authData).toHaveProperty('user');
    expect(authData.user.email).toBe(config.testUser.email);
  });

  test('User login should fail with invalid credentials', async () => {
    try {
      await global.apiHelpers.authenticate('invalid@email.com', 'wrongpassword');
      fail('Should have thrown an error');
    } catch (error) {
      expect(error.response.status).toBe(401);
    }
  });

  test('Protected routes should require authentication', async () => {
    try {
      await global.apiClient.get(endpoints.labNotebook);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error.response.status).toBe(401);
    }
  });

  test('Authenticated requests should work', async () => {
    await global.apiHelpers.authenticate();
    
    const response = await global.apiClient.get(endpoints.labNotebook);
    expect(response.status).toBe(200);
  });

  test('Token refresh should work', async () => {
    await global.apiHelpers.authenticate();
    
    const response = await global.apiClient.post(endpoints.auth.refresh);
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('token');
  });

  test('Logout should work', async () => {
    await global.apiHelpers.authenticate();
    
    const response = await global.apiClient.post(endpoints.auth.logout);
    expect(response.status).toBe(200);
    
    // Verify token is invalidated
    try {
      await global.apiClient.get(endpoints.labNotebook);
      fail('Should have thrown an error after logout');
    } catch (error) {
      expect(error.response.status).toBe(401);
    }
  });
});

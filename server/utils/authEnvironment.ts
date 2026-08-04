/**
 * Boot-time security guards for JWT and demo auth.
 * Import early from server/index.ts after dotenv is loaded.
 */
export function assertAuthEnvironment(): void {
  const isProd = process.env.NODE_ENV === 'production';
  const jwtSecret = process.env.JWT_SECRET?.trim();
  const insecureDefaults = new Set([
    '',
    'your-super-secret-jwt-key-change-this-in-production',
    'changeme',
    'secret',
    'jwt-secret'
  ]);

  if (!jwtSecret || insecureDefaults.has(jwtSecret)) {
    console.error(
      'FATAL: JWT_SECRET must be set to a strong unique value. Refusing to start.'
    );
    process.exit(1);
  }

  if (jwtSecret.length < 32) {
    console.error('FATAL: JWT_SECRET must be at least 32 characters. Refusing to start.');
    process.exit(1);
  }

  const demoEnabled = process.env.ENABLE_DEMO_AUTH === 'true';
  if (isProd && demoEnabled) {
    console.error(
      'FATAL: ENABLE_DEMO_AUTH=true is not allowed when NODE_ENV=production. Refusing to start.'
    );
    process.exit(1);
  }

  if (demoEnabled) {
    const demoToken = process.env.DEMO_AUTH_TOKEN || '';
    if (!demoToken || demoToken === 'demo-token-123') {
      console.warn(
        'SECURITY WARNING: ENABLE_DEMO_AUTH is on with a weak/default DEMO_AUTH_TOKEN. Use a strong random token for E2E only.'
      );
    }
    console.warn(
      'SECURITY WARNING: Demo authentication is ENABLED. Use only on disposable local/CI servers.'
    );
  }
}

export function getRequiredJwtSecret(): string {
  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwtSecret;
}

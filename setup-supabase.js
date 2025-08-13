#!/usr/bin/env node

console.log('🔧 ResearchLabSync Supabase Setup Helper');
console.log('==========================================\n');

console.log('📋 Follow these steps:\n');

console.log('1️⃣  Go to https://supabase.com and sign in');
console.log('2️⃣  Create a new project called "researchlab"');
console.log('3️⃣  Wait for setup to complete (1-2 minutes)');
console.log('4️⃣  Go to Settings → API in your project');
console.log('5️⃣  Copy your Project URL and anon public key\n');

console.log('📝 Now create a file called .env in this folder with this content:\n');

console.log('PORT=5001');
console.log('NODE_ENV=development');
console.log('FRONTEND_URL=http://localhost:5173');
console.log('JWT_SECRET=your-super-secret-jwt-key-change-this-in-production');
console.log('DB_PATH=./data/researchlab.db');
console.log('GEMINI_API_KEY=your-gemini-api-key-here');
console.log('');
console.log('# Supabase Configuration');
console.log('VITE_SUPABASE_URL=YOUR_PROJECT_URL_HERE');
console.log('VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE\n');

console.log('🔑 Replace YOUR_PROJECT_URL_HERE with your actual Project URL');
console.log('🔑 Replace YOUR_ANON_KEY_HERE with your actual anon public key\n');

console.log('📚 After creating .env, run: npm run db:setup');
console.log('🚀 Then start the app with: ./start.sh\n');

console.log('❓ Need help? Check SUPABASE_SETUP.md for detailed instructions');

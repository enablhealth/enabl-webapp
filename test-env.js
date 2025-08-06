// Quick test script to check environment variables
console.log('=== Environment Variables Test ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NEXT_PUBLIC_COGNITO_USER_POOL_ID:', process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID);
console.log('NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID:', process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID);

// Check if .env.local is being loaded
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('\n.env.local file exists and contains:');
  console.log(envContent.split('\n').slice(0, 5).join('\n')); // First 5 lines
} catch (error) {
  console.log('\n❌ Error reading .env.local:', error.message);
}

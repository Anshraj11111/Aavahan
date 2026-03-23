'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

console.log('🔍 Testing Cloudinary Configuration...\n');

console.log('Environment Variables:');
console.log('  CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME || '❌ NOT SET');
console.log('  CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY || '❌ NOT SET');
console.log('  CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✅ SET (hidden)' : '❌ NOT SET');

console.log('\nTrying to load Cloudinary config...');
try {
  const { cloudinary } = require('../config/cloudinary');
  console.log('✅ Cloudinary config loaded successfully');
  console.log('   Cloud Name:', cloudinary.config().cloud_name || '❌ NOT CONFIGURED');
  console.log('   API Key:', cloudinary.config().api_key || '❌ NOT CONFIGURED');
  console.log('   API Secret:', cloudinary.config().api_secret ? '✅ CONFIGURED' : '❌ NOT CONFIGURED');
} catch (error) {
  console.error('❌ Failed to load Cloudinary config:', error.message);
}

console.log('\n✅ Test complete!');

#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const args = process.argv.slice(2);
const targetEnv = args[0];

if (!targetEnv || !['development', 'production', 'test'].includes(targetEnv)) {
  console.error('Usage: npm run env:switch <development|production|test>');
  console.error('Example: npm run env:switch production');
  process.exit(1);
}

try {
  const envPath = join(process.cwd(), '.env');
  let envContent = readFileSync(envPath, 'utf-8');
  
  // Update NODE_ENV in .env file
  envContent = envContent.replace(/^NODE_ENV=.*$/m, `NODE_ENV=${targetEnv}`);
  
  // Update environment-specific settings
  if (targetEnv === 'production') {
    envContent = envContent.replace(/^DATABASE_PATH=.*$/m, 'DATABASE_PATH=/app/data/ai-toolkit.db');
    envContent = envContent.replace(/^REDIS_KEY_PREFIX=.*$/m, 'REDIS_KEY_PREFIX=ai-toolkit:prod:');
    envContent = envContent.replace(/^LOG_LEVEL=.*$/m, 'LOG_LEVEL=info');
    envContent = envContent.replace(/^DATABASE_LOGGING=.*$/m, 'DATABASE_LOGGING=false');
    envContent = envContent.replace(/^API_DOCUMENTATION_ENABLED=.*$/m, 'API_DOCUMENTATION_ENABLED=false');
    envContent = envContent.replace(/^MAX_CONCURRENT_JOBS=.*$/m, 'MAX_CONCURRENT_JOBS=10');
    envContent = envContent.replace(/^STORAGE_MAX_FILE_SIZE=.*$/m, 'STORAGE_MAX_FILE_SIZE=500MB');
  } else if (targetEnv === 'development') {
    envContent = envContent.replace(/^DATABASE_PATH=.*$/m, 'DATABASE_PATH=./data/ai-toolkit-dev.db');
    envContent = envContent.replace(/^REDIS_KEY_PREFIX=.*$/m, 'REDIS_KEY_PREFIX=ai-toolkit:dev:');
    envContent = envContent.replace(/^LOG_LEVEL=.*$/m, 'LOG_LEVEL=debug');
    envContent = envContent.replace(/^DATABASE_LOGGING=.*$/m, 'DATABASE_LOGGING=true');
    envContent = envContent.replace(/^API_DOCUMENTATION_ENABLED=.*$/m, 'API_DOCUMENTATION_ENABLED=true');
    envContent = envContent.replace(/^MAX_CONCURRENT_JOBS=.*$/m, 'MAX_CONCURRENT_JOBS=3');
    envContent = envContent.replace(/^STORAGE_MAX_FILE_SIZE=.*$/m, 'STORAGE_MAX_FILE_SIZE=100MB');
  } else if (targetEnv === 'test') {
    envContent = envContent.replace(/^DATABASE_PATH=.*$/m, 'DATABASE_PATH=./data/ai-toolkit-test.db');
    envContent = envContent.replace(/^REDIS_KEY_PREFIX=.*$/m, 'REDIS_KEY_PREFIX=ai-toolkit:test:');
    envContent = envContent.replace(/^LOG_LEVEL=.*$/m, 'LOG_LEVEL=error');
    envContent = envContent.replace(/^DATABASE_LOGGING=.*$/m, 'DATABASE_LOGGING=false');
    envContent = envContent.replace(/^API_DOCUMENTATION_ENABLED=.*$/m, 'API_DOCUMENTATION_ENABLED=false');
    envContent = envContent.replace(/^MAX_CONCURRENT_JOBS=.*$/m, 'MAX_CONCURRENT_JOBS=1');
    envContent = envContent.replace(/^STORAGE_MAX_FILE_SIZE=.*$/m, 'STORAGE_MAX_FILE_SIZE=10MB');
  }
  
  writeFileSync(envPath, envContent);
  
  console.log(`✅ Environment switched to: ${targetEnv}`);
  console.log(`📝 Updated .env file with ${targetEnv} settings`);
  console.log(`🔄 Restart the application to apply changes`);
  
} catch (error) {
  console.error('❌ Failed to switch environment:', error.message);
  process.exit(1);
}
#!/usr/bin/env node

import { createApiKeyManager } from '../index.js';
import { LLMProvider } from '@ai-toolkit/shared';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const apiKeyManager = createApiKeyManager();
  await apiKeyManager.initialize();

  switch (command) {
    case 'set':
      await setApiKey(args.slice(1), apiKeyManager);
      break;
    case 'get':
      await getApiKey(args.slice(1), apiKeyManager);
      break;
    case 'list':
      await listProviders(apiKeyManager);
      break;
    case 'validate':
      await validateApiKey(args.slice(1), apiKeyManager);
      break;
    case 'remove':
      await removeApiKey(args.slice(1), apiKeyManager);
      break;
    case 'clear':
      await clearAllApiKeys(apiKeyManager);
      break;
    case 'export':
      await exportToEnv(apiKeyManager);
      break;
    case 'import':
      await importFromEnv(apiKeyManager);
      break;
    default:
      showHelp();
  }
}

async function setApiKey(args: string[], apiKeyManager: any) {
  const [provider, apiKey] = args;
  
  if (!provider || !apiKey) {
    console.error('Usage: api-key-cli set <provider> <api-key>');
    process.exit(1);
  }

  if (!['openai', 'anthropic'].includes(provider)) {
    console.error('Supported providers: openai, anthropic');
    process.exit(1);
  }

  try {
    await apiKeyManager.storeApiKey({
      provider: provider as LLMProvider,
      apiKey,
      metadata: { source: 'cli' }
    });
    console.log(`✓ API key for ${provider} stored successfully`);
  } catch (error) {
    console.error(`✗ Failed to store API key: ${(error as Error).message}`);
    process.exit(1);
  }
}

async function getApiKey(args: string[], apiKeyManager: any) {
  const [provider] = args;
  
  if (!provider) {
    console.error('Usage: api-key-cli get <provider>');
    process.exit(1);
  }

  try {
    const apiKey = await apiKeyManager.getApiKey(provider as LLMProvider);
    if (apiKey) {
      // Mask the API key for security
      const maskedKey = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4);
      console.log(`API key for ${provider}: ${maskedKey}`);
    } else {
      console.log(`No API key found for ${provider}`);
    }
  } catch (error) {
    console.error(`✗ Failed to retrieve API key: ${(error as Error).message}`);
    process.exit(1);
  }
}

async function listProviders(apiKeyManager: any) {
  try {
    const providers = await apiKeyManager.listConfiguredProviders();
    
    if (providers.length === 0) {
      console.log('No API keys configured');
      return;
    }

    console.log('Configured providers:');
    for (const provider of providers) {
      const stats = await apiKeyManager.getUsageStats(provider);
      console.log(`  ${provider}:`);
      console.log(`    Total requests: ${stats.totalRequests}`);
      console.log(`    Last used: ${stats.lastUsed ? stats.lastUsed.toISOString() : 'Never'}`);
      console.log(`    Rate limit hits: ${stats.rateLimitHits}`);
    }
  } catch (error) {
    console.error(`✗ Failed to list providers: ${(error as Error).message}`);
    process.exit(1);
  }
}

async function validateApiKey(args: string[], apiKeyManager: any) {
  const [provider] = args;
  
  if (!provider) {
    console.error('Usage: api-key-cli validate <provider>');
    process.exit(1);
  }

  try {
    console.log(`Validating API key for ${provider}...`);
    const result = await apiKeyManager.validateApiKey(provider as LLMProvider);
    
    if (result.valid) {
      console.log(`✓ API key for ${provider} is valid`);
      if (result.metadata?.rateLimitRemaining) {
        console.log(`  Rate limit remaining: ${result.metadata.rateLimitRemaining}`);
      }
    } else {
      console.log(`✗ API key for ${provider} is invalid: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`✗ Failed to validate API key: ${(error as Error).message}`);
    process.exit(1);
  }
}

async function removeApiKey(args: string[], apiKeyManager: any) {
  const [provider] = args;
  
  if (!provider) {
    console.error('Usage: api-key-cli remove <provider>');
    process.exit(1);
  }

  try {
    await apiKeyManager.removeApiKey(provider as LLMProvider);
    console.log(`✓ API key for ${provider} removed successfully`);
  } catch (error) {
    console.error(`✗ Failed to remove API key: ${(error as Error).message}`);
    process.exit(1);
  }
}

async function clearAllApiKeys(apiKeyManager: any) {
  try {
    await apiKeyManager.clearAllApiKeys();
    console.log('✓ All API keys cleared successfully');
  } catch (error) {
    console.error(`✗ Failed to clear API keys: ${(error as Error).message}`);
    process.exit(1);
  }
}

async function exportToEnv(apiKeyManager: any) {
  try {
    const envVars = await apiKeyManager.exportToEnvironment();
    
    console.log('# Environment variables for API keys:');
    for (const [key, value] of Object.entries(envVars)) {
      console.log(`export ${key}="${value}"`);
    }
  } catch (error) {
    console.error(`✗ Failed to export API keys: ${(error as Error).message}`);
    process.exit(1);
  }
}

async function importFromEnv(apiKeyManager: any) {
  try {
    await apiKeyManager.loadFromEnvironment();
    console.log('✓ API keys imported from environment variables');
  } catch (error) {
    console.error(`✗ Failed to import API keys: ${(error as Error).message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
AI Toolkit API Key Manager

Usage: api-key-cli <command> [options]

Commands:
  set <provider> <api-key>  Store an API key for a provider
  get <provider>            Retrieve an API key (masked)
  list                      List all configured providers
  validate <provider>       Validate an API key
  remove <provider>         Remove an API key
  clear                     Remove all API keys
  export                    Export API keys as environment variables
  import                    Import API keys from environment variables

Providers:
  openai                    OpenAI ChatGPT API
  anthropic                 Anthropic Claude API

Examples:
  api-key-cli set openai sk-...
  api-key-cli validate openai
  api-key-cli list
  api-key-cli export > .env
`);
}

if (require.main === module) {
  main().catch(console.error);
}

export { main };
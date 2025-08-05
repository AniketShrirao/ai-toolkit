#!/usr/bin/env node

/**
 * UI Fixes Test for Chat Interface Enhancement
 * 
 * This script tests the UI fixes:
 * 1. Settings tabs functionality
 * 2. Toast system for clear chat confirmation
 * 3. Reduced box shadows on chat bubble
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  const border = '='.repeat(message.length + 4);
  log(border, colors.cyan);
  log(`  ${message}  `, colors.cyan);
  log(border, colors.cyan);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Test functions
function testToastComponentExists() {
  logInfo('Testing Toast component exists...');
  
  try {
    const toastExists = existsSync('packages/web-dashboard/src/components/UI/Toast.tsx');
    const toastStylesExist = existsSync('packages/web-dashboard/src/components/UI/Toast.scss');
    const toastContextExists = existsSync('packages/web-dashboard/src/contexts/ToastContext.tsx');
    
    if (toastExists && toastStylesExist && toastContextExists) {
      logSuccess('Toast system files exist');
      return true;
    } else {
      logError('Toast system files missing');
      return false;
    }
  } catch (error) {
    logError(`Toast component test failed: ${error.message}`);
    return false;
  }
}

function testChatComponentUpdated() {
  logInfo('Testing Chat component has toast integration...');
  
  try {
    const fs = require('fs');
    const chatContent = fs.readFileSync('packages/web-dashboard/src/components/Chat/Chat.tsx', 'utf8');
    
    const hasToastImport = chatContent.includes('useToastHelpers');
    const hasToastUsage = chatContent.includes('showConfirmation');
    const hasUpdatedClearFunction = chatContent.includes('showSuccess');
    
    if (hasToastImport && hasToastUsage && hasUpdatedClearFunction) {
      logSuccess('Chat component has toast integration');
      return true;
    } else {
      logError('Chat component missing toast integration');
      if (!hasToastImport) logError('  - Missing useToastHelpers import');
      if (!hasToastUsage) logError('  - Missing showConfirmation usage');
      if (!hasUpdatedClearFunction) logError('  - Missing showSuccess usage');
      return false;
    }
  } catch (error) {
    logError(`Chat component test failed: ${error.message}`);
    return false;
  }
}

function testAppHasToastProvider() {
  logInfo('Testing App.tsx has ToastProvider...');
  
  try {
    const fs = require('fs');
    const appContent = fs.readFileSync('packages/web-dashboard/src/App.tsx', 'utf8');
    
    const hasToastImport = appContent.includes('ToastProvider');
    const hasToastWrapper = appContent.includes('<ToastProvider>');
    
    if (hasToastImport && hasToastWrapper) {
      logSuccess('App.tsx has ToastProvider integration');
      return true;
    } else {
      logError('App.tsx missing ToastProvider integration');
      if (!hasToastImport) logError('  - Missing ToastProvider import');
      if (!hasToastWrapper) logError('  - Missing ToastProvider wrapper');
      return false;
    }
  } catch (error) {
    logError(`App.tsx test failed: ${error.message}`);
    return false;
  }
}

function testSettingsTabsFixed() {
  logInfo('Testing settings tabs have proper button types...');
  
  try {
    const fs = require('fs');
    const chatContent = fs.readFileSync('packages/web-dashboard/src/components/Chat/Chat.tsx', 'utf8');
    
    const hasButtonTypes = chatContent.includes('type="button"');
    const hasTabButtons = chatContent.includes('tab-button');
    
    if (hasButtonTypes && hasTabButtons) {
      logSuccess('Settings tabs have proper button types');
      return true;
    } else {
      logError('Settings tabs missing proper button types');
      return false;
    }
  } catch (error) {
    logError(`Settings tabs test failed: ${error.message}`);
    return false;
  }
}

function testBoxShadowsReduced() {
  logInfo('Testing box shadows have been reduced...');
  
  try {
    const fs = require('fs');
    const stickyChatStyles = fs.readFileSync('packages/web-dashboard/src/components/UI/StickyChat.scss', 'utf8');
    
    const hasReducedShadows = stickyChatStyles.includes('0 4px 12px rgba(0, 0, 0, 0.1)');
    const hasReducedBadgeShadow = stickyChatStyles.includes('0 1px 4px rgba(0, 0, 0, 0.1)');
    const removedDropShadow = !stickyChatStyles.includes('filter: drop-shadow');
    
    if (hasReducedShadows && hasReducedBadgeShadow && removedDropShadow) {
      logSuccess('Box shadows have been reduced');
      return true;
    } else {
      logError('Box shadows not properly reduced');
      if (!hasReducedShadows) logError('  - Main shadow not reduced');
      if (!hasReducedBadgeShadow) logError('  - Badge shadow not reduced');
      if (!removedDropShadow) logError('  - Drop shadow not removed');
      return false;
    }
  } catch (error) {
    logError(`Box shadow test failed: ${error.message}`);
    return false;
  }
}

function testChatInterfaceScrollFix() {
  logInfo('Testing ChatInterface scrollIntoView fix...');
  
  try {
    const fs = require('fs');
    const chatInterfaceContent = fs.readFileSync('packages/web-dashboard/src/components/UI/ChatInterface.tsx', 'utf8');
    
    const hasScrollFix = chatInterfaceContent.includes('typeof messagesEndRef.current.scrollIntoView === \'function\'');
    
    if (hasScrollFix) {
      logSuccess('ChatInterface has scrollIntoView safety check');
      return true;
    } else {
      logError('ChatInterface missing scrollIntoView safety check');
      return false;
    }
  } catch (error) {
    logError(`ChatInterface scroll fix test failed: ${error.message}`);
    return false;
  }
}

// Main test execution
async function runUIFixesTests() {
  logHeader('Chat Interface Enhancement - UI Fixes Tests');
  
  const results = [];

  // Run all tests
  results.push({
    name: 'Toast Component Files',
    passed: testToastComponentExists(),
  });
  
  results.push({
    name: 'Chat Component Toast Integration',
    passed: testChatComponentUpdated(),
  });
  
  results.push({
    name: 'App ToastProvider Integration',
    passed: testAppHasToastProvider(),
  });
  
  results.push({
    name: 'Settings Tabs Button Types',
    passed: testSettingsTabsFixed(),
  });
  
  results.push({
    name: 'Reduced Box Shadows',
    passed: testBoxShadowsReduced(),
  });
  
  results.push({
    name: 'ChatInterface Scroll Fix',
    passed: testChatInterfaceScrollFix(),
  });

  // Generate report
  logHeader('UI Fixes Test Results');
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;

  log(`Total Tests: ${totalTests}`);
  log(`Passed: ${passedTests}`, colors.green);
  log(`Failed: ${failedTests}`, failedTests > 0 ? colors.red : colors.green);

  results.forEach(result => {
    if (result.passed) {
      logSuccess(`${result.name}: PASSED`);
    } else {
      logError(`${result.name}: FAILED`);
    }
  });

  if (failedTests > 0) {
    logError(`\n${failedTests} UI fix test(s) failed.`);
    process.exit(1);
  } else {
    logSuccess('\nAll UI fix tests passed! 🎉');
    
    logInfo('\nUI Fixes Summary:');
    log('✅ Toast system implemented for better UX');
    log('✅ Clear chat now uses toast confirmation instead of alert');
    log('✅ Settings tabs have proper button types for functionality');
    log('✅ Box shadows reduced for cleaner appearance');
    log('✅ ChatInterface scroll fix for test compatibility');
    
    process.exit(0);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logError(`Uncaught Exception: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Show help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  logHeader('UI Fixes Test Runner');
  log('\nUsage: node ui-fixes-test.js [options]');
  log('\nOptions:');
  log('  --help, -h              Show this help message');
  log('\nDescription:');
  log('  Tests the UI fixes implemented for the chat interface enhancement:');
  log('  - Toast system for better user feedback');
  log('  - Settings tabs functionality fixes');
  log('  - Reduced box shadows for cleaner appearance');
  log('  - ChatInterface scroll compatibility fixes');
  process.exit(0);
}

// Run the tests
runUIFixesTests();
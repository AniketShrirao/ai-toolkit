// Simple test script to verify theme functionality
// This can be run in the browser console

function testThemeSystem() {
  console.log('🎨 Testing Theme System...');
  
  // Test 1: Check if theme variables are defined
  console.log('\n1. Testing CSS Custom Properties:');
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  
  const themeVars = [
    '--bg-primary',
    '--text-primary',
    '--primary',
    '--code-bg',
    '--syntax-keyword'
  ];
  
  themeVars.forEach(varName => {
    const value = computedStyle.getPropertyValue(varName).trim();
    console.log(`   ${varName}: ${value || 'NOT DEFINED'}`);
  });
  
  // Test 2: Check theme attributes
  console.log('\n2. Testing Theme Attributes:');
  const dataTheme = root.getAttribute('data-theme');
  const resolvedTheme = root.getAttribute('data-resolved-theme');
  console.log(`   data-theme: ${dataTheme || 'not set'}`);
  console.log(`   data-resolved-theme: ${resolvedTheme || 'not set'}`);
  
  // Test 3: Check localStorage
  console.log('\n3. Testing Theme Persistence:');
  const savedTheme = localStorage.getItem('theme');
  console.log(`   localStorage theme: ${savedTheme || 'not set'}`);
  
  // Test 4: Check system preference
  console.log('\n4. Testing System Preference:');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  console.log(`   System prefers dark: ${prefersDark}`);
  
  // Test 5: Test theme switching
  console.log('\n5. Testing Theme Switching:');
  const originalTheme = savedTheme || 'system';
  
  // Simulate theme changes
  const themes = ['light', 'dark', 'system'];
  themes.forEach((theme, index) => {
    setTimeout(() => {
      localStorage.setItem('theme', theme);
      if (theme === 'system') {
        root.removeAttribute('data-theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.setAttribute('data-resolved-theme', systemPrefersDark ? 'dark' : 'light');
      } else {
        root.setAttribute('data-theme', theme);
        root.setAttribute('data-resolved-theme', theme);
      }
      console.log(`   Switched to ${theme} theme`);
      
      // Restore original theme after test
      if (index === themes.length - 1) {
        setTimeout(() => {
          localStorage.setItem('theme', originalTheme);
          if (originalTheme === 'system') {
            root.removeAttribute('data-theme');
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.setAttribute('data-resolved-theme', systemPrefersDark ? 'dark' : 'light');
          } else {
            root.setAttribute('data-theme', originalTheme);
            root.setAttribute('data-resolved-theme', originalTheme);
          }
          console.log(`   Restored original theme: ${originalTheme}`);
          console.log('\n✅ Theme system test completed!');
        }, 1000);
      }
    }, index * 1000);
  });
}

// Auto-run test if in browser
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testThemeSystem);
  } else {
    testThemeSystem();
  }
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testThemeSystem };
}
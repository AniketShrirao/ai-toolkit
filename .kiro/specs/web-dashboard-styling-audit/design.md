# Design Document

## Overview

This design addresses the styling issues in the web-dashboard by conducting a systematic audit of all components and restoring proper SCSS styling. The solution involves examining each component file, identifying missing or broken styles, and implementing comprehensive SCSS files that properly utilize the ui-styles design system for consistent spacing, typography, colors, and responsive behavior.

## Architecture

### Discovered Architecture
Based on our audit, the web-dashboard has the following SCSS architecture:

#### Vite Configuration Integration
The `vite.config.ts` file automatically imports ui-styles for all SCSS files:

```typescript
css: {
  preprocessorOptions: {
    scss: {
      additionalData: `
        @use "@ai-toolkit/ui-styles/scss/abstracts/variables" as *;
        @use "@ai-toolkit/ui-styles/scss/abstracts/mixins" as *;
        @use "@ai-toolkit/ui-styles/scss/abstracts/functions" as *;
        @use "@ai-toolkit/ui-styles/scss/components/forms" as *;
        @use "@ai-toolkit/ui-styles/scss/components/cards" as *;
        @use "@ai-toolkit/ui-styles/scss/components/buttons" as *;
        @use "@ai-toolkit/ui-styles/scss/components/badges" as *;
        @use "@ai-toolkit/ui-styles/scss/utilities/colors" as *;
        @use "@ai-toolkit/ui-styles/scss/utilities/spacing" as *;
        @use "@ai-toolkit/ui-styles/scss/utilities/layout" as *;
        @use "@ai-toolkit/ui-styles/scss/utilities/dashboard" as *;
      `,
    },
  },
}
```

**Available Functions**: `space()`, `task-space()`, `font-size()`, `radius()`, `shadow()`, `transition()`, `ease()`
**Available Mixins**: `button-base`, `modern-input-base`, `breakpoint()`, `reduced-motion`, `high-contrast`
**Available Variables**: `$font-family-base`, `$font-weight-*`, `$spacing-scale`, etc.

#### CSS Custom Properties System
- **Main Entry**: `src/styles/main.scss` defines comprehensive CSS custom properties
- **Color Variables**: `--primary`, `--text-primary`, `--bg-secondary`, etc.
- **Legacy Support**: Maintains backward compatibility with existing variable names
- **Component Usage**: Components reference these CSS custom properties directly

### Component Audit Strategy
- **Function Call Fixes**: Correct syntax errors in existing SCSS files
- **Variable Reference Updates**: Ensure proper CSS custom property usage
- **Consistency Checks**: Verify all components use the same function patterns
- **Build Verification**: Test that all changes compile successfully

### Key Findings from Initial Audit

#### Common Issues Identified
1. **Function Call Syntax Errors**:
   - ❌ `easing(ease-out)` → ✅ `ease(ease-out)`
   - ❌ `spacing(2)` → ✅ `space(2)`
   - ❌ Missing function parameters

2. **Variable Reference Issues**:
   - ❌ Undefined CSS custom properties
   - ❌ Inconsistent variable naming
   - ✅ Use variables from main.scss (e.g., `var(--primary)`, `var(--color-primary-hover)`)

3. **Build Status**:
   - ✅ SCSS files exist for all major components
   - ✅ Vite configuration properly imports ui-styles globally
   - ✅ Build process works after function call fixes
   - ⚠️ Deprecation warnings from Sass (non-breaking)

#### Successfully Fixed Components
- ✅ **Button Component**: Fixed function calls, proper variable usage, responsive behavior
- ✅ **Build Process**: Confirmed compilation works with corrected syntax

## Components and Interfaces

### 1. UI Components Audit

#### Button Component (Actual Implementation)
```scss
// Button.scss - Functions globally available via Vite config
.button {
    @include button-base;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: space(2);
    font-family: $font-family-base;
    font-weight: $font-weight-medium;
    transition: all transition(base) ease(ease-out); // Fixed: was easing(ease-out)
    
    &:focus {
        box-shadow: 0 0 0 3px var(--primary-alpha);
    }
}

.button-primary {
    background-color: var(--primary);
    color: var(--text-inverse);
    
    &:hover:not(:disabled) {
        background-color: var(--color-primary-hover);
        box-shadow: shadow(md);
        transform: translateY(-1px);
    }
}

.button-sm {
    padding: space(2) space(3);
    font-size: font-size(sm);
    border-radius: radius(md);
}
```

#### Input Component (Actual Implementation)
```scss
// Input.scss - Functions globally available via Vite config
.input-wrapper {
    display: flex;
    flex-direction: column;
    gap: space(2);
}

.input {
    @include modern-input-base;
    width: 100%;
    
    &:focus {
        outline: none;
        border-color: var(--color-focus);
        box-shadow: 0 0 0 3px var(--primary-alpha);
    }
    
    &:disabled {
        opacity: 0.6;
        background-color: var(--bg-secondary);
    }
}

.input-error .input {
    border-color: var(--error);
    
    &:focus {
        border-color: var(--error);
        box-shadow: 0 0 0 3px var(--error-alpha);
    }
}
    @include input-error;
  }
  
  &:disabled {
    @include input-disabled;
  }
}
```

### 2. Layout Components Audit

#### Card Component
```scss
// Card.scss


.card {
  @include modern-card-base;
  padding: space(6);
  margin-bottom: space(4);
  
  &-header {
    @include text-style(lg, semibold);
    margin-bottom: space(4);
    padding-bottom: space(3);
    border-bottom: 1px solid var(--border);
  }
  
  &-content {
    @include text-style(base);
    line-height: line-height(relaxed);
  }
}
```

### 3. Document Components Audit

#### FileUpload Component
```scss
// FileUpload.scss


.file-upload {
  border: 2px dashed var(--border);
  border-radius: radius(lg);
  padding: space(8);
  text-align: center;
  transition: all transition(base);
  
  &:hover {
    border-color: var(--primary);
    background-color: var(--primary-alpha);
  }
  
  &-icon {
    font-size: font-size(4xl);
    color: var(--text-tertiary);
    margin-bottom: space(4);
  }
  
  &-text {
    @include text-style(lg, medium);
    color: var(--text-secondary);
    margin-bottom: space(2);
  }
  
  &-hint {
    @include text-style(sm);
    color: var(--text-tertiary);
  }
}
```

### 4. Settings Components Audit

#### Settings Component
```scss
// Settings.scss


.settings {
  display: grid;
  gap: space(6);
  
  &-header {
    @include text-style(2xl, bold);
    margin-bottom: space(6);
    padding-bottom: space(4);
    border-bottom: 1px solid var(--border);
  }
  
  &-section {
    @include modern-card-base;
    padding: space(6);
    
    &-title {
      @include text-style(lg, semibold);
      margin-bottom: space(4);
    }
    
    &-description {
      @include text-style(base);
      color: var(--text-secondary);
      margin-bottom: space(4);
    }
  }
  
  &-form {
    display: grid;
    gap: space(4);
    
    &-group {
      display: grid;
      gap: space(2);
      
      label {
        @include text-style(sm, medium);
        color: var(--text-primary);
      }
      
      input, select, textarea {
        @include input-base;
      }
    }
  }
}
```

## Data Models

### Component Styling Audit Structure
```typescript
interface ComponentAudit {
  componentName: string;
  hasScssFile: boolean;
  stylingIssues: StyleIssue[];
  missingFeatures: string[];
  responsiveIssues: string[];
  accessibilityIssues: string[];
}

interface StyleIssue {
  type: 'missing-import' | 'broken-variable' | 'missing-mixin' | 'hardcoded-value';
  description: string;
  location: string;
  severity: 'high' | 'medium' | 'low';
}
```

### Design System Integration
```typescript
interface DesignSystemUsage {
  colors: {
    usingCustomProperties: boolean;
    usingColorFunctions: boolean;
    hardcodedColors: string[];
  };
  spacing: {
    usingSpacingScale: boolean;
    hardcodedSpacing: string[];
  };
  typography: {
    usingTypographyMixins: boolean;
    usingFontScale: boolean;
    hardcodedFonts: string[];
  };
}
```

## Error Handling

### Missing SCSS Files
- Create comprehensive SCSS files for components without styling
- Implement fallback styles for edge cases
- Ensure graceful degradation on older browsers

### Broken Variable References
- Update all variable references to use ui-styles system
- Replace hardcoded values with design system tokens
- Fix import statements and module references

### Responsive Breakpoints
- Implement mobile-first responsive design
- Use ui-styles breakpoint mixins consistently
- Test across all supported device sizes

## Testing Strategy

### Visual Regression Testing
- Screenshot comparison for all components
- Cross-browser testing for consistency
- Mobile and desktop viewport testing
- Dark mode compatibility testing

### Component Functionality Testing
- Interactive state testing (hover, focus, active)
- Form validation styling verification
- Responsive behavior validation
- Accessibility compliance verification

### Design System Integration Testing
- Verify all components use ui-styles imports
- Check color contrast ratios meet WCAG standards
- Validate spacing consistency across components
- Test typography scale implementation

## Implementation Phases

### Phase 1: Component Audit (✅ Completed)
- ✅ Systematically reviewed all component directories
- ✅ Identified that SCSS files exist but have function call syntax errors
- ✅ Documented Vite configuration provides global ui-styles access
- ✅ Confirmed build process works after syntax corrections

### Phase 2: Core UI Components (🔄 In Progress)
- ✅ Fixed Button component function calls and variable usage
- 🔄 Fix Input, Card, Badge, and other foundational components
- 🔄 Ensure consistent CSS custom property usage
- 🔄 Test and validate styling consistency across components

### Phase 3: Layout and Navigation
- Restore Header, Sidebar, and Layout component styling
- Implement responsive navigation patterns
- Fix spacing and typography issues
- Ensure proper visual hierarchy

### Phase 4: Feature Components
- Fix Document management component styling
- Restore Settings and configuration interfaces
- Implement Chat and communication component styles
- Add Dashboard and monitoring component styling

### Phase 5: Polish and Optimization
- Fine-tune spacing and typography
- Optimize responsive behavior
- Add smooth transitions and animations
- Conduct final accessibility audit

## Success Metrics

### Visual Consistency
- All components follow the established design system
- Consistent spacing and typography across the application
- Proper color usage and contrast ratios
- Professional and polished visual appearance

### Responsive Behavior
- Smooth adaptation across all device sizes
- Proper touch targets on mobile devices
- Efficient use of screen space on all viewports
- Consistent user experience across platforms

### Code Quality
- All SCSS files properly import from ui-styles
- No hardcoded values or magic numbers
- Consistent naming conventions and structure
- Maintainable and scalable styling architecture
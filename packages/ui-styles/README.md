# @ai-toolkit/ui-styles

Shared UI styles and design system for the AI Toolkit monorepo.

## Installation

```bash
npm install @ai-toolkit/ui-styles
```

## Usage

### SCSS/Sass

Import the main stylesheet in your SCSS files:

```scss
@use '@ai-toolkit/ui-styles' as ui;

// Use design tokens
.my-component {
  padding: ui.space(4);
  background-color: var(--color-primary);
  border-radius: ui.radius(md);
}

// Use mixins
.my-button {
  @include ui.button-base;
  @include ui.button-variant(primary);
  @include ui.button-size(md);
}
```

### CSS

Import the compiled CSS:

```css
@import '@ai-toolkit/ui-styles/dist/index.css';
```

### JavaScript/TypeScript

Use design tokens in JavaScript:

```typescript
import { designTokens, getSpacing, setCSSCustomProperties } from '@ai-toolkit/ui-styles';

// Get spacing value
const padding = getSpacing('4'); // '1rem'

// Set CSS custom properties
setCSSCustomProperties();

// Access design tokens
console.log(designTokens.colors.primary); // '#3b82f6'
```

## Design System

### Colors

- **Primary**: Blue color scheme for primary actions
- **Secondary**: Gray color scheme for secondary elements
- **Success**: Green for success states
- **Warning**: Orange for warning states
- **Error**: Red for error states
- **Info**: Blue for informational content

### Spacing

Based on a 4px grid system (0.25rem increments):

- `0` - 0px
- `1` - 4px
- `2` - 8px
- `4` - 16px
- `6` - 24px
- `8` - 32px
- etc.

### Typography

- **Font Family**: System font stack with fallbacks
- **Font Sizes**: xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl
- **Font Weights**: normal (400), medium (500), semibold (600), bold (700)

### Breakpoints

- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

## Components

### Buttons

```html
<button class="btn btn--primary btn--md">Primary Button</button>
<button class="btn btn--secondary btn--sm">Secondary Button</button>
<button class="btn btn--ghost btn--lg">Ghost Button</button>
```

### Cards

```html
<div class="card">
  <div class="card__header">
    <h3 class="card__title">Card Title</h3>
  </div>
  <div class="card__content">
    <p>Card content goes here.</p>
  </div>
  <div class="card__footer">
    <button class="btn btn--primary">Action</button>
  </div>
</div>
```

### Forms

```html
<div class="form-group">
  <label class="form-label" for="email">Email</label>
  <input class="form-input" type="email" id="email" placeholder="Enter your email">
  <div class="form-help">We'll never share your email.</div>
</div>
```

### Badges

```html
<span class="badge badge--primary">Primary</span>
<span class="badge badge--success badge--sm">Success</span>
<span class="badge badge--warning badge--lg">Warning</span>
```

## Utilities

### Spacing

```html
<div class="p-4 m-2">Padding 16px, Margin 8px</div>
<div class="px-6 py-3">Horizontal padding 24px, Vertical padding 12px</div>
```

### Layout

```html
<div class="flex items-center justify-between">
  <span>Left content</span>
  <span>Right content</span>
</div>
```

### Colors

```html
<p class="text-primary">Primary text color</p>
<div class="bg-success-light">Success background</div>
```

## Customization

Override CSS custom properties to customize the design system:

```css
:root {
  --color-primary: #your-color;
  --font-family-base: 'Your Font', sans-serif;
  --spacing-4: 1.5rem; /* Override default 1rem */
}
```

## Development

```bash
# Install dependencies
npm install

# Build styles
npm run build

# Watch for changes
npm run watch

# Clean build directory
npm run clean
```

## License

MIT
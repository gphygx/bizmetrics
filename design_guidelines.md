# BizMetrics Login Page - Design Guidelines

## Design Approach

**System Selected:** shadcn/ui + Tailwind CSS (Material Design principles)
**Justification:** Financial analytics platforms require trust, clarity, and professional polish. Following established design patterns ensures familiarity while the shadcn/ui system provides consistent, accessible components.

**Reference Inspiration:** Stripe Dashboard login (clean authentication), Linear (typography hierarchy), Plaid (financial trustworthiness)

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary):**
- Background: 222 47% 11% (deep slate)
- Surface: 217 33% 17% (elevated slate)
- Primary: 217 91% 60% (trust blue)
- Text Primary: 210 40% 98%
- Text Secondary: 215 20% 65%
- Border: 217 33% 24%
- Error: 0 84% 60%

**Light Mode:**
- Background: 0 0% 100%
- Surface: 0 0% 98%
- Primary: 217 91% 60%
- Text Primary: 222 47% 11%
- Text Secondary: 215 16% 47%
- Border: 214 32% 91%

### B. Typography

**Font Stack:** Inter (Google Fonts)
- Heading (h1): 32px/40px, font-bold (Platform name)
- Subheading: 16px/24px, font-normal, text-muted-foreground
- Label: 14px/20px, font-medium
- Input: 16px/24px, font-normal
- Link: 14px/20px, font-medium, underline-offset-4

### C. Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Form field spacing: space-y-6
- Section padding: p-8 (mobile), p-12 (desktop)
- Component gaps: gap-4 for related elements

**Grid Structure:** Two-column split (50/50) on desktop, single column mobile

## Page Structure

### Split-Screen Layout

**Left Panel (Image Side):**
- Full-height background image or gradient overlay
- Subtle data visualization pattern or abstract financial charts
- Company logo (top-left, absolute positioning, p-8)
- Optional: Testimonial card (bottom-left, p-8) with user quote, name, and company

**Right Panel (Form Side):**
- Centered vertically and horizontally
- Max-width: 400px container
- Background: Surface color
- Responsive: Full-width on mobile, stacks image above form

### Form Components

**Header Section:**
- "Welcome back" (h1, mb-2)
- "Sign in to access your financial metrics" (text-muted-foreground, mb-8)

**Input Fields:**
- Email/Username field with icon (Mail icon)
- Password field with toggle visibility icon (Eye/EyeOff)
- Each field: Label above, full-width input, proper spacing (mb-6)
- Focus states: ring-2 ring-primary

**Action Elements:**
- "Remember me" checkbox + "Forgot password?" link (justified space-between, mb-6)
- Primary button: Full-width, h-11, "Sign in" text
- Divider with "OR" text (my-6)
- Secondary outline button: "Sign in with SSO" (if applicable)

**Footer:**
- "Don't have an account? Contact sales" (text-center, text-sm, mt-6)

### Component Specifications

**Inputs:**
- Height: h-11
- Border-radius: rounded-md
- Border: border-input
- Background: background with subtle hover state
- Padding: px-3 py-2

**Button (Primary):**
- Background: bg-primary
- Text: text-primary-foreground
- Height: h-11
- Border-radius: rounded-md
- Font-weight: font-medium

**Button (Outline - on image):**
- Variant: outline
- Backdrop-blur: backdrop-blur-sm
- Background: bg-background/10

## Images

**Hero/Background Image:**
- **Description:** Professional abstract data visualization - flowing charts, subtle grid patterns, or modern dashboard interface mockup. Dark navy/blue tones with accent colors matching the primary palette. Should convey sophistication and data intelligence.
- **Placement:** Left 50% of viewport (desktop), top 40vh (mobile)
- **Treatment:** Gradient overlay from bottom (opacity-60) to maintain readability if text is placed
- **Alternative:** Animated gradient background (222 47% 11% to 217 91% 60%) with 3-second slow pulse

**Logo:**
- **Description:** BizMetrics wordmark or icon+wordmark combination in white/light color
- **Placement:** Top-left of image panel (absolute, top-8 left-8)
- **Size:** h-8 to h-10

## Accessibility & Polish

- Focus indicators: 2px ring, primary color
- Error states: Red border + error message below field (text-sm text-destructive)
- Loading states: Button shows spinner, disabled state
- Dark mode toggle: Top-right corner (Sun/Moon icon)
- All inputs have proper labels and aria-attributes
- Keyboard navigation fully supported
- Form validation: Inline error messages appear below fields

## Animations

**Subtle Only:**
- Input focus: Border color transition (150ms)
- Button hover: Opacity change (100ms)
- Form errors: Shake animation (400ms) when validation fails
- Page load: Fade-in content (300ms)
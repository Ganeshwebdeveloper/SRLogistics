# SR Logistics Fleet Management - Design Guidelines

## Design Approach
**Selected System**: Material Design 3 with custom adaptations for fleet management  
**Rationale**: Material Design provides excellent patterns for data-heavy dashboards, real-time updates, and map integration. Its component system supports both admin and driver interfaces with clear visual hierarchy.

## Color Palette

### Light Mode
- **Primary**: 211 100% 50% (Deep Blue - professional, trustworthy)
- **Primary Container**: 211 100% 95%
- **Secondary**: 192 95% 45% (Teal - for secondary actions)
- **Surface**: 0 0% 100%
- **Surface Variant**: 210 20% 96%
- **On Surface**: 210 15% 20%
- **Success**: 142 76% 36% (Trip completed, crates delivered)
- **Warning**: 38 92% 50% (Low crates, speed alerts)
- **Error**: 0 72% 51% (Trip issues, offline drivers)

### Dark Mode
- **Primary**: 211 100% 65%
- **Primary Container**: 211 90% 25%
- **Secondary**: 192 85% 55%
- **Surface**: 210 15% 12%
- **Surface Variant**: 210 15% 18%
- **On Surface**: 210 10% 90%
- **Success**: 142 70% 45%
- **Warning**: 38 85% 60%
- **Error**: 0 65% 60%

## Typography
**Font Family**: Inter (via Google Fonts CDN)

- **Display Large**: 2.5rem/3rem, font-weight 700 (Admin dashboard headings)
- **Headline**: 1.75rem/2.25rem, font-weight 600 (Section headers)
- **Title**: 1.25rem/1.75rem, font-weight 600 (Card titles, trip names)
- **Body Large**: 1rem/1.5rem, font-weight 400 (Primary content)
- **Body**: 0.875rem/1.25rem, font-weight 400 (Secondary info, descriptions)
- **Label**: 0.75rem/1rem, font-weight 500, uppercase tracking-wide (Status badges, table headers)

## Layout System
**Spacing Primitives**: Use Tailwind units of **2, 4, 6, and 8** for consistency
- Component padding: p-4 or p-6
- Section spacing: my-6 or my-8
- Card gaps: gap-4
- Form field spacing: space-y-4

**Grid Structure**:
- Admin Dashboard: 12-column grid with sidebar (col-span-2) and main content (col-span-10)
- Driver Dashboard: Single column with stacked cards, max-w-4xl centered
- Responsive: Stack to single column on mobile (md: breakpoint)

## Component Library

### Navigation
- **Admin Sidebar**: Fixed left sidebar (w-64), dark surface with primary text, icon + label navigation items
- **Driver Top Bar**: Sticky header with profile, notifications, and status indicator
- **Active States**: Primary color background with elevated shadow

### Data Display

**Cards**:
- Elevated surface with rounded-xl corners
- Shadow-md for depth
- p-6 padding
- Border-l-4 with status color for trip cards

**Tables** (Admin):
- Striped rows with surface-variant alternating
- Fixed header with sticky positioning
- Hover states with subtle background change
- Status badges inline with colored backgrounds

**Stats Dashboard**:
- 4-column grid (lg:grid-cols-4, md:grid-cols-2) for key metrics
- Large numbers (text-3xl font-bold) with label below
- Icon in primary color background circle (rounded-full w-12 h-12)

### Forms & Inputs
- All inputs with consistent height (h-12)
- Rounded-lg borders
- Focus states with primary color ring (ring-2 ring-primary)
- Labels with font-weight 500, text-sm
- Dark mode: surface-variant background with on-surface text

**Assignment Form** (Admin):
- Grouped fields in surface-variant containers
- Dropdowns for truck/route/driver selection
- Availability indicators (green dot for available trucks)
- Submit button: Primary color, w-full on mobile

### Real-Time Elements

**Map Container**:
- Full-width card with h-96 minimum
- Driver pins: Circular avatars with truck number overlay
- Route lines: Primary color with 40% opacity
- Current location: Pulsing animation with primary color

**Live Stats Bar**:
- Horizontal flex container below map
- Distance, speed, duration in separate cards
- Auto-updating values with transition animations
- Warning color for speed over threshold

**Chat Interface**:
- Fixed bottom-right or drawer (admin) / full screen (driver)
- Messages: left-aligned (others) vs right-aligned (self)
- Image messages: max-w-xs, rounded-lg, clickable for full view
- Input bar: Sticky bottom with file upload icon

### Status Indicators
- **Trip Status**: Pill badges with colored backgrounds
  - Ongoing: Warning color
  - Completed: Success color  
  - Available: Surface-variant
- **Driver Status**: Dot indicators (w-3 h-3 rounded-full)
  - Active: Success color with pulse animation
  - Offline: Error color

### Crate Management
- **Counter Component**: 
  - Large center number (text-4xl font-bold)
  - Plus/minus buttons on sides (circular, w-12 h-12)
  - Initial count shown in secondary text above
  - Last updated timestamp below

**Crate History**:
- Timeline view with vertical line
- Each update as a card connected to timeline
- Color-coded by action (delivered: success, returned: secondary)

## Animations
**Minimal & Purposeful**:
- Page transitions: 200ms ease-in-out
- Card hover: subtle scale (scale-105) with shadow increase
- Map markers: Gentle bounce on new location update
- Status changes: 300ms color transition
- No parallax, no scroll-triggered animations

## Images
**Hero Section** (Landing/Login):
- Large hero image showing delivery truck in motion (1920x800px)
- Overlay gradient: from transparent to surface color (bottom)
- CTA buttons on overlay with backdrop-blur-sm

**Dashboard Icons**:
- Use Heroicons (outline variant) via CDN for all UI icons
- Truck, map-pin, chat-bubble, clock, cube icons
- Consistent size: w-6 h-6 for navigation, w-5 h-5 inline

**Avatar Placeholders**:
- Driver avatars: Circular, 40x40px with initials fallback
- Truck icons in cards: 64x64px, semi-transparent primary background

## Responsive Behavior
- Admin sidebar collapses to hamburger menu on mobile
- Map height reduces to h-64 on mobile
- Stats grid: 1 column on mobile, 2 on tablet, 4 on desktop
- Chat interface: Full screen modal on mobile, drawer on desktop
- Table: Horizontal scroll on mobile with sticky first column
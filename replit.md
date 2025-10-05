# SR Logistics Fleet Management System

## Overview

SR Logistics is a milk transport fleet management web application designed for truck owners (admins) and drivers. The system enables real-time trip management, crate tracking, live GPS monitoring, and group chat communication between admins and drivers.

The application provides two distinct user interfaces:
- **Admin Dashboard**: Comprehensive fleet oversight with trip assignment, live tracking maps, statistics, and driver management
- **Driver Interface**: Simplified mobile-friendly view for trip execution, crate counting, and communication

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with Vite as the build tool and development server

**UI Component System**: shadcn/ui built on Radix UI primitives with Tailwind CSS for styling. The design follows Material Design 3 principles adapted for fleet management, using a "New York" style variant with custom theming.

**Routing**: Wouter for lightweight client-side routing with role-based navigation (admin vs driver routes)

**State Management**: 
- TanStack Query (React Query) for server state management and data fetching
- React hooks for local component state
- No global state management library (Redux/Zustand) - relies on React Query cache and prop drilling

**Design System**:
- Custom color palette with light/dark mode support via CSS variables
- Inter font family from Google Fonts
- Material Design 3 spacing primitives (2, 4, 6, 8 units)
- Responsive grid layouts: 12-column for admin, single-column centered for drivers

**Key Frontend Patterns**:
- Component composition with barrel exports from ui/ folder
- Form handling with React Hook Form and Zod validation
- Real-time updates via WebSocket connection
- Map integration using Leaflet for GPS tracking visualization

### Backend Architecture

**Runtime**: Node.js with Express.js framework

**Database ORM**: Drizzle ORM with PostgreSQL (Neon serverless)

**API Design**: RESTful endpoints under `/api` prefix with JSON request/response format

**Real-time Communication**: WebSocket server (ws library) running on same HTTP server for chat and live tracking updates. WebSocket path: `/ws` with user ID query parameter for client identification.

**Authentication**: 
- Session-based authentication using bcrypt for password hashing
- No JWT implementation - relies on server-side sessions
- Role-based access control (admin/driver roles)

**File Organization**:
- `server/routes.ts`: API endpoint registration and WebSocket setup
- `server/storage.ts`: Database abstraction layer with TypeScript interfaces
- `server/seed.ts`: Database seeding with sample data
- `shared/schema.ts`: Drizzle schema definitions and Zod validation schemas

### Database Schema

**Core Tables**:
- `users`: Authentication and role management (id, name, email, password, role, status)
- `trucks`: Fleet vehicle inventory (id, truckNumber, capacity, status)
- `routes`: Predefined delivery routes (id, routeName, notes)
- `trips`: Active/historical trip records (id, truckId, driverId, routeId, startTime, endTime, distanceTravelled, avgSpeed, currentLocation, status)
- `crates`: Crate delivery tracking (id, tripId, initialCount, remainingCount, lastUpdated)
- `messages`: Group chat message history (id, senderId, content, type, createdAt)

**Relationships**:
- Trips reference trucks, drivers (users), and routes via foreign keys
- Crates belong to specific trips
- Messages reference user senders

**Key Fields**:
- UUIDs generated via `gen_random_uuid()` for primary keys
- Status enums: user status (active/inactive), truck status (available/busy), trip status (ongoing/completed)
- Timestamp fields for trip start/end times, crate updates, and message creation

**Database Implementation**:
- Using standard PostgreSQL with `pg` driver and `drizzle-orm/node-postgres`
- Compatible with any PostgreSQL database (Supabase, Neon, Render, etc.)
- All CRUD operations handled through `DbStorage` class in `server/storage.ts`
- Database seeding script available at `server/seed.ts`

### External Dependencies

**Database Service**: PostgreSQL (Supabase) via standard `pg` driver

**Map Services**: 
- OpenStreetMap tile layer for map rendering
- Leaflet.js for interactive map components

**UI Component Library**: Radix UI primitives for accessible, unstyled components:
- Dialog, Dropdown, Select, Toast, Tooltip, and 20+ other primitives
- All styled via Tailwind CSS with custom design tokens

**Real-time Infrastructure**: 
- Native WebSocket (ws) for chat and tracking - no Socket.io dependency
- Client-side WebSocket connection managed in React components

**Real-time GPS Tracking**:
- Live GPS location updates delivered via WebSocket with `location_update` message type
- LiveTracking component (`client/src/components/views/LiveTracking.tsx`) establishes WebSocket connection on mount
- GPS locations stored in component state as Map<tripId, {latitude, longitude, timestamp}>
- MapView component (`client/src/components/MapView.tsx`) efficiently updates marker positions without recreating entire map
- Markers are tracked by driver ID and only updated when positions change
- Falls back to default location (New York City: 40.7128, -74.0060) if GPS data not yet available for a trip
- WebSocket message format for location updates:
  ```json
  {
    "type": "location_update",
    "tripId": "uuid",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "timestamp": "2025-10-02T18:57:00Z"
  }
  ```

**Development Tools**:
- Vite plugins: React, runtime error overlay, Replit-specific tooling
- TypeScript for type safety across frontend and backend
- Drizzle Kit for database migrations

**Authentication**: 
- bcrypt for password hashing (10 salt rounds)
- No external auth provider
- Secure user update endpoints with Zod validation
- Separate password change endpoint with proper hashing

**API Endpoints**:
- Authentication: `/api/auth/register`, `/api/auth/login`
- Users: `/api/users`, `/api/users/drivers`, `/api/users/:id`, `/api/users/:id/password`
- Trucks: `/api/trucks`, `/api/trucks/available`, `/api/trucks/:id`
- Routes: `/api/routes`, `/api/routes/:id`
- Trips: `/api/trips`, `/api/trips/ongoing`, `/api/trips/driver/:driverId`, `/api/trips/:id`
- Crates: `/api/crates/trip/:tripId`, `/api/crates/:id`
- Messages: `/api/messages`, `/api/messages/:id` (with DELETE support)

**Seed Data**:
- Admin: admin@srlogistics.com (password: admin123)
- Driver 1: john@srlogistics.com (password: driver123)
- Driver 2: sarah@srlogistics.com (password: driver123)
- 2 trucks (TRK-001, TRK-002)
- 1 route (City Center Route)
- 1 ongoing trip with crates

**Styling**: 
- Tailwind CSS with PostCSS
- class-variance-authority (CVA) for component variants
- clsx and tailwind-merge for class name composition

**Form Handling**:
- React Hook Form for form state management
- Zod for runtime validation
- @hookform/resolvers for Zod integration

**Date Utilities**: date-fns for date formatting and manipulation

**Build & Deployment**:
- esbuild for server-side bundling
- Vite for client-side bundling
- Production build outputs to `dist/` directory
- Render.com deployment configuration in `render.yaml`
- Health check endpoint at `/api/health` for monitoring

**Deployment on Render.com**:
1. Database setup: Supabase PostgreSQL database with connection string in `DATABASE_URL` environment variable
2. Build command: `npm install --include=dev && npm run build`
3. Start command: `npm start`
4. Required environment variables:
   - `NODE_ENV=production`
   - `DATABASE_URL` (Supabase connection string)
   - `SESSION_SECRET` (auto-generated by Render)
5. Health check endpoint: `/api/health`
6. Database migrations: Run `npm run db:push -- --force` before first deployment
7. Database seeding: Run `tsx server/seed.ts` after migrations to populate initial data
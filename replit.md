# Grinch Christmas Game

## Overview

This is a 2D Christmas-themed browser game where the player controls the Grinch character to catch falling gifts from Santa's sleigh. The game features progressive difficulty, particle effects, and a festive holiday theme. Built with React, TypeScript, and Vite, it uses a canvas-based rendering system for smooth 2D gameplay.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Single Page Application (SPA)**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR (Hot Module Replacement)
- Canvas-based 2D game rendering instead of WebGL/Three.js for simpler game mechanics
- Radix UI components provide accessible, pre-built UI primitives
- Tailwind CSS for utility-first styling with custom theming via CSS variables

**State Management**
- Zustand stores for lightweight, hooks-based state management
- Separate stores for game logic (`useGrinchGame`), audio (`useAudio`), and generic game state (`useGame`)
- Uses `subscribeWithSelector` middleware for selective state subscriptions
- Game state stored in refs during gameplay to avoid re-renders during animation loops

**Game Architecture**
- Canvas-based 2D game loop running via `requestAnimationFrame`
- Collision detection using simple bounding box algorithms
- Particle system for visual effects (sparkles, explosions, snowflakes, ice effects)
- Progressive difficulty system that increases spawn rates and speeds
- Multiple gift types: normal (points), bombs (game over), snowballs (freeze effect)

**Component Structure**
- `App.tsx`: Main application wrapper
- `GrinchGame2D.tsx`: Core game loop and canvas rendering
- `GameUI.tsx`: HUD overlay showing score and level
- `GameOverScreen.tsx`: End game screen with restart functionality
- Comprehensive Radix UI component library in `/components/ui/`

### Backend Architecture

**Express.js Server**
- ESM module system for modern JavaScript syntax
- Vite integration in development mode for seamless HMR
- Minimal API structure with placeholder routes in `server/routes.ts`
- Custom error handling middleware
- Request/response logging for API endpoints

**Storage Layer**
- Abstracted storage interface (`IStorage`) for flexible data persistence
- In-memory storage implementation (`MemStorage`) as default
- Designed to be swapped with database implementations without code changes
- Currently implements user CRUD operations (get, create, find by username)

**Development vs Production**
- Development: Vite middleware serves React app with HMR
- Production: Pre-built static files served from `dist/public`
- Separate build processes for client (Vite) and server (esbuild)

### External Dependencies

**Database**
- PostgreSQL via `@neondatabase/serverless` for serverless PostgreSQL connections
- Drizzle ORM for type-safe database operations and schema management
- Schema defined in `shared/schema.ts` with Zod validation
- Migration system via `drizzle-kit` with migrations stored in `/migrations`
- Currently configured for Neon Database but can work with any PostgreSQL provider

**UI Libraries**
- Radix UI primitives for accessible component foundations (dialogs, dropdowns, tooltips, etc.)
- React Three Fiber and Three.js ecosystem (Drei, postprocessing) included but not actively used in current 2D implementation
- Lucide React for consistent iconography
- CMDk for command palette functionality

**Development Tools**
- TypeScript with strict mode enabled
- Path aliases (`@/` for client, `@shared/` for shared code)
- PostCSS with Tailwind CSS and Autoprefixer
- Custom Vite plugins for error overlays and GLSL shader support

**Build and Deployment**
- esbuild for server bundling (ESM format, external packages)
- Vite for client bundling with React plugin
- Support for various asset types: 3D models (gltf, glb), audio files (mp3, ogg, wav)

**Audio System**
- HTML5 Audio API via store-managed audio instances
- Background music with loop support
- Sound effects for game events (hits, success)
- Mute/unmute toggle functionality

**Session Management**
- Express session handling infrastructure in place
- `connect-pg-simple` for PostgreSQL-backed sessions (when database is configured)
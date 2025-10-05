# Overview

This is a Deep Archive AI search application that enables users to search across declassified government documents and historical archives using AI-powered analysis. The application combines multiple archival sources (CIA, FBI, NARA, NSA, Wayback Machine) with AI models to provide comprehensive research capabilities for historical and declassified information.

The system is built as a full-stack TypeScript application using React for the frontend and Express for the backend, with a focus on providing an intelligent search interface that can analyze and synthesize information from multiple government and archival sources.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Technology Stack:**
- **Framework:** React 18 with TypeScript
- **Routing:** Wouter (lightweight client-side routing)
- **State Management:** TanStack Query (React Query) for server state
- **UI Components:** Radix UI primitives with shadcn/ui component library
- **Styling:** Tailwind CSS with custom theme configuration
- **Build Tool:** Vite

**Design Decisions:**
- Uses a component-based architecture with shadcn/ui for consistent, accessible UI components
- Implements custom hooks (`use-chat`, `use-sources`, `use-mobile`) for reusable logic
- Single-page application with client-side routing for smooth navigation
- Real-time message streaming and source panel management
- Responsive design with mobile-first approach

## Backend Architecture

**Technology Stack:**
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database ORM:** Drizzle ORM configured for PostgreSQL
- **Database Provider:** Neon Database (serverless PostgreSQL)
- **Build Tool:** esbuild for production builds

**API Structure:**
- RESTful API design with `/api` prefix
- Main chat endpoint handles multi-source search orchestration
- In-memory storage implementation (`MemStorage`) with interface for future database integration
- Middleware for request logging and JSON body parsing

**Design Decisions:**
- Currently uses in-memory storage (`MemStorage` class) as a placeholder, designed with `IStorage` interface for easy migration to PostgreSQL/Drizzle ORM
- Database schema defined in `shared/schema.ts` with tables for conversations, messages, bookmarks, and search history
- Modular service architecture for different search sources (Perplexity, archival services, Wayback Machine)

## Data Storage

**Database Schema (Prepared for PostgreSQL via Drizzle):**
- **conversations:** Stores chat conversation metadata
- **messages:** Individual messages with role (user/assistant), content, and source citations
- **bookmarks:** Saved documents and sources
- **search_history:** Query history tracking

**Source Types Supported:**
- CIA FOIA Reading Room
- FBI Vault
- National Archives (NARA)
- NSA Declassified Documents
- Department of Energy (DOE) OpenNet
- Wayback Machine (Archive.org)
- Academic sources
- General web sources

**Current Implementation:**
- In-memory storage for development/testing
- Schema fully defined and ready for PostgreSQL migration via Drizzle
- UUID-based primary keys using PostgreSQL's `gen_random_uuid()`

## External Dependencies

**AI/LLM Services:**
- **OpenRouter API:** Primary AI service using DeepSeek R1 model for search and analysis
  - Configured with hardcoded API key in service (should be moved to environment variable)
  - Model: `deepseek/deepseek-r1:free`
  - Used for intelligent search interpretation and response generation

**Archival Search Services:**
- **CIA FOIA Reading Room:** Declassified CIA documents (API simulation, no public API)
- **FBI Vault:** FBI declassified files (API simulation)
- **NARA:** National Archives (API simulation)
- **NSA:** NSA declassified documents (API simulation)
- **Wayback Machine CDX API:** Historical web snapshots via `http://web.archive.org/cdx/search/cdx`

**Database:**
- **Neon Database:** Serverless PostgreSQL provider
  - Connection via `@neondatabase/serverless` driver
  - Configuration expects `DATABASE_URL` environment variable

**Development Tools:**
- **Replit-specific plugins:** Runtime error overlay, cartographer, dev banner
- **Vite plugins:** React plugin, TypeScript support

**UI/Styling:**
- **Tailwind CSS:** Utility-first styling
- **Radix UI:** Accessible component primitives (20+ component packages)
- **Google Fonts:** Inter, JetBrains Mono, Space Grotesk font families

**Form/Validation:**
- **React Hook Form:** Form state management
- **Zod:** Schema validation with Drizzle integration via `drizzle-zod`

**Session Management:**
- **connect-pg-simple:** PostgreSQL session store (configured but not yet fully implemented)

**Note on API Keys:**
- Multiple AI service API keys are currently hardcoded in the codebase (found in attached assets)
- These should be migrated to secure environment variables:
  - Groq API key
  - OpenAI API key
  - OpenRouter API key
  - Brave Browser API (mentioned but not implemented)
  - Hugging Face model access (mentioned but not implemented)
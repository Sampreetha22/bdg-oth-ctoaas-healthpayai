# FWA Analytics Platform

## Overview

The FWA Analytics Platform is an AI-powered healthcare fraud, waste, and abuse (FWA) detection system designed for healthcare payers. It provides real-time analytics, compliance reporting, and intelligent pattern recognition to identify billing anomalies, EVV (Electronic Visit Verification) discrepancies, provider behavioral patterns, and benefit utilization issues. The platform leverages LangGraph-based AI agents for sophisticated fraud analysis and employs a modern Material Design 3-inspired interface optimized for data-intensive healthcare analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and development server.

**UI Component System**: Shadcn/ui (New York style) with Radix UI primitives for accessible, composable components. The design follows Material Design 3 principles adapted for healthcare analytics, emphasizing data density with clarity and dual-mode (light/dark) support as a first-class feature.

**Styling**: Tailwind CSS with custom design tokens defined in CSS variables for comprehensive theming support. Typography uses Inter for primary content and IBM Plex Mono for numerical data and code display.

**State Management**: TanStack Query (React Query) for server state management with configured query defaults (no refetch on window focus, infinite stale time) for stable data presentation.

**Routing**: Wouter for lightweight client-side routing with six main application sections: Dashboard, Claim Anomaly Detection, EVV Intelligence, Provider Profiling, Benefit Utilization, and Reports.

**Layout System**: 12-column responsive grid system with consistent spacing primitives (2, 4, 6, 8, 12, 16, 24 Tailwind units) and a collapsible sidebar navigation pattern.

### Backend Architecture

**Server Framework**: Express.js running on Node.js with TypeScript, providing RESTful API endpoints for frontend consumption.

**Development vs Production**: Dual entry points (index-dev.ts with Vite middleware for HMR, index-prod.ts serving static builds) enable optimized development workflow and production deployment.

**API Structure**: Route handlers organized in routes.ts providing endpoints for:
- Dashboard metrics and recent alerts
- Claim anomaly detection (duplicate billing, underbilling, upcoding)
- EVV pattern analysis (not visited, service overlaps, missed visits)
- Provider risk profiling and outlier detection
- Benefit utilization tracking
- Compliance reporting

**Data Generation**: Synthetic healthcare data generator (data-generator.ts) creates realistic test data including providers, members, claims, EVV records, clinical outcomes, and fraud alerts for development and testing.

### AI Agent System

**Framework**: LangGraph for orchestrating multi-agent fraud analysis workflows with OpenAI/Azure OpenAI integration.

**Agent Architecture**: State-graph-based system with specialized nodes:
- Claim Validator: Basic validation and business rule checking
- Anomaly Detector: Pattern-based anomaly identification
- Pattern Analyzer: Operational vs fraud pathway classification
- Risk Scorer: Final risk scoring and recommendation generation

**State Management**: Typed FraudAnalysisState interface tracks validation issues, anomalies, hypotheses, risk scores, and evidence throughout the analysis pipeline.

**Integration Point**: AI agents (ai-agents.ts) provide claim and provider analysis capabilities consumed by API endpoints for real-time fraud detection.

### Data Layer

**Database**: PostgreSQL accessed via Neon serverless driver with WebSocket support for edge compatibility.

**ORM**: Drizzle ORM with TypeScript-first schema definition in shared/schema.ts providing type-safe database access.

**Schema Design**: Normalized relational schema with tables for:
- `providers`: Healthcare provider records with risk scoring
- `members`: Patient/member information
- `claims`: Individual claim records with CPT codes, amounts, dates
- `evvRecords`: Electronic visit verification data with GPS coordinates
- `clinicalOutcomes`: Treatment outcome tracking
- `fraudAlerts`: Detected fraud incidents with status tracking
- `providerStats`: Aggregated provider statistics

**Enums**: PostgreSQL enums for risk levels, FWA types, alert statuses, and analysis pathways ensuring data integrity.

**Relations**: Drizzle relations define foreign key relationships between tables (claims to providers/members, EVV records to claims, etc.).

**Data Access Layer**: Storage abstraction (storage.ts) provides repository pattern with methods for CRUD operations, relationship queries, and aggregated analytics, decoupling business logic from database implementation.

### Build and Deployment

**TypeScript Configuration**: Module resolution set to "bundler" with path aliases (@/, @shared/, @assets/) for clean imports across client and server code.

**Build Process**: 
- Client: Vite builds React application to dist/public
- Server: esbuild bundles Express server to dist/index.js with external packages
- Database: Drizzle Kit manages schema migrations to migrations directory

**Environment Requirements**: DATABASE_URL for Postgres connection, optional Azure OpenAI credentials for AI features.

## External Dependencies

### Database Service
- **Neon Serverless Postgres**: Managed PostgreSQL with WebSocket connection pooling and edge runtime compatibility

### AI/ML Services
- **OpenAI/Azure OpenAI**: GPT-4 model access via LangChain integration for fraud analysis agents
- **LangGraph**: Multi-agent workflow orchestration framework for complex decision trees

### UI Component Libraries
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives (dialogs, dropdowns, tooltips, tabs, etc.)
- **Recharts**: Data visualization library for charts and graphs in analytics dashboards
- **Lucide React**: Icon set for consistent UI iconography
- **cmdk**: Command palette component for keyboard-driven navigation

### Utility Libraries
- **date-fns**: Date formatting and manipulation
- **zod**: Runtime type validation with Drizzle schema integration
- **class-variance-authority**: Type-safe variant-based component styling
- **tailwind-merge**: Intelligent Tailwind class merging for component composition

### Development Tools
- **Vite**: Fast development server and optimized production builds
- **ESBuild**: High-performance JavaScript bundler for server code
- **Drizzle Kit**: Database schema migration and management CLI
- **TypeScript**: Static type checking across entire codebase

### Session Management
- **connect-pg-simple**: PostgreSQL-based session store (indicated by dependency, though session implementation not visible in provided files)
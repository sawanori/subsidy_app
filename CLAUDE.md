# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **申請ドキュメント自動生成アプリ** (Application Document Auto-Generation App) built with a multi-agent tmux communication system. The project combines a Next.js frontend, NestJS backend, and PostgreSQL database to automate generation of Japanese subsidy application documents.

## Architecture

### Multi-Agent System
- **PRESIDENT** (separate session): Project oversight and final approval
- **boss1** (multiagent:agents): Team leader and project coordination
- **worker1** (frontend): Next.js 14+ with TypeScript, Tailwind CSS, shadcn/ui
- **worker2** (backend): NestJS REST API with Prisma ORM, PDF generation
- **worker3** (database): PostgreSQL with Prisma schema management

### Agent Communication
```bash
./agent-send.sh [target_agent] "[message]"
```

Agents follow hierarchical communication: PRESIDENT → boss1 → workers → boss1 → PRESIDENT

### Technical Stack

**Frontend (./frontend/)**
- Next.js 14+ with App Router
- TypeScript + Tailwind CSS + shadcn/ui
- Storybook for component documentation
- Playwright for E2E testing, Jest/Vitest for unit testing

**Backend (./backend/)**
- NestJS with TypeScript
- Prisma ORM with PostgreSQL
- PDF generation (Puppeteer, docxtemplater)
- OCR processing with Tesseract.js
- Security: ClamAV antivirus, AES256 encryption

**Infrastructure**
- Vercel (frontend deployment)
- Railway/Render (backend deployment)
- Neon/Supabase (PostgreSQL hosting)
- S3-compatible storage for file handling

## Development Commands

### Frontend Development
```bash
cd frontend/
npm run dev                    # Start development server
npm run build                  # Production build
npm run lint                   # ESLint check
npm run type-check             # TypeScript check
npm run test:unit              # Jest unit tests
npm run test:e2e               # Playwright E2E tests
npm run test:accessibility     # Accessibility tests
npm run test:performance       # Performance tests
npm run test:coverage          # Vitest coverage report
```

### Backend Development
```bash
cd backend/
npm run start:dev              # Development server with ts-node
npm run build                  # TypeScript compilation
npm run lint                   # ESLint check
npm run test                   # Jest tests
npm run test:cov               # Coverage report
npm run test:e2e               # E2E integration tests
npm run start:prod             # Production server from dist/
```

### Database Management
```bash
cd backend/
npx prisma migrate dev         # Apply migrations
npx prisma generate            # Generate Prisma client
npx prisma studio              # Database browser
npx prisma db push             # Push schema changes
npx prisma migrate reset       # Reset database (dev only)
```

### Multi-Agent Environment
```bash
./setup.sh                     # Initialize tmux sessions
tmux attach-session -t multiagent  # Attach to agent session
tmux attach-session -t president   # Attach to president session
./agent-send.sh [agent] "[msg]"   # Send message to specific agent
./agent-send.sh --list         # Show available agents
```

## Project Structure

### Core Configuration
- `plan.yaml`: Complete project roadmap with 50+ tickets across 4 sprints
- `governance.yaml`: Quality gates, security baselines, SLO/SLI definitions
- `OPERATIONS.md`: Production operations guide and runbooks
- `frontend/`: Next.js 15.5.2 application with App Router
- `backend/`: NestJS REST API with Prisma ORM
- `backend/prisma/schema.prisma`: Complete database schema

### Development Governance
The project follows strict Definition of Ready (DOR) and Definition of Done (DOD):
- Test coverage ≥70% required (Jest for backend, Jest/Vitest for frontend)
- WCAG 2.1 AA accessibility compliance (tested with @axe-core/playwright)
- Performance targets: ≤2s preview, ≥99% success rate
- Security: Multi-layer protection with AES256, ClamAV, audit logging
- Cost control: ≤15円 per generation
- Linting: ESLint 9 for both frontend and backend

### Agent Role Instructions
- `instructions/president.md`: Project oversight responsibilities
- `instructions/boss.md`: Team coordination and task distribution
- `instructions/worker.md`: Task execution and completion reporting

## Key Features

### Document Generation Pipeline
- HTML → PDF generation via Puppeteer (backend)
- DOCX template → PDF conversion via docxtemplater
- Automatic stamp placement with pdf-lib
- SVG generation: Gantt charts (Mermaid), Organization charts (Dagre)
- Multi-format output with ZIP packaging

### Evidence Processing System
- OCR with Japanese language support (Tesseract.js)
- File parsing: PDF (pdf-parse), Excel (xlsx), CSV
- Automatic data structuring and footnote generation
- Quality scoring system (0-100) for processed evidence
- Security scanning with node-clamav integration
- File validation: MIME type, extension, size limits

### Quality Assurance
- Frontend testing: Jest/Vitest (unit), Playwright (E2E, accessibility, performance)
- Backend testing: Jest (unit/integration), Supertest (E2E)
- Storybook for component documentation and visual testing
- Real-time monitoring with SLO/SLI tracking (Pino/Winston logging)
- Cost control mechanisms and storage management
- Comprehensive audit logging for compliance

## Agent Communication Protocol

When working as an agent in this system:

1. **Check your role**: Refer to appropriate instruction file in `instructions/`
2. **Follow hierarchy**: Use `./agent-send.sh` for inter-agent communication
3. **Track completion**: Create completion files in `./tmp/` when finished
4. **Report status**: Final agent reports completion to supervisor
5. **Maintain governance**: Ensure all work meets `governance.yaml` standards

### Sprint Status
- **Sprint 1** (Completed): Basic infrastructure, wizard UI, design system
- **Sprint 2** (Current): Document generation, validation, i18n foundations
- **Sprint 3** (Upcoming): Evidence processing, OCR, supplementary materials
- **Sprint 4** (Future): QA, deployment, production operations

### Technology Stack Details

**Frontend Dependencies**:
- React 19.1.0, Next.js 15.5.2
- shadcn/ui components with Radix UI
- react-hook-form + zod for form validation
- react-pdf for PDF preview, pdfjs-dist for parsing
- next-intl for internationalization
- Tailwind CSS 4 with Oxide engine

**Backend Dependencies**:
- NestJS 11.1.6 with Express
- Prisma ORM 6.15.0 for PostgreSQL
- Puppeteer for PDF generation
- Tesseract.js for OCR processing
- Handlebars for template processing
- nestjs-i18n for internationalization
- OpenAI SDK for AI integrations

The system is designed for systematic, quality-driven development with full traceability and automated quality gates.
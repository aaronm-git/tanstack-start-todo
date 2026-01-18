# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **[BREAKING]** Migrated AI todo generation from direct OpenAI API calls to TanStack AI
  - Now uses `chat()` from `@tanstack/ai` with `outputSchema` parameter
  - Automatic Zod schema validation and type inference
  - Easier to swap AI providers (OpenAI, Anthropic, Gemini, etc.)
  
- **AI Schema Improvements**
  - Changed all `.nullable()` to `.nullish()` for better OpenAI compatibility
  - Added detailed `.describe()` strings to guide AI model responses
  - Improved field descriptions with examples and clear expectations
  
- **Type Safety Enhancements**
  - Full TypeScript inference from Zod 4 schemas
  - Single source of truth for database → Zod → TypeScript types
  - Consolidated schemas in `src/lib/tasks.ts`

### Fixed

- Fixed "Expected string, received undefined" errors in AI todo generation
  - Root cause: Incompatibility between Zod 4 syntax and TanStack AI schema converter
  - Solution: Use `.nullish()` instead of `.nullable()` or `.optional()`
  
### Added

- New documentation: [Zod 4 + TanStack AI Integration](./docs/dev/zod-tanstack-ai-integration.md)
  - Comprehensive guide on the integration approach
  - Schema design best practices
  - Troubleshooting common issues
  
### Updated

- Updated [AI Todo Creation (OpenAI)](./docs/dev/ai-todo-openai.md) with TanStack AI implementation details
- Updated package dependencies to latest versions:
  - `@tanstack/ai`: 0.2.2
  - `zod`: 4.3.5
  - `@tanstack/ai-openai`: latest

## [Initial] - 2026-01-18

### Added

- Initial project setup with TanStack Start
- Todo management with Drizzle ORM and PostgreSQL
- AI-powered todo creation with OpenAI
- Authentication with Better Auth
- Dashboard UI with shadcn/ui components

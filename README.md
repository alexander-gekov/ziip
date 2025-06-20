# Ziip.fun Monorepo

This is a pnpm workspaces monorepo containing multiple applications.

## Structure

```
├── apps/
│   ├── vite/          # React + Vite + shadcn/ui application
│   └── nuxt/          # Nuxt 3 + Vue 3 + TypeScript + Pinia application
├── package.json       # Root workspace configuration
└── pnpm-workspace.yaml # pnpm workspace configuration
```

## Prerequisites

- Node.js (v18 or higher)
- pnpm (v9 or higher)

## Installation

Install dependencies for all applications:

```bash
pnpm install
```

## Development

### Vite App (React)
```bash
# Start development server
pnpm dev:vite

# Build for production
pnpm build:vite
```

### Nuxt App (Vue 3)
```bash
# Start development server
pnpm dev:nuxt

# Build for production
pnpm build:nuxt
```

### Run both applications
```bash
# Start both development servers
pnpm dev:vite & pnpm dev:nuxt
```

## Applications

### Vite App
- **Framework**: React 18
- **Build Tool**: Vite
- **UI Library**: shadcn/ui
- **Styling**: Tailwind CSS
- **TypeScript**: Full support
- **Features**: Game application with modern React patterns

### Nuxt App
- **Framework**: Nuxt 3
- **Vue Version**: Vue 3 with Composition API
- **TypeScript**: Strict mode enabled
- **State Management**: Pinia with composition API stores
- **Styling**: Tailwind CSS
- **Features**: 
  - Auto-imports for Vue, Nuxt, and custom composables
  - File-based routing
  - Server-side rendering
  - TypeScript support

## Workspace Commands

```bash
# Install dependencies for all apps
pnpm install

# Run linting for all apps
pnpm lint

# Build all applications
pnpm build:vite && pnpm build:nuxt
```

## Development Guidelines

### Vue/Nuxt Development Rules
- Use Vue 3 with Composition API
- Use TypeScript for all components
- Auto-imports are configured (no need to import from vue, components, composables, stores)
- Write Pinia stores in composition API style
- Use npm as package manager unless specified otherwise
- Avoid comments in favor of readable code with proper spacing
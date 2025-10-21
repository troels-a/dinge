# AGENTS.md

## Project Overview

Dinge is a React library for CRUD-based item management with automatic caching and optimistic updates. It provides a centralized context and store for item state management, with built-in caching, TTL support, and rollback functionality.

## Setup Commands

- Install deps: `yarn install`
- Start dev server: `yarn dev`
- Build library: `yarn build`
- Run tests: `yarn test`
- Run tests in watch mode: `yarn test:watch`
- Type checking: `yarn type-check`
- Linting: `yarn lint`

## Code Style

- TypeScript strict mode
- Single quotes, no semicolons
- Use functional patterns where possible
- Prefer composition over inheritance
- Use React hooks for state management
- Export types alongside components

## Architecture

### Core Components
- `ItemProvider`: Main context provider for configuration
- `Item`: Wrapper component that loads and provides item data
- `useItem`: Hook for accessing item data and CRUD operations
- `useItemContext`: Hook for creating new items

### Store Structure
- Zustand store for state management
- Items stored as `{ [type]: { [id]: ItemState } }`
- Each item has: `data`, `clean`, `loading`, `error`, `timestamp`
- TTL support for cache expiration
- Automatic rollback on API failures

### API Integration
- Flexible configuration (string or object configs)
- Custom HTTP methods and response handlers
- Request transformation support
- Error handling and retry logic

## Testing Instructions

- Find test files in `tests/` directory
- Run `yarn test` to run all tests
- Use `yarn test:watch` for development
- Tests use Vitest + React Testing Library
- Mock `fetch` for API tests
- Test both success and error scenarios
- Add tests for new features

## Build Instructions

- Library builds to both CJS and ESM formats
- TypeScript declarations are generated
- Build output goes to `dist/` directory
- Use `yarn build` before committing
- Ensure no TypeScript errors before building

## Development Workflow

1. Make changes to `src/` files
2. Run `yarn type-check` to verify types
3. Run `yarn test` to ensure tests pass
4. Run `yarn build` to generate distribution files
5. Test the built library in a separate project

## File Structure

```
src/
├── index.ts                 # Main exports
├── ItemProvider.tsx         # Main provider component
├── Item.tsx                 # Item wrapper component
├── useItem.ts               # Main hook
├── useItemContext.ts        # Context hook for creating items
├── store.ts                 # Zustand store setup
├── types.ts                 # TypeScript type definitions
└── utils/
    ├── api.ts               # API request utilities
    └── cache.ts             # Cache/TTL utilities
```

## Key Implementation Notes

### Store Management
- Use Zustand's `set()` with updater functions
- Only update `data` with `mutate()`, not `clean`
- Update both `data` and `clean` on successful API calls
- Rollback to `clean` state on API failures

### Config Parsing
- Parse string configs into full OperationConfig objects
- Set default HTTP methods (POST/GET/PUT/DELETE)
- Default handler: `res => res.json()`

### Error Handling
- Always handle API errors gracefully
- Provide rollback functionality for optimistic updates
- Show loading states during API calls
- Display error messages to users

## PR Instructions

- Title format: `[dinge] <Title>`
- Always run `yarn lint` and `yarn test` before committing
- Ensure `yarn build` succeeds
- Update tests for new features
- Update documentation if API changes

## Security Considerations

- Never expose API keys or sensitive data
- Validate all user inputs
- Handle network errors gracefully
- Use proper error boundaries in React components

## Common Patterns

### Creating Items
```jsx
const { create } = useItemContext('book');
const newBook = await create({ title: 'New Book' });
```

### Optimistic Updates
```jsx
const { mutate, update } = useItem();
mutate(prev => ({ ...prev, title: 'New Title' }));
await update(undefined, { rollback: true });
```

### Error Handling
```jsx
const { data, error, refresh } = useItem();
if (error) {
  return <div>Error: {error.message}</div>;
}
```

## Dependencies

- **React 18+** - Core React functionality
- **Zustand** - State management
- **TypeScript** - Type safety
- **Vitest** - Testing framework
- **React Testing Library** - Component testing

## Installation

The library can be installed from git:
```bash
npm install git+https://github.com/yourusername/dinge.git
```

Or from npm (when published):
```bash
npm install dinge
```

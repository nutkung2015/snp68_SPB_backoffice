# AI Agent Instructions for SPB Backoffice Project

## Project Overview
This is an Angular-based backoffice system for building management with the following key features:
- Announcement management
- Invite/resident management
- Issue tracking
- Order management
- Security management
- User management

## Architecture & Structure

### Key Components
- `src/app/components/` - Feature components organized by domain
- `src/app/services/` - Core services for auth, REST API, and Firebase integration
- `src/app/layouts/` - Layout templates (anonymous vs authenticated)
- `src/app/shared/` - Reusable UI components

### Important Services
- `AuthService` (`services/auth.service.ts`) - Handles authentication and user session
- `RestService` (`services/rest.service.ts`) - Central service for API communication
- `FirebaseService` (`services/firebase.service.ts`) - Manages Firebase storage integration

### Authentication Flow
1. Auth guard (`auth.guard.ts`) protects authenticated routes
2. Auth interceptor (`auth.interceptor.ts`) injects auth tokens into API requests
3. Anonymous layout used for login/public pages, authenticated layout for protected features

## Development Workflow

### Setup & Running
```bash
# Install dependencies
npm install

# Start development server
npm start   # Runs on http://localhost:4200

# Run tests
npm test
```

### Common Patterns
1. Component structure follows Angular standard with separate files for:
   - `.component.ts` - Component logic
   - `.component.html` - Template
   - `.component.scss` - Styles
   - `.component.spec.ts` - Tests

2. API Integration:
   - Models/interfaces defined in `rest.service.ts`
   - Use `RestService` for all API calls
   - Proper error handling using the service's built-in error handler

3. Firebase Storage:
   - Use `FirebaseService` for file uploads/storage
   - Configured in `app.config.ts` with environment-specific settings

## Type Definitions & Interfaces
Key interfaces for reference (defined in `rest.service.ts`):
```typescript
interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  posted_by: string;
  attachment_urls: string[];
  audience: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}
```

## Best Practices
1. Use Angular Material components for UI consistency
2. Implement proper route guards for protected features
3. Handle file uploads through Firebase service
4. Follow established component structure and naming conventions
5. Use TypeScript interfaces for API request/response types

## Common Gotchas
- Announcement IDs must be explicitly provided (e.g., 'annc001')
- Firebase configuration required in environment files
- Protected routes require valid auth token
- File attachments must go through Firebase storage
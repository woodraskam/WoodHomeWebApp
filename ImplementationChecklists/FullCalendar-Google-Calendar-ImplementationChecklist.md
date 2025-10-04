# FullCalendar Google Calendar Integration - Implementation Checklist

## Overview
Implementation checklist for FullCalendar Google Calendar integration, following the comprehensive design outlined in FullCalendar-Google-Calendar-ImplementationGuide.md.

## Current State Analysis
- **Existing Components**: Go backend with handlers/models/services structure, existing templates, SQL Server database, Sonos integration
- **Current Features**: Web application with Sonos control, Cribbage game, CandyLand, TicTacToe
- **Architecture**: Uses Gorilla Mux router, internal package structure, environment variables, template system
- **Target**: Phase 1 - Read-only Google Calendar display with FullCalendar v6

## Implementation Progress

### Phase 1: Prerequisites & Environment Setup
**Duration**: 1-2 days
**Status**: ⏳ Pending

#### 1.1 Google Cloud Project Setup
- [ ] Navigate to Google Cloud Console
- [ ] Create new project or select existing project
- [ ] Enable Google Calendar API
- [ ] Configure OAuth Consent Screen (Internal or External)
- [ ] Add required scopes: `https://www.googleapis.com/auth/calendar.readonly`
- [ ] Create OAuth 2.0 Credentials (Web application)
- [ ] Set authorized redirect URI: `http://localhost:8080/auth/google/callback`
- [ ] Download credentials JSON or copy Client ID and Secret

#### 1.2 Environment Configuration
- [x] Create/update `.env` file with Google OAuth credentials
- [x] Add `GOOGLE_CLIENT_ID` to environment
- [x] Add `GOOGLE_CLIENT_SECRET` to environment
- [x] Add `GOOGLE_REDIRECT_URL` to environment
- [x] Generate and add secure `SESSION_KEY` (32+ bytes)
- [x] Test environment variable loading

#### 1.3 Go Dependencies Installation
- [x] Install OAuth2 packages: `golang.org/x/oauth2`
- [x] Install Google OAuth: `golang.org/x/oauth2/google`
- [x] Install Calendar API: `google.golang.org/api/calendar/v3`
- [x] Install API options: `google.golang.org/api/option`
- [x] Install session management: `github.com/gorilla/sessions`
- [x] Note: `github.com/google/uuid` already installed
- [x] Note: `github.com/gorilla/mux` already installed
- [x] Update `go.mod` and `go.sum` files
- [x] Verify all dependencies resolve correctly

### Phase 2: OAuth Authentication Implementation
**Duration**: 2-3 days
**Status**: ⏳ Pending

#### 2.1 OAuth Configuration Service
- [x] Create `internal/services/oauth.go` file
- [x] Implement `NewGoogleOAuthConfig()` function
- [x] Implement `GenerateStateToken()` function with crypto/rand
- [x] Load configuration from environment variables
- [x] Use `oauth2.AccessTypeOffline` for refresh tokens
- [x] Add proper error handling
- [x] Test OAuth configuration creation

#### 2.2 OAuth Token Model
- [x] Create `internal/models/oauth_token.go` file
- [x] Define `OAuthToken` struct with proper JSON tags
- [x] Implement `ToOAuth2Token()` conversion method
- [x] Implement `FromOAuth2Token()` creation method
- [ ] Add database schema for token storage (if using DB approach)
- [ ] Implement `SaveToken()` and `GetToken()` functions
- [ ] Add token encryption for database storage
- [x] Never expose tokens in JSON responses

#### 2.3 OAuth Handlers Implementation
- [x] Create `internal/handlers/auth.go` file
- [x] Initialize session store with secure random key
- [x] Implement `GoogleLoginHandler` with state generation
- [x] Implement `GoogleCallbackHandler` with state validation
- [x] Add CSRF protection with state tokens
- [x] Store tokens securely (session or database)
- [x] Add comprehensive error handling
- [x] Clear sensitive data from sessions after use
- [x] Implement `LogoutHandler` for cleanup
- [ ] Test OAuth flow manually

#### 2.4 Route Registration
- [ ] Create calendar handler struct following Sonos pattern
- [ ] Add OAuth routes to mux router (following Sonos pattern)
- [ ] Register `/auth/google/login` route
- [ ] Register `/auth/google/callback` route
- [ ] Register `/auth/logout` route
- [ ] Register `/calendar` page route
- [ ] Register `/api/calendar/events` API route
- [ ] Use proper HTTP method restrictions
- [ ] Test route registration

### Phase 3: Calendar Service Implementation
**Duration**: 2-3 days
**Status**: ⏳ Pending

#### 3.1 Calendar Service Core
- [ ] Create `internal/services/calendar.go` file
- [ ] Define `CalendarEvent` struct for frontend
- [ ] Implement `GetCalendarEvents()` function
- [ ] Add automatic token refresh logic
- [ ] Handle both all-day and timed events
- [ ] Transform Google events to FullCalendar format
- [ ] Implement `getEventColor()` function
- [ ] Add proper error handling and logging
- [ ] Test calendar service with sample data

#### 3.2 Calendar API Handler
- [ ] Create `internal/handlers/calendar.go` file (following Sonos pattern)
- [ ] Create `CalendarHandler` struct with service dependency
- [ ] Implement `GetEventsHandler` method
- [ ] Parse query parameters (start, end dates)
- [ ] Validate date formats (RFC3339)
- [ ] Call calendar service to fetch events
- [ ] Handle token expiration gracefully
- [ ] Return proper JSON response
- [ ] Add CORS headers if needed
- [ ] Test API endpoint manually

#### 3.3 Authentication Middleware
- [ ] Create authentication middleware function
- [ ] Check for valid token in session
- [ ] Redirect to login if not authenticated
- [ ] Apply middleware to protected routes
- [ ] Test middleware functionality
- [ ] Ensure proper error handling

### Phase 4: Frontend Implementation
**Duration**: 2-3 days
**Status**: ⏳ Pending

#### 4.1 Calendar HTML Template
- [ ] Create `templates/calendar.html` file
- [ ] Include FullCalendar CSS from CDN
- [ ] Include FullCalendar JavaScript from CDN
- [ ] Add calendar container div with proper styling
- [ ] Implement responsive design
- [ ] Add loading and error state indicators
- [ ] Test template rendering

#### 4.2 FullCalendar Configuration
- [ ] Initialize FullCalendar with proper config
- [ ] Set `initialView` to 'dayGridMonth'
- [ ] Configure `headerToolbar` with navigation
- [ ] Set `timeZone` to 'local' for user timezone
- [ ] Implement dynamic event loading via `events` function
- [ ] Add event click handler (Phase 1: basic alert)
- [ ] Configure loading indicators
- [ ] Test calendar initialization

#### 4.3 Event Loading Integration
- [ ] Implement `events` function for dynamic loading
- [ ] Fetch events from `/api/calendar/events` endpoint
- [ ] Handle API responses and errors
- [ ] Call `successCallback` with event data
- [ ] Call `failureCallback` on errors
- [ ] Add loading states during fetch
- [ ] Test event loading functionality

#### 4.4 Calendar Page Handler
- [ ] Add `CalendarPageHandler` method to existing `CalendarHandler`
- [ ] Implement `CalendarPageHandler` method
- [ ] Use Go's `html/template` package (following existing pattern)
- [ ] Ensure middleware protects this route
- [ ] Test page loads in browser
- [ ] Verify authentication requirement

### Phase 5: Integration & Testing
**Duration**: 2-3 days
**Status**: ⏳ Pending

#### 5.1 Manual Testing - OAuth Flow
- [ ] Test `/auth/google/login` redirects to Google
- [ ] Test Google login and permission grant
- [ ] Test callback handling and token exchange
- [ ] Test token storage in session
- [ ] Test redirect to `/calendar` page
- [ ] Test logout functionality
- [ ] Test session persistence

#### 5.2 Manual Testing - Calendar Display
- [ ] Test `/calendar` page loads without errors
- [ ] Test FullCalendar renders correctly
- [ ] Test initial month view loads events
- [ ] Test navigation (prev/next month)
- [ ] Test view switching (month/week/day)
- [ ] Test all-day events display
- [ ] Test timed events display
- [ ] Test event colors match Google Calendar
- [ ] Test timezone handling

#### 5.3 Error Handling Testing
- [ ] Test expired token automatic refresh
- [ ] Test invalid token redirects to login
- [ ] Test network errors display user-friendly messages
- [ ] Test empty date ranges return empty array
- [ ] Test API error responses
- [ ] Test session timeout handling

#### 5.4 Security Testing
- [ ] Test cannot access `/calendar` without authentication
- [ ] Test state token validation prevents CSRF
- [ ] Test session cookies have HttpOnly flag
- [ ] Test tokens not visible in browser DevTools
- [ ] Test logout clears all session data
- [ ] Test concurrent user sessions

### Phase 6: Production Preparation
**Duration**: 1-2 days
**Status**: ⏳ Pending

#### 6.1 Security Hardening
- [ ] Ensure `.env` file not committed to git
- [ ] Use strong random SESSION_KEY (32+ bytes)
- [ ] Plan SESSION_KEY rotation strategy
- [ ] Update redirect URL for production HTTPS
- [ ] Set cookie `Secure: true` flag for production
- [ ] Implement token encryption for database storage
- [ ] Add rate limiting to API endpoints
- [ ] Configure CORS properly for production

#### 6.2 Performance Optimization
- [ ] Implement event caching with 5-minute TTL
- [ ] Add database indexing for token queries
- [ ] Configure database connection pooling
- [ ] Set appropriate MaxResults for API calls
- [ ] Add performance monitoring
- [ ] Test under load conditions

#### 6.3 Monitoring & Logging
- [ ] Add logging for OAuth login attempts
- [ ] Add logging for token refresh operations
- [ ] Add logging for API errors
- [ ] Add logging for rate limit hits
- [ ] Set up error alerting
- [ ] Monitor OAuth success/failure rates
- [ ] Track API response times
- [ ] Monitor Google API quota usage

#### 6.4 Deployment Preparation
- [ ] Update Google OAuth redirect URL for production
- [ ] Configure HTTPS certificates
- [ ] Set up production environment variables
- [ ] Test production deployment
- [ ] Verify all security settings
- [ ] Plan backup and recovery procedures

## Completion Criteria

### Functional Requirements
- [ ] Users can authenticate with Google OAuth
- [ ] Calendar displays Google Calendar events
- [ ] Events show correct times and dates
- [ ] Navigation between months/weeks/days works
- [ ] All-day and timed events display correctly
- [ ] Event colors match Google Calendar
- [ ] Token refresh happens automatically
- [ ] Logout clears all session data

### Technical Requirements
- [ ] Code follows project standards and patterns
- [ ] Proper error handling throughout
- [ ] Security best practices implemented
- [ ] Performance requirements met
- [ ] Comprehensive logging added
- [ ] All tests pass
- [ ] Documentation updated

### Security Requirements
- [ ] CSRF protection with state tokens
- [ ] Secure token storage
- [ ] HttpOnly session cookies
- [ ] Proper session management
- [ ] No sensitive data in logs
- [ ] Rate limiting implemented
- [ ] HTTPS ready for production

## Architecture Integration Notes

### Existing Codebase Integration
- **Handler Pattern**: Follow the existing Sonos handler pattern with struct and service dependency injection
- **Route Registration**: Use the existing mux router pattern like Sonos routes
- **Template System**: Use the existing template system in `templates/` directory
- **Database**: Leverage existing SQL Server connection for token storage
- **Environment Variables**: Add Google OAuth variables to existing `.env` system
- **Logging**: Use existing logging patterns with `logrus`

### File Structure Integration
```
internal/
├── handlers/
│   ├── sonos_handler.go          # Existing
│   └── calendar_handler.go       # New - following same pattern
├── models/
│   ├── sonos.go                  # Existing
│   └── oauth_token.go            # New
└── services/
    ├── sonos_service.go          # Existing
    ├── oauth.go                  # New
    └── calendar.go               # New
```

### Route Integration
- Add calendar routes to existing mux router in `main.go`
- Follow the same pattern as Sonos: `http.Handle("/api/calendar/", calendarRouter)`
- Use the same middleware pattern for authentication

## Notes
- **Phase 1 Focus**: Implement read-only calendar display first
- **Token Management**: Use `oauth2.AccessTypeOffline` to ensure refresh tokens
- **Timezone Handling**: Set FullCalendar `timeZone: 'local'` for user timezone
- **Error Handling**: Implement comprehensive error handling for all OAuth steps
- **Testing**: Test thoroughly with manual testing checklist before production
- **Future Enhancement**: Plan Phase 2 (create/edit events) after Phase 1 is stable

## Risk Mitigation
- **OAuth Complexity**: Follow the guide exactly, test each step
- **Token Expiry**: Implement automatic refresh with proper error handling
- **Timezone Issues**: Use browser timezone, test with known events
- **API Rate Limits**: Monitor usage, implement caching
- **Security**: Never store tokens in localStorage, use secure sessions

## Next Steps After Completion
1. Deploy to staging environment with HTTPS
2. Update Google OAuth redirect URL for production
3. Monitor OAuth success rates and API usage
4. Plan Phase 2 features (create/edit events)
5. Consider multi-calendar support
6. Add advanced FullCalendar features

# auth

Email/password authentication uses bcrypt and opaque database sessions. The browser receives only the random session token in an HTTP-only cookie; MySQL stores its SHA-256 hash. Routes handle HTTP concerns and validation, middleware resolves authenticated users, and the service owns credentials and session persistence.

Implemented endpoints: register, login, logout, current user, and onboarding completion. Persistence is isolated in the auth repository.

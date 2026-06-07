## ADDED Requirements

### Requirement: User Registration
The system SHALL allow users to register with email and password.

#### Scenario: Successful registration
- **WHEN** user submits valid email and password (min 8 characters)
- **THEN** system creates user record with bcrypt-hashed password
- **AND** system returns JWT access_token and refresh_token

#### Scenario: Duplicate email registration
- **WHEN** user submits email that already exists
- **THEN** system returns 400 error with message "Email already registered"

#### Scenario: Weak password
- **WHEN** user submits password shorter than 8 characters
- **THEN** system returns 400 error with message "Password must be at least 8 characters"

---

### Requirement: User Login
The system SHALL allow users to login with email and password.

#### Scenario: Successful login
- **WHEN** user submits correct email and password
- **THEN** system returns JWT access_token and refresh_token
- **AND** access_token contains user_id in payload

#### Scenario: Invalid credentials
- **WHEN** user submits wrong password
- **THEN** system returns 401 error with message "Invalid email or password"

#### Scenario: Non-existent user
- **WHEN** user submits email that doesn't exist
- **THEN** system returns 401 error with message "Invalid email or password"

---

### Requirement: JWT Authentication
All API endpoints (except /auth/*) SHALL require valid JWT token.

#### Scenario: Valid token
- **WHEN** request includes Authorization header with valid Bearer token
- **THEN** system extracts user_id from token payload
- **AND** proceeds with authenticated request

#### Scenario: Missing token
- **WHEN** request does not include Authorization header
- **THEN** system returns 401 error with message "Missing authentication token"

#### Scenario: Invalid token
- **WHEN** request includes expired or malformed token
- **THEN** system returns 401 error with message "Invalid or expired token"

---

### Requirement: Token Refresh
The system SHALL allow users to refresh access_token using refresh_token.

#### Scenario: Successful refresh
- **WHEN** user submits valid refresh_token
- **THEN** system returns new access_token

#### Scenario: Expired refresh token
- **WHEN** user submits expired refresh_token
- **THEN** system returns 401 error requiring re-login

---

### Requirement: User Logout
The system SHALL allow users to invalidate their refresh_token.

#### Scenario: Successful logout
- **WHEN** user calls logout endpoint with valid refresh_token
- **THEN** system marks token as revoked
- **AND** token can no longer be used for refresh
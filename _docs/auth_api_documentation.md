# StreamFlow Authentication API Documentation

> [!IMPORTANT]
> **Storage Infrastructure Update:** The file storage architecture has been successfully migrated to **Cloudinary**. Previous documentation referencing local `multer` saves to `/uploads/` and `sharp` image optimization should be viewed as historical context. 
> 
> - **Multer** is now strictly used as a temporary parsing step.
> - **Files** are instantly offloaded to Cloudinary (`streamflow/profiles`) and local temporary files are deleted.
> - **URLs** stored in the database are now secure `https://res.cloudinary.com/...` paths.


This document provides a comprehensive technical reference for the StreamFlow Authentication API. It is designed for frontend developers and backend contributors to understand the core authentication flows, available endpoints, middleware behavior, and internal helper utilities.

---

## 🏗️ Architecture Overview

The authentication system is built on an **Access Token + Refresh Token** strategy using JSON Web Tokens (JWT) and secure HTTP-only cookies (for access tokens). 

- **Access Tokens** (`1h` expiry) are sent securely via cookies to prevent XSS attacks.
- **Refresh Tokens** (`7d` expiry) are stored in the database against device/IP sessions and used to seamlessly rotate expired access tokens.
- **Passwords** are securely hashed using `bcrypt` (Salt Rounds: 10).
- **File Uploads** (like profile pictures) are handled seamlessly alongside text payloads using `multer` via `multipart/form-data`.

---

## 🛣️ API Endpoints

### 1. Register User
Creates a new user account, securely hashes their password, and establishes an initial session.

- **URL:** `POST /api/users/register`
- **Content-Type:** `multipart/form-data`
- **Auth Required:** No

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | Yes | Must be 2-20 characters. |
| `email` | string | Yes | Valid email address. |
| `password` | string | Yes | Min 6 chars, 1 uppercase, 1 lowercase, 1 special char. |
| `profileImg`| file | No | Optional image file for the user's avatar. |

#### Responses
- `201 Created` - Returns user object and access token.
- `400 Bad Request` - Validation error (e.g., email/username in use).

---

### 2. Login User
Authenticates a user and establishes a session. Automatically prevents concurrent identical sessions on the same device/IP.

- **URL:** `POST /api/users/login`
- **Content-Type:** `application/json`
- **Auth Required:** No

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Email or Username. |
| `password`| string | Yes | The user's password. |
| `remember`| boolean| No | If true, establishes a persistent 7-day refresh token session. |

#### Responses
- `200 OK` - Returns user object (including `lastPlayback` state) and sets `accessToken` cookie.
- `400 Bad Request` - Invalid credentials.
- `403 Forbidden` - Account deactivated.

---

### 3. Get Profile Data (Auto-Login)
Fetches the currently authenticated user's profile information. Commonly used on app startup to rehydrate frontend state.

- **URL:** `GET /api/users/profile/data`
- **Content-Type:** `application/json`
- **Auth Required:** Yes (`checkAuthenticated`)

#### Responses
- `200 OK` - Returns `name`, `username`, `phone`, `profileImg`, and `lastPlayback`.
- `401 Unauthorized` - Token missing, invalid, or expired.

---

### 4. Update Profile
Updates the authenticated user's profile information.

- **URL:** `PUT /api/users/profile`
- **Content-Type:** `multipart/form-data`
- **Auth Required:** Yes (`checkAuthenticated`)

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Full name. |
| `username` | string | No | New username. |
| `phone` | string | No | Phone number. |
| `profileImg`| file | No | New profile image to upload and replace the old one. |

#### Responses
- `200 OK` - Profile successfully updated.
- `401 Unauthorized` - Unauthenticated request.

---

### 5. Logout
Terminates the user's session and clears authentication cookies.

- **URL:** `GET /api/users/logout`
- **Auth Required:** No (Best effort)

#### Responses
- `200 OK` - Successfully logged out.

---

### 6. Forget Password
Initiates the password reset flow by generating a short-lived token and emailing it.

- **URL:** `POST /api/users/forget-password`
- **Content-Type:** `application/json`

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | The email linked to the account. |

#### Responses
- `200 OK` - Reset link sent successfully.
- `404 Not Found` - Email does not exist.

---

### 7. Reset Password
Completes the password reset flow using a valid reset token.

- **URL:** `POST /api/users/reset-password`
- **Content-Type:** `application/json`

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | Yes | The reset token received via email. |
| `newPassword`| string | Yes | The new password. |

#### Responses
- `200 OK` - Password reset successfully.
- `400 Bad Request` - Token invalid, expired, or password is same as old.

---

## 🛡️ Middlewares

> [!IMPORTANT]
> Middlewares sit between the route and the controller to enforce security boundaries.

### `checkAuthenticated` (`auth.Middleware.js`)
The core guard for protected routes. 
1. Extracts the `accessToken` from cookies or the `Authorization: Bearer` header.
2. Verifies the token payload.
3. If the token is valid, attaches the `req.user` object to the request.
4. **Seamless Rotation**: If the access token is invalid but a valid `refreshToken` cookie exists, it validates the refresh token, generates a brand new access token, attaches it to the response cookies, and allows the request to proceed uninterrupted.

### `authorizeRoles(...roles)` (`auth.Middleware.js`)
Role-based Access Control (RBAC) middleware. Must be chained *after* `checkAuthenticated`. 
- Rejects the request with `403 Forbidden` if the `req.user.role` does not match one of the permitted roles.

### `validateRequest` (`validate.js`)
Catches and formats `express-validator` errors cleanly before they reach the controller logic.

### `uploadProfileImg` (`uploadProfileImg.js`)
Multer configuration middleware that handles `multipart/form-data`. It parses the incoming request to extract the uploaded `profileImg` file, generates a unique filename, and temporarily saves the original image to disk (`uploads/profiles`).

### `optimizeImage` (`imageOptimizer.js`)
Image processing middleware powered by `sharp`. It intercepts images uploaded by Multer, compresses them, and converts them to the highly optimized `.webp` format. It automatically deletes the original unoptimized file and updates the `req.file` pointer to the new `.webp` asset before passing control to the final controller.

---

## 🛠️ Internal Helper Functions

These utilities are heavily utilized across the authentication controllers to adhere to the DRY (Don't Repeat Yourself) principle.

### `utils/jwt.js`
- `generateAccessToken(user)`: Signs a 1-hour JWT containing `{ id, username }`.
- `generateRefreshToken(user)`: Signs a 7-day JWT.
- `generateResetToken(user)`: Signs a 10-minute JWT for password recovery.
- `verifyToken(token, type)`: Securely decodes and validates a token against its respective secret (`ACCESS_SECRET`, `REFRESH_SECRET`, or `RESET_SECRET`).

### `utils/cookie.js`
Abstracts cookie management. Ensures standard security practices like `httpOnly` and `sameSite: lax` are uniformly applied.
- `setAccessTokenCookie(res, accessToken)`
- `clearAuthCookies(res)`

### `utils/hash.js`
Abstracts cryptography.
- `hashPassword(password)`: Hashes a plaintext password using `bcrypt` (10 rounds).
- `comparePassword(plaintext, hashed)`: Compares a login attempt against the database hash.

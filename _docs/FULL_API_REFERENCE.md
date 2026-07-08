# StreamFlow Full API Reference

> [!IMPORTANT]
> **Storage Infrastructure Update:** The file storage architecture has been successfully migrated to **Cloudinary**. Previous documentation referencing local `multer` saves to `/uploads/` and `sharp` image optimization should be viewed as historical context. 
> 
> - **Multer** is now strictly used as a temporary parsing step.
> - **Files** are instantly offloaded to Cloudinary (`streamflow/profiles`, `streamflow/audio`, `streamflow/covers`) and local temporary files are deleted.
> - **URLs** stored in the database are now secure `https://res.cloudinary.com/...` paths.
> - **Audio Streaming** routes now act as a redirect gateway to Cloudinary's global CDN instead of serving via local `fs.createReadStream`.


This document combines all the individual API and Utility documentation files into one master reference guide.

---

# Audio & Song API Documentation

> [!IMPORTANT]
> **Storage Infrastructure Update:** The file storage architecture has been successfully migrated to **Cloudinary**. Previous documentation referencing local `multer` saves to `/uploads/` and `sharp` image optimization should be viewed as historical context. 
> 
> - **Multer** is now strictly used as a temporary parsing step.
> - **Files** are instantly offloaded to Cloudinary (`streamflow/audio`, `streamflow/covers`) and local temporary files are deleted.
> - **URLs** stored in the database are now secure `https://res.cloudinary.com/...` paths.
> - **Audio Streaming** routes now act as a redirect gateway to Cloudinary's global CDN instead of serving via local `fs.createReadStream`.


This document outlines the API endpoints related to Audio and Song management in Stream_Flow. It covers standard CRUD operations, audio streaming via chunked transfers, and administrative actions.

## 🏗️ Architecture Overview

The Audio API handles both metadata (title, genre, singer) and static file assets (audio files and cover images).
- **File Uploads**: Processed via `multer` (`multipart/form-data`) and heavily optimized via `sharp` for cover images.
- **Audio Streaming**: Handled using HTTP 206 Partial Content headers for chunked streaming, reducing memory overhead and allowing users to skip around in a track.

Base path for user routes: `/api/audios`
Base path for admin routes: `/`

---

## 🛣️ API Endpoints

### 1. Upload Audio
Uploads a new song, including the audio file itself and its cover art.

- **URL:** `POST /api/audios/upload`
- **Content-Type:** `multipart/form-data`
- **Auth Required:** Yes (`checkAuthenticated`)

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | The song title. |
| `genre` | string | Yes | The genre of the song. |
| `singer` | string/array | Yes | Array or comma-separated string of singers. |
| `isPrivate` | boolean| No | If true, only the uploader can see/play the song. |
| `duration` | number | Yes | Duration of the audio track in seconds. |
| `audio` | file | Yes | The `.mp3` or `.wav` audio file. |
| `cover` | file | Yes | The cover art image file. |

#### Responses
- `201 Created` - Returns the newly created audio object.
- `400 Bad Request` - Missing required fields or files.

---

### 2. Get Public Audios (Paginated & Filtered)
Retrieves public songs with server-side pagination and filtering.

- **URL:** `GET /audios/` (or `GET /audios/song/`)
- **Auth Required:** No

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | The page number for pagination. |
| `limit` | number | 50 | Number of results per page. |
| `genre` | string | 'all' | Filter by a specific genre. |
| `category` | string | 'all' | Filter by category (`song`, `podcast`, `audiobook`). |
| `artist` | string | 'all' | Filter by a specific artist (exact match of singer array). |
| `album` | string | 'all' | Filter by a specific album. |

#### Responses
- `200 OK` - Returns a paginated object: `{ audios: [], totalCount, totalPages, currentPage }`.

---

### 3. Unified Global Search
Searches across Audios (Songs, Podcasts, Audiobooks) AND Public Playlists simultaneously.

- **URL:** `GET /audios/search`
- **Auth Required:** No

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | - | The search query string. |
| `page` | number | 1 | The page number for pagination. |
| `limit` | number | 50 | Number of results per page. |
| `genre` | string | 'all' | Filter audios by a specific genre. |
| `category` | string | 'all' | Filter audios by category. |
| `artist` | string | 'all' | Filter audios by a specific artist. |
| `album` | string | 'all' | Filter audios by a specific album. |

#### Responses
- `200 OK` - Returns `{ audios: [], totalAudios, playlists: [], totalPlaylists, users: [], totalUsers, albums: [], totalAlbums, currentPage, totalPages }`. Note: `users` only returns accounts with the `artist` role.

---

### 4. Category-Specific Endpoints
Convenience endpoints to fetch or search entirely within a specific category.

- **URL:** `GET /audios/category/:category`
- **URL:** `GET /audios/category/:category/search?q=...`
- **Auth Required:** No

#### Responses
- Maps identically to the paginated `Get Public Audios` and `Unified Global Search` payloads.

### 5. Get My Audios
Fetches the library of songs uploaded by the currently authenticated user.

- **URL:** `GET /api/audios/mine`
- **Auth Required:** Yes (`checkAuthenticated`)

#### Responses
- `200 OK` - Returns an array of user's audio objects.

---

### 6. Stream Audio
Streams an audio file back to the client using chunked data transfer (`206 Partial Content`), supporting seeking/scrubbing in audio players.

- **URL:** `GET /api/audios/stream/:id`
- **Auth Required:** No

#### Responses
- `206 Partial Content` - Binary audio stream.
- `404 Not Found` - Audio document or physical file missing.
- `416 Range Not Satisfiable` - Requested byte range exceeds file size.

---

### 7. Update Audio
Edits the metadata or cover art of an existing song. Users can only update their own uploads.

- **URL:** `PUT /api/audios/:id`
- **Content-Type:** `multipart/form-data`
- **Auth Required:** Yes (`checkAuthenticated`, `validateObjectId`)

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | No | The new song title. |
| `genre` | string | No | The new genre. |
| `singer` | string | No | JSON stringified array of singers. |
| `isPrivate` | boolean| No | Visibility toggle. |
| `cover` | file | No | A new cover art image to replace the old one. |

#### Responses
- `200 OK` - Audio updated successfully.
- `403 Forbidden` - User is not the owner of the audio.

---

### 8. Delete Audio
Permanently deletes an audio file from the platform. Users can only delete their own uploads.

- **URL:** `DELETE /api/audios/:id`
- **Auth Required:** Yes (`checkAuthenticated`, `validateObjectId`)

#### Responses
- `200 OK` - Audio deleted successfully.
- `403 Forbidden` - Attempting to delete another user's audio.

---

## 👑 Admin Endpoints

### 7. Admin: Get ALL Audios
Fetches every audio file in the database regardless of visibility/privacy.

- **URL:** `GET /admin/audios`
- **Auth Required:** Yes (`checkAuthenticated`, `authorizeRoles("admin")`)

#### Responses
- `200 OK` - Returns an array of all audio objects.

### 8. Admin: Delete Any Audio
Allows an administrator to forcefully delete any audio track.

- **URL:** `DELETE /admin/audio/:id`
- **Auth Required:** Yes (`checkAuthenticated`, `authorizeRoles("admin")`, `validateObjectId`)

#### Responses
- `200 OK` - Audio deleted by admin.

---

## 🛡️ Middlewares

The audio endpoints utilize several layers of middleware to ensure security, robust file handling, and media optimization.

### `checkAuthenticated` (`auth.Middleware.js`)
Guard middleware that extracts and validates the user's `accessToken` (or transparently rotates the `refreshToken`). Attaches `req.user` to authorized requests.

### `authorizeRoles("admin")` (`auth.Middleware.js`)
Strict RBAC guard used exclusively on the admin routes to prevent standard users from fetching the global library or deleting arbitrary files.

### `validateObjectId` (`validateObjectId.js`)
Ensures that the `:id` parameter provided in the URL is a structurally valid MongoDB `ObjectId` before querying the database, preventing fatal casting errors.

### `upload.fields` (`config/multer.js`)
A `multer` instance configured to handle multi-file uploads (e.g., separating the `audio` file and the `cover` image). It enforces strict MIME type filtering, rejecting non-audio files for the audio field and non-image files for the cover field.

### `optimizeImage` (`imageOptimizer.js`)
Image processing middleware running `sharp`. It intercepts the `cover` image saved by `multer`, converts it to the highly-compressed `.webp` format, deletes the original uploaded image file, and seamlessly updates `req.file` with the new WebP asset details before handing off to the controller.

---

## ⚙️ Core Implementation Logic

### Upload & Save Logic (`uploadAudio`)
The audio upload controller handles several complex data formatting and validation steps before saving to the database:
1. **Singer Parsing:** The frontend can send the `singer` field as a string or an array. The controller standardizes this by flattening arrays and joining them into a comma-separated string before saving.
2. **Path Construction:** Unlike typical setups, the `audioUrl` and `coverImageUrl` fields are constructed using the absolute server path (`${__dirname}/../uploads/audio/...`). This ensures the `fs` module can locate the files easily during streaming.
3. **Database Write:** A new `Audio` document is instantiated and linked to the `req.user._id` (the uploader). The audio metadata, including the parsed `duration`, is written alongside the file paths.

### Streaming Logic (`streamAudio`)
To prevent the server from loading massive `.mp3` or `.wav` files into RAM, the streaming endpoint implements a highly optimized chunked-transfer mechanism using HTTP `Range` headers:
1. **File Verification:** The controller uses `fs.existsSync` to ensure the audio file hasn't been deleted from the file system.
2. **Range Header Parsing:** When a modern HTML5 audio player requests a song, it sends a `Range` header (e.g., `bytes=1000-2000`). The controller parses this to determine exactly which chunk of the file the user is trying to buffer.
3. **Chunk Calculation:** It calculates the start and end bytes, ensuring it doesn't exceed the total file size (`fs.statSync(filePath).size`). If the requested range is invalid, it returns `416 Range Not Satisfiable`.
4. **Pipe Streaming:** It sends a `206 Partial Content` response header indicating chunked streaming, followed by a dynamically generated Node.js readable stream (`fs.createReadStream`) that pipes only the requested byte chunk directly into the HTTP response buffer (`res`). If no range is requested, it defaults to a standard `200 OK` full-file stream.


---

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


---

# Playlist API Documentation

Base URL: `/api/playlists`

All endpoints require authentication (Cookie or Bearer Token) unless specified otherwise.

---

## 1. Get User Playlists
**Endpoint:** `GET /me`  
**Description:** Retrieves all playlists owned by the authenticated user.  
**Access:** Authenticated Users Only

### Response (200 OK)
```json
{
  "success": true,
  "playlists": [
    {
      "_id": "6a4d2affe767ae5eb58776d6",
      "name": "My Favourites",
      "description": "My favorite songs",
      "isPublic": false,
      "cover": "https://example.com/cover.jpg",
      "owner": "60a4c...",
      "audio": [
        {
          "_id": "6a4d1d94851c292ee1218e08",
          "title": "Song Title",
          ...
        }
      ],
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

## 2. Create Playlist
**Endpoint:** `POST /`  
**Description:** Creates a new playlist for the authenticated user.  
**Access:** Authenticated Users Only

### Request Body
```json
{
  "name": "Workout Mix",              // Required: string
  "description": "High energy songs", // Optional: string
  "isPublic": true,                   // Optional: boolean (default: false)
  "audio": ["60a4c..."]               // Optional: array of song IDs
}
```

### Response (201 Created)
```json
{
  "success": true,
  "playlist": {
    "_id": "6a4d2affe767ae5eb58776d6",
    "name": "Workout Mix",
    "description": "High energy songs",
    "isPublic": true,
    "owner": "60a4c...",
    "audio": ["60a4c..."]
  }
}
```

---

## 3. Get Playlist By ID
**Endpoint:** `GET /:id`  
**Description:** Retrieves a specific playlist by its ID. Populates the `audio` and `owner` fields.  
**Access:** 
- Owner: Always accessible
- Other Users / Guests: Only accessible if `isPublic` is `true`.

### Parameters
- `id` (URL param): The ID of the playlist to retrieve.

### Response (200 OK)
```json
{
  "success": true,
  "playlist": {
    "_id": "6a4d2affe767ae5eb58776d6",
    "name": "Workout Mix",
    "isPublic": true,
    "owner": {
      "_id": "60a4c...",
      "name": "John Doe",
      "username": "johndoe",
      "profileImg": "..."
    },
    "audio": [
      {
        "_id": "6a4d1d94851c292ee1218e08",
        "title": "Song Title",
        ...
      }
    ]
  }
}
```

### Error Responses
- **403 Forbidden**: If the playlist is private (`isPublic: false`) and the requesting user is not the owner.
- **404 Not Found**: If the playlist ID does not exist.

---

## 4. Update Playlist
**Endpoint:** `PUT /:id`  
**Description:** Updates an existing playlist. Only the owner can update it.  
**Access:** Authenticated Users (Owner Only)

### Parameters
- `id` (URL param): The ID of the playlist to update.

### Request Body (All fields optional)
```json
{
  "name": "New Name",
  "description": "New description",
  "isPublic": false,
  "cover": "https://new-cover.jpg"
}
```

### Response (200 OK)
Returns the updated, fully populated playlist object.
```json
{
  "success": true,
  "playlist": { ... }
}
```

---

## 5. Delete Playlist
**Endpoint:** `DELETE /:id`  
**Description:** Deletes a specific playlist. Only the owner can delete it.  
**Access:** Authenticated Users (Owner Only)

### Parameters
- `id` (URL param): The ID of the playlist to delete.

### Response (200 OK)
```json
{
  "success": true,
  "message": "Playlist deleted successfully"
}
```

---

## 6. Add Song To Playlist
**Endpoint:** `POST /:id/songs`  
**Description:** Adds a single song to a playlist. Only the owner can add songs.  
**Access:** Authenticated Users (Owner Only)

### Parameters
- `id` (URL param): The ID of the playlist.

### Request Body
```json
{
  "songId": "60a4c..." // Required: string
}
```

### Response (200 OK)
Returns the updated, fully populated playlist object.
```json
{
  "success": true,
  "playlist": { ... }
}
```

### Error Responses
- **400 Bad Request**: If the song is already in the playlist.
- **404 Not Found**: If the song or playlist does not exist.

---

## 7. Remove Song From Playlist
**Endpoint:** `DELETE /:id/songs/:songId`  
**Description:** Removes a single song from a playlist. Only the owner can remove songs.  
**Access:** Authenticated Users (Owner Only)

### Parameters
- `id` (URL param): The ID of the playlist.
- `songId` (URL param): The ID of the song to remove.

### Response (200 OK)
Returns the updated, fully populated playlist object.
```json
{
  "success": true,
  "playlist": { ... }
}
```


---

# User Profile API Documentation

> [!IMPORTANT]
> **Storage Infrastructure Update:** The file storage architecture has been successfully migrated to **Cloudinary**. Previous documentation referencing local `multer` saves to `/uploads/` and `sharp` image optimization should be viewed as historical context. 
> 
> - **Multer** is now strictly used as a temporary parsing step.
> - **Files** are instantly offloaded to Cloudinary (`streamflow/profiles`) and local temporary files are deleted.
> - **URLs** stored in the database are now secure `https://res.cloudinary.com/...` paths.

This document outlines the API endpoints related to User Profile management in Stream_Flow. It adheres to RESTful best practices and includes details on authentication, expected request formats, and response schemas.

## Overview

The User Profile API allows authenticated users to fetch and update their profile information. It also provides public-facing profile retrieval for a specific username.

Base path: `/api/users`

---

## 1. Get Current User Profile Data

Retrieves the profile information for the currently authenticated user.

**Endpoint:** `GET /profile/data`
**Authentication:** Required (Bearer Token / Cookie via `checkAuthenticated` middleware)

### Response

**Status Code:** `200 OK`

```json
{
  "message": "User profile fetched successfully.",
  "user": {
    "name": "John Doe",
    "username": "johndoe123",
    "phone": "+1234567890",
    "profileImg": "/uploads/profiles/filename.jpg",
    "lastPlayback": {
      "songId": {
        "_id": "60d5ecb8b392...",
        "title": "Song Title",
        "artist": {
          "username": "artistname",
          "profileImg": "/uploads/profiles/artist.jpg"
        }
      },
      "currentTime": 105.5
    }
  }
}
```

**Status Code:** `401 Unauthorized`

```json
{
  "message": "Not authenticated!"
}
```

---

## 2. Update Current User Profile

Updates the profile information for the currently authenticated user. Supports `multipart/form-data` for profile image uploads.

**Endpoint:** `PUT /profile`
**Authentication:** Required
**Content-Type:** `multipart/form-data`

### Request Parameters (Form Data)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | No | The updated full name of the user. |
| `username` | String | No | The updated unique username. |
| `phone` | String | No | The updated phone number. |
| `profileImg`| File (Image) | No | A valid image file for the user's avatar. |

### Response

**Status Code:** `200 OK`

```json
{
  "message": "Profile updated!",
  "user": {
    "name": "John Doe",
    "username": "johndoe_updated",
    "phone": "+1234567890",
    "profileImg": "/uploads/profiles/new-filename.jpg",
    "lastPlayback": {
      "songId": "60d5ecb8b392...",
      "currentTime": 105.5
    }
  }
}
```

**Status Code:** `401 Unauthorized`

```json
{
  "message": "Not authenticated"
}
```

---

## 3. Get User by Username (Public Profile)

Retrieves a user's public profile data based on their username.

**Endpoint:** `GET /user/:username`
**Authentication:** Required (to view profiles)

### URL Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `username` | String | Yes | The username of the requested profile. |

### Response

**Status Code:** `200 OK`

```json
{
  "user": {
    "_id": "60d5ecb8b392...",
    "name": "Jane Doe",
    "username": "janedoe",
    "phone": "+1987654321",
    "profileImg": "/uploads/profiles/jane.jpg"
    // ...other user fields
  },
  "isOwner": false
}
```
*Note: `isOwner` is a boolean flag indicating if the requested username matches the currently authenticated user.*

**Status Code:** `400 Bad Request`

```json
{
  "message": "username is required!"
}
```

**Status Code:** `404 Not Found`

```json
{
  "message": "User not found!"
}
```

---

## 4. Sync Playback State

Updates the current user's playback state so it can be resumed seamlessly across different devices.

**Endpoint:** `PUT /profile/playback`
**Authentication:** Required

### Request Body (JSON)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `songId` | String | Yes | The ID of the currently playing Audio document. |
| `currentTime` | Number | Yes | The timestamp (in seconds) the user paused or is currently at. |

```json
{
  "songId": "60d5ecb8b392...",
  "currentTime": 125.4
}
```

### Response

**Status Code:** `200 OK`

```json
{
  "message": "Playback state synced"
}
```

**Status Code:** `401 Unauthorized`

```json
{
  "message": "Not authenticated!"
}
```

---

## 3. Get Public Profile

Retrieves the public profile information and public uploaded audios for a specific user by their username.

**Endpoint:** `GET /public/:username`
**Authentication:** Optional

### Response

**Status Code:** `200 OK`

```json
{
  "user": {
    "_id": "60d5ecb8b392...",
    "name": "David Guetta",
    "username": "davidguetta",
    "profileImg": "https://res.cloudinary.com/...",
    "isActive": true
  },
  "audios": [
    {
      "_id": "60d5ecb8b392...",
      "title": "Titanium",
      "genre": "Electronic",
      "singer": "David Guetta",
      "audioUrl": "https://res.cloudinary.com/...",
      "coverImageUrl": "https://res.cloudinary.com/..."
    }
  ]
}
```

**Status Code:** `404 Not Found`
- When the user does not exist or is inactive.

---

## 🛡️ Middlewares

The profile endpoints utilize several layers of middleware to ensure security and efficient file handling before reaching the controller.

### `checkAuthenticated` (`auth.Middleware.js`)
Guard middleware that validates the user's `accessToken`. If valid, it attaches the user data to `req.user`. If expired but a valid `refreshToken` exists, it seamlessly rotates the token behind the scenes without interrupting the request.

### `uploadProfileImg` (`uploadProfileImg.js`)
A `multer` instance configured specifically for handling `multipart/form-data` uploads. It intercepts incoming image files, enforces file-type validation (only allowing images), and temporarily stores the original file in `uploads/profiles`.

### `optimizeImage` (`imageOptimizer.js`)
An advanced image processing middleware running `sharp`. It takes the file saved by `multer`, converts it to the highly-compressed `.webp` format, deletes the original uploaded file to save server space, and updates `req.file` with the new WebP asset details before handing off to the controller.

---

## Security & Implementation Notes

- **File Uploads**: The `PUT /profile` endpoint utilizes `multer` (`upload.single('profileImg')`) for handling file uploads. Ensure the frontend sets the correct content-type header (`multipart/form-data`) when attaching files.
- **Image Fallback**: If a user has no profile image, the backend will return a default image path: `/assets/images/default-profile.jpg`.
- **Validation**: While basic validation exists in the controller (e.g., trimming strings), ensure the frontend handles input validation (length, format) before submitting the request to reduce unnecessary backend load.


---

# Settings & Account Management API Documentation

This document outlines the API endpoints related to User Settings and Account Management in Stream_Flow. It serves as a centralized reference for profile updates, password resets, and account synchronization.

---

## 1. Update Profile Information

Allows an authenticated user to update their core profile details and upload a new profile avatar. The endpoint supports `multipart/form-data` to seamlessly handle both text fields and the image payload.

**Endpoint:** `PUT /api/users/profile`
**Authentication:** Required (Bearer Token / Cookie via `checkAuthenticated` middleware)
**Content-Type:** `multipart/form-data`

### Request Parameters

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | No | The updated full name of the user. |
| `username` | String | No | The updated unique username. |
| `phone` | String | No | The updated phone number. |
| `profileImg`| File | No | A valid image file for the user's avatar. Will be processed by `imageOptimizer` middleware. |

### Response

**Status Code:** `200 OK`
```json
{
  "message": "Profile updated!",
  "user": {
    "name": "Jane Doe",
    "username": "janedoe_new",
    "phone": "+1987654321",
    "profileImg": "/uploads/profiles/1628374981-avatar.jpg",
    "lastPlayback": {
      "songId": "60d5ecb8b392...",
      "currentTime": 105.5
    }
  }
}
```

**Status Code:** `401 Unauthorized`
```json
{
  "message": "Not authenticated"
}
```

---

## 2. Sync Playback State (Cross-Device Settings)

Updates the user's last played song and timestamp, allowing them to resume listening seamlessly when they log in from a different device.

**Endpoint:** `PUT /api/users/profile/playback`
**Authentication:** Required
**Content-Type:** `application/json`

### Request Body

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `songId` | String (ObjectId) | No | The `_id` of the currently playing song. Send `null` to clear. |
| `currentTime`| Number | No | The exact timestamp (in seconds) the user paused/closed the player. |

### Response

**Status Code:** `200 OK`
```json
{
  "message": "Playback state synced"
}
```

---

## 3. Forget Password

Initiates the password reset flow. Generates a secure, short-lived reset token and sends it to the user's registered email address.

**Endpoint:** `POST /api/users/forget-password`
**Authentication:** None Required
**Content-Type:** `application/json`

### Request Body

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | String | Yes | The email address linked to the user's account. |

### Response

**Status Code:** `200 OK`
```json
{
  "message": "Reset link sent to email: user@example.com",
  "result": 1
}
```

**Status Code:** `404 Not Found`
```json
{
  "message": "User Not Found or Invalid Email"
}
```

---

## 4. Reset Password

Completes the password reset process using the token provided via email. Verifies the token and securely hashes the new password before updating the database.

**Endpoint:** `POST /api/users/reset-password`
**Authentication:** None Required
**Content-Type:** `application/json`

### Request Body

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `token` | String | Yes | The unique reset token sent to the user's email. |
| `newPassword`| String | Yes | The new password. Must meet complexity requirements (Min 6 chars, 1 uppercase, 1 lowercase, 1 special char). |

### Response

**Status Code:** `200 OK`
```json
{
  "message": "Password reset successfully!",
  "result": 1
}
```

**Status Code:** `400 Bad Request`
```json
{
  "message": "Invalid or expired token!"
}
```
*(Also returns `400` if `Token and new password are required!` or `New password must be different from the old password!`)*

---

## 5. Change Password (In-App)

Allows an authenticated user to change their password by providing their current password.

**Endpoint:** `PUT /api/users/change-password`
**Authentication:** Required (Bearer Token / Cookie via `checkAuthenticated` middleware)
**Content-Type:** `application/json`

### Request Body

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `oldPassword` | String | Yes | The user's current password. |
| `newPassword`| String | Yes | The new password. |

### Response

**Status Code:** `200 OK`
```json
{
  "message": "Password changed successfully."
}
```

**Status Code:** `400 Bad Request`
```json
{
  "message": "Incorrect current password."
}
```

---

## 🛡️ Internal Middlewares Used in Settings

- **`checkAuthenticated`**: Intercepts requests to `/profile` and `/profile/playback` to ensure the user has a valid access token in their cookies.
- **`uploadProfileImg` (`multer`)**: Specifically configured to handle incoming `profileImg` files, placing them temporarily in memory or a specific directory.
- **`optimizeImage`**: A powerful middleware that intercepts the uploaded profile image, resizes/compresses it, and ensures it's saved in a web-optimized format to save bandwidth before passing it to the controller.


---


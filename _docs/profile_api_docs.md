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

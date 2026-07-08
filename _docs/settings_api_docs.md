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

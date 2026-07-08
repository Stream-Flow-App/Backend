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

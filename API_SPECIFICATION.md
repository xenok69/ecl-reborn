# Admin Submit API Specification

This document outlines the required backend API endpoints for the admin level submission functionality.

## Required Endpoints

### 1. Video Upload Endpoint
**POST** `/api/upload-video`

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Body:**
- `videoFile`: File (video file to upload)
- `levelName`: String (level name for file naming)

**Response Success (200):**
```json
{
  "success": true,
  "filePath": "./assets/lvl_videos/1640123456789_level_video.mp4",
  "message": "Video uploaded successfully"
}
```

**Response Error (400/500):**
```json
{
  "success": false,
  "message": "Upload failed: File too large"
}
```

### 2. Level Submission Endpoint
**POST** `/api/submit-level`

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Body:**
```json
{
  "action": "add_level",
  "levelData": {
    "placement": 1,
    "levelName": "Example Level",
    "creator": "Creator Name",
    "verifier": "Verifier Name",
    "id": "123456789",
    "youtubeVideoId": "dQw4w9WgXcQ",
    "tags": {
      "difficulty": "Insane",
      "gamemode": "Mixed",
      "decorationStyle": "Effect",
      "extraTags": ["Epilepsy"]
    },
    "addedDate": "2025-01-15"
  },
  "updatedData": {
    "metadata": { ... },
    "levels": [ ... ]
  },
  "targetBranch": "staging",
  "commitMessage": "Add level: Example Level at placement #1"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Level submitted to staging branch",
  "commitHash": "abc123def456",
  "stagingUrl": "https://github.com/user/repo/tree/staging"
}
```

**Response Error (400/403/500):**
```json
{
  "success": false,
  "message": "Permission denied: Admin access required"
}
```

## Implementation Requirements

### File Upload Handler
1. **Validate file type:** MP4, WebM, OGG, MOV only
2. **Validate file size:** Max 100MB
3. **Generate unique filename:** `${timestamp}_${originalName}`
4. **Store in:** `/assets/lvl_videos/` directory
5. **Return file path** for database storage

### Git Integration
1. **Create staging branch** if it doesn't exist
2. **Update levels.json** with new data
3. **Commit changes** with descriptive message
4. **Push to staging branch** (NOT main/production)
5. **Return commit hash** for tracking

### Security Requirements
1. **JWT token validation** for admin access
2. **Rate limiting** to prevent spam
3. **Input validation** and sanitization
4. **File type verification** (not just extension)
5. **CORS headers** for frontend integration

### Error Handling
- **File upload errors:** Size, type, storage issues
- **Git operation errors:** Branch creation, commit failures
- **Authentication errors:** Invalid/expired tokens
- **Validation errors:** Missing fields, invalid data

## Frontend Integration

The admin form will:
1. **Upload video file** first (if provided)
2. **Submit level data** with file path
3. **Handle loading states** during upload/submission
4. **Display success/error messages** to admin
5. **Reset form** on successful submission

## Testing Considerations

1. **Mock endpoints** for development
2. **Staging branch isolation** from production
3. **File cleanup** for failed uploads
4. **Rollback capability** for failed commits
5. **Logging** for debugging and audit trails
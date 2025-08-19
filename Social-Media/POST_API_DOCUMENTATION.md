# Post API Documentation

This document describes the CRUD operations and additional features available for posts in the SocialV2 API.

## Base URL
```
/api/posts
```

## Authentication
All endpoints require authentication. Include the Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Create Post
**POST** `/api/posts`

Create a new post.

**Request Body:**
```json
{
  "content": "This is my post content",
  "media": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
  "thumbnail": "https://example.com/thumbnail.jpg",
  "mood": "happy",
  "tags": ["social", "life"],
  "location": "New York, NY",
  "privacy": "public",
  "postType": "text",
  "expiresAt": "2024-12-31T23:59:59.000Z"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Post created successfully",
  "post": {
    "_id": "post_id",
    "user": {
      "_id": "user_id",
      "username": "john_doe",
      "profileImage": "https://example.com/profile.jpg"
    },
    "content": "This is my post content",
    "media": ["https://example.com/image1.jpg"],
    "privacy": "public",
    "postType": "text",
    "likesCount": 0,
    "commentsCount": 0,
    "views": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Get All Posts
**GET** `/api/posts`

Get all posts with pagination and filters.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Posts per page (default: 10)
- `privacy` (optional): Filter by privacy ("public", "friends", "private")
- `postType` (optional): Filter by post type ("text", "image", "video", "audio", "poll", "link")
- `mood` (optional): Filter by mood

**Response:**
```json
{
  "status": "success",
  "posts": [
    {
      "_id": "post_id",
      "user": {
        "_id": "user_id",
        "username": "john_doe",
        "profileImage": "https://example.com/profile.jpg"
      },
      "content": "Post content",
      "privacy": "public",
      "likesCount": 5,
      "commentsCount": 2,
      "views": 100,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalPosts": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 3. Get Post by ID
**GET** `/api/posts/:postId`

Get a specific post by its ID.

**Response:**
```json
{
  "status": "success",
  "post": {
    "_id": "post_id",
    "user": {
      "_id": "user_id",
      "username": "john_doe",
      "profileImage": "https://example.com/profile.jpg"
    },
    "content": "Post content",
    "media": ["https://example.com/image.jpg"],
    "privacy": "public",
    "likesCount": 5,
    "commentsCount": 2,
    "views": 101,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. Get My Posts
**GET** `/api/posts/my/posts`

Get all posts created by the authenticated user.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Posts per page (default: 10)

**Response:**
```json
{
  "status": "success",
  "posts": [
    {
      "_id": "post_id",
      "user": {
        "_id": "user_id",
        "username": "john_doe",
        "profileImage": "https://example.com/profile.jpg"
      },
      "content": "My post content",
      "privacy": "public",
      "likesCount": 3,
      "commentsCount": 1,
      "views": 50,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalPosts": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 5. Get Posts by User
**GET** `/api/posts/user/:userId`

Get all posts by a specific user.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Posts per page (default: 10)

**Response:**
```json
{
  "status": "success",
  "posts": [
    {
      "_id": "post_id",
      "user": {
        "_id": "user_id",
        "username": "jane_doe",
        "profileImage": "https://example.com/profile.jpg"
      },
      "content": "User's post content",
      "privacy": "public",
      "likesCount": 10,
      "commentsCount": 5,
      "views": 200,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalPosts": 25,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 6. Update Post
**PATCH** `/api/posts/:postId`

Update an existing post (only by the post owner).

**Request Body:**
```json
{
  "content": "Updated post content",
  "privacy": "friends",
  "tags": ["updated", "tags"]
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Post updated successfully",
  "post": {
    "_id": "post_id",
    "user": {
      "_id": "user_id",
      "username": "john_doe",
      "profileImage": "https://example.com/profile.jpg"
    },
    "content": "Updated post content",
    "privacy": "friends",
    "tags": ["updated", "tags"],
    "updatedAt": "2024-01-01T01:00:00.000Z"
  }
}
```

### 7. Delete Post
**DELETE** `/api/posts/:postId`

Delete a post (only by the post owner).

**Response:**
```json
{
  "status": "success",
  "message": "Post deleted successfully"
}
```

### 8. Like Post
**POST** `/api/posts/:postId/like`

Like a post.

**Response:**
```json
{
  "status": "success",
  "message": "Post liked successfully"
}
```

### 9. Unlike Post
**DELETE** `/api/posts/:postId/like`

Unlike a post.

**Response:**
```json
{
  "status": "success",
  "message": "Post unliked successfully"
}
```

### 10. Share Post
**POST** `/api/posts/:postId/share`

Share an existing post.

**Request Body:**
```json
{
  "content": "Check out this amazing post!",
  "privacy": "public"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Post shared successfully",
  "post": {
    "_id": "shared_post_id",
    "user": {
      "_id": "user_id",
      "username": "john_doe",
      "profileImage": "https://example.com/profile.jpg"
    },
    "content": "Check out this amazing post!",
    "sharedPostId": {
      "_id": "original_post_id",
      "content": "Original post content",
      "user": {
        "_id": "original_user_id",
        "username": "original_user"
      }
    },
    "privacy": "public",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Error Responses

### 404 - Post Not Found
```json
{
  "status": "failure",
  "error": "Post not found"
}
```

### 403 - Access Denied
```json
{
  "status": "failure",
  "error": "Access denied"
}
```

### 400 - Bad Request
```json
{
  "status": "failure",
  "error": "You have already liked this post"
}
```

### 401 - Unauthorized
```json
{
  "status": "failure",
  "error": "Invalid token"
}
```

## Post Types
- `text`: Text-only posts
- `image`: Posts with images
- `video`: Posts with videos
- `audio`: Posts with audio files
- `poll`: Poll posts
- `link`: Posts with external links

## Privacy Settings
- `public`: Visible to everyone
- `friends`: Visible to friends only
- `private`: Visible to the post owner only

## Features
- **Pagination**: All list endpoints support pagination
- **Filtering**: Filter posts by privacy, type, and mood
- **Privacy Control**: Users can control who sees their posts
- **Like System**: Users can like and unlike posts
- **Share System**: Users can share posts with their own content
- **View Tracking**: Post views are automatically tracked
- **Media Support**: Posts can include images, videos, and other media
- **Tags**: Posts can be tagged for better organization
- **Expiration**: Posts can have expiration dates
- **Mood Tracking**: Posts can include mood indicators 
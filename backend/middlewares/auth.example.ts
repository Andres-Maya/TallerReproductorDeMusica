/**
 * Example usage of authentication middleware
 * 
 * This file demonstrates how to use requireAuth and optionalAuth
 * middleware in Express routes.
 */

import express from 'express';
import { requireAuth, optionalAuth, AuthRequest } from './auth';

const router = express.Router();

// Example 1: Protected route - requires authentication
router.get('/playlists', requireAuth, (req: AuthRequest, res) => {
  // req.user is guaranteed to exist here
  const userId = req.user!.userId;
  
  res.json({
    message: `Fetching playlists for user ${userId}`,
    user: req.user,
  });
});

// Example 2: Optional authentication - works with or without auth
router.get('/songs', optionalAuth, (req: AuthRequest, res) => {
  if (req.user) {
    // User is authenticated - can provide personalized results
    res.json({
      message: `Fetching songs for authenticated user ${req.user.username}`,
      personalized: true,
    });
  } else {
    // User is not authenticated - provide public results
    res.json({
      message: 'Fetching public songs',
      personalized: false,
    });
  }
});

// Example 3: Multiple middleware - auth + custom validation
router.post('/playlists', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { name } = req.body;
  
  res.json({
    message: `Creating playlist "${name}" for user ${userId}`,
  });
});

// Example 4: Accessing user info in controller
router.delete('/playlists/:id', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const playlistId = req.params.id;
  
  // In a real implementation, you would:
  // 1. Fetch the playlist from database
  // 2. Check if playlist.userId === userId
  // 3. Return 403 if ownership check fails
  // 4. Delete the playlist if ownership check passes
  
  res.json({
    message: `User ${userId} attempting to delete playlist ${playlistId}`,
  });
});

export default router;

import { requireAuth } from '@clerk/express';
import { createClerkClient } from '@clerk/backend';
import User from '../models/User.js';

const clerk = createClerkClient({ 
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY
});

/**
 * protect — verify the Clerk JWT on every protected route.
 *
 * Uses @clerk/express requireAuth for optimized, cached token verification.
 * 
 * On first call for a new Clerk user:
 *   → fetches their profile from Clerk API
 *   → creates a matching MongoDB User document (lazy sync)
 *
 * On subsequent calls:
 *   → finds existing User by clerkId
 */
export const protect = [
  requireAuth(), // This caches JWKs automatically and is extremely fast
  async (req, res, next) => {
    try {
      const clerkId = req.auth.userId;

      // Try to find matching MongoDB user
      let user = await User.findOne({ clerkId });

      if (!user) {
        // First time this Clerk user hits our API — fetch info and create profile
        const clerkUser = await clerk.users.getUser(clerkId);

        const email = clerkUser.emailAddresses?.[0]?.emailAddress || '';
        const firstName = clerkUser.firstName || '';
        const lastName = clerkUser.lastName || '';
        const name = `${firstName} ${lastName}`.trim() || email.split('@')[0] || 'User';
        const avatar = clerkUser.imageUrl || '';

        user = await User.findOneAndUpdate(
          { clerkId },
          { $setOnInsert: { clerkId, name, email, avatar } },
          { upsert: true, new: true }
        );
      }

      req.user = user;
      next();
    } catch (err) {
      console.error('User sync error:', err.message);
      return res.status(500).json({ message: 'Failed to sync user profile' });
    }
  }
];

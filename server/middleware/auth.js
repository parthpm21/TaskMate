import { createClerkClient, verifyToken } from '@clerk/backend';
import User from '../models/User.js';

if (!process.env.CLERK_SECRET_KEY) {
  console.warn('⚠️  CLERK_SECRET_KEY is not set — auth middleware will fail!');
}

const clerk = createClerkClient({ 
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY
});

/**
 * protect — verify the Clerk JWT manually on every protected route.
 *
 * Extracts the Bearer token from the Authorization header,
 * verifies it via Clerk's backend SDK, then syncs/finds the
 * matching MongoDB user.
 */
export const protect = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No auth token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Invalid auth token format' });
    }

    // Verify the JWT using Clerk's backend SDK
    let payload;
    try {
      payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    } catch (verifyErr) {
      console.error('Token verification failed:', verifyErr.message);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const clerkId = payload.sub;
    if (!clerkId) {
      return res.status(401).json({ message: 'Token missing user ID' });
    }

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
    req.auth = { userId: clerkId };
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message, err.stack);
    return res.status(500).json({ message: 'Authentication failed' });
  }
};

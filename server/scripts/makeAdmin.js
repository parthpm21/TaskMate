import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const email = 'b230666@skit.ac.in';

await mongoose.connect(process.env.MONGO_URI);

const user = await User.findOneAndUpdate(
  { email },
  { $set: { isAdmin: true } },
  { new: true }
);

if (user) {
  console.log(`✅ "${user.name}" (${user.email}) is now an admin!`);
} else {
  console.log('❌ User not found. Check the email.');
}

await mongoose.disconnect();
process.exit(0);

import mongoose from 'mongoose';
import { User } from '../models/user.model';
import { env } from '../config/env';

async function seedAdmin() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update all users without a role to be admins
    const result = await User.updateMany(
      { role: { $exists: false } },
      { $set: { role: 'admin' } }
    );

    console.log(`Updated ${result.modifiedCount} user(s) to admin role`);

    // Also update any null roles
    const nullResult = await User.updateMany(
      { role: null },
      { $set: { role: 'admin' } }
    );

    console.log(`Updated ${nullResult.modifiedCount} user(s) with null role to admin`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();

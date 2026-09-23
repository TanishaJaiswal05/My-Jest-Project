import mongoose from 'mongoose';
import Booking from '../models/Booking';
import Salon from '../models/Salon';
import Service from '../models/Service';
import User from '../models/User';

// Tests use a separate database so they never delete development data.
const testUri = process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017/salon-test-db';

export const connectToTestDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(testUri);
  }
};

export const clearDatabase = async (): Promise<void> => {
  // Clearing collections gives every test a predictable starting point.
  await Promise.all([
    Booking.deleteMany({}),
    Service.deleteMany({}),
    Salon.deleteMany({}),
    User.deleteMany({})
  ]);
};

export const closeTestDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
};

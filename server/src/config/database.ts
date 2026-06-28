import mongoose from 'mongoose';
import env from './environment';
import logger from './logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    await mongoose.connect(env.MONGO_URI);
  } catch (error) {
    logger.error(`Initial MongoDB connection error: ${error}`);
    process.exit(1);
  }
};

export default connectDatabase;

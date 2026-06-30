import app from './app';
import env from './config/environment';
import connectDatabase from './config/database';
import logger from './config/logger';

const startServer = async () => {
  await connectDatabase();

  // Auto-verify all existing users and seed doctors if missing on startup
  try {
    const { User } = await import('./models/user.model');
    const { Doctor } = await import('./models/appointment.model');
    
    await User.updateMany({}, { $set: { isVerified: true } });
    
    const docEmail = 'robert.chen@medimind.ai';
    let docUser1 = await User.findOne({ email: docEmail });
    if (!docUser1) {
      docUser1 = new User({
        email: docEmail,
        password: 'Password123!',
        role: 'DOCTOR',
        isVerified: true,
      });
      await docUser1.save();
      
      const doctor1 = new Doctor({
        userId: docUser1._id,
        firstName: 'Robert',
        lastName: 'Chen',
        specialty: 'Cardiologist',
        npi: '1092837465',
        availabilitySlots: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
          { dayOfWeek: 3, startTime: '13:00', endTime: '17:00' },
        ],
      });
      await doctor1.save();
    }

    const docEmail2 = 'sarah.jenkins@medimind.ai';
    let docUser2 = await User.findOne({ email: docEmail2 });
    if (!docUser2) {
      docUser2 = new User({
        email: docEmail2,
        password: 'Password123!',
        role: 'DOCTOR',
        isVerified: true,
      });
      await docUser2.save();
      
      const doctor2 = new Doctor({
        userId: docUser2._id,
        firstName: 'Sarah',
        lastName: 'Jenkins',
        specialty: 'Endocrinologist',
        npi: '1982736450',
        availabilitySlots: [
          { dayOfWeek: 2, startTime: '10:00', endTime: '15:00' },
          { dayOfWeek: 4, startTime: '10:00', endTime: '15:00' },
        ],
      });
      await doctor2.save();
    }

    logger.info('Database users auto-verified and clinician profiles seeded.');
  } catch (err) {
    logger.error(`Failed to initialize startup seeding: ${err}`);
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`Server is running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });

  const handleShutdown = (signal: string) => {
    logger.info(`Received ${signal}. Gracefully shutting down...`);
    server.close(() => {
      logger.info('Http server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
};

startServer().catch((err) => {
  logger.error(`Critical server initialization error: ${err}`);
  process.exit(1);
});

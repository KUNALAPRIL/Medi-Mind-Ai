import app from './app';
import env from './config/environment';
import connectDatabase from './config/database';
import logger from './config/logger';

const startServer = async () => {
  await connectDatabase();

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

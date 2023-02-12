export const settings = {
  MONGO_URI:
    process.env.mongoURI ||
    'mongodb://0.0.0.0:27017/blogPlatform?maxPoolSize=20&w=majority',
  postgres: {
    POSTGRES_URI:
      'postgresql://fxwuOcQLxdBBXdSBdLPRXFDYirBtPoaB:jNfYWwovDucnzAQqApTOCVrJINyOxDEY@db.thin.dev/6642a832-10dd-41b9-a072-eb62bcf20454',
    PORT: '5432',
    USERNAME: 'postgres',
    PASSWORD: 'admin',
    DATABASE_NAME: 'BlogsPlatform',
  },
  JWT_SECRET: process.env.JWT_SECRET || '123',
  basic: {
    USER: 'admin',
    PASS: 'qwerty',
  },
  SALT_GENERATE_ROUND: '10',
  timeLife: {
    CONFIRMATION_CODE: '24', // hour
    ACCESS_TOKEN: '10000', // sec
    REFRESH_TOKEN: '20000', // sec
  },
  throttler: {
    CONNECTION_TIME_LIMIT: '10000', // msec
    CONNECTION_COUNT_LIMIT: '5',
  },
  environment: 'dev',
  newestLikes: {
    limit: '3'
  }
};

import { Environment } from './helpers/environment.model';
import * as dotenv from 'dotenv';
dotenv.config();

export const settings = {
  PORT: Number(process.env.PORT),
  LOCAL: Boolean(process.env.LOCAL),
  environment: process.env.ENV_TYPE || Environment.Production,
  local: process.env.POSTGRES_LOCAL_URI,
  MONGO_URI:
    process.env.mongoURI ||
    'mongodb://0.0.0.0:27017/blogPlatform?maxPoolSize=20&w=majority',
  POSTGRES_URI:
    process.env.POSTGRES_URI ||
    'postgresql://fxwuOcQLxdBBXdSBdLPRXFDYirBtPoaB:jNfYWwovDucnzAQqApTOCVrJINyOxDEY@db.thin.dev/6642a832-10dd-41b9-a072-eb62bcf20454',
  JWT_SECRET: process.env.JWT_SECRET || '123',
  basic: {
    USER: 'admin',
    PASS: 'qwerty',
  },
  SALT_GENERATE_ROUND: '10',
  timeLife: {
    CONFIRMATION_CODE: '24', // hour
    ACCESS_TOKEN: '1000', // sec
    REFRESH_TOKEN: '2000', // sec
  },
  throttler: {
    CONNECTION_TIME_LIMIT: '10000', // msec
    CONNECTION_COUNT_LIMIT: '5',
  },
  newestLikes: {
    limit: '3',
  },
  repositoryType: {
    mongoose: '',
    rawSql: 'pg',
    orm: 'orm',
  },
  currentRepository: 'pg',
  s3: {
    baseUrl: 'https://storage.yandexcloud.net',
    bucketsName: 'test-buckets',
    endpoint: 'https://storage.yandexcloud.net',
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
  ngrok: { authToken: process.env.NGROK_AUTH_TOKEN },
  telegram: {
    baseUrl: 'https://api.telegram.org/bot',
    botToken: process.env.BOT_TOKEN,
  },
  images: {
    wallpaper: {
      size: 100000,
      width: 1028,
      height: 312,
    },
    main: {
      blog: {
        size: 100000,
        width: 156,
        height: 156,
      },
      post: {
        original: {
          size: 100000,
          width: 940,
          height: 432,
        },
        middle: {
          width: 300,
          height: 180,
        },
        small: {
          width: 149,
          height: 96,
        },
      },
    },
  },
};

import 'server-only';

import mongoose, { type Model } from 'mongoose';

type GlobalMongooseState = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

type AppStoreDocument = {
  key: string;
  value: string;
  updatedAt: Date;
};

const globalForMongo = globalThis as typeof globalThis & {
  __noticeboardMongoose?: GlobalMongooseState;
  __noticeboardAppStoreModel?: Model<AppStoreDocument>;
};

const mongooseState =
  globalForMongo.__noticeboardMongoose ?? {
    conn: null,
    promise: null,
  };

if (!globalForMongo.__noticeboardMongoose) {
  globalForMongo.__noticeboardMongoose = mongooseState;
}

export function isMongoConfigured() {
  return Boolean(process.env.MONGODB_URI);
}

export async function connectToMongo() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Missing MONGODB_URI environment variable.');
  }

  if (mongooseState.conn) {
    return mongooseState.conn;
  }

  if (!mongooseState.promise) {
    mongooseState.promise = mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || 'noticeboard',
      bufferCommands: false,
    });
  }

  mongooseState.conn = await mongooseState.promise;
  return mongooseState.conn;
}

export function getAppStoreModel() {
  if (globalForMongo.__noticeboardAppStoreModel) {
    return globalForMongo.__noticeboardAppStoreModel;
  }

  const schema = new mongoose.Schema<AppStoreDocument>(
    {
      key: { type: String, required: true, unique: true, index: true },
      value: { type: String, required: true },
      updatedAt: { type: Date, required: true, default: () => new Date() },
    },
    {
      versionKey: false,
      collection: 'app_store',
    }
  );

  globalForMongo.__noticeboardAppStoreModel =
    (mongoose.models.AppStore as Model<AppStoreDocument> | undefined) ??
    mongoose.model<AppStoreDocument>('AppStore', schema);

  return globalForMongo.__noticeboardAppStoreModel;
}

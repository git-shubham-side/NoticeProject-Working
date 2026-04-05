import 'server-only';

import { connectToMongo, getAppStoreModel } from './mongodb';

const globalForStore = globalThis as typeof globalThis & {
  __noticeboardStoreCache?: Map<string, string>;
  __noticeboardStoreHydration?: Promise<void>;
};

const storeCache = globalForStore.__noticeboardStoreCache ?? new Map<string, string>();

if (!globalForStore.__noticeboardStoreCache) {
  globalForStore.__noticeboardStoreCache = storeCache;
}

function requireMongoUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MONGODB_URI environment variable. Configure MongoDB before starting the app.');
  }
  return uri;
}

async function hydrateStoreCache() {
  requireMongoUri();

  if (globalForStore.__noticeboardStoreHydration) {
    return globalForStore.__noticeboardStoreHydration;
  }

  globalForStore.__noticeboardStoreHydration = (async () => {
    await connectToMongo();
    const AppStore = getAppStoreModel();
    const documents = await AppStore.find({}, { _id: 0, key: 1, value: 1 }).lean();

    storeCache.clear();
    documents.forEach((document) => {
      storeCache.set(document.key, document.value);
    });
  })();

  return globalForStore.__noticeboardStoreHydration;
}

export function getStoreValue<T>(key: string): T | null {
  requireMongoUri();
  const cached = storeCache.get(key);
  return cached ? (JSON.parse(cached) as T) : null;
}

export function setStoreValue<T>(key: string, value: T) {
  requireMongoUri();

  const serialized = JSON.stringify(value);
  storeCache.set(key, serialized);

  void (async () => {
    try {
      await connectToMongo();
      const AppStore = getAppStoreModel();
      await AppStore.findOneAndUpdate(
        { key },
        {
          key,
          value: serialized,
          updatedAt: new Date(),
        },
        {
          upsert: true,
        }
      );
    } catch (error) {
      console.error(`Failed to persist "${key}" to MongoDB:`, error);
    }
  })();
}

void hydrateStoreCache().catch((error) => {
  console.error('MongoDB store initialization failed:', error);
});

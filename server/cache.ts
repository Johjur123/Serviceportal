import NodeCache from 'node-cache';

const cache = new NodeCache({ 
  stdTTL: 300, // 5 minutes default
  checkperiod: 60, // check for expired keys every 60 seconds
  useClones: false // for better performance
});

export const withCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  const cached = cache.get<T>(key);
  if (cached) {
    return Promise.resolve(cached);
  }
  
  return fetcher().then(result => {
    if (ttl !== undefined) {
      cache.set(key, result, ttl);
    } else {
      cache.set(key, result);
    }
    return result;
  });
};

export const invalidateCache = (pattern: string) => {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => key.includes(pattern));
  cache.del(matchingKeys);
};

export const getCacheStats = () => {
  return {
    keys: cache.keys().length,
    stats: cache.getStats()
  };
};
import fs from 'fs';
import path from 'path';

const STORE_PATH = path.join('/tmp', 'prmaterial_store.json');

export const loadStore = () => {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('⚠️ Could not load store from /tmp:', err.message);
  }
  return {};
};

export const saveStoreKey = (key, data) => {
  try {
    const store = loadStore();
    store[key] = data;
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.warn(`⚠️ Could not save ${key} to /tmp store:`, err.message);
  }
};

export const getStoreKey = (key, defaultData) => {
  const store = loadStore();
  if (store[key] && Array.isArray(store[key]) && store[key].length > 0) {
    return store[key];
  }
  if (store[key] && typeof store[key] === 'object' && Object.keys(store[key]).length > 0) {
    return store[key];
  }
  return defaultData;
};

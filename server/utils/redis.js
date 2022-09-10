import { client } from '..';
import { isEmpty } from './nativeMethods';

const getCache = async (key) => {
  try {
    const cache = await client.get(String(key));

    if (!isEmpty(cache)) {
      return JSON.parse(cache);
    } else {
      return null;
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

const getKeys = async (key) => {
  try {
    const cache = await client.keys(key);

    if (!isEmpty(cache)) {
      return cache;
    } else {
      return null;
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

const setCache = async (key, data, caducidad = '') => {
  try {
    if (!isEmpty(caducidad)) {
      await client.setEx(String(key), caducidad, JSON.stringify(data));
    } else {
      await client.set(String(key), JSON.stringify(data));
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

const delCache = async (key) => {
  try {
    const cache = await client.del(key);

    return cache;
  } catch (error) {
    throw new Error(error.message);
  }
};

export { setCache, getCache, delCache, getKeys };

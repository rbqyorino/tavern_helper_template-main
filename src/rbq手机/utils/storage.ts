/**
 * 本地存储工具
 * 用于管理IndexedDB存储UI状态和缓存
 */

const DB_NAME = 'rbq_phone_db';
const DB_VERSION = 1;
const STORE_NAME = 'ui_state';
const CACHE_STORE = 'cache';

/**
 * 初始化IndexedDB
 */
export async function initializeDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 创建UI状态存储
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }

      // 创建缓存存储
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE, { keyPath: 'url' });
      }
    };
  });
}

/**
 * 保存UI状态到IndexedDB
 */
export async function saveToIndexedDB(key: string, value: any): Promise<void> {
  try {
    const db = await initializeDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.put({ id: key, data: value, timestamp: Date.now() });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('[Storage] 保存到IndexedDB失败:', error);
    // 降级到localStorage
    localStorage.setItem(key, JSON.stringify(value));
  }
}

/**
 * 从IndexedDB读取UI状态
 */
export async function loadFromIndexedDB<T = any>(key: string): Promise<T | null> {
  try {
    const db = await initializeDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve(result.data as T);
        } else {
          // 尝试从localStorage读取（向后兼容）
          const stored = localStorage.getItem(key);
          resolve(stored ? (JSON.parse(stored) as T) : null);
        }
      };
    });
  } catch (error) {
    console.error('[Storage] 从IndexedDB读取失败:', error);
    // 降级到localStorage
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : null;
  }
}

/**
 * 缓存图片/资源
 */
export async function cacheResource(url: string, blob: Blob): Promise<void> {
  try {
    const db = await initializeDB();
    const transaction = db.transaction(CACHE_STORE, 'readwrite');
    const store = transaction.objectStore(CACHE_STORE);

    return new Promise((resolve, reject) => {
      const request = store.put({
        url,
        blob,
        timestamp: Date.now(),
      });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('[Storage] 缓存资源失败:', error);
  }
}

/**
 * 获取缓存的资源
 */
export async function getCachedResource(url: string): Promise<Blob | null> {
  try {
    const db = await initializeDB();
    const transaction = db.transaction(CACHE_STORE, 'readonly');
    const store = transaction.objectStore(CACHE_STORE);

    return new Promise((resolve, reject) => {
      const request = store.get(url);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.blob : null);
      };
    });
  } catch (error) {
    console.error('[Storage] 获取缓存资源失败:', error);
    return null;
  }
}

/**
 * 清除过期缓存（7天以上）
 */
export async function clearExpiredCache(days: number = 7): Promise<void> {
  try {
    const db = await initializeDB();
    const transaction = db.transaction(CACHE_STORE, 'readwrite');
    const store = transaction.objectStore(CACHE_STORE);
    const now = Date.now();
    const expireTime = days * 24 * 60 * 60 * 1000;

    return new Promise((resolve, reject) => {
      const request = store.openCursor();
      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (now - cursor.value.timestamp > expireTime) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  } catch (error) {
    console.error('[Storage] 清除过期缓存失败:', error);
  }
}

/**
 * 删除指定的缓存
 */
export async function deleteCachedResource(url: string): Promise<void> {
  try {
    const db = await initializeDB();
    const transaction = db.transaction(CACHE_STORE, 'readwrite');
    const store = transaction.objectStore(CACHE_STORE);

    return new Promise((resolve, reject) => {
      const request = store.delete(url);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('[Storage] 删除缓存失败:', error);
  }
}

/**
 * 清空所有缓存
 */
export async function clearAllCache(): Promise<void> {
  try {
    const db = await initializeDB();
    const transaction = db.transaction(CACHE_STORE, 'readwrite');
    const store = transaction.objectStore(CACHE_STORE);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('[Storage] 清空所有缓存失败:', error);
  }
}

/**
 * 加载图片并缓存
 */
export async function loadAndCacheImage(url: string): Promise<string> {
  try {
    // 首先检查缓存
    const cached = await getCachedResource(url);
    if (cached) {
      return URL.createObjectURL(cached);
    }

    // 从网络加载
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();

    // 缓存资源
    await cacheResource(url, blob);

    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('[Storage] 加载和缓存图片失败:', error, url);
    // 返回原始URL作为备选
    return url;
  }
}

/**
 * 导出所有数据（备份）
 */
export async function exportAllData(): Promise<any> {
  try {
    const db = await initializeDB();
    const result: any = {};

    // 导出UI状态
    const uiTransaction = db.transaction(STORE_NAME, 'readonly');
    const uiStore = uiTransaction.objectStore(STORE_NAME);

    result.uiState = await new Promise((resolve, reject) => {
      const request = uiStore.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    return result;
  } catch (error) {
    console.error('[Storage] 导出数据失败:', error);
    return null;
  }
}

/**
 * 导入数据（恢复）
 */
export async function importAllData(data: any): Promise<void> {
  try {
    const db = await initializeDB();

    if (data.uiState && Array.isArray(data.uiState)) {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      for (const item of data.uiState) {
        await new Promise((resolve, reject) => {
          const request = store.put(item);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(null);
        });
      }
    }

    console.log('[Storage] 数据导入成功');
  } catch (error) {
    console.error('[Storage] 导入数据失败:', error);
  }
}

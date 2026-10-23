import { EnvironmentalReport } from '../types';

const DB_NAME = 'daNangGreenDB';
const STORE_NAME = 'offline_reports';
const TILE_STORE_NAME = 'map_tiles';
const CACHED_REPORTS_STORE = 'cached_public_reports';
const DB_VERSION = 3;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", event);
      reject("Could not open IndexedDB");
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(TILE_STORE_NAME)) {
        const tileStore = db.createObjectStore(TILE_STORE_NAME, { keyPath: 'key' });
        tileStore.createIndex('layer', 'layer', { unique: false });
        tileStore.createIndex('zoom', 'zoom', { unique: false });
      }
      if (!db.objectStoreNames.contains(CACHED_REPORTS_STORE)) {
        db.createObjectStore(CACHED_REPORTS_STORE, { keyPath: 'id' });
      }
    };
  });
};

export const saveOfflineReport = async (report: EnvironmentalReport): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(report);

    request.onsuccess = () => resolve();
    request.onerror = () => reject("Could not save report offline");
  });
};

export const getOfflineReports = async (): Promise<EnvironmentalReport[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject("Could not retrieve offline reports");
  });
};

export const deleteOfflineReport = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject("Could not delete offline report");
  });
};

// Caching functions for public reports (Offline Mode)
export const cachePublicReports = async (reports: EnvironmentalReport[]): Promise<void> => {
  if (!reports || reports.length === 0) return;
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CACHED_REPORTS_STORE], 'readwrite');
    const store = transaction.objectStore(CACHED_REPORTS_STORE);
    
    // Clear old cached reports first to keep it fresh
    store.clear();

    let completed = 0;
    reports.forEach((report) => {
      // Convert Date object to ISO string / printable format if necessary for storage
      const reportToStore = {
        ...report,
        timestamp: report.timestamp instanceof Date ? report.timestamp.toISOString() : report.timestamp
      };
      const req = store.put(reportToStore);
      req.onsuccess = () => {
        completed++;
        if (completed === reports.length) {
          resolve();
        }
      };
      req.onerror = () => {
        console.warn(`Failed to cache report ${report.id}`);
      };
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = (err) => reject(err);
  });
};

export const getCachedPublicReports = async (): Promise<EnvironmentalReport[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CACHED_REPORTS_STORE], 'readonly');
    const store = transaction.objectStore(CACHED_REPORTS_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const reports = (request.result || []).map((r: any) => ({
        ...r,
        timestamp: new Date(r.timestamp)
      }));
      resolve(reports);
    };
    request.onerror = () => reject("Could not retrieve cached public reports");
  });
};

export const clearCachedPublicReports = async (): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CACHED_REPORTS_STORE], 'readwrite');
    const store = transaction.objectStore(CACHED_REPORTS_STORE);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject("Could not clear cached public reports");
  });
};

export const compressImage = (file: File, maxWidth: number = 1024, quality: number = 0.6): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Nếu file nhỏ hơn 500KB, không cần nén mạnh, chỉ cần đọc DataURL
    if (file.size < 500 * 1024) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => resolve(event.target?.result as string);
      reader.onerror = (error) => reject(error);
      return;
    }

    // Nếu không phải là ảnh, trả về data URL gốc (không nén)
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => resolve(event.target?.result as string);
      reader.onerror = (error) => reject(error);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with lower quality for Vercel compatibility
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (error) => {
        console.warn("Image compression failed, using original file:", error);
        resolve(event.target?.result as string);
      };
    };
    reader.onerror = (error) => reject(error);
  });
};

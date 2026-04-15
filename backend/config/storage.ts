import { StorageAdapter } from '../persistence/storage/StorageAdapter';
import { LocalStorageAdapter } from '../persistence/storage/LocalStorageAdapter';
import { S3StorageAdapter } from '../persistence/storage/S3StorageAdapter';
import { CloudinaryAdapter } from '../persistence/storage/CloudinaryAdapter';

/**
 * Storage adapter factory
 * 
 * Creates the appropriate storage adapter based on environment configuration.
 * 
 * Validates: Requirements 9.5
 */
export function createStorageAdapter(): StorageAdapter {
  const storageType = process.env.STORAGE_TYPE || 'local';
  
  switch (storageType.toLowerCase()) {
    case 's3':
      try {
        return S3StorageAdapter.fromEnvironment();
      } catch (error) {
        console.error('Failed to create S3 adapter:', error);
        console.log('Falling back to local storage');
        return new LocalStorageAdapter(process.env.UPLOAD_DIR || './uploads');
      }
    
    case 'cloudinary':
      try {
        return CloudinaryAdapter.fromEnvironment();
      } catch (error) {
        console.error('Failed to create Cloudinary adapter:', error);
        console.log('Falling back to local storage');
        return new LocalStorageAdapter(process.env.UPLOAD_DIR || './uploads');
      }
    
    case 'local':
    default:
      return new LocalStorageAdapter(process.env.UPLOAD_DIR || './uploads');
  }
}

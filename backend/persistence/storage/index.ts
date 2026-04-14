/**
 * Storage adapters module
 * 
 * Exports all storage adapter implementations and the common interface
 */

export { StorageAdapter } from './StorageAdapter';
export { LocalStorageAdapter } from './LocalStorageAdapter';
export { S3StorageAdapter, S3Config } from './S3StorageAdapter';
export { CloudinaryAdapter, CloudinaryConfig } from './CloudinaryAdapter';

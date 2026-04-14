# Storage Adapters

This directory contains storage adapter implementations for the audio upload feature.

## Overview

The storage layer provides a common interface (`StorageAdapter`) for different storage backends, allowing the application to work with local filesystem storage in development and cloud storage in production.

## Available Adapters

### LocalStorageAdapter

File-based storage for local development.

**Features:**
- Stores files in local filesystem
- Organizes files by userId in directory structure
- Generates unique filenames using UUID
- Suitable for development and testing

**Usage:**

```typescript
import { LocalStorageAdapter } from './storage';

const adapter = new LocalStorageAdapter('./uploads');

// Save a file
const filePath = await adapter.save(fileBuffer, 'unique-filename.mp3', 'user_123');

// Retrieve a file
const fileBuffer = await adapter.get('unique-filename.mp3', 'user_123');

// Check if file exists
const exists = await adapter.exists('unique-filename.mp3', 'user_123');

// Get URL for file
const url = await adapter.getUrl('unique-filename.mp3', 'user_123');

// Delete a file
await adapter.delete('unique-filename.mp3', 'user_123');

// Generate unique filename
const uniqueName = LocalStorageAdapter.generateUniqueFilename('song.mp3');
```

**Directory Structure:**

```
uploads/
├── user_123/
│   ├── abc123-def456-ghi789.mp3
│   └── xyz789-abc123-def456.wav
└── user_456/
    └── qwe123-asd456-zxc789.mp3
```

### S3StorageAdapter

AWS S3 storage adapter for production deployments.

**Features:**
- Stores files in AWS S3
- Organizes files by userId in S3 key structure
- Generates signed URLs for secure file access
- Suitable for production environments

**Requirements:**

Install AWS SDK packages:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Configuration:**

Set environment variables:

```bash
AWS_REGION=us-east-1
AWS_S3_BUCKET=my-audio-files-bucket
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

**Usage:**

```typescript
import { S3StorageAdapter } from './storage';

// Create from environment variables
const adapter = S3StorageAdapter.fromEnvironment();

// Or create with explicit config
const adapter = new S3StorageAdapter({
  region: 'us-east-1',
  bucket: 'my-audio-files-bucket',
  accessKeyId: 'your-access-key-id',
  secretAccessKey: 'your-secret-access-key'
});

// Use the same interface as LocalStorageAdapter
await adapter.save(fileBuffer, 'unique-filename.mp3', 'user_123');
const fileBuffer = await adapter.get('unique-filename.mp3', 'user_123');
```

**S3 Key Structure:**

```
uploads/user_123/abc123-def456-ghi789.mp3
uploads/user_456/xyz789-abc123-def456.wav
```

## StorageAdapter Interface

All storage adapters implement the following interface:

```typescript
interface StorageAdapter {
  save(file: Buffer, filename: string, userId: string): Promise<string>;
  get(filename: string, userId: string): Promise<Buffer>;
  delete(filename: string, userId: string): Promise<void>;
  exists(filename: string, userId: string): Promise<boolean>;
  getUrl(filename: string, userId: string): Promise<string>;
}
```

## Choosing a Storage Backend

### Development

Use `LocalStorageAdapter` for local development:

```typescript
const adapter = new LocalStorageAdapter('./uploads');
```

### Production

Use `S3StorageAdapter` for production deployments:

```typescript
const adapter = S3StorageAdapter.fromEnvironment();
```

### Configuration Example

```typescript
// config/storage.ts
import { StorageAdapter, LocalStorageAdapter, S3StorageAdapter } from '../persistence/storage';

export function createStorageAdapter(): StorageAdapter {
  const storageType = process.env.STORAGE_TYPE || 'local';
  
  switch (storageType) {
    case 's3':
      return S3StorageAdapter.fromEnvironment();
    case 'local':
    default:
      return new LocalStorageAdapter(process.env.UPLOAD_DIR || './uploads');
  }
}
```

## Testing

Run tests for storage adapters:

```bash
# Test LocalStorageAdapter
npm test -- LocalStorageAdapter.test.ts

# Test S3StorageAdapter (requires AWS SDK)
npm test -- S3StorageAdapter.test.ts
```

## Requirements Validation

This implementation validates the following requirements:

- **Requirement 3.1**: Storage in dedicated location
- **Requirement 3.2**: Unique filename generation using UUID
- **Requirement 3.4**: Directory structure by userId
- **Requirement 9.1**: File-based storage for development
- **Requirement 9.2**: Cloud storage support (S3)
- **Requirement 9.6**: Common storage interface
- **Requirement 9.9**: Signed URL generation (S3)

## Future Enhancements

Additional storage adapters can be implemented:

- **CloudinaryAdapter**: For Cloudinary storage
- **GoogleCloudStorageAdapter**: For Google Cloud Storage
- **AzureBlobStorageAdapter**: For Azure Blob Storage

All adapters should implement the `StorageAdapter` interface for consistency.

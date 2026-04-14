/**
 * FileRepository Usage Examples
 * 
 * This file demonstrates how to use the FileRepository to manage uploaded file metadata.
 */

import { FileFileRepository } from './FileRepository';
import { UploadedFile } from '../domain/UploadedFile';

async function exampleUsage() {
  // Initialize the repository
  const fileRepository = new FileFileRepository('data');

  // Example 1: Create a new file metadata record
  console.log('Example 1: Creating file metadata');
  const newFile = new UploadedFile(
    'user_123',                    // userId
    'my-song.mp3',                 // originalName
    'abc-def-ghi-jkl.mp3',        // storedName (unique)
    5242880,                       // size in bytes (5MB)
    'audio/mpeg',                  // mimeType
    'mp3',                         // format
    245,                           // duration in seconds
    {                              // metadata (ID3 tags)
      title: 'My Awesome Song',
      artist: 'John Doe',
      album: 'Demo Album',
      year: 2024,
      genre: 'Rock'
    }
  );

  await fileRepository.create(newFile);
  console.log('Created file:', newFile.id);

  // Example 2: Find a file by ID
  console.log('\nExample 2: Finding file by ID');
  const foundFile = await fileRepository.findById(newFile.id);
  if (foundFile) {
    console.log('Found file:', {
      id: foundFile.id,
      originalName: foundFile.originalName,
      size: foundFile.size,
      metadata: foundFile.metadata
    });
  }

  // Example 3: Find all files for a user
  console.log('\nExample 3: Finding all files for a user');
  const userFiles = await fileRepository.findByUserId('user_123');
  console.log(`User has ${userFiles.length} files`);
  userFiles.forEach(file => {
    console.log(`  - ${file.originalName} (${file.size} bytes)`);
  });

  // Example 4: Calculate user storage usage
  console.log('\nExample 4: Calculating storage usage');
  const storageUsage = await fileRepository.getUserStorageUsage('user_123');
  const usageMB = (storageUsage / (1024 * 1024)).toFixed(2);
  console.log(`User storage usage: ${usageMB} MB`);

  // Example 5: Delete a file
  console.log('\nExample 5: Deleting a file');
  await fileRepository.delete(newFile.id);
  console.log('File deleted');

  // Verify deletion
  const deletedFile = await fileRepository.findById(newFile.id);
  console.log('File exists after deletion:', deletedFile !== null);

  // Example 6: Storage usage after deletion
  const newUsage = await fileRepository.getUserStorageUsage('user_123');
  console.log(`Storage usage after deletion: ${newUsage} bytes`);
}

// Example 7: Working with multiple users
async function multiUserExample() {
  const fileRepository = new FileFileRepository('data');

  // Create files for different users
  const user1File = new UploadedFile(
    'user_1',
    'song1.mp3',
    'stored1.mp3',
    5242880,
    'audio/mpeg',
    'mp3'
  );

  const user2File = new UploadedFile(
    'user_2',
    'song2.wav',
    'stored2.wav',
    10485760,
    'audio/wav',
    'wav'
  );

  await fileRepository.create(user1File);
  await fileRepository.create(user2File);

  // Get storage usage for each user
  const user1Usage = await fileRepository.getUserStorageUsage('user_1');
  const user2Usage = await fileRepository.getUserStorageUsage('user_2');

  console.log('User 1 storage:', (user1Usage / (1024 * 1024)).toFixed(2), 'MB');
  console.log('User 2 storage:', (user2Usage / (1024 * 1024)).toFixed(2), 'MB');
}

// Example 8: Error handling
async function errorHandlingExample() {
  const fileRepository = new FileFileRepository('data');

  try {
    // Try to delete a non-existent file
    await fileRepository.delete('nonexistent_id');
  } catch (error) {
    console.log('Expected error:', (error as Error).message);
  }

  try {
    // Try to create an invalid file
    const invalidFile = new UploadedFile(
      '',  // Invalid: empty userId
      'song.mp3',
      'stored.mp3',
      5242880,
      'audio/mpeg',
      'mp3'
    );
    await fileRepository.create(invalidFile);
  } catch (error) {
    console.log('Expected validation error:', (error as Error).message);
  }
}

// Uncomment to run examples:
// exampleUsage().catch(console.error);
// multiUserExample().catch(console.error);
// errorHandlingExample().catch(console.error);

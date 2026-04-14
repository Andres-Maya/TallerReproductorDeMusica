/**
 * Migration Script: Add sourceType and fileId fields to existing songs
 * 
 * This script migrates existing song records to include the new sourceType
 * and fileId fields required for the audio upload and YouTube integration feature.
 * 
 * For all existing songs:
 * - Sets sourceType = 'url' (existing songs are URL-based)
 * - Sets fileId = null (no uploaded files yet)
 * 
 * This ensures backward compatibility with existing data.
 */

import fs from 'fs/promises';
import path from 'path';
import { SongDTO } from '../domain/Song';

interface PlaylistDTO {
  id: string;
  userId: string;
  name: string;
  songs: SongDTO[];
  createdAt: string;
  updatedAt: string;
}

async function migratePlaylistFile(filePath: string): Promise<void> {
  console.log(`Migrating playlist: ${filePath}`);
  
  try {
    // Read the playlist file
    const content = await fs.readFile(filePath, 'utf-8');
    const playlist: PlaylistDTO = JSON.parse(content);
    
    let migrationCount = 0;
    
    // Migrate each song
    playlist.songs = playlist.songs.map((song: any) => {
      // Check if song already has the new fields
      if (song.sourceType !== undefined && song.fileId !== undefined) {
        return song; // Already migrated
      }
      
      migrationCount++;
      
      // Add new fields with default values for existing URL-based songs
      return {
        ...song,
        sourceType: 'url',
        fileId: null
      };
    });
    
    if (migrationCount > 0) {
      // Write back the migrated playlist
      await fs.writeFile(filePath, JSON.stringify(playlist, null, 2), 'utf-8');
      console.log(`  ✓ Migrated ${migrationCount} song(s)`);
    } else {
      console.log(`  ✓ No migration needed (already up to date)`);
    }
  } catch (error) {
    console.error(`  ✗ Error migrating ${filePath}:`, error);
    throw error;
  }
}

async function migrateAllPlaylists(dataDir: string): Promise<void> {
  const playlistsDir = path.join(dataDir, 'playlists');
  
  console.log('Starting song migration...');
  console.log(`Playlists directory: ${playlistsDir}`);
  
  try {
    // Check if playlists directory exists
    await fs.access(playlistsDir);
  } catch {
    console.log('No playlists directory found. Nothing to migrate.');
    return;
  }
  
  // Read all files in the playlists directory
  const files = await fs.readdir(playlistsDir);
  const playlistFiles = files.filter(file => file.endsWith('.json'));
  
  if (playlistFiles.length === 0) {
    console.log('No playlist files found. Nothing to migrate.');
    return;
  }
  
  console.log(`Found ${playlistFiles.length} playlist file(s) to check\n`);
  
  // Migrate each playlist file
  for (const file of playlistFiles) {
    const filePath = path.join(playlistsDir, file);
    await migratePlaylistFile(filePath);
  }
  
  console.log('\n✓ Migration completed successfully!');
}

// Run migration if executed directly
if (require.main === module) {
  const dataDir = process.argv[2] || path.join(__dirname, '../../data');
  
  migrateAllPlaylists(dataDir)
    .then(() => {
      console.log('\nMigration finished.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Migration failed:', error);
      process.exit(1);
    });
}

export { migrateAllPlaylists, migratePlaylistFile };

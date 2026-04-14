import { parseFile } from 'music-metadata';
import { AudioMetadata } from '../domain/UploadedFile';

/**
 * MetadataExtractor Service
 * 
 * Extracts ID3 tags and audio metadata from uploaded audio files using the music-metadata library.
 * Handles files with or without metadata gracefully, providing fallback behavior.
 * 
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5
 */
export class MetadataExtractor {
  /**
   * Extract metadata from an audio file.
   * 
   * Reads ID3 tags and audio properties from the file, extracting:
   * - title
   * - artist
   * - album
   * - year
   * - genre
   * - duration
   * 
   * @param filePath - Path to the audio file
   * @returns AudioMetadata object with extracted information and duration
   * @throws Error if file cannot be read (but returns partial metadata if parsing fails)
   * 
   * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5
   */
  async extract(filePath: string): Promise<AudioMetadata & { duration?: number }> {
    try {
      // Parse the audio file using music-metadata
      const metadata = await parseFile(filePath);

      // Extract common tags
      const common = metadata.common;
      const format = metadata.format;

      // Build AudioMetadata object from extracted tags
      const audioMetadata: AudioMetadata & { duration?: number } = {
        title: common.title,
        artist: common.artist,
        album: common.album,
        year: common.year,
        genre: common.genre ? common.genre[0] : undefined,
      };

      // Extract duration from format information (in seconds)
      if (format.duration) {
        audioMetadata.duration = Math.round(format.duration);
      }

      return audioMetadata;
    } catch (error) {
      // If metadata extraction fails, return empty metadata object
      // This allows the upload to continue with fallback to filename
      console.warn(`Failed to extract metadata from ${filePath}:`, error);
      return {};
    }
  }

  /**
   * Extract metadata from a buffer instead of a file path.
   * Useful for processing files that are already in memory.
   * 
   * @param buffer - Audio file buffer
   * @param mimeType - MIME type of the audio file
   * @returns AudioMetadata object with extracted information and duration
   */
  async extractFromBuffer(buffer: Buffer, mimeType: string): Promise<AudioMetadata & { duration?: number }> {
    try {
      const { parseBuffer } = await import('music-metadata');
      
      // Parse the audio buffer using music-metadata
      const metadata = await parseBuffer(buffer, mimeType);

      // Extract common tags
      const common = metadata.common;
      const format = metadata.format;

      // Build AudioMetadata object from extracted tags
      const audioMetadata: AudioMetadata & { duration?: number } = {
        title: common.title,
        artist: common.artist,
        album: common.album,
        year: common.year,
        genre: common.genre ? common.genre[0] : undefined,
      };

      // Extract duration from format information (in seconds)
      if (format.duration) {
        audioMetadata.duration = Math.round(format.duration);
      }

      return audioMetadata;
    } catch (error) {
      // If metadata extraction fails, return empty metadata object
      console.warn('Failed to extract metadata from buffer:', error);
      return {};
    }
  }
}

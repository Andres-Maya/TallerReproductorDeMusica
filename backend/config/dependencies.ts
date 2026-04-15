import { createStorageAdapter } from './storage';
import { FileFileRepository } from '../persistence/FileRepository';
import { FilePlaylistRepository } from '../persistence/PlaylistRepository';
import { StorageManager } from '../services/StorageManager';
import { MetadataExtractor } from '../services/MetadataExtractor';
import { FileValidator } from '../services/FileValidator';
import { PlaylistManager } from '../services/PlaylistManager';
import { UploadService } from '../services/UploadService';
import { YouTubeExtractor } from '../services/YouTubeExtractor';
import { UploadController } from '../controllers/UploadController';
import { FileController } from '../controllers/FileController';
import { YouTubeController } from '../controllers/YouTubeController';

/**
 * Dependency injection container for upload-related services.
 * 
 * Creates and wires all services, repositories, and controllers with proper dependencies.
 * Configures storage adapter based on environment variables.
 * 
 * Validates: Requirements 12.7
 */
export class DependencyContainer {
  // Repositories
  public readonly fileRepository: FileFileRepository;
  public readonly playlistRepository: FilePlaylistRepository;

  // Storage
  public readonly storageAdapter: ReturnType<typeof createStorageAdapter>;
  public readonly storageManager: StorageManager;

  // Services
  public readonly metadataExtractor: MetadataExtractor;
  public readonly fileValidator: FileValidator;
  public readonly playlistManager: PlaylistManager;
  public readonly uploadService: UploadService;
  public readonly youtubeExtractor: YouTubeExtractor;

  // Controllers
  public readonly uploadController: UploadController;
  public readonly fileController: FileController;
  public readonly youtubeController: YouTubeController;

  constructor() {
    // Initialize repositories
    this.fileRepository = new FileFileRepository();
    this.playlistRepository = new FilePlaylistRepository();

    // Initialize storage adapter based on environment
    this.storageAdapter = createStorageAdapter();
    this.storageManager = new StorageManager(this.storageAdapter, this.fileRepository);

    // Initialize services
    this.metadataExtractor = new MetadataExtractor();
    this.fileValidator = new FileValidator();
    this.playlistManager = new PlaylistManager(this.playlistRepository);
    this.uploadService = new UploadService(
      this.storageManager,
      this.metadataExtractor,
      this.fileValidator,
      this.playlistManager
    );
    this.youtubeExtractor = new YouTubeExtractor();

    // Initialize controllers
    this.uploadController = new UploadController(this.uploadService);
    this.fileController = new FileController(this.storageManager);
    this.youtubeController = new YouTubeController(
      this.youtubeExtractor,
      this.fileValidator
    );
  }
}

// Export singleton instance
export const dependencies = new DependencyContainer();

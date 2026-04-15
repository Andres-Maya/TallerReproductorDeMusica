/**
 * UploadModal - Tabbed modal for adding songs via URL, file upload, or YouTube
 * 
 * Features:
 * - Three tabs: URL, Upload File, YouTube
 * - Remembers last selected tab
 * - Progress tracking for uploads and extractions
 * - Validation and error handling
 * 
 * Requirements: 6.1, 6.2, 6.12
 */

import { UploadApi } from '../../api/UploadApi';
import { YouTubeApi } from '../../api/YouTubeApi';
import { SongDTO } from '../../api/PlaylistApi';

export type UploadTab = 'url' | 'upload' | 'youtube';

export interface UploadModalState {
  activeTab: UploadTab;
  isProcessing: boolean;
  progress: number;
  error: string | null;
  
  // URL tab
  urlData: {
    title: string;
    artist: string;
    audioUrl: string;
  };
  
  // Upload tab
  selectedFile: File | null;
  fileMetadata: {
    name: string;
    size: number;
    format: string;
  } | null;
  
  // YouTube tab
  youtubeUrl: string;
  youtubePreview: {
    title: string;
    duration: number;
    thumbnail: string;
  } | null;
  isLoadingPreview: boolean;
}

/**
 * UploadModal - Manages song addition through multiple input methods
 * 
 * Requirements: 6.1, 6.2, 6.12
 */
export class UploadModal {
  private container: HTMLElement;
  private uploadApi: UploadApi;
  private youtubeApi: YouTubeApi;
  private playlistApi: any; // PlaylistApi type
  private onSongAdded: (song: SongDTO) => void;
  private playlistId: string;
  private state: UploadModalState;
  private isVisible: boolean = false;

  constructor(
    container: HTMLElement,
    uploadApi: UploadApi,
    youtubeApi: YouTubeApi,
    playlistApi: any, // PlaylistApi
    onSongAdded: (song: SongDTO) => void
  ) {
    this.container = container;
    this.uploadApi = uploadApi;
    this.youtubeApi = youtubeApi;
    this.playlistApi = playlistApi;
    this.onSongAdded = onSongAdded;
    this.playlistId = '';

    // Initialize state with last selected tab from localStorage
    const lastTab = (localStorage.getItem('uploadModal_lastTab') as UploadTab) || 'url';
    
    this.state = {
      activeTab: lastTab,
      isProcessing: false,
      progress: 0,
      error: null,
      urlData: {
        title: '',
        artist: '',
        audioUrl: '',
      },
      selectedFile: null,
      fileMetadata: null,
      youtubeUrl: '',
      youtubePreview: null,
      isLoadingPreview: false,
    };
  }

  /**
   * Show the modal for a specific playlist
   * 
   * @param playlistId - ID of the playlist to add songs to
   */
  show(playlistId: string): void {
    this.playlistId = playlistId;
    this.isVisible = true;
    this.resetState();
    this.render();
    this.attachEventListeners();
  }

  /**
   * Hide the modal
   */
  hide(): void {
    this.isVisible = false;
    this.render();
  }

  /**
   * Set the active tab
   * 
   * @param tab - Tab to activate
   */
  setActiveTab(tab: UploadTab): void {
    this.state.activeTab = tab;
    this.state.error = null;
    
    // Remember last selected tab
    localStorage.setItem('uploadModal_lastTab', tab);
    
    this.render();
    this.attachEventListeners();
  }

  /**
   * Reset state to initial values
   */
  private resetState(): void {
    this.state = {
      ...this.state,
      isProcessing: false,
      progress: 0,
      error: null,
      urlData: { title: '', artist: '', audioUrl: '' },
      selectedFile: null,
      fileMetadata: null,
      youtubeUrl: '',
      youtubePreview: null,
      isLoadingPreview: false,
    };
  }

  /**
   * Render the modal
   */
  private render(): void {
    if (!this.isVisible) {
      this.container.innerHTML = '';
      return;
    }

    this.container.innerHTML = `
      <div class="modal-overlay" id="upload-modal-overlay">
        <div class="modal modal-upload">
          <div class="modal-header">
            <h3 class="modal-title">Add Song</h3>
            <button class="modal-close" id="close-upload-modal">&times;</button>
          </div>
          
          <!-- Tab Navigation -->
          <div class="upload-tabs">
            <button 
              class="upload-tab ${this.state.activeTab === 'url' ? 'upload-tab-active' : ''}"
              data-tab="url"
              ${this.state.isProcessing ? 'disabled' : ''}>
              URL
            </button>
            <button 
              class="upload-tab ${this.state.activeTab === 'upload' ? 'upload-tab-active' : ''}"
              data-tab="upload"
              ${this.state.isProcessing ? 'disabled' : ''}>
              Upload File
            </button>
            <button 
              class="upload-tab ${this.state.activeTab === 'youtube' ? 'upload-tab-active' : ''}"
              data-tab="youtube"
              ${this.state.isProcessing ? 'disabled' : ''}>
              YouTube
            </button>
          </div>

          <div class="modal-body">
            ${this.state.error ? `
              <div class="form-error-general">
                ${this.escapeHtml(this.state.error)}
              </div>
            ` : ''}

            ${this.state.isProcessing ? this.renderProgress() : ''}

            <!-- Tab Content -->
            <div class="upload-tab-content">
              ${this.renderTabContent()}
            </div>
          </div>

          <div class="modal-footer">
            <button 
              class="btn-secondary" 
              id="cancel-upload"
              ${this.state.isProcessing ? 'disabled' : ''}>
              Cancel
            </button>
            <button 
              class="btn-primary" 
              id="submit-upload"
              ${this.state.isProcessing || !this.canSubmit() ? 'disabled' : ''}>
              ${this.getSubmitButtonText()}
            </button>
          </div>
        </div>
      </div>
    `;

    this.addStyles();
  }

  /**
   * Render progress indicator
   */
  private renderProgress(): string {
    return `
      <div class="upload-progress">
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: ${this.state.progress}%"></div>
        </div>
        <div class="progress-text">${this.state.progress}%</div>
      </div>
    `;
  }

  /**
   * Render content for the active tab
   */
  private renderTabContent(): string {
    switch (this.state.activeTab) {
      case 'url':
        return this.renderUrlTab();
      case 'upload':
        return this.renderUploadTab();
      case 'youtube':
        return this.renderYoutubeTab();
      default:
        return '';
    }
  }

  /**
   * Render URL tab content
   */
  private renderUrlTab(): string {
    return `
      <div class="form-group">
        <label for="song-title" class="form-label">Title</label>
        <input
          type="text"
          id="song-title"
          class="form-input"
          value="${this.escapeHtml(this.state.urlData.title)}"
          placeholder="Enter song title"
          ${this.state.isProcessing ? 'disabled' : ''}
        />
      </div>
      <div class="form-group">
        <label for="song-artist" class="form-label">Artist</label>
        <input
          type="text"
          id="song-artist"
          class="form-input"
          value="${this.escapeHtml(this.state.urlData.artist)}"
          placeholder="Enter artist name"
          ${this.state.isProcessing ? 'disabled' : ''}
        />
      </div>
      <div class="form-group">
        <label for="song-url" class="form-label">Audio URL</label>
        <input
          type="url"
          id="song-url"
          class="form-input"
          value="${this.escapeHtml(this.state.urlData.audioUrl)}"
          placeholder="https://example.com/song.mp3"
          ${this.state.isProcessing ? 'disabled' : ''}
        />
      </div>
    `;
  }

  /**
   * Render Upload File tab content
   */
  private renderUploadTab(): string {
    return `
      <div class="file-upload-area">
        ${this.state.selectedFile ? `
          <div class="file-selected">
            <div class="file-icon">🎵</div>
            <div class="file-info">
              <div class="file-name">${this.escapeHtml(this.state.fileMetadata?.name || '')}</div>
              <div class="file-meta">
                ${this.formatFileSize(this.state.fileMetadata?.size || 0)} • 
                ${this.escapeHtml(this.state.fileMetadata?.format || '')}
              </div>
            </div>
            <button class="btn-clear-file" id="clear-file" ${this.state.isProcessing ? 'disabled' : ''}>
              &times;
            </button>
          </div>
        ` : `
          <div class="file-drop-zone" id="file-drop-zone">
            <div class="drop-zone-content">
              <div class="drop-zone-icon">📁</div>
              <div class="drop-zone-text">
                Drag and drop an audio file here
              </div>
              <div class="drop-zone-or">or</div>
              <label for="file-input" class="btn-secondary btn-file-picker">
                Choose File
              </label>
              <input
                type="file"
                id="file-input"
                accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/flac,.mp3,.wav,.ogg,.m4a,.flac"
                style="display: none;"
                ${this.state.isProcessing ? 'disabled' : ''}
              />
              <div class="drop-zone-hint">
                Supported formats: MP3, WAV, OGG, M4A, FLAC (max 50MB)
              </div>
            </div>
          </div>
        `}
      </div>
    `;
  }

  /**
   * Render YouTube tab content
   */
  private renderYoutubeTab(): string {
    return `
      <div class="form-group">
        <label for="youtube-url" class="form-label">YouTube URL</label>
        <input
          type="url"
          id="youtube-url"
          class="form-input"
          value="${this.escapeHtml(this.state.youtubeUrl)}"
          placeholder="https://www.youtube.com/watch?v=..."
          ${this.state.isProcessing ? 'disabled' : ''}
        />
      </div>

      ${this.state.isLoadingPreview ? `
        <div class="youtube-preview-loading">
          Loading preview...
        </div>
      ` : ''}

      ${this.state.youtubePreview ? `
        <div class="youtube-preview">
          <img 
            src="${this.escapeHtml(this.state.youtubePreview.thumbnail)}" 
            alt="Video thumbnail"
            class="youtube-thumbnail"
          />
          <div class="youtube-info">
            <div class="youtube-title">${this.escapeHtml(this.state.youtubePreview.title)}</div>
            <div class="youtube-duration">${this.formatDuration(this.state.youtubePreview.duration)}</div>
          </div>
        </div>
      ` : ''}
    `;
  }

  /**
   * Check if the form can be submitted
   */
  private canSubmit(): boolean {
    if (this.state.isProcessing) return false;

    switch (this.state.activeTab) {
      case 'url':
        return !!(
          this.state.urlData.title.trim() &&
          this.state.urlData.artist.trim() &&
          this.state.urlData.audioUrl.trim()
        );
      case 'upload':
        return !!this.state.selectedFile;
      case 'youtube':
        return !!this.state.youtubePreview;
      default:
        return false;
    }
  }

  /**
   * Get submit button text based on state
   */
  private getSubmitButtonText(): string {
    if (this.state.isProcessing) {
      switch (this.state.activeTab) {
        case 'upload':
          return 'Uploading...';
        case 'youtube':
          return 'Extracting...';
        default:
          return 'Processing...';
      }
    }
    return 'Add Song';
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    // Close button
    const closeBtn = this.container.querySelector('#close-upload-modal');
    closeBtn?.addEventListener('click', () => this.hide());

    // Overlay click
    const overlay = this.container.querySelector('#upload-modal-overlay');
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hide();
      }
    });

    // Cancel button
    const cancelBtn = this.container.querySelector('#cancel-upload');
    cancelBtn?.addEventListener('click', () => this.hide());

    // Submit button
    const submitBtn = this.container.querySelector('#submit-upload');
    submitBtn?.addEventListener('click', () => this.handleSubmit());

    // Tab buttons
    const tabButtons = this.container.querySelectorAll('.upload-tab');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = (btn as HTMLElement).dataset.tab as UploadTab;
        this.setActiveTab(tab);
      });
    });

    // Tab-specific listeners
    this.attachTabListeners();
  }

  /**
   * Attach listeners for the active tab
   */
  private attachTabListeners(): void {
    switch (this.state.activeTab) {
      case 'url':
        this.attachUrlTabListeners();
        break;
      case 'upload':
        this.attachUploadTabListeners();
        break;
      case 'youtube':
        this.attachYoutubeTabListeners();
        break;
    }
  }

  /**
   * Attach listeners for URL tab
   */
  private attachUrlTabListeners(): void {
    const titleInput = this.container.querySelector('#song-title') as HTMLInputElement;
    const artistInput = this.container.querySelector('#song-artist') as HTMLInputElement;
    const urlInput = this.container.querySelector('#song-url') as HTMLInputElement;

    titleInput?.addEventListener('input', () => {
      this.state.urlData.title = titleInput.value;
      this.updateSubmitButton();
    });

    artistInput?.addEventListener('input', () => {
      this.state.urlData.artist = artistInput.value;
      this.updateSubmitButton();
    });

    urlInput?.addEventListener('input', () => {
      this.state.urlData.audioUrl = urlInput.value;
      this.updateSubmitButton();
    });
  }

  /**
   * Attach listeners for Upload tab
   */
  private attachUploadTabListeners(): void {
    const fileInput = this.container.querySelector('#file-input') as HTMLInputElement;
    const dropZone = this.container.querySelector('#file-drop-zone');
    const clearBtn = this.container.querySelector('#clear-file');

    fileInput?.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        this.handleFileSelect(file);
      }
    });

    clearBtn?.addEventListener('click', () => {
      this.state.selectedFile = null;
      this.state.fileMetadata = null;
      this.render();
      this.attachEventListeners();
    });

    // Drag and drop
    dropZone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drop-zone-active');
    });

    dropZone?.addEventListener('dragleave', () => {
      dropZone.classList.remove('drop-zone-active');
    });

    dropZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drop-zone-active');
      
      const file = (e as DragEvent).dataTransfer?.files[0];
      if (file) {
        this.handleFileSelect(file);
      }
    });
  }

  /**
   * Attach listeners for YouTube tab
   */
  private attachYoutubeTabListeners(): void {
    const urlInput = this.container.querySelector('#youtube-url') as HTMLInputElement;

    let debounceTimer: number;
    urlInput?.addEventListener('input', () => {
      this.state.youtubeUrl = urlInput.value;
      this.state.youtubePreview = null;
      
      clearTimeout(debounceTimer);
      
      if (this.state.youtubeUrl.trim()) {
        debounceTimer = window.setTimeout(() => {
          this.loadYoutubePreview();
        }, 800);
      } else {
        this.updateSubmitButton();
      }
    });
  }

  /**
   * Handle file selection
   */
  private handleFileSelect(file: File): void {
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      this.state.error = validation.error || 'Invalid file';
      this.render();
      this.attachEventListeners();
      return;
    }

    this.state.selectedFile = file;
    this.state.fileMetadata = {
      name: file.name,
      size: file.size,
      format: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
    };
    this.state.error = null;

    this.render();
    this.attachEventListeners();
  }

  /**
   * Validate file
   */
  private validateFile(file: File): { isValid: boolean; error?: string } {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/flac'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid file type. Supported formats: MP3, WAV, OGG, M4A, FLAC',
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size exceeds 50MB limit',
      };
    }

    return { isValid: true };
  }

  /**
   * Load YouTube video preview
   */
  private async loadYoutubePreview(): Promise<void> {
    if (!this.state.youtubeUrl.trim()) return;

    this.state.isLoadingPreview = true;
    this.state.error = null;
    this.render();
    this.attachEventListeners();

    try {
      const preview = await this.youtubeApi.getPreview({ url: this.state.youtubeUrl });
      
      if (!preview.isAvailable) {
        throw new Error('Video is not available');
      }

      this.state.youtubePreview = preview;
      this.state.isLoadingPreview = false;
      this.render();
      this.attachEventListeners();
    } catch (error) {
      this.state.isLoadingPreview = false;
      this.state.error = error instanceof Error ? error.message : 'Failed to load video preview';
      this.render();
      this.attachEventListeners();
    }
  }

  /**
   * Handle form submission
   */
  private async handleSubmit(): Promise<void> {
    if (!this.canSubmit()) return;

    this.state.isProcessing = true;
    this.state.progress = 0;
    this.state.error = null;
    this.render();
    this.attachEventListeners();

    try {
      let song: SongDTO;

      switch (this.state.activeTab) {
        case 'url':
          song = await this.submitUrl();
          break;
        case 'upload':
          song = await this.submitUpload();
          break;
        case 'youtube':
          song = await this.submitYoutube();
          break;
        default:
          throw new Error('Invalid tab');
      }

      this.onSongAdded(song);
      this.hide();
    } catch (error) {
      this.state.isProcessing = false;
      this.state.error = error instanceof Error ? error.message : 'Operation failed';
      this.render();
      this.attachEventListeners();
    }
  }

  /**
   * Submit URL form (existing functionality)
   */
  private async submitUrl(): Promise<SongDTO> {
    // Call the existing PlaylistApi.addSong method
    const song = await this.playlistApi.addSong(this.playlistId, {
      title: this.state.urlData.title.trim(),
      artist: this.state.urlData.artist.trim(),
      audioUrl: this.state.urlData.audioUrl.trim(),
    });
    
    return song;
  }

  /**
   * Submit file upload
   */
  private async submitUpload(): Promise<SongDTO> {
    if (!this.state.selectedFile) {
      throw new Error('No file selected');
    }

    const response = await this.uploadApi.uploadFile({
      file: this.state.selectedFile,
      playlistId: this.playlistId,
      onProgress: (percentage) => {
        this.state.progress = percentage;
        this.updateProgress();
      },
    });

    return response.song;
  }

  /**
   * Submit YouTube extraction
   */
  private async submitYoutube(): Promise<SongDTO> {
    const response = await this.youtubeApi.extractAudio(
      {
        url: this.state.youtubeUrl,
        playlistId: this.playlistId,
      },
      (percentage) => {
        this.state.progress = percentage;
        this.updateProgress();
      }
    );

    return response.song;
  }

  /**
   * Update progress display
   */
  private updateProgress(): void {
    const progressBar = this.container.querySelector('.progress-bar') as HTMLElement;
    const progressText = this.container.querySelector('.progress-text');

    if (progressBar) {
      progressBar.style.width = `${this.state.progress}%`;
    }
    if (progressText) {
      progressText.textContent = `${this.state.progress}%`;
    }
  }

  /**
   * Update submit button state
   */
  private updateSubmitButton(): void {
    const submitBtn = this.container.querySelector('#submit-upload') as HTMLButtonElement;
    if (submitBtn) {
      submitBtn.disabled = !this.canSubmit();
    }
  }

  /**
   * Format file size
   */
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Format duration in seconds to MM:SS
   */
  private formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Add component styles
   */
  private addStyles(): void {
    if (document.getElementById('upload-modal-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'upload-modal-styles';
    style.textContent = `
      .modal-upload {
        max-width: 600px;
      }

      .upload-tabs {
        display: flex;
        border-bottom: 2px solid #e2e8f0;
      }

      .upload-tab {
        flex: 1;
        padding: 1rem;
        background: none;
        border: none;
        border-bottom: 3px solid transparent;
        font-size: 0.95rem;
        font-weight: 600;
        color: #718096;
        cursor: pointer;
        transition: all 0.2s;
      }

      .upload-tab:hover:not(:disabled) {
        color: #4a5568;
        background-color: #f7fafc;
      }

      .upload-tab:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .upload-tab-active {
        color: #667eea;
        border-bottom-color: #667eea;
      }

      .upload-tab-content {
        margin-top: 1rem;
      }

      .upload-progress {
        margin-bottom: 1.5rem;
      }

      .progress-bar-container {
        width: 100%;
        height: 8px;
        background-color: #e2e8f0;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.5rem;
      }

      .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        transition: width 0.3s ease;
      }

      .progress-text {
        text-align: center;
        font-size: 0.9rem;
        color: #4a5568;
        font-weight: 600;
      }

      .file-upload-area {
        min-height: 200px;
      }

      .file-drop-zone {
        border: 2px dashed #cbd5e0;
        border-radius: 8px;
        padding: 2rem;
        text-align: center;
        transition: all 0.2s;
        cursor: pointer;
      }

      .file-drop-zone:hover {
        border-color: #667eea;
        background-color: #f7fafc;
      }

      .file-drop-zone.drop-zone-active {
        border-color: #667eea;
        background-color: #ebf4ff;
      }

      .drop-zone-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }

      .drop-zone-icon {
        font-size: 3rem;
      }

      .drop-zone-text {
        font-size: 1rem;
        color: #4a5568;
        font-weight: 500;
      }

      .drop-zone-or {
        color: #a0aec0;
        font-size: 0.9rem;
      }

      .btn-file-picker {
        display: inline-block;
        cursor: pointer;
      }

      .drop-zone-hint {
        font-size: 0.85rem;
        color: #a0aec0;
      }

      .file-selected {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem;
        background-color: #f7fafc;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
      }

      .file-icon {
        font-size: 2.5rem;
      }

      .file-info {
        flex: 1;
      }

      .file-name {
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 0.25rem;
      }

      .file-meta {
        font-size: 0.85rem;
        color: #718096;
      }

      .btn-clear-file {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #718096;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        transition: all 0.2s;
      }

      .btn-clear-file:hover:not(:disabled) {
        background-color: #e2e8f0;
        color: #2d3748;
      }

      .youtube-preview-loading {
        text-align: center;
        padding: 2rem;
        color: #718096;
      }

      .youtube-preview {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        background-color: #f7fafc;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        margin-top: 1rem;
      }

      .youtube-thumbnail {
        width: 120px;
        height: 90px;
        object-fit: cover;
        border-radius: 6px;
      }

      .youtube-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .youtube-title {
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 0.5rem;
      }

      .youtube-duration {
        font-size: 0.85rem;
        color: #718096;
      }
    `;

    document.head.appendChild(style);
  }
}

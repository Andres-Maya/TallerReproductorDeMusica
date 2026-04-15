/**
 * FileDropZone - Drag-and-drop file upload component
 * 
 * Features:
 * - Drag-and-drop file upload
 * - File picker button
 * - File validation
 * - Visual feedback on drag over
 * 
 * Requirements: 6.4, 6.5, 6.6
 */

export interface FileDropZoneConfig {
  acceptedFormats: string[];
  maxSizeMB: number;
  onFileSelect: (file: File) => void;
  onError: (error: string) => void;
}

/**
 * FileDropZone - Reusable drag-and-drop file upload component
 * 
 * Requirements: 6.4, 6.5, 6.6
 */
export class FileDropZone {
  private container: HTMLElement;
  private config: FileDropZoneConfig;
  private isEnabled: boolean = true;

  constructor(container: HTMLElement, config: FileDropZoneConfig) {
    this.container = container;
    this.config = config;
    this.render();
    this.attachEventListeners();
  }

  /**
   * Render the drop zone
   */
  render(): void {
    this.container.innerHTML = `
      <div class="file-drop-zone" id="drop-zone">
        <div class="drop-zone-content">
          <div class="drop-zone-icon">📁</div>
          <div class="drop-zone-text">
            Drag and drop a file here
          </div>
          <div class="drop-zone-or">or</div>
          <label for="file-input" class="btn-secondary btn-file-picker">
            Choose File
          </label>
          <input
            type="file"
            id="file-input"
            accept="${this.config.acceptedFormats.join(',')}"
            style="display: none;"
          />
          <div class="drop-zone-hint">
            Max size: ${this.config.maxSizeMB}MB
          </div>
        </div>
      </div>
    `;

    this.addStyles();
  }

  /**
   * Enable or disable the drop zone
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    const dropZone = this.container.querySelector('#drop-zone');
    
    if (enabled) {
      dropZone?.classList.remove('drop-zone-disabled');
    } else {
      dropZone?.classList.add('drop-zone-disabled');
    }
  }

  /**
   * Clear the drop zone
   */
  clear(): void {
    this.render();
    this.attachEventListeners();
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    const fileInput = this.container.querySelector('#file-input') as HTMLInputElement;
    const dropZone = this.container.querySelector('#drop-zone');

    fileInput?.addEventListener('change', (e) => this.handleFileInput(e));
    
    dropZone?.addEventListener('dragover', (e) => this.handleDragOver(e));
    dropZone?.addEventListener('dragleave', () => this.handleDragLeave());
    dropZone?.addEventListener('drop', (e) => this.handleDrop(e));
  }

  /**
   * Handle drag over event
   */
  private handleDragOver(event: Event): void {
    if (!this.isEnabled) return;
    
    event.preventDefault();
    const dropZone = this.container.querySelector('#drop-zone');
    dropZone?.classList.add('drop-zone-active');
  }

  /**
   * Handle drag leave event
   */
  private handleDragLeave(): void {
    const dropZone = this.container.querySelector('#drop-zone');
    dropZone?.classList.remove('drop-zone-active');
  }

  /**
   * Handle drop event
   */
  private handleDrop(event: Event): void {
    if (!this.isEnabled) return;
    
    event.preventDefault();
    const dropZone = this.container.querySelector('#drop-zone');
    dropZone?.classList.remove('drop-zone-active');

    const file = (event as DragEvent).dataTransfer?.files[0];
    if (file) {
      this.processFile(file);
    }
  }

  /**
   * Handle file input change
   */
  private handleFileInput(event: Event): void {
    if (!this.isEnabled) return;
    
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  /**
   * Process and validate file
   */
  private processFile(file: File): void {
    if (!this.validateFile(file)) {
      return;
    }

    this.config.onFileSelect(file);
  }

  /**
   * Validate file
   */
  private validateFile(file: File): boolean {
    // Check file size
    const maxSizeBytes = this.config.maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      this.config.onError(`File size exceeds ${this.config.maxSizeMB}MB limit`);
      return false;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidType = this.config.acceptedFormats.some(format => 
      format.toLowerCase() === fileExtension || 
      format === file.type
    );

    if (!isValidType) {
      this.config.onError('Invalid file type');
      return false;
    }

    return true;
  }

  /**
   * Add component styles
   */
  private addStyles(): void {
    if (document.getElementById('file-drop-zone-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'file-drop-zone-styles';
    style.textContent = `
      .file-drop-zone {
        border: 2px dashed #cbd5e0;
        border-radius: 8px;
        padding: 2rem;
        text-align: center;
        transition: all 0.2s;
        cursor: pointer;
        background-color: #fff;
      }

      .file-drop-zone:hover:not(.drop-zone-disabled) {
        border-color: #667eea;
        background-color: #f7fafc;
      }

      .file-drop-zone.drop-zone-active {
        border-color: #667eea;
        background-color: #ebf4ff;
        transform: scale(1.02);
      }

      .file-drop-zone.drop-zone-disabled {
        opacity: 0.5;
        cursor: not-allowed;
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
    `;

    document.head.appendChild(style);
  }
}

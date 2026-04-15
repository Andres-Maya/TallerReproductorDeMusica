/**
 * StorageQuotaDisplay - Display user storage quota information
 * 
 * Features:
 * - Display current storage usage and limit
 * - Show percentage bar
 * - Display warning when usage exceeds 80%
 * 
 * Requirements: 4.4, 4.8
 */

import { UploadApi, StorageQuotaInfo } from '../../api/UploadApi';

/**
 * StorageQuotaDisplay - Displays user storage quota
 * 
 * Requirements: 4.4, 4.8
 */
export class StorageQuotaDisplay {
  private container: HTMLElement;
  private uploadApi: UploadApi;
  private quota: StorageQuotaInfo | null = null;
  private isLoading: boolean = false;
  private error: string | null = null;

  constructor(container: HTMLElement, uploadApi: UploadApi) {
    this.container = container;
    this.uploadApi = uploadApi;
  }

  /**
   * Load and display storage quota
   */
  async load(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    this.render();

    try {
      this.quota = await this.uploadApi.getStorageQuota();
      this.isLoading = false;
      this.render();
    } catch (error) {
      this.isLoading = false;
      this.error = error instanceof Error ? error.message : 'Failed to load storage quota';
      this.render();
    }
  }

  /**
   * Refresh storage quota
   */
  async refresh(): Promise<void> {
    await this.load();
  }

  /**
   * Render the storage quota display
   */
  private render(): void {
    if (this.isLoading) {
      this.container.innerHTML = `
        <div class="storage-quota-loading">
          Loading storage info...
        </div>
      `;
      this.addStyles();
      return;
    }

    if (this.error) {
      this.container.innerHTML = `
        <div class="storage-quota-error">
          ${this.escapeHtml(this.error)}
        </div>
      `;
      this.addStyles();
      return;
    }

    if (!this.quota) {
      this.container.innerHTML = '';
      return;
    }

    const isNearLimit = this.quota.percentage >= 80;
    const warningClass = isNearLimit ? 'storage-quota-warning' : '';

    this.container.innerHTML = `
      <div class="storage-quota ${warningClass}">
        <div class="storage-quota-header">
          <span class="storage-quota-icon">💾</span>
          <span class="storage-quota-title">Storage</span>
        </div>
        
        <div class="storage-quota-bar-container">
          <div 
            class="storage-quota-bar ${isNearLimit ? 'storage-quota-bar-warning' : ''}" 
            style="width: ${this.quota.percentage}%"
          ></div>
        </div>
        
        <div class="storage-quota-info">
          <span class="storage-quota-used">
            ${this.formatBytes(this.quota.used)} / ${this.formatBytes(this.quota.limit)}
          </span>
          <span class="storage-quota-percentage">
            ${this.quota.percentage.toFixed(1)}%
          </span>
        </div>

        ${isNearLimit ? `
          <div class="storage-quota-warning-message">
            ⚠️ Storage usage is high. Consider deleting unused files.
          </div>
        ` : ''}
      </div>
    `;

    this.addStyles();
  }

  /**
   * Format bytes to human-readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
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
    if (document.getElementById('storage-quota-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'storage-quota-styles';
    style.textContent = `
      .storage-quota {
        padding: 1rem;
        background-color: #f7fafc;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        margin-bottom: 1rem;
      }

      .storage-quota-warning {
        border-color: #f6ad55;
        background-color: #fffaf0;
      }

      .storage-quota-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
      }

      .storage-quota-icon {
        font-size: 1.25rem;
      }

      .storage-quota-title {
        font-size: 0.9rem;
        font-weight: 600;
        color: #4a5568;
      }

      .storage-quota-bar-container {
        width: 100%;
        height: 8px;
        background-color: #e2e8f0;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.5rem;
      }

      .storage-quota-bar {
        height: 100%;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        transition: width 0.3s ease;
        border-radius: 4px;
      }

      .storage-quota-bar-warning {
        background: linear-gradient(90deg, #f6ad55 0%, #ed8936 100%);
      }

      .storage-quota-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.85rem;
      }

      .storage-quota-used {
        color: #4a5568;
      }

      .storage-quota-percentage {
        font-weight: 600;
        color: #2d3748;
      }

      .storage-quota-warning-message {
        margin-top: 0.75rem;
        padding: 0.5rem;
        background-color: #fef5e7;
        border: 1px solid #f6ad55;
        border-radius: 4px;
        font-size: 0.85rem;
        color: #744210;
      }

      .storage-quota-loading,
      .storage-quota-error {
        padding: 1rem;
        text-align: center;
        font-size: 0.9rem;
        color: #718096;
      }

      .storage-quota-error {
        color: #e53e3e;
      }
    `;

    document.head.appendChild(style);
  }
}

/**
 * ProgressIndicator - Display upload/extraction progress
 * 
 * Features:
 * - Display progress as percentage
 * - Show status message
 * - Support different status types
 * 
 * Requirements: 1.10, 2.7, 6.10
 */

export type ProgressStatus = 'uploading' | 'processing' | 'extracting' | 'complete' | 'error';

export interface ProgressState {
  percentage: number;
  status: ProgressStatus;
  message: string;
}

/**
 * ProgressIndicator - Displays operation progress
 * 
 * Requirements: 1.10, 2.7, 6.10
 */
export class ProgressIndicator {
  private container: HTMLElement;
  private state: ProgressState;
  private isVisible: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.state = {
      percentage: 0,
      status: 'uploading',
      message: '',
    };
  }

  /**
   * Show the progress indicator
   * 
   * @param state - Initial progress state
   */
  show(state: ProgressState): void {
    this.state = state;
    this.isVisible = true;
    this.render();
  }

  /**
   * Update the progress state
   * 
   * @param state - Partial state to update
   */
  update(state: Partial<ProgressState>): void {
    this.state = { ...this.state, ...state };
    this.render();
  }

  /**
   * Hide the progress indicator
   */
  hide(): void {
    this.isVisible = false;
    this.render();
  }

  /**
   * Render the progress indicator
   */
  private render(): void {
    if (!this.isVisible) {
      this.container.innerHTML = '';
      return;
    }

    const statusClass = `progress-status-${this.state.status}`;
    const statusIcon = this.getStatusIcon();

    this.container.innerHTML = `
      <div class="progress-indicator ${statusClass}">
        <div class="progress-header">
          <span class="progress-icon">${statusIcon}</span>
          <span class="progress-message">${this.escapeHtml(this.state.message)}</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: ${this.state.percentage}%"></div>
        </div>
        <div class="progress-percentage">${this.state.percentage}%</div>
      </div>
    `;

    this.addStyles();
  }

  /**
   * Get icon for current status
   */
  private getStatusIcon(): string {
    switch (this.state.status) {
      case 'uploading':
        return '⬆️';
      case 'processing':
        return '⚙️';
      case 'extracting':
        return '🎵';
      case 'complete':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⏳';
    }
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
    if (document.getElementById('progress-indicator-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'progress-indicator-styles';
    style.textContent = `
      .progress-indicator {
        padding: 1.5rem;
        background-color: #f7fafc;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        margin-bottom: 1rem;
      }

      .progress-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }

      .progress-icon {
        font-size: 1.5rem;
      }

      .progress-message {
        font-size: 0.95rem;
        font-weight: 600;
        color: #4a5568;
      }

      .progress-bar-container {
        width: 100%;
        height: 10px;
        background-color: #e2e8f0;
        border-radius: 5px;
        overflow: hidden;
        margin-bottom: 0.5rem;
      }

      .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        transition: width 0.3s ease;
        border-radius: 5px;
      }

      .progress-percentage {
        text-align: center;
        font-size: 0.9rem;
        font-weight: 600;
        color: #4a5568;
      }

      .progress-status-complete .progress-bar {
        background: linear-gradient(90deg, #48bb78 0%, #38a169 100%);
      }

      .progress-status-error .progress-bar {
        background: linear-gradient(90deg, #f56565 0%, #e53e3e 100%);
      }

      .progress-status-complete .progress-indicator {
        border-color: #48bb78;
        background-color: #f0fff4;
      }

      .progress-status-error .progress-indicator {
        border-color: #f56565;
        background-color: #fff5f5;
      }
    `;

    document.head.appendChild(style);
  }
}

import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'danger' | 'info';
    borderColor?: string; // กำหนดสี border เอง
}

@Component({
    selector: 'app-confirm-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule
    ],
    template: `
    <div class="confirm-dialog" [ngStyle]="getBorderStyle()">
      <!-- Icon -->
      <div class="dialog-icon" [class]="data.type || 'warning'">
        <mat-icon>{{ getIcon() }}</mat-icon>
      </div>

      <!-- Content -->
      <h2 class="dialog-title">{{ data.title || 'ยืนยันการดำเนินการ' }}</h2>
      <p class="dialog-message">{{ data.message }}</p>

      <!-- Actions -->
      <div class="dialog-actions">
        <button mat-button class="btn-cancel" (click)="onCancel()">
          {{ data.cancelText || 'ยกเลิก' }}
        </button>
        <button mat-flat-button class="btn-confirm" [class]="data.type || 'warning'" (click)="onConfirm()">
          {{ data.confirmText || 'ยืนยัน' }}
        </button>
      </div>
    </div>
  `,
    styles: [`
    :host {
      display: block;
    }

    /* Override Material Dialog container */
    ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
      border-radius: 16px !important;
      overflow: hidden;
    }

    .confirm-dialog {
      padding: 24px;
      text-align: center;
      max-width: 360px;
    }

    .dialog-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }

      &.warning {
        background: #fff3cd;
        mat-icon { color: #856404; }
      }

      &.danger {
        background: #f8d7da;
        mat-icon { color: #721c24; }
      }

      &.info {
        background: #e8f4fd;
        mat-icon { color: #2A405E; }
      }
    }

    .dialog-title {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
    }

    .dialog-message {
      margin: 0 0 24px;
      font-size: 14px;
      color: #6c757d;
      line-height: 1.5;
    }

    .dialog-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .btn-cancel {
      border: 1px solid #dee2e6;
      border-radius: 8px;
      color: #495057;
      min-width: 100px;

      &:hover {
        background: #f8f9fa;
      }
    }

    .btn-confirm {
      border-radius: 8px;
      min-width: 100px;

      &.warning {
        background: #2A405E;
        color: white;
      }

      &.danger {
        background: #dc3545;
        color: white;
      }

      &.info {
        background: #2A405E;
        color: white;
      }
    }
  `]
})
export class ConfirmDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<ConfirmDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
    ) { }

    getIcon(): string {
        switch (this.data.type) {
            case 'danger': return 'warning';
            case 'info': return 'info';
            default: return 'help_outline';
        }
    }

    getBorderStyle(): { [key: string]: string } {
        if (this.data.borderColor) {
            return { 'border-color': this.data.borderColor };
        }
        // Default border color based on type
        switch (this.data.type) {
            case 'danger': return { 'border-color': '#dc3545' };
            case 'info': return { 'border-color': '#2A405E' };
            case 'warning': return { 'border-color': '#ffc107' };
            default: return {};
        }
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }

    onConfirm(): void {
        this.dialogRef.close(true);
    }
}

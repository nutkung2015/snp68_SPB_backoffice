import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

export interface InputDialogData {
    title?: string;
    message?: string;
    label?: string;
    placeholder?: string;
    value?: string;
    confirmText?: string;
    cancelText?: string;
    icon?: string;
}

@Component({
    selector: 'app-input-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatIconModule,
        FormsModule
    ],
    template: `
    <div class="input-dialog">
      <!-- Icon -->
      <div class="dialog-icon">
        <mat-icon>{{ data.icon || 'edit' }}</mat-icon>
      </div>

      <!-- Content -->
      <h2 class="dialog-title">{{ data.title || 'ระบุข้อมูล' }}</h2>
      <p class="dialog-message" *ngIf="data.message">{{ data.message }}</p>

      <div class="dialog-content">
        <mat-form-field appearance="outline" class="full-width custom-field">
          <mat-label>{{ data.label || 'ข้อมูล' }}</mat-label>
          <input matInput [(ngModel)]="inputValue" [placeholder]="data.placeholder || ''" 
                 (keyup.enter)="onConfirm()" autofocus>
        </mat-form-field>
      </div>

      <!-- Actions -->
      <div class="dialog-actions">
        <button mat-button class="btn-cancel" (click)="onCancel()">
          {{ data.cancelText || 'ยกเลิก' }}
        </button>
        <button mat-flat-button class="btn-confirm" (click)="onConfirm()" [disabled]="!inputValue.trim()">
          {{ data.confirmText || 'ยืนยัน' }}
        </button>
      </div>
    </div>
  `,
    styles: [`
    :host {
      display: block;
    }

    ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
      border-radius: 24px !important;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1) !important;
    }

    .input-dialog {
      padding: 32px;
      text-align: center;
      min-width: 400px;
      max-width: 100%;
      background: white;
      box-sizing: border-box;
      overflow: hidden;
    }

    .dialog-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #eef5ff;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: #2A405E;
      }
    }

    .dialog-title {
      margin: 0 0 12px;
      font-size: 24px;
      font-weight: 700;
      color: #1a1a1a;
      letter-spacing: -0.5px;
    }

    .dialog-message {
      margin: 0 0 24px;
      font-size: 15px;
      color: #64748b;
      line-height: 1.6;
    }

    .dialog-content {
      margin-bottom: 32px;
      text-align: left;
      width: 100%;
      box-sizing: border-box;
    }

    .full-width {
      width: 100%;
      box-sizing: border-box;
    }

    ::ng-deep .custom-field {
      width: 100% !important;
      
      .mat-mdc-text-field-wrapper {
        width: 100% !important;
      }

      .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }

      .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__leading,
      .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__notch,
      .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__trailing {
        border-color: #cbd5e1 !important;
      }

      .mdc-text-field--outlined:not(.mdc-text-field--disabled).mdc-text-field--focused .mdc-notched-outline__leading,
      .mdc-text-field--outlined:not(.mdc-text-field--disabled).mdc-text-field--focused .mdc-notched-outline__notch,
      .mdc-text-field--outlined:not(.mdc-text-field--disabled).mdc-text-field--focused .mdc-notched-outline__trailing {
        border-color: #2A405E !important;
        border-width: 2px !important;
      }

      .mat-mdc-form-field-label-wrapper {
        color: #64748b;
      }

      &.mat-focused .mat-mdc-form-field-label-wrapper {
        color: #2A405E;
      }
    }

    .dialog-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
    }

    .btn-cancel {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0 32px;
      height: 48px;
      color: #475569;
      font-weight: 500;
      font-size: 16px;

      &:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
      }
    }

    .btn-confirm {
      border-radius: 12px;
      padding: 0 32px;
      height: 48px;
      background: #2A405E;
      color: white;
      font-weight: 500;
      font-size: 16px;
      min-width: 140px;

      &:disabled {
        background: #f1f5f9 !important;
        color: #cbd5e1 !important;
      }

      &:not(:disabled):hover {
        background: #1e2e44;
        box-shadow: 0 4px 12px rgba(42, 64, 94, 0.2);
      }
    }
  `]
})
export class InputDialogComponent {
    inputValue: string = '';

    constructor(
        public dialogRef: MatDialogRef<InputDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: InputDialogData
    ) {
        if (data.value) {
            this.inputValue = data.value;
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onConfirm(): void {
        if (this.inputValue && this.inputValue.trim()) {
            this.dialogRef.close(this.inputValue.trim());
        }
    }
}

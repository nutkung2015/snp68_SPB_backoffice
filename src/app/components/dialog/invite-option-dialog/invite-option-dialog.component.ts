import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-invite-option-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="invite-option-dialog">
      <h2 mat-dialog-title>เลือกวิธีเพิ่มสมาชิก</h2>
      <mat-dialog-content>
        <div class="options-container">
          <button mat-raised-button class="option-btn create-account" (click)="selectOption('create')">
            <mat-icon>person_add</mat-icon>
            <div class="option-text">
              <span class="option-title">สร้างบัญชีใหม่</span>
              <span class="option-desc">สร้างบัญชีผู้ใช้นิติบุคคลใหม่</span>
            </div>
          </button>
          <button mat-raised-button class="option-btn invite" (click)="selectOption('invite')">
            <mat-icon>mail</mat-icon>
            <div class="option-text">
              <span class="option-title">เชิญด้วยคำเชิญ</span>
              <span class="option-desc">ส่งลิงก์เชิญไปยังอีเมลสมาชิก</span>
            </div>
          </button>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">ยกเลิก</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .invite-option-dialog {
      padding: 8px;
      font-family: 'LINE Seed Sans TH', sans-serif;
      border-radius: 24px !important;
    }
    
    h2[mat-dialog-title] {
      font-weight: 600 !important;
      margin-bottom: 16px !important;
      font-family: 'LINE Seed Sans TH', sans-serif;
    }
    
    .options-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 300px !important;
    }
    
    .option-btn {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px !important;
      text-align: left;
      height: auto;
      border-radius: 12px;
      transition: all 0.2s ease;
      font-family: 'LINE Seed Sans TH', sans-serif;
    }
    
    .option-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .option-btn mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }
    
    .option-btn.create-account {
      background: linear-gradient(135deg, #2A405E 0%, #217FFF 100%);
      color: white;
    }
    
    .option-btn.invite {
      background: linear-gradient(135deg, #2A405E 0%, #141e2cff 100%);
      color: white;
    }
    
    .option-text {
      display: flex;
      flex-direction: column;
    }
    
    .option-title {
      font-size: 16px;
      font-weight: 600;
    }
    
    .option-desc {
      font-size: 12px;
      opacity: 0.9;
      margin-top: 4px;
    }
    
    mat-dialog-actions {
      padding-top: 16px !important;
      
      button {
        font-family: 'LINE Seed Sans TH', sans-serif;
        border: 2px solid #2A405E;
        border-radius: 10px;
        color: #2A405E;
      }
    }
  `]
})
export class InviteOptionDialogComponent {
  constructor(private dialogRef: MatDialogRef<InviteOptionDialogComponent>) { }

  selectOption(option: 'create' | 'invite'): void {
    this.dialogRef.close(option);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}

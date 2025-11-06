import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';

export interface InvitationSuccessData {
  invitationCode: string;
  role: string;
  type: 'resident' | 'juristic';
}

@Component({
  selector: 'app-invitation-success-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    FormsModule,
    FlexLayoutModule,
  ],
  template: `
    <div class="dialog-container" fxLayout="column" fxLayoutAlign="center center" fxLayoutGap="20px">
      <div class="success-icon">
        <mat-icon>check_circle</mat-icon>
      </div>

      <div class="dialog-title">
        <h2>สร้างคำเชิญสำเร็จ!</h2>
      </div>

      <div class="invitation-info" fxLayout="column" fxLayoutAlign="center center" fxLayoutGap="16px">
        <div class="info-item">
          <span class="label">ประเภทคำเชิญ:</span>
          <span class="value">{{ getTypeLabel() }}</span>
        </div>

        <div class="info-item">
          <span class="label">บทบาท:</span>
          <span class="value">{{ getRoleLabel() }}</span>
        </div>
      </div>

      <div class="invitation-code-section" fxLayout="column" fxLayoutAlign="center center" fxLayoutGap="12px">
        <span class="code-label">รหัสคำเชิญ</span>
        <div class="code-display" fxLayout="row" fxLayoutAlign="space-between center">
          <input
            #codeInput
            [value]="data.invitationCode"
            readonly
            class="code-input"
          />
          <button
            mat-icon-button
            class="copy-button"
            (click)="copyToClipboard(codeInput)"
            matTooltip="คัดลอก"
          >
            <mat-icon>content_copy</mat-icon>
          </button>
        </div>
      </div>

      <div class="dialog-actions" fxLayout="row" fxLayoutGap="12px">
        <button mat-stroked-button (click)="closeDialog()">
          ปิด
        </button>
      </div>
    </div>
  `,
styleUrls: ['./invitation-success-dialog.component.scss']

})
export class InvitationSuccessDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<InvitationSuccessDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InvitationSuccessData
  ) {}

  getTypeLabel(): string {
    return this.data.type === 'resident' ? 'ผู้อยู่อาศัย' : 'นิติบุคคล/รปภ.';
  }

  getRoleLabel(): string {
    const roleLabels: { [key: string]: string } = {
      'owner': 'เจ้าของ',
      'family': 'ครอบครัว',
      'tenant': 'ผู้เช่า',
      'juristicLeader': 'ผู้นำนิติบุคคล',
      'juristicMember': 'สมาชิกนิติบุคคล',
      'security': 'รปภ.'
    };
    return roleLabels[this.data.role] || this.data.role;
  }

  copyToClipboard(inputElement: HTMLInputElement): void {
    inputElement.select();
    inputElement.setSelectionRange(0, 99999); // สำหรับ mobile devices

    // Declare originalPlaceholder outside try block for proper scoping
    const originalPlaceholder = inputElement.placeholder;

    try {
      document.execCommand('copy');
      // แสดงข้อความสำเร็จชั่วคราว
      inputElement.placeholder = 'คัดลอกแล้ว!';
      setTimeout(() => {
        inputElement.placeholder = originalPlaceholder;
      }, 1500);
    } catch (err) {
      console.error('ไม่สามารถคัดลอกได้:', err);
      // Fallback สำหรับเบราว์เซอร์ที่ไม่รองรับ
      navigator.clipboard.writeText(inputElement.value).then(() => {
        inputElement.placeholder = 'คัดลอกแล้ว!';
        setTimeout(() => {
          inputElement.placeholder = originalPlaceholder;
        }, 1500);
      }).catch(err => {
        console.error('Fallback copy ไม่สำเร็จ:', err);
      });
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}

import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { QRCodeModule } from 'angularx-qrcode';


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
    QRCodeModule,
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

      <!-- QR Code Section -->
      <div class="qr-code-section" fxLayout="column" fxLayoutAlign="center center" fxLayoutGap="12px">
        <span class="qr-label">สแกน QR Code เพื่อเข้าร่วม</span>
        <div class="qr-code-wrapper">
          <qrcode
            [qrdata]="getJoinUrl()"
            [width]="180"
            [errorCorrectionLevel]="'M'"
            [margin]="2"
          ></qrcode>
        </div>
      </div>

      <div class="invitation-code-section" fxLayout="column" fxLayoutAlign="center center" fxLayoutGap="12px">
        <span class="code-label">รหัสคำเชิญ (6 หลัก)</span>
        <div class="code-display" fxLayout="row" fxLayoutAlign="space-between center">
          <input
            #codeInput
            [value]="getFormattedCode()"
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
        <span class="code-hint">แชร์รหัสนี้ หรือให้ผู้รับสแกน QR Code ด้านบน</span>
      </div>

      <div class="dialog-actions" fxLayout="row" fxLayoutGap="12px">
        <button mat-stroked-button (click)="copyAllInfo()">
          <mat-icon>share</mat-icon>
          คัดลอกทั้งหมด
        </button>
        <button mat-flat-button color="primary" (click)="closeDialog()">
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
  ) { }

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

  /**
   * Get formatted 6-digit code (uppercase)
   */
  getFormattedCode(): string {
    const code = this.data.invitationCode || '';
    // If code is longer than 6 chars, take last 6 or format appropriately
    return code.toUpperCase().slice(-6) || code.toUpperCase();
  }

  /**
   * Return only the invitation code for QR Code
   */
  getJoinUrl(): string {
    return this.getFormattedCode();
  }

  copyToClipboard(inputElement: HTMLInputElement): void {
    inputElement.select();
    inputElement.setSelectionRange(0, 99999);

    const originalPlaceholder = inputElement.placeholder;

    try {
      document.execCommand('copy');
      inputElement.placeholder = 'คัดลอกแล้ว!';
      setTimeout(() => {
        inputElement.placeholder = originalPlaceholder;
      }, 1500);
    } catch (err) {
      console.error('ไม่สามารถคัดลอกได้:', err);
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

  /**
   * Copy all invitation info including code and join URL
   */
  copyAllInfo(): void {
    const typeLabel = this.getTypeLabel();
    const roleLabel = this.getRoleLabel();
    const code = this.getFormattedCode();

    const shareText = `🏠 คำเชิญเข้าร่วมโครงการ

📋 ประเภท: ${typeLabel}
👤 บทบาท: ${roleLabel}
🔑 รหัสคำเชิญ: ${code}

กรุณาใช้รหัสนี้ หรือสแกน QR Code เพื่อเข้าร่วมโครงการ`;

    navigator.clipboard.writeText(shareText).then(() => {
      alert('คัดลอกข้อมูลทั้งหมดแล้ว!');
    }).catch(err => {
      console.error('ไม่สามารถคัดลอกได้:', err);
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}

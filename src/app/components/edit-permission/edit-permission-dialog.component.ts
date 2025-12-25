import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { FlexLayoutModule } from '@angular/flex-layout';

import { JuristicMember, Permission } from './edit-permission.component';

export interface DialogData {
  member: JuristicMember;
  permissionLabels: { [key: string]: string };
}

@Component({
  selector: 'app-edit-permission-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatDividerModule,
    FlexLayoutModule,
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <div fxLayout="row" fxLayoutAlign="start center" fxLayoutGap="12px">
          <div class="avatar">
            <mat-icon>person</mat-icon>
          </div>
          <div fxLayout="column" fxLayoutGap="2px">
            <h2 class="dialog-title">แก้ไขสิทธิ์</h2>
            <span class="member-name">{{ data.member.full_name }}</span>
            <span class="member-email">{{ data.member.email }}</span>
          </div>
        </div>
        <button mat-icon-button (click)="onCancel()" class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-divider></mat-divider>

      <div class="dialog-content">
        <div class="role-info">
          <span class="label">บทบาทปัจจุบัน:</span>
          <span class="role-badge" [ngClass]="getRoleBadgeClass(data.member.role_in_project)">
            {{ getRoleDisplayName(data.member.role_in_project) }}
          </span>
        </div>

        <div class="permissions-section">
          <h3 class="section-title">
            <mat-icon>security</mat-icon>
            <span>สิทธิ์การใช้งาน</span>
          </h3>

          <div class="permission-list">
            <div class="permission-item" *ngFor="let perm of permissionKeys">
              <div class="permission-info">
                <mat-icon class="permission-icon">{{ getPermissionIcon(perm) }}</mat-icon>
                <span class="permission-label">{{ data.permissionLabels[perm] }}</span>
              </div>
              <mat-slide-toggle
                [(ngModel)]="localPermissions[perm]"
                color="primary"
                [disabled]="isLeaderOnlyPermission(perm) && data.member.role_in_project !== 'juristicLeader'">
              </mat-slide-toggle>
            </div>
          </div>
        </div>
      </div>

      <mat-divider></mat-divider>

      <div class="dialog-actions">
        <button mat-button class="btn-cancel" (click)="onCancel()">ยกเลิก</button>
        <button mat-flat-button color="primary" class="btn-save" (click)="onSave()">
          <mat-icon>save</mat-icon>
          บันทึก
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      min-width: 400px;
      max-width: 500px;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 20px 24px;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    }

    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        color: white;
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    .dialog-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
    }

    .member-name {
      font-size: 14px;
      color: #475569;
      font-weight: 500;
    }

    .member-email {
      font-size: 12px;
      color: #94a3b8;
    }

    .close-button {
      position: absolute;
      top: 12px;
      right: 12px;
      color: #64748b;

      &:hover {
        color: #1e293b;
      }
    }

    .dialog-content {
      padding: 20px 24px;
      max-height: 400px;
      overflow-y: auto;
    }

    .role-info {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding: 12px 16px;
      background: #f8fafc;
      border-radius: 8px;

      .label {
        color: #64748b;
        font-size: 14px;
      }

      .role-badge {
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 600;
      }
    }

    .role-leader {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      color: #92400e;
    }

    .role-juristic {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      color: #1e40af;
    }

    .role-security {
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      color: #166534;
    }

    .permissions-section {
      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        color: #475569;
        margin-bottom: 16px;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          color: #3b82f6;
        }
      }
    }

    .permission-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .permission-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      transition: all 0.2s ease;

      &:hover {
        border-color: #3b82f6;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
      }
    }

    .permission-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .permission-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #64748b;
    }

    .permission-label {
      font-size: 14px;
      color: #334155;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      background: #f8fafc;
    }

    .btn-cancel {
      color: #64748b;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }

    .btn-save {
      border-radius: 8px;
      min-width: 120px;

      mat-icon {
        margin-right: 4px;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    ::ng-deep .mat-mdc-slide-toggle .mdc-switch--selected .mdc-switch__track::after {
      background: #3b82f6 !important;
    }
  `]
})
export class EditPermissionDialogComponent {
  localPermissions: { [key: string]: boolean } = {};
  permissionKeys: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<EditPermissionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    // Copy permissions locally for editing
    this.permissionKeys = Object.keys(data.permissionLabels);
    this.permissionKeys.forEach(key => {
      this.localPermissions[key] = (data.member.permissions as any)[key] || false;
    });
  }

  getPermissionIcon(perm: string): string {
    const icons: { [key: string]: string } = {
      canViewAnnouncements: 'campaign',
      canCreateAnnouncements: 'edit_note',
      canManageResidents: 'people',
      canManageUnits: 'home_work',
      canManageIssues: 'build',
      canManageVisitors: 'person_pin',
      canManageSettings: 'settings',
      canManagePermissions: 'admin_panel_settings',
    };
    return icons[perm] || 'check_circle';
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'juristicLeader':
        return 'role-leader';
      case 'juristicMember':
        return 'role-juristic';
      case 'security':
        return 'role-security';
      default:
        return 'role-juristic';
    }
  }

  getRoleDisplayName(role: string): string {
    switch (role) {
      case 'juristicLeader':
        return 'หัวหน้านิติบุคคล';
      case 'juristicMember':
        return 'นิติบุคคล';
      case 'security':
        return 'รปภ.';
      default:
        return role;
    }
  }

  isLeaderOnlyPermission(perm: string): boolean {
    return perm === 'canManagePermissions' || perm === 'canManageSettings';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close(this.localPermissions);
  }
}

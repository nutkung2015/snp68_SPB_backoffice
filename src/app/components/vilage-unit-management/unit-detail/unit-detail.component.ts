import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import {
  RestService,
  UnitDetailData,
  UnitDetailInfo,
  UnitResident,
  UnitHouseModel,
  UnitInvitationHistory
} from '../../../services/rest.service';
import { LoadingDataComponent } from '../../../shared/loading-data/loading-data.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-unit-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    MatDialogModule,
    FlexLayoutModule,
    LoadingDataComponent
  ],
  templateUrl: './unit-detail.component.html',
  styleUrl: './unit-detail.component.scss'
})
export class UnitDetailComponent implements OnInit {
  isLoading = new BehaviorSubject<boolean>(true);
  isLoading$ = this.isLoading.asObservable();

  unitInfo?: UnitDetailInfo;
  residents: UnitResident[] = [];
  houseModel?: UnitHouseModel | null;
  invitationHistory: UnitInvitationHistory[] = [];

  // Table columns
  residentColumns: string[] = ['full_name', 'email', 'phone', 'role', 'joined_at'];
  invitationColumns: string[] = ['code', 'status', 'role', 'invited_email', 'invited_phone', 'invited_by_name', 'created_at', 'expires_at'];

  constructor(
    private restService: RestService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    const unitId = this.route.snapshot.params['id'];
    if (unitId) {
      this.loadUnitDetail(unitId);
    } else {
      this.showErrorDialog('ไม่พบรหัสยูนิต', 'danger');
      this.router.navigate(['/village']);
    }
  }

  loadUnitDetail(unitId: string): void {
    this.isLoading.next(true);

    this.restService.getUnitDetail(unitId).subscribe({
      next: (response) => {
        if (response.status === 'success' && response.data) {
          const data: UnitDetailData = response.data;
          this.unitInfo = data.unit_info;
          this.residents = data.residents || [];
          this.houseModel = data.house_model;
          this.invitationHistory = data.invitation_history || [];
        } else {
          this.showErrorDialog(response.message || 'ไม่สามารถโหลดข้อมูลยูนิตได้', 'warning');
        }
      },
      error: (err) => {
        console.error('Error loading unit detail:', err);
        this.handleApiError(err);
      },
      complete: () => {
        this.isLoading.next(false);
      }
    });
  }

  handleApiError(error: any): void {
    let title = 'เกิดข้อผิดพลาด';
    let message = 'ไม่สามารถโหลดข้อมูลได้';
    let type: 'warning' | 'danger' | 'info' = 'danger';

    // Check for specific HTTP status codes
    if (error?.status === 401) {
      title = 'ไม่ได้เข้าสู่ระบบ';
      message = 'Unauthorized - กรุณาเข้าสู่ระบบใหม่อีกครั้ง';
      type = 'warning';
    } else if (error?.status === 403) {
      title = 'ไม่มีสิทธิ์เข้าถึง';
      message = 'Unauthorized: Only Juristic or Admins can view full unit details.';
      type = 'warning';
    } else if (error?.status === 404) {
      title = 'ไม่พบข้อมูล';
      message = 'Unit not found.';
      type = 'warning';
    } else if (error?.status === 500) {
      title = 'เซิร์ฟเวอร์ผิดพลาด';
      message = 'Server error - กรุณาลองใหม่อีกครั้ง';
      type = 'danger';
    } else if (typeof error === 'string') {
      message = error;
    }

    this.showErrorDialog(message, type, title);
  }

  showErrorDialog(message: string, type: 'warning' | 'danger' | 'info' = 'warning', title?: string): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: title || 'แจ้งเตือน',
        message: message,
        confirmText: 'ตกลง',
        type: type
      }
    }).afterClosed().subscribe(() => {
      // If it's a 401, redirect to login
      if (type === 'warning' && message.includes('Unauthorized')) {
        this.router.navigate(['/village']);
      }
    });
  }

  // Status styling
  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'occupied':
      case 'active':
        return 'status-active';
      case 'vacant':
      case 'inactive':
        return 'status-inactive';
      default:
        return 'status-default';
    }
  }

  getStatusText(status: string): string {
    switch (status?.toLowerCase()) {
      case 'occupied':
        return 'มีผู้อยู่อาศัย';
      case 'active':
        return 'ใช้งาน';
      case 'vacant':
      case 'inactive':
        return 'ไม่มีผู้อยู่อาศัย';
      default:
        return status || '-';
    }
  }

  // Role styling
  getRoleClass(role: string): string {
    switch (role?.toLowerCase()) {
      case 'owner':
        return 'role-owner';
      case 'tenant':
        return 'role-tenant';
      case 'family':
        return 'role-family';
      default:
        return 'role-default';
    }
  }

  getRoleText(role: string): string {
    switch (role?.toLowerCase()) {
      case 'owner':
        return 'เจ้าของ';
      case 'tenant':
        return 'ผู้เช่า';
      case 'family':
        return 'ครอบครัว';
      default:
        return role || '-';
    }
  }

  // Invitation status styling
  getInvitationStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return 'badge-green';
      case 'pending':
        return 'badge-yellow';
      case 'expired':
        return 'badge-gray';
      case 'revoked':
        return 'badge-red';
      default:
        return 'badge-default';
    }
  }

  getInvitationStatusText(status: string): string {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return 'ยอมรับแล้ว';
      case 'pending':
        return 'รอดำเนินการ';
      case 'expired':
        return 'หมดอายุ';
      case 'revoked':
        return 'ถูกยกเลิก';
      default:
        return status || '-';
    }
  }

  // Date formatting
  formatDateTime(dateStr: string | null): string {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('th-TH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '-';
    }
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('th-TH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return '-';
    }
  }

  // File actions
  openPlanFile(): void {
    if (this.houseModel?.plan_file_url) {
      window.open(this.houseModel.plan_file_url, '_blank');
    }
  }

  openDetailFile(): void {
    if (this.houseModel?.detail_file_url) {
      window.open(this.houseModel.detail_file_url, '_blank');
    }
  }

  // Navigation
  onBack(): void {
    this.router.navigate(['/village']);
  }
}

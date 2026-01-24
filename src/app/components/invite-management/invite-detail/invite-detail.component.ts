import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { QRCodeModule } from 'angularx-qrcode';
import { ActivatedRoute, Router } from '@angular/router';
import { RestService, UnitInvitation } from '../../../services/rest.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { ToastService } from '../../../shared/toast/toast.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FlexLayoutModule } from '@angular/flex-layout';

@Component({
  selector: 'app-invite-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    QRCodeModule,
    PageHeaderComponent,
    MatProgressSpinnerModule,
    FlexLayoutModule
  ],
  templateUrl: './invite-detail.component.html',
  styleUrls: ['./invite-detail.component.scss']
})
export class InviteDetailComponent implements OnInit {
  invitation: UnitInvitation | null = null;
  isLoading = false;
  invitationId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private restService: RestService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.invitationId = this.route.snapshot.paramMap.get('id');
    if (this.invitationId) {
      this.loadInvitation(this.invitationId);
    } else {
      this.toast.error('ไม่พบรหัสคำเชิญ');
      this.onBack();
    }
  }

  loadInvitation(id: string): void {
    this.isLoading = true;
    this.restService.getUnitInvitationById(id).subscribe({
      next: (response) => {
        if (response.data) {
          this.invitation = response.data;
        } else {
          this.toast.error('ไม่พบข้อมูลคำเชิญ');
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading invitation:', err);
        this.toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        this.isLoading = false;
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/invite-management']);
  }

  formatDate(dateVal: any): string {
    if (!dateVal) return '-';
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return '-';

    // Format: DD/MM/YYYY HH:mm
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  getRemainingDays(dateVal: any): string {
    if (!dateVal) return '';
    const expiryDate = new Date(dateVal);
    if (isNaN(expiryDate.getTime())) return '';

    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return '(หมดอายุแล้ว)';
    if (diffDays === 0) return '(หมดอายุวันนี้)';
    return `(อีก ${diffDays} วัน)`;
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'รอดำเนินการ';
      case 'accepted': return 'ตอบรับแล้ว';
      case 'declined': return 'ปฏิเสธ';
      case 'expired': return 'หมดอายุ';
      default: return status;
    }
  }
}

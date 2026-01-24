import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { LoadingDataComponent } from '../../../shared/loading-data/loading-data.component';
import { MatLabel } from '@angular/material/form-field';
import { RestService } from '../../../services/rest.service';
import { IssuePersonalConfirmDeleteComponent } from '../../dialog/issue-personal-confirm-delete/issue-personal-confirm-delete.component';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ToastService } from '../../../shared/toast/toast.service';

interface ImageUrl {
  url: string;
  public_id: string;
}

// สร้าง Interface ใหม่ตาม Shape Data ของ Common Issue
export interface CommonIssue {
  id: string;
  unit_id: string;
  project_id: string;
  zone: string;
  reporter_name: string;
  reporter_id: string;
  reported_date: string;
  issue_type: string;
  location: string;
  description: string;
  image_urls: ImageUrl[];
  status: string;
  assigned_to: string | null;
  priority: string;
  notes: string | null;
  resolved_date: string | null;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-issue-common-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    FlexLayoutModule,
    LoadingDataComponent,
    MatLabel,
    MatButtonModule
  ],
  templateUrl: './issue-common-detail.component.html',
  styleUrl: './issue-common-detail.component.scss'
})
export class IssueCommonDetailComponent implements OnInit {
  isLoading = new BehaviorSubject<boolean>(true);
  isLoading$ = this.isLoading.asObservable();

  issue?: CommonIssue;
  imageUrls: ImageUrl[] = [];

  constructor(
    private http: HttpClient,
    private rest: RestService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private toast: ToastService
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.loadIssue(id);
  }

  loadIssue(id: string) {
    // ใช้ API getCommonIssueById ตามที่ระบุ
    this.rest.getCommonIssueById(id).subscribe({
      next: (response: any) => {
        // Backend return shape: { status: "success", data: object }
        if (response.status === 'success') {
          this.issue = response.data;
          this.imageUrls = this.issue?.image_urls || [];
        }
        this.isLoading.next(false);
      },
      error: (error) => {
        console.error('Error loading common issue:', error);
        this.toast.error('ไม่สามารถโหลดข้อมูลแจ้งซ่อมได้');
        this.isLoading.next(false);
      }
    });
  }

  getTypeLabel(type: string): string {
    const typeMap: { [key: string]: string } = {
      AssetsFacilities: 'ทรัพย์สิน/สิ่งอำนวยความสะดวก',
      plumbing: 'ประปา',
      electrical: 'ไฟฟ้า',
      building: 'อาคาร',
      other: 'อื่นๆ'
    };
    return typeMap[type] || type;
  }

  getPriorityLabel(priority: string): string {
    const priorityMap: { [key: string]: string } = {
      low: 'ต่ำ',
      medium: 'ปานกลาง',
      high: 'สูง',
      critical: 'วิกฤต'
    };
    return priorityMap[priority] || priority;
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: 'รอดำเนินการ', // เพิ่มสถานะ pending ตาม data
      open: 'เปิด',
      in_progress: 'กำลังดำเนินการ',
      resolved: 'แก้ไขแล้ว',
      closed: 'ปิด',
      reopened: 'เปิดใหม่'
    };
    return statusMap[status] || status;
  }

  onBack(): void {
    this.router.navigate(['/issue-common']);
  }

  onEdit(): void {
    if (this.issue) {
      this.router.navigate([`/issue-common/edit/${this.issue.id}`]);
    }
  }

  onDelete(): void {
    if (this.issue?.id) {
      const dialogRef = this.dialog.open(IssuePersonalConfirmDeleteComponent, {
        width: '400px',
        data: {
          toppic: 'คุณต้องการลบรายการแจ้งปัญหานี้หรือไม่?',
          cancel: 'ยกเลิก',
          confirm: 'ยืนยัน'
        },
      });

      dialogRef.afterClosed().subscribe((result: boolean) => {
        if (result) {
          if (!this.issue?.id) { return; }
          // ใช้ API deleteCommonIssue ที่มีใน rest service
          this.rest.deleteCommonIssue(this.issue.id).subscribe({
            next: () => {
              this.toast.success('ลบรายการแจ้งซ่อมเรียบร้อยแล้ว');
              this.router.navigate(['/issue-common']);
            },
            error: (error) => {
              console.error('Error deleting issue:', error);
              this.toast.error('ไม่สามารถลบรายการแจ้งซ่อมได้');
            }
          });
        }
      });
    }
  }
}
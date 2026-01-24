import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RestService, GuardPost } from '../../services/rest.service';
import { AuthService } from '../../services/auth.service';
import { GuardPostDialogComponent } from './guard-post-dialog/guard-post-dialog.component';
import { GateZoneManageDialogComponent } from './gate-zone-manage-dialog/gate-zone-manage-dialog.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-house-guard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatCardModule,
    FlexLayoutModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    PageHeaderComponent
  ],
  templateUrl: './house-guard.component.html',
  styleUrl: './house-guard.component.scss'
})
export class HouseGuardComponent implements OnInit {
  // State
  guardPosts: GuardPost[] = [];
  isLoading = true;
  projectId = '';

  constructor(
    private restService: RestService,
    private authService: AuthService,
    private dialog: MatDialog,
    private toast: ToastService
  ) { }

  // ============================================
  // Lifecycle
  // ============================================

  ngOnInit() {
    this.loadProjectData();
    this.loadGuardPosts();
  }

  // ============================================
  // Computed Properties (Getters)
  // ============================================

  /** จำนวนป้อมที่ active */
  get activeCount(): number {
    return this.guardPosts.filter(p => p.status === 'active').length;
  }

  /** จำนวนโซนทั้งหมด */
  get totalZones(): number {
    return this.guardPosts.reduce((sum, p) => sum + (p.zone_count || 0), 0);
  }

  // ============================================
  // Data Loading
  // ============================================

  /** โหลด project ID จาก auth service */
  private loadProjectData() {
    const memberships = this.authService.getProjectMemberships();
    if (memberships && memberships.length > 0) {
      this.projectId = memberships[0].project_id;
    }
  }

  /** โหลดข้อมูลป้อมยามทั้งหมด */
  loadGuardPosts() {
    if (!this.projectId) return;

    this.isLoading = true;

    this.restService.getGuardPosts(this.projectId).subscribe({
      next: (res) => {
        this.guardPosts = res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading guard posts:', err);
        this.isLoading = false;
      }
    });
  }

  // ============================================
  // Actions
  // ============================================

  /** เปิด dialog เพิ่ม/แก้ไขป้อมยาม */
  openDialog(guardPost?: GuardPost) {
    const dialogRef = this.dialog.open(GuardPostDialogComponent, {
      width: '500px',
      data: { guardPost, projectId: this.projectId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      if (guardPost) {
        // แก้ไข
        this.restService.updateGuardPost(guardPost.id, result).subscribe({
          next: () => {
            this.toast.success('แก้ไขข้อมูลเรียบร้อยแล้ว');
            this.loadGuardPosts();
          },
          error: (err) => this.toast.error('ไม่สามารถแก้ไขได้: ' + (err.message || 'เกิดข้อผิดพลาด'))
        });
      } else {
        // เพิ่มใหม่
        this.restService.createGuardPost(result).subscribe({
          next: () => {
            this.toast.success('เพิ่มข้อมูลเรียบร้อยแล้ว');
            this.loadGuardPosts();
          },
          error: (err) => this.toast.error('ไม่สามารถเพิ่มได้: ' + (err.message || 'เกิดข้อผิดพลาด'))
        });
      }
    });
  }

  /** ลบป้อมยาม */
  deleteGuardPost(post: GuardPost) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'ลบป้อมยาม',
        message: `ต้องการลบป้อม "${post.post_name}" หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`,
        confirmText: 'ลบ',
        cancelText: 'ยกเลิก',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.restService.deleteGuardPost(post.id).subscribe({
        next: () => {
          this.toast.success(`ลบป้อม "${post.post_name}" เรียบร้อยแล้ว`);
          this.loadGuardPosts();
        },
        error: (err) => {
          this.toast.error('ไม่สามารถลบได้: ' + (err.message || 'กรุณาลองใหม่อีกครั้ง'));
        }
      });
    });
  }

  /** เปิด dialog จัดการโซน */
  openZoneManage(guardPost: GuardPost) {
    const dialogRef = this.dialog.open(GateZoneManageDialogComponent, {
      width: '500px',
      data: { guardPost, projectId: this.projectId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadGuardPosts();
      }
    });
  }
}

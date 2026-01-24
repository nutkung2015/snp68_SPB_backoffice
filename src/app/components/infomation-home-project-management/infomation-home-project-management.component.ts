import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UnitService } from '../../services/unit.service';
import { RestService } from '../../services/rest.service';
import { AuthService } from '../../services/auth.service';
import { forkJoin } from 'rxjs';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ToastService } from '../../shared/toast/toast.service';
import { InputDialogComponent } from '../../shared/input-dialog/input-dialog.component';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';

interface HouseTypeRow {
  id: number;
  model_name: string;
  plan_file_url: string | null;
  detail_file_url: string | null;
  updated_at: Date | null;
  isUploadingPlan: boolean;
  isUploadingDetail: boolean;
  isEditing: boolean;
}

interface ProjectInfoRow {
  is_created: boolean; // flag to track if record exists or we are creating new
  project_detail_file_url: string | null;
  rules_file_url: string | null;
  updated_at: Date | null;
  isUploadingDetail: boolean;
  isUploadingRules: boolean;
  isEditing: boolean;
}

type ViewMode = 'house_models' | 'project_info';

@Component({
  selector: 'app-infomation-home-project-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
    FormsModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatButtonToggleModule
  ],
  templateUrl: './infomation-home-project-management.component.html',
  styleUrl: './infomation-home-project-management.component.scss'
})
export class InfomationHomeProjectManagementComponent implements OnInit {
  displayedColumns: string[] = ['model_name', 'plan_file', 'detail_file', 'updated_at'];
  dataSource: HouseTypeRow[] = [];
  projectInfoData: ProjectInfoRow = {
    is_created: false,
    project_detail_file_url: null,
    rules_file_url: null,
    updated_at: null,
    isUploadingDetail: false,
    isUploadingRules: false,
    isEditing: false
  };
  viewMode: ViewMode = 'house_models';
  isLoading = false;
  projectId: string | null = null;
  userRole: string | null = null;

  constructor(
    private unitService: UnitService,
    private restService: RestService,
    private authService: AuthService,
    private toast: ToastService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.checkProjectIdAndLoadData();
    this.loadUserRole();
  }

  loadUserRole(): void {
    const memberships = this.authService.getProjectMemberships();
    if (memberships && memberships.length > 0) {
      this.userRole = memberships[0].role || null;
    }
  }

  checkProjectIdAndLoadData(): void {
    const memberships = this.authService.getProjectMemberships();
    if (memberships && memberships.length > 0) {
      this.projectId = memberships[0].project_id;
      this.loadData();
    } else {
      console.error('No project membership found');
    }
  }

  // Permission Getters
  get canEdit(): boolean {
    return this.userRole === 'juristicMember' || this.userRole === 'juristicLeader';
  }

  get canDelete(): boolean {
    return this.userRole === 'juristicLeader';
  }

  get canUpload(): boolean {
    return this.userRole === 'juristicMember' || this.userRole === 'juristicLeader';
  }

  loadData(): void {
    if (!this.projectId) return;

    this.isLoading = true;

    if (this.viewMode === 'house_models') {
      this.restService.getHouseModels(this.projectId).subscribe({
        next: (response) => {
          const houseModels = response.data || [];

          this.dataSource = houseModels.map(model => ({
            id: model.id,
            model_name: model.model_name,
            plan_file_url: model.plan_file_url,
            detail_file_url: model.detail_file_url,
            updated_at: model.updated_at ? new Date(model.updated_at) : null,
            isUploadingPlan: false,
            isUploadingDetail: false,
            isEditing: false
          }));

          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading data:', err);
          this.isLoading = false;
        }
      });
    } else {
      // Load Project Info
      this.restService.getProjectInfoDocs(this.projectId).subscribe({
        next: (response) => {
          const data = response.data;
          if (data) {
            this.projectInfoData = {
              ...this.projectInfoData, // Keep UI state like isEditing if needed, or unnecessary if we want fresh state? Better to reset file data but keep UI state? Actually, usually reload resets everything.
              is_created: true,
              project_detail_file_url: data.project_detail_file_url,
              rules_file_url: data.rules_file_url,
              updated_at: data.updated_at ? new Date(data.updated_at) : null,
              isUploadingDetail: false,
              isUploadingRules: false
              // isEditing: false // Don't force reset isEditing to allow staying in edit mode if needed, or strictly reset? Let's reset to match house model behavior.
            };
            this.projectInfoData.isEditing = false;
          } else {
            // No data found, reset to empty (static card state)
            this.resetProjectInfo();
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading project info:', err);
          this.resetProjectInfo();
          this.isLoading = false;
        }
      });
    }
  }

  resetProjectInfo(): void {
    this.projectInfoData = {
      is_created: false,
      project_detail_file_url: null,
      rules_file_url: null,
      updated_at: null,
      isUploadingDetail: false,
      isUploadingRules: false,
      isEditing: false
    };
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
    this.loadData();
  }

  onFileSelected(event: any, row: HouseTypeRow, fileType: 'plan_file' | 'detail_file'): void {
    const file = event.target.files[0];
    if (file) {
      this.uploadFile(file, row, fileType);
    }
    // Reset input
    event.target.value = '';
  }

  uploadFile(file: File, row: HouseTypeRow, fileType: 'plan_file' | 'detail_file'): void {
    if (!this.projectId) return;

    if (fileType === 'plan_file') row.isUploadingPlan = true;
    else row.isUploadingDetail = true;

    const formData = new FormData();
    formData.append('project_id', this.projectId);
    formData.append('model_name', row.model_name);
    formData.append(fileType, file);

    this.restService.saveHouseModel(formData).subscribe({
      next: () => {
        this.loadData();
        // Reset loading status handled by data reload
      },
      error: (err) => {
        console.error('Upload error:', err);
        this.toast.error('เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
        if (fileType === 'plan_file') row.isUploadingPlan = false;
        else row.isUploadingDetail = false;
      }
    });
  }

  deleteFile(row: HouseTypeRow, fileType: 'plan_file' | 'detail_file'): void {
    if (!confirm('ต้องการลบไฟล์นี้ใช่หรือไม่?')) return;
    if (!this.projectId) return;

    const formData = new FormData();
    formData.append('project_id', this.projectId);
    formData.append('model_name', row.model_name);
    // Append empty string to clear the url in backend
    formData.append(`${fileType}_url`, '');

    this.restService.saveHouseModel(formData).subscribe({
      next: () => {
        this.loadData();
      },
      error: (err) => {
        console.error('Delete error:', err);
        this.toast.error('เกิดข้อผิดพลาดในการลบไฟล์');
      }
    });
  }

  onProjectFileSelected(event: any, fileType: 'project_detail' | 'rules'): void {
    const file = event.target.files[0];
    if (file && this.projectInfoData) {
      this.uploadProjectFile(file, fileType);
    }
    event.target.value = '';
  }

  uploadProjectFile(file: File, fileType: 'project_detail' | 'rules'): void {
    if (!this.projectId || !this.projectInfoData) return;

    if (fileType === 'project_detail') this.projectInfoData.isUploadingDetail = true;
    else this.projectInfoData.isUploadingRules = true;

    const formData = new FormData();
    // Service จะดึง project_id จาก localStorage อัตโนมัติแล้ว

    // เปลี่ยนชื่อ field ให้ตรงกับ backend
    if (fileType === 'project_detail') {
      formData.append('project_detail_file', file);
    } else {
      formData.append('rules_file', file);
    }

    // ไม่ต้องส่ง projectId เป็น parameter แล้ว
    this.restService.saveProjectInfoDocs(formData).subscribe({
      next: () => {
        this.loadData();
      },
      error: (err) => {
        console.error('Upload error:', err);
        this.toast.error('เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
        if (this.projectInfoData) {
          if (fileType === 'project_detail') this.projectInfoData.isUploadingDetail = false;
          else this.projectInfoData.isUploadingRules = false;
        }
      }
    });
  }

  deleteProjectFile(fileType: 'project_detail' | 'rules'): void {
    if (!confirm('ต้องการลบไฟล์นี้ใช่หรือไม่?')) return;
    if (!this.projectId) {
      this.toast.error('ไม่พบ Project ID');
      return;
    }

    this.isLoading = true;
    this.restService.deleteProjectInfoDocs(this.projectId, fileType).subscribe({
      next: () => {
        this.isLoading = false;
        this.loadData();
      },
      error: (err) => {
        console.error('Delete error:', err);
        this.isLoading = false;
        this.toast.error('เกิดข้อผิดพลาดในการลบไฟล์: ' + (err.message || err));
      }
    });
  }

  toggleEditProjectInfo(): void {
    if (this.projectInfoData) {
      this.projectInfoData.isEditing = !this.projectInfoData.isEditing;
    }
  }

  toggleEdit(row: HouseTypeRow): void {
    row.isEditing = !row.isEditing;
  }

  addNewCard(): void {
    const dialogRef = this.dialog.open(InputDialogComponent, {
      width: '400px',
      data: {
        title: 'สร้างแบบบ้านใหม่',
        label: 'ชื่อแบบบ้าน (Type Name)',
        placeholder: 'ระบุชื่อแบบบ้าน...',
        confirmText: 'สร้าง',
        cancelText: 'ยกเลิก',
        icon: 'add_home'
      }
    });

    dialogRef.afterClosed().subscribe(typeName => {
      if (typeName && typeName.trim()) {
        if (this.dataSource.find(x => x.model_name === typeName.trim())) {
          this.toast.warning('มี Unit Type นี้อยู่แล้ว');
          return;
        }

        if (!this.projectId) return;

        const formData = new FormData();
        formData.append('project_id', this.projectId);
        formData.append('model_name', typeName.trim());

        this.restService.saveHouseModel(formData).subscribe({
          next: () => {
            this.toast.success('สร้างแบบบ้านใหม่เรียบร้อยแล้ว');
            this.loadData();
          },
          error: (err) => this.toast.error('ไม่สามารถสร้างแบบบ้านใหม่ได้: ' + err.message)
        });
      }
    });
  }

  deleteCard(row: HouseTypeRow): void {
    if (!confirm(`คุณต้องการลบแบบบ้าน "${row.model_name}" ใช่หรือไม่? หากลบแล้วข้อมูลทั้งหมดของแบบบ้านนี้จะหายไป`)) {
      return;
    }

    if (!row.id) {
      this.toast.error('ไม่พบ ID ของแบบบ้าน');
      return;
    }

    this.isLoading = true;
    this.restService.deleteHouseModel(row.id).subscribe({
      next: () => {
        this.isLoading = false;
        this.toast.success('ลบแบบบ้านเรียบร้อยแล้ว');
        this.loadData(); // Reload data to refresh the grid
      },
      error: (err) => {
        console.error('Delete card error:', err);
        this.isLoading = false;
        this.toast.error('เกิดข้อผิดพลาดในการลบแบบบ้าน: ' + (err.message || err));
      }
    });
  }

  viewPdf(url: string, filename: string): void {
    if (!url) {
      this.toast.warning('ไม่พบ URL ของไฟล์');
      return;
    }
    // เปิด PDF โดยตรงจาก Cloudinary URL
    window.open(url, '_blank');
  }
}

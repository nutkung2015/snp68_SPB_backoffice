import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { LoadingDataComponent } from '../../../shared/loading-data/loading-data.component';
import { BehaviorSubject } from 'rxjs';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AuthService } from '../../../services/auth.service';
import { UnitService, CreateUnitInvitationRequest } from '../../../services/unit.service';
import * as XLSX from 'xlsx';

// อัปเดต interface ให้ตรงกับ API structure ใหม่
export interface Unit {
  project_id: string;
  unit_number: string;
  zone: string;
  building: string;
  // floor: string; // เพิ่มกลับมาตาม API
}

@Component({
  selector: 'app-create-unit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    HttpClientModule,
    MatCardModule,
    MatRadioModule,
    MatCheckboxModule,
    MatDialogModule,
    MatTableModule,
    LoadingDataComponent,
    FlexLayoutModule,
  ],
  templateUrl: './create-unit.component.html',
  styleUrls: ['./create-unit.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CreateUnitComponent implements OnInit {
  isLoading = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoading.asObservable();

  unitForm: FormGroup;
  projectName: string = '';
  projectId: string = '';

  // Import Modal Properties
  showImportModal = false;
  selectedFile: File | null = null;
  fileSize: string = '';
  previewData: any[] = [];
  displayedColumns: string[] = ['house_number', 'zone', 'building', 'area_sqm', 'status'];
  isUploading = false;

  // ตัวเลือกสำหรับ role
  unitRoles = [
    { value: 'owner', label: 'เจ้าของ' },
    { value: 'tenant', label: 'ผู้เช่า' },
    { value: 'family', label: 'ครอบครัว' }
  ];

  // ตัวเลือกสำหรับ zone และ building (อาจดึงจาก API หรือ hardcoded)
  zones = [
    { value: 'Zone A', label: 'โซน A' },
    { value: 'Zone B', label: 'โซน B' },
    { value: 'Zone C', label: 'โซน C' }
  ];

  buildings = [
    { value: 'type1', label: 'อาคาร Type 1' },
    { value: 'type2', label: 'อาคาร Type 2' },
    { value: 'type3', label: 'อาคาร Type 3' }
  ];

  // รายการ units ที่มีอยู่แล้ว (จะโหลดจาก API) - อัปเดต type
  existingUnits: Unit[] = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private unitService: UnitService
  ) {
    this.unitForm = this.fb.group({
      unit_number: ['', [Validators.required]], // กรอกเลขที่บ้าน
      zone: ['', [Validators.required]], // เลือกโซน
      building: ['', [Validators.required]], // เลือกอาคาร
      // floor: ['', [Validators.required]] // เลือกชั้น
    });
  }

  ngOnInit() {
    this.loadProjectData();
    this.updateFormValidators();
  }

  loadProjectData() {
    // โหลดข้อมูลโครงการจาก project memberships (เหมือนเดิม)
    const projectMemberships = this.authService.getProjectMemberships();
    if (projectMemberships && projectMemberships.length > 0) {
      const firstProject = projectMemberships[0];
      this.projectId = firstProject.project_id;
      this.projectName = firstProject.project_name || 'ไม่ระบุชื่อโครงการ';

      // โหลดรายการ units ที่มีอยู่แล้วเพื่อตรวจสอบเลขที่บ้านซ้ำ
      this.loadExistingUnits();
    }
  }

  loadExistingUnits() {
    this.unitService.getUnits(this.projectId).subscribe({
      next: (response) => {
        this.existingUnits = response || [];
      },
      error: (error) => {
        console.error('เกิดข้อผิดพลาดในการโหลดข้อมูล units ที่มีอยู่:', error);
      }
    });
  }

  updateFormValidators() {
    // ไม่ต้อง validate email/phone เพราะไม่มีแล้ว
  }

  // ไม่ต้องมี custom validators

  async onSubmit(): Promise<void> {
    if (this.unitForm.valid) {
      this.isLoading.next(true);

      try {
        const formValue = this.unitForm.value;

        // เตรียมข้อมูลสำหรับส่งไป backend ตาม API structure
        const unitData = {
          project_id: this.projectId,
          unit_number: formValue.unit_number,
          zone: formValue.zone,
          building: formValue.building,
          // floor: formValue.floor
        };

        console.log('กำลังสร้าง unit:', unitData);

        this.http.post('http://localhost:5000/api/units', unitData).subscribe({
          next: (response) => {
            console.log('สร้าง unit สำเร็จ:', response);
            alert('สร้างหน่วยสำเร็จ!');
            this.router.navigate(['/invite-management']);
          },
          error: (error) => {
            console.error('เกิดข้อผิดพลาดในการสร้าง unit:', error);
            alert('เกิดข้อผิดพลาดในการสร้างหน่วย');
          },
          complete: () => {
            this.isLoading.next(false);
          }
        });
      } catch (error) {
        console.error('เกิดข้อผิดพลาดที่ไม่คาดคิด:', error);
        alert('เกิดข้อผิดพลาดที่ไม่คาดคิด');
        this.isLoading.next(false);
      }
    } else {
      alert('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง');
      // แสดง error messages สำหรับแต่ละ field
      Object.keys(this.unitForm.controls).forEach(key => {
        this.unitForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/invite-management']);
  }

  // Helper method สำหรับตรวจสอบ error ใน template
  getFieldError(fieldName: string): string {
    const field = this.unitForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} จำเป็นต้องกรอก`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      unit_number: 'เลขที่บ้าน',
      zone: 'โซน',
      building: 'อาคาร',
      // floor: 'ชั้น'
    };
    return labels[fieldName] || fieldName;
  }

  // Import Modal Methods
  openImportModal(): void {
    this.showImportModal = true;
    this.resetImportData();
  }

  closeImportModal(): void {
    this.showImportModal = false;
    this.resetImportData();
  }

  resetImportData(): void {
    this.selectedFile = null;
    this.fileSize = '';
    this.previewData = [];
    this.isUploading = false;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // ตรวจสอบนามสกุลไฟล์
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
        alert('กรุณาเลือกไฟล์ Excel (.xlsx หรือ .xls) เท่านั้น');
        event.target.value = '';
        return;
      }

      this.selectedFile = file;
      this.fileSize = this.formatFileSize(file.size);
      this.parseExcelFile(file);
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  parseExcelFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // อ่านข้อมูลจาก sheet แรก
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // แปลงเป็น JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // ตรวจสอบว่ามีข้อมูล
        if (jsonData.length < 2) {
          alert('ไฟล์ Excel ไม่มีข้อมูล');
          return;
        }

        // แปลงข้อมูลให้อยู่ในรูปแบบที่ต้องการ (ข้ามแถวแรกที่เป็น header)
        this.previewData = (jsonData as any[]).slice(1, 11).map((row: any) => ({
          house_number: row[0] || '',
          zone: row[1] || '',
          building: row[2] || '',
          area_sqm: row[3] || '',
          status: row[4] || ''
        }));

        console.log('Preview data:', this.previewData);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ Excel');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async uploadImportFile(): Promise<void> {
    if (!this.selectedFile) {
      alert('กรุณาเลือกไฟล์ก่อน');
      return;
    }

    this.isUploading = true;

    try {
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('project_id', this.projectId);

      // ดึง token จาก AuthService
      const token = this.authService.getToken();
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      this.http.post('http://localhost:5000/api/units/import', formData, { headers }).subscribe({
        next: (response) => {
          console.log('Import successful:', response);
          alert('นำเข้าข้อมูลสำเร็จ!');
          this.closeImportModal();
          this.loadExistingUnits(); // โหลดข้อมูลใหม่
        },
        error: (error) => {
          console.error('Import error:', error);
          alert('เกิดข้อผิดพลาดในการนำเข้าข้อมูล: ' + (error.error?.message || error.message));
        },
        complete: () => {
          this.isUploading = false;
        }
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('เกิดข้อผิดพลาดที่ไม่คาดคิด');
      this.isUploading = false;
    }
  }
}

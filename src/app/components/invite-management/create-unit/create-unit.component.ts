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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { LoadingDataComponent } from '../../../shared/loading-data/loading-data.component';
import { BehaviorSubject } from 'rxjs';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AuthService } from '../../../services/auth.service';
import { UnitService, CreateUnitInvitationRequest } from '../../../services/unit.service';

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
}

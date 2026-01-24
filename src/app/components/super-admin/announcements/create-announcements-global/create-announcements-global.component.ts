import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RestService } from '../../../../services/rest.service';
import { ToastService } from '../../../../shared/toast/toast.service';
import { LoadingDataComponent } from '../../../../shared/loading-data/loading-data.component';
import { ProjectSelectionDialogComponent, Project } from './project-selection-dialog.component';

@Component({
  selector: 'app-create-announcements-global',
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
    MatCardModule,
    MatRadioModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    FlexLayoutModule,
    LoadingDataComponent
  ],
  templateUrl: './create-announcements-global.component.html',
  styleUrl: './create-announcements-global.component.scss'
})
export class CreateAnnouncementsGlobalComponent implements OnInit {
  announcementForm: FormGroup;
  isSaving = false;

  // Selected projects
  selectedProjectIds: string[] = [];
  selectedProjects: Project[] = [];

  isLoading = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoading.asObservable();

  types = [
    { value: 'info', label: 'ข้อมูลข่าวสาร' },
    { value: 'warning', label: 'คำเตือน' },
    { value: 'maintenance', label: 'บำรุงรักษา' },
    { value: 'update', label: 'อัปเดตระบบ' },
    { value: 'emergency', label: 'ฉุกเฉิน' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private restService: RestService,
    private toast: ToastService,
    private dialog: MatDialog
  ) {
    this.announcementForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', [Validators.required]],
      type: ['info', [Validators.required]],
      is_active: [true, [Validators.required]],
      start_date: [null],
      end_date: [null]
    });
  }

  ngOnInit(): void { }

  selectType(typeValue: string): void {
    this.announcementForm.get('type')?.setValue(typeValue);
  }

  // Removed onTargetAllChange - no longer needed

  openProjectSelectionDialog(): void {
    const dialogRef = this.dialog.open(ProjectSelectionDialogComponent, {
      width: '500px',
      maxHeight: '80vh',
      data: {
        selectedProjectIds: this.selectedProjectIds
      }
    });

    dialogRef.afterClosed().subscribe((result: string[] | null | undefined) => {
      // Only update if result is a valid array (not null/undefined from backdrop click)
      if (result && Array.isArray(result)) {
        this.selectedProjectIds = result;
        // Fetch project details for display
        this.loadSelectedProjectsDetails();
      }
    });
  }

  loadSelectedProjectsDetails(): void {
    if (this.selectedProjectIds.length === 0) {
      this.selectedProjects = [];
      return;
    }

    // Fetch all projects and filter
    this.restService.getProjects({ limit: 1000 }).subscribe({
      next: (res: any) => {
        if (res.status === 'success' && res.data) {
          this.selectedProjects = res.data.filter((p: any) =>
            this.selectedProjectIds.includes(p.id)
          );
        }
      },
      error: (err) => {
        console.error('Error loading project details:', err);
      }
    });
  }

  removeProject(projectId: string): void {
    this.selectedProjectIds = this.selectedProjectIds.filter(id => id !== projectId);
    this.selectedProjects = this.selectedProjects.filter(p => p.id !== projectId);
  }

  isFormValid(): boolean {
    if (!this.announcementForm.valid) return false;
    if (this.selectedProjectIds.length === 0) return false;
    return true;
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      if (this.selectedProjectIds.length === 0) {
        this.toast.error('กรุณาเลือกอย่างน้อย 1 โครงการ');
      }
      return;
    }

    this.isSaving = true;
    this.isLoading.next(true);

    const formValue = this.announcementForm.value;

    // Build API payload - always send selected project IDs
    const payload: any = {
      title: formValue.title,
      content: formValue.content,
      type: formValue.type,
      is_active: formValue.is_active,
      target_projects: this.selectedProjectIds
    };

    // Add optional dates if set
    if (formValue.start_date) {
      payload.start_date = new Date(formValue.start_date).toISOString();
    }
    if (formValue.end_date) {
      payload.end_date = new Date(formValue.end_date).toISOString();
    }

    console.log('Submitting global announcement:', payload);

    this.restService.createGlobalAnnouncement(payload).subscribe({
      next: (res: any) => {
        console.log('Create announcement response:', res);
        if (res.status === 'success') {
          this.toast.success('สร้างประกาศ Global สำเร็จ');
          this.router.navigate(['/super-admin/announcements']);
        } else {
          this.toast.error(res.message || 'เกิดข้อผิดพลาดในการสร้างประกาศ');
        }
        this.isSaving = false;
        this.isLoading.next(false);
      },
      error: (err) => {
        console.error('Create announcement error:', err);
        this.toast.error('เกิดข้อผิดพลาดในการสร้างประกาศ');
        this.isSaving = false;
        this.isLoading.next(false);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/super-admin/announcements']);
  }
}

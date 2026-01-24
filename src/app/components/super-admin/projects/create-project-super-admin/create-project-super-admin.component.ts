import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RestService } from '../../../../services/rest.service';
import { ToastService } from '../../../../shared/toast/toast.service';
import { LoadingDataComponent } from '../../../../shared/loading-data/loading-data.component';

@Component({
  selector: 'app-create-project-super-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    FlexLayoutModule,
    LoadingDataComponent
  ],
  templateUrl: './create-project-super-admin.component.html',
  styleUrl: './create-project-super-admin.component.scss'
})
export class CreateProjectSuperAdminComponent implements OnInit {
  projectForm: FormGroup;
  isSaving = false;

  isLoading = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoading.asObservable();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private restService: RestService,
    private toast: ToastService
  ) {
    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      address: ['']
    });
  }

  ngOnInit(): void { }

  onSubmit(): void {
    if (this.projectForm.valid) {
      this.isSaving = true;
      this.isLoading.next(true);

      const formValue = this.projectForm.value;
      const payload: any = {
        name: formValue.name.trim()
      };

      // Add address if provided
      if (formValue.address && formValue.address.trim()) {
        payload.address = formValue.address.trim();
      }

      console.log('Creating project:', payload);

      this.restService.createProject(payload).subscribe({
        next: (res: any) => {
          console.log('Create project response:', res);
          if (res.status === 'success') {
            this.toast.success('สร้างโปรเจคสำเร็จ');
            this.router.navigate(['/super-admin/projects']);
          } else {
            this.toast.error(res.message || 'เกิดข้อผิดพลาดในการสร้างโปรเจค');
          }
          this.isSaving = false;
          this.isLoading.next(false);
        },
        error: (err) => {
          console.error('Create project error:', err);
          this.toast.error(err || 'เกิดข้อผิดพลาดในการสร้างโปรเจค');
          this.isSaving = false;
          this.isLoading.next(false);
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/super-admin/projects']);
  }
}

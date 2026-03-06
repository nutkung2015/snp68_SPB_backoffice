import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RestService } from '../../../../services/rest.service';
import { ToastService } from '../../../../shared/toast/toast.service';

export interface CreateJuristicRequest {
    full_name: string;
    email: string;
    phone: string;
    password: string;
    role: string;
    project_id: string;
}

@Component({
    selector: 'app-create-juristic',
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
        MatSelectModule,
        MatProgressSpinnerModule,
        FlexLayoutModule
    ],
    templateUrl: './create-juristic.component.html',
    styleUrl: './create-juristic.component.scss'
})
export class CreateJuristicComponent implements OnInit {
    juristicForm: FormGroup;
    isSaving = false;
    hidePassword = true;

    isLoading = new BehaviorSubject<boolean>(false);
    isLoading$ = this.isLoading.asObservable();

    // Projects list for dropdown
    projects: any[] = [];
    isLoadingProjects = true;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private restService: RestService,
        private toast: ToastService
    ) {
        this.juristicForm = this.fb.group({
            full_name: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            phone: ['', [Validators.required, Validators.pattern(/^0[0-9]{8,9}$/)]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            project_id: ['', [Validators.required]]
        });
    }

    ngOnInit(): void {
        this.loadProjects();
    }

    loadProjects(): void {
        this.isLoadingProjects = true;
        this.restService.getProjects({ limit: 1000 }).subscribe({
            next: (res: any) => {
                if (res.status === 'success') {
                    this.projects = res.data || [];
                }
                this.isLoadingProjects = false;
            },
            error: (err) => {
                console.error('Error loading projects:', err);
                this.toast.error('ไม่สามารถโหลดรายการโครงการได้');
                this.isLoadingProjects = false;
            }
        });
    }

    onSubmit(): void {
        if (this.juristicForm.valid) {
            this.isSaving = true;
            this.isLoading.next(true);

            const formValue = this.juristicForm.value;
            const payload: CreateJuristicRequest = {
                full_name: formValue.full_name.trim(),
                email: formValue.email.trim().toLowerCase(),
                phone: formValue.phone.trim(),
                password: formValue.password,
                role: 'juristicLeader',
                project_id: formValue.project_id
            };

            console.log('Creating juristic user:', payload);

            this.restService.createJuristicUser(payload).subscribe({
                next: (res: any) => {
                    console.log('Create juristic response:', res);
                    if (res.status === 'success') {
                        this.toast.success('สร้างผู้ใช้นิติบุคคลสำเร็จ');
                        this.router.navigate(['/super-admin/users']);
                    } else {
                        this.toast.error(res.message || 'เกิดข้อผิดพลาดในการสร้างผู้ใช้');
                    }
                    this.isSaving = false;
                    this.isLoading.next(false);
                },
                error: (err) => {
                    console.error('Create juristic error:', err);
                    this.toast.error(err || 'เกิดข้อผิดพลาดในการสร้างผู้ใช้');
                    this.isSaving = false;
                    this.isLoading.next(false);
                }
            });
        } else {
            // Mark all fields as touched to show validation errors
            Object.keys(this.juristicForm.controls).forEach(key => {
                this.juristicForm.controls[key].markAsTouched();
            });
        }
    }

    onCancel(): void {
        this.router.navigate(['/super-admin/users']);
    }

    generatePassword(): void {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        this.juristicForm.patchValue({ password });
        this.hidePassword = false;
    }
}

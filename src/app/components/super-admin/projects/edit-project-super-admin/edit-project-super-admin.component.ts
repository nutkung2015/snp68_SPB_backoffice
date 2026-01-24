import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, ActivatedRoute } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RestService } from '../../../../services/rest.service';
import { ToastService } from '../../../../shared/toast/toast.service';
import { LoadingDataComponent } from '../../../../shared/loading-data/loading-data.component';

@Component({
    selector: 'app-edit-project-super-admin',
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
    templateUrl: './edit-project-super-admin.component.html',
    styleUrl: './edit-project-super-admin.component.scss'
})
export class EditProjectSuperAdminComponent implements OnInit {
    projectForm: FormGroup;
    projectId: string = '';
    projectName: string = '';
    isSaving = false;
    isLoadingData = true;

    isLoading = new BehaviorSubject<boolean>(false);
    isLoading$ = this.isLoading.asObservable();

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private restService: RestService,
        private toast: ToastService
    ) {
        this.projectForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            address: ['']
        });
    }

    ngOnInit(): void {
        this.projectId = this.route.snapshot.paramMap.get('id') || '';
        if (this.projectId) {
            this.loadProject();
        } else {
            this.toast.error('ไม่พบ ID โปรเจค');
            this.router.navigate(['/super-admin/projects']);
        }
    }

    loadProject(): void {
        this.isLoadingData = true;
        this.restService.getProjectById(this.projectId).subscribe({
            next: (res: any) => {
                if (res.status === 'success' && res.data) {
                    const project = res.data;
                    this.projectName = project.name;
                    this.projectForm.patchValue({
                        name: project.name,
                        address: project.address || ''
                    });
                } else {
                    this.toast.error('ไม่พบข้อมูลโปรเจค');
                    this.router.navigate(['/super-admin/projects']);
                }
                this.isLoadingData = false;
            },
            error: (err) => {
                console.error('Load project error:', err);
                this.toast.error(err || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
                this.isLoadingData = false;
                this.router.navigate(['/super-admin/projects']);
            }
        });
    }

    onSubmit(): void {
        if (this.projectForm.valid) {
            this.isSaving = true;
            this.isLoading.next(true);

            const formValue = this.projectForm.value;
            const payload: any = {
                name: formValue.name.trim()
            };

            if (formValue.address && formValue.address.trim()) {
                payload.address = formValue.address.trim();
            }

            console.log('Updating project:', payload);

            this.restService.updateProject(this.projectId, payload).subscribe({
                next: (res: any) => {
                    console.log('Update project response:', res);
                    if (res.status === 'success') {
                        this.toast.success('แก้ไขโปรเจคสำเร็จ');
                        this.router.navigate(['/super-admin/projects']);
                    } else {
                        this.toast.error(res.message || 'เกิดข้อผิดพลาดในการแก้ไขโปรเจค');
                    }
                    this.isSaving = false;
                    this.isLoading.next(false);
                },
                error: (err) => {
                    console.error('Update project error:', err);
                    this.toast.error(err || 'เกิดข้อผิดพลาดในการแก้ไขโปรเจค');
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

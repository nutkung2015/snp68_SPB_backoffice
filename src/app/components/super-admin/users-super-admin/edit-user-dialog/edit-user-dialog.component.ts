import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RestService } from '../../../../services/rest.service';

@Component({
  selector: 'app-edit-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FlexLayoutModule
  ],
  templateUrl: './edit-user-dialog.component.html',
  styleUrl: './edit-user-dialog.component.scss'
})
export class EditUserDialogComponent implements OnInit {
  editForm: FormGroup;
  isLoading = true;
  isSaving = false;
  roles = ['resident', 'security', 'juristic', 'super-admin'];

  constructor(
    private fb: FormBuilder,
    private restService: RestService,
    public dialogRef: MatDialogRef<EditUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: string }
  ) {
    this.editForm = this.fb.group({
      full_name: ['', Validators.required],
      phone: ['', [Validators.pattern('^[0-9]*$')]],
      email: [{ value: '', disabled: true }],
      role: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.data && this.data.id) {
      this.loadUser();
    } else {
      this.isLoading = false;
      this.dialogRef.close();
    }
  }

  loadUser(): void {
    this.isLoading = true;
    this.restService.getSuperAdminUserById(this.data.id).subscribe({
      next: (res: any) => {
        if (res.status === 'success' && res.data) {
          const user = res.data;
          this.editForm.patchValue({
            full_name: user.full_name,
            phone: user.phone,
            email: user.email,
            role: user.role
          });
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading user:', err);
        this.isLoading = false;
        // Optionally show alert here
        this.dialogRef.close();
      }
    });
  }

  onSubmit(): void {
    if (this.editForm.valid) {
      this.isSaving = true;
      const updateData = {
        full_name: this.editForm.get('full_name')?.value,
        phone: this.editForm.get('phone')?.value,
        role: this.editForm.get('role')?.value
      };

      this.restService.updateSuperAdminUser(this.data.id, updateData).subscribe({
        next: (res: any) => {
          this.isSaving = false;
          if (res.status === 'success') {
            this.dialogRef.close({ success: true, data: res.data });
          } else {
            console.error('Error updating user:', res.message);
          }
        },
        error: (err) => {
          this.isSaving = false;
          console.error('API Error updating user:', err);
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FlexLayoutModule } from '@angular/flex-layout';
import { GuardPost } from '../../../services/rest.service';

@Component({
  selector: 'app-guard-post-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    FlexLayoutModule
  ],
  templateUrl: './guard-post-dialog.component.html',
  styleUrls: ['./guard-post-dialog.component.scss']
})
export class GuardPostDialogComponent {
  form: FormGroup;
  isEditMode: boolean;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<GuardPostDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { guardPost?: GuardPost, projectId: string }
  ) {
    this.isEditMode = !!data.guardPost;
    this.form = this.fb.group({
      post_name: [data.guardPost?.post_name || '', [Validators.required]],
      phone_1: [data.guardPost?.phone_1 || '', [Validators.pattern(/^\d{9,15}$/)]],
      phone_2: [data.guardPost?.phone_2 || '', [Validators.pattern(/^\d{9,15}$/)]],
      status: [data.guardPost?.status || 'active', [Validators.required]]
    });
  }

  onSubmit() {
    if (this.form.valid) {
      const result = {
        ...this.form.value,
        project_id: this.data.projectId
      };
      this.dialogRef.close(result);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}

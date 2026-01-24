import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { Zone } from '../../../services/rest.service';

import { MatDividerModule } from '@angular/material/divider';

@Component({
    selector: 'app-zone-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatIconModule,
        FlexLayoutModule,
        MatDividerModule
    ],
    templateUrl: './zone-dialog.component.html',
    styleUrls: ['./zone-dialog.component.scss']
})
export class ZoneDialogComponent {
    form: FormGroup;
    isEditMode: boolean;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<ZoneDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { zone?: Zone, projectId: string }
    ) {
        this.isEditMode = !!data.zone;
        this.form = this.fb.group({
            name: [data.zone?.name || '', [Validators.required]],
            code: [data.zone?.code || ''],
            description: [data.zone?.description || ''],
            color: [data.zone?.color || '#1e293b'] // Default color
        });
    }

    onSubmit() {
        if (this.form.valid) {
            const formValue = this.form.value;
            const result = {
                ...formValue,
                project_id: this.data.projectId
            };

            if (this.isEditMode && this.data.zone) {
                // Should return ID as well if needed by caller, but caller handles update
            }

            this.dialogRef.close(result);
        }
    }

    onCancel() {
        this.dialogRef.close();
    }
}

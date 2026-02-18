import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { RestService, Vehicle, Unit } from '../../../services/rest.service';
import { ToastService } from '../../../shared/toast/toast.service';

export interface VehicleDialogData {
    mode: 'add' | 'edit';
    projectId: string;
    vehicle?: Vehicle;
}

@Component({
    selector: 'app-vehicle-dialog',
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
        MatCheckboxModule,
        MatSlideToggleModule,
        MatProgressSpinnerModule,
        MatAutocompleteModule,
    ],
    templateUrl: './vehicle-dialog.component.html',
    styleUrls: ['./vehicle-dialog.component.scss'],
})
export class VehicleDialogComponent implements OnInit {
    vehicleForm!: FormGroup;
    isLoading = false;
    isSaving = false;
    units: Unit[] = [];
    filteredUnits: Unit[] = [];

    // Thai provinces list
    provinces: string[] = [
        'กรุงเทพมหานคร',
        'กระบี่',
        'กาญจนบุรี',
        'กาฬสินธุ์',
        'กำแพงเพชร',
        'ขอนแก่น',
        'จันทบุรี',
        'ฉะเชิงเทรา',
        'ชลบุรี',
        'ชัยนาท',
        'ชัยภูมิ',
        'ชุมพร',
        'เชียงราย',
        'เชียงใหม่',
        'ตรัง',
        'ตราด',
        'ตาก',
        'นครนายก',
        'นครปฐม',
        'นครพนม',
        'นครราชสีมา',
        'นครศรีธรรมราช',
        'นครสวรรค์',
        'นนทบุรี',
        'นราธิวาส',
        'น่าน',
        'บึงกาฬ',
        'บุรีรัมย์',
        'ปทุมธานี',
        'ประจวบคีรีขันธ์',
        'ปราจีนบุรี',
        'ปัตตานี',
        'พระนครศรีอยุธยา',
        'พังงา',
        'พัทลุง',
        'พิจิตร',
        'พิษณุโลก',
        'เพชรบุรี',
        'เพชรบูรณ์',
        'แพร่',
        'พะเยา',
        'ภูเก็ต',
        'มหาสารคาม',
        'มุกดาหาร',
        'แม่ฮ่องสอน',
        'ยะลา',
        'ยโสธร',
        'ร้อยเอ็ด',
        'ระนอง',
        'ระยอง',
        'ราชบุรี',
        'ลพบุรี',
        'ลำปาง',
        'ลำพูน',
        'เลย',
        'ศรีสะเกษ',
        'สกลนคร',
        'สงขลา',
        'สตูล',
        'สมุทรปราการ',
        'สมุทรสงคราม',
        'สมุทรสาคร',
        'สระแก้ว',
        'สระบุรี',
        'สิงห์บุรี',
        'สุโขทัย',
        'สุพรรณบุรี',
        'สุราษฎร์ธานี',
        'สุรินทร์',
        'หนองคาย',
        'หนองบัวลำภู',
        'อ่างทอง',
        'อุดรธานี',
        'อุทัยธานี',
        'อุตรดิตถ์',
        'อุบลราชธานี',
        'อำนาจเจริญ',
    ];

    constructor(
        public dialogRef: MatDialogRef<VehicleDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: VehicleDialogData,
        private fb: FormBuilder,
        private restService: RestService,
        private toast: ToastService
    ) { }

    ngOnInit(): void {
        this.initForm();
        this.loadUnits();
    }

    initForm(): void {
        const vehicle = this.data.vehicle;

        this.vehicleForm = this.fb.group({
            unit_id: [vehicle?.unit_id || '', Validators.required],
            plate_number: [vehicle?.plate_number || '', [Validators.required, Validators.maxLength(20)]],
            province: [vehicle?.province || ''],
            brand: [vehicle?.brand || '', Validators.maxLength(50)],
            color: [vehicle?.color || '', Validators.maxLength(20)],
            is_active: [vehicle?.is_active ?? true],
        });
    }

    loadUnits(): void {
        this.isLoading = true;
        this.restService.getUnits(this.data.projectId).subscribe({
            next: (units) => {
                this.units = units || [];
                this.filteredUnits = this.units;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Load units error:', err);
                this.isLoading = false;
            },
        });
    }

    filterUnits(value: string): void {
        const filterValue = value.toLowerCase();
        this.filteredUnits = this.units.filter(
            (unit) => unit.unit_number.toLowerCase().includes(filterValue)
        );
    }

    onSubmit(): void {
        if (this.vehicleForm.invalid) {
            this.vehicleForm.markAllAsTouched();
            return;
        }

        this.isSaving = true;
        const formValue = this.vehicleForm.value;

        if (this.data.mode === 'add') {
            this.restService
                .addVehicle({
                    project_id: this.data.projectId,
                    unit_id: formValue.unit_id,
                    plate_number: formValue.plate_number,
                    province: formValue.province || undefined,
                    brand: formValue.brand || undefined,
                    color: formValue.color || undefined,
                    is_active: formValue.is_active,
                })
                .subscribe({
                    next: (res) => {
                        this.isSaving = false;
                        if (res.status === 'success') {
                            this.dialogRef.close(true);
                        } else {
                            this.toast.error(res.message || 'ไม่สามารถเพิ่มยานพาหนะได้');
                        }
                    },
                    error: (err) => {
                        this.isSaving = false;
                        console.error('Add vehicle error:', err);
                        this.toast.error('เกิดข้อผิดพลาดในการเพิ่มยานพาหนะ');
                    },
                });
        } else {
            this.restService
                .updateVehicle(this.data.vehicle!.id, {
                    project_id: this.data.projectId,
                    plate_number: formValue.plate_number,
                    province: formValue.province || undefined,
                    brand: formValue.brand || undefined,
                    color: formValue.color || undefined,
                    is_active: formValue.is_active,
                })
                .subscribe({
                    next: (res) => {
                        this.isSaving = false;
                        if (res.status === 'success') {
                            this.dialogRef.close(true);
                        } else {
                            this.toast.error(res.message || 'ไม่สามารถแก้ไขยานพาหนะได้');
                        }
                    },
                    error: (err) => {
                        this.isSaving = false;
                        console.error('Update vehicle error:', err);
                        this.toast.error('เกิดข้อผิดพลาดในการแก้ไขยานพาหนะ');
                    },
                });
        }
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }

    getUnitDisplayName(unitId: string): string {
        const unit = this.units.find((u) => u.id === unitId);
        return unit ? unit.unit_number : '';
    }
}

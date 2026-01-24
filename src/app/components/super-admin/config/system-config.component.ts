import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { RestService } from '../../../services/rest.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

@Component({
    selector: 'app-system-config',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatSlideToggleModule,
        MatInputModule,
        MatFormFieldModule,
        MatProgressSpinnerModule,
        MatDividerModule,
        FormsModule,
        FlexLayoutModule,
        PageHeaderComponent
    ],
    templateUrl: './system-config.component.html',
    styleUrl: './system-config.component.scss'
})
export class SystemConfigComponent implements OnInit {
    isLoading = true;
    isSaving = false;
    config: any = {
        maintenance_mode: { value: false },
        default_theme_color: { value: '#07354E' },
        rate_limit_requests: { value: 100 }
    };

    themes: string[] = ['#07354E', '#1e293b', '#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    constructor(
        private restService: RestService,
        private toast: ToastService
    ) { }

    ngOnInit(): void {
        this.loadConfig();
    }

    loadConfig(): void {
        this.isLoading = true;
        this.restService.getSystemConfig().subscribe({
            next: (res: any) => {
                if (res.status === 'success') {
                    this.config = { ...this.config, ...res.data };
                    if (this.config.maintenance_mode) {
                        this.config.maintenance_mode.value = this.config.maintenance_mode.value === 'true' || this.config.maintenance_mode.value === true;
                    }
                }
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading config:', err);
                this.isLoading = false;
            }
        });
    }

    saveConfig(): void {
        this.isSaving = true;

        const updates = {
            updates: {
                maintenance_mode: this.config.maintenance_mode.value,
                default_theme_color: this.config.default_theme_color.value,
                rate_limit_requests: this.config.rate_limit_requests.value
            }
        };

        this.restService.updateSystemConfig(updates).subscribe({
            next: () => {
                this.isSaving = false;
                this.toast.success('บันทึกการตั้งค่าสำเร็จ');
            },
            error: (err) => {
                this.isSaving = false;
                this.toast.error('เกิดข้อผิดพลาดในการบันทึก');
                console.error(err);
            }
        });
    }

    selectTheme(color: string): void {
        this.config.default_theme_color.value = color;
    }
}

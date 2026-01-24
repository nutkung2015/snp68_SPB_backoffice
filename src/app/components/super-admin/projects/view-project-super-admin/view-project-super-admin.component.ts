import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { Router, ActivatedRoute } from '@angular/router';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RestService } from '../../../../services/rest.service';
import { ToastService } from '../../../../shared/toast/toast.service';

interface ProjectDetail {
    id: string;
    name: string;
    address: string | null;
    logo_url: string | null;
    unit_count: number;
    member_count: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

@Component({
    selector: 'app-view-project-super-admin',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatProgressSpinnerModule,
        MatDividerModule,
        MatChipsModule,
        FlexLayoutModule
    ],
    templateUrl: './view-project-super-admin.component.html',
    styleUrl: './view-project-super-admin.component.scss'
})
export class ViewProjectSuperAdminComponent implements OnInit {
    projectId: string = '';
    project: ProjectDetail | null = null;
    isLoading = true;
    hasLightBackground = false;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private restService: RestService,
        private toast: ToastService
    ) { }

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
        this.isLoading = true;
        this.restService.getProjectById(this.projectId).subscribe({
            next: (res: any) => {
                if (res.status === 'success' && res.data) {
                    this.project = res.data;
                    // Check if logo has light background
                    if (this.project?.logo_url) {
                        this.checkImageBackground(this.project.logo_url);
                    }
                } else {
                    this.toast.error('ไม่พบข้อมูลโปรเจค');
                    this.router.navigate(['/super-admin/projects']);
                }
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Load project error:', err);
                this.toast.error(err || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
                this.isLoading = false;
                this.router.navigate(['/super-admin/projects']);
            }
        });
    }

    /**
     * Check if the image has a light/white background by analyzing corner pixels
     * Uses Canvas API to read pixel data from the image
     */
    checkImageBackground(imageUrl: string): void {
        const img = new Image();
        img.crossOrigin = 'Anonymous'; // Required for CORS images

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                // Sample pixels from corners and edges
                const samplePoints = [
                    { x: 0, y: 0 },                          // Top-left
                    { x: img.width - 1, y: 0 },              // Top-right
                    { x: 0, y: img.height - 1 },             // Bottom-left
                    { x: img.width - 1, y: img.height - 1 }, // Bottom-right
                    { x: Math.floor(img.width / 2), y: 0 },  // Top-center
                    { x: Math.floor(img.width / 2), y: img.height - 1 }, // Bottom-center
                ];

                let lightPixelCount = 0;
                const threshold = 230; // Consider light if RGB values are above this

                for (const point of samplePoints) {
                    const pixelData = ctx.getImageData(point.x, point.y, 1, 1).data;
                    const r = pixelData[0];
                    const g = pixelData[1];
                    const b = pixelData[2];
                    const alpha = pixelData[3];

                    // Check if pixel is light (high RGB values) or transparent
                    if ((r > threshold && g > threshold && b > threshold) || alpha < 50) {
                        lightPixelCount++;
                    }
                }

                // If more than half of sample points are light, set flag
                this.hasLightBackground = lightPixelCount >= samplePoints.length / 2;
            } catch (error) {
                // CORS or other errors - default to showing contrast background
                console.warn('Could not analyze image background:', error);
                this.hasLightBackground = true;
            }
        };

        img.onerror = () => {
            // If image fails to load, default to contrast background
            this.hasLightBackground = true;
        };

        img.src = imageUrl;
    }

    formatDate(dateStr: string | null): string {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    onEdit(): void {
        this.router.navigate(['/super-admin/projects/edit', this.projectId]);
    }

    onDelete(): void {
        if (this.project && confirm(`คุณต้องการลบโปรเจค "${this.project.name}" หรือไม่?`)) {
            this.restService.deleteProject(this.projectId).subscribe({
                next: (res: any) => {
                    if (res.status === 'success') {
                        this.toast.success(`ลบโปรเจค "${this.project?.name}" สำเร็จ`);
                        this.router.navigate(['/super-admin/projects']);
                    } else {
                        this.toast.error(res.message || 'เกิดข้อผิดพลาดในการลบโปรเจค');
                    }
                },
                error: (err) => {
                    console.error('Delete project error:', err);
                    this.toast.error(err || 'เกิดข้อผิดพลาดในการลบโปรเจค');
                }
            });
        }
    }

    onBack(): void {
        this.router.navigate(['/super-admin/projects']);
    }
}

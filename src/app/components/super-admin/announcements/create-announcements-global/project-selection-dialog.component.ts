import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RestService } from '../../../../services/rest.service';

export interface ProjectSelectionDialogData {
    selectedProjectIds: string[];
}

export interface Project {
    id: string;
    name: string;
    status?: string;
}

@Component({
    selector: 'app-project-selection-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatCheckboxModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatFormFieldModule,
        MatInputModule
    ],
    template: `
        <div class="dialog-container">
            <h2 mat-dialog-title>
                <mat-icon>business</mat-icon>
                เลือกโครงการ
            </h2>
            
            <mat-dialog-content>
                <div class="search-box">
                    <mat-form-field appearance="outline" class="full-width">
                        <mat-icon matPrefix>search</mat-icon>
                        <input matInput placeholder="ค้นหาโครงการ..." [(ngModel)]="searchTerm" (input)="filterProjects()">
                    </mat-form-field>
                </div>
                
                <div class="loading-container" *ngIf="isLoading">
                    <mat-spinner diameter="40"></mat-spinner>
                    <span>กำลังโหลดรายการโครงการ...</span>
                </div>
                
                <div class="projects-list" *ngIf="!isLoading">
                    <div class="select-all-row">
                        <mat-checkbox 
                            [checked]="isAllSelected()" 
                            [indeterminate]="isSomeSelected()"
                            (change)="toggleSelectAll($event.checked)">
                            เลือกทั้งหมด ({{ filteredProjects.length }} โครงการ)
                        </mat-checkbox>
                    </div>
                    
                    <div class="project-item" *ngFor="let project of filteredProjects">
                        <mat-checkbox 
                            [checked]="isSelected(project.id)"
                            (change)="toggleProject(project.id, $event.checked)">
                            <div class="project-info">
                                <span class="project-name">{{ project.name }}</span>
                                <span class="project-id">#{{ project.id }}</span>
                            </div>
                        </mat-checkbox>
                    </div>
                    
                    <div class="no-projects" *ngIf="filteredProjects.length === 0">
                        <mat-icon>search_off</mat-icon>
                        <span>ไม่พบโครงการที่ตรงกับการค้นหา</span>
                    </div>
                </div>
                
                <div class="selected-count" *ngIf="!isLoading">
                    เลือกแล้ว {{ selectedProjectIds.length }} โครงการ
                </div>
            </mat-dialog-content>
            
            <mat-dialog-actions align="end">
                <button mat-stroked-button (click)="onCancel()">ยกเลิก</button>
                <button mat-flat-button color="primary" (click)="onConfirm()" [disabled]="selectedProjectIds.length === 0">
                    ยืนยัน
                </button>
            </mat-dialog-actions>
        </div>
    `,
    styles: [`
        .dialog-container {
            min-width: 400px;
            max-width: 500px;
        }
        
        h2[mat-dialog-title] {
            display: flex;
            align-items: center;
            gap: 12px;
            margin: 0;
            padding: 16px 24px;
            border-bottom: 1px solid #e0e0e0;
            
            mat-icon {
                color: #2084FC;
            }
        }
        
        mat-dialog-content {
            padding: 16px 24px;
            max-height: 400px;
        }
        
        .search-box {
            margin-bottom: 16px;
        }
        
        .full-width {
            width: 100%;
        }
        
        .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            gap: 16px;
            color: #666;
        }
        
        .projects-list {
            max-height: 280px;
            overflow-y: auto;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
        }
        
        .select-all-row {
            padding: 12px 16px;
            background-color: #f5f7fa;
            border-bottom: 1px solid #e0e0e0;
            position: sticky;
            top: 0;
            z-index: 1;
        }
        
        .project-item {
            padding: 12px 16px;
            border-bottom: 1px solid #f0f0f0;
            transition: background-color 0.2s ease;
            
            &:hover {
                background-color: #f9fafb;
            }
            
            &:last-child {
                border-bottom: none;
            }
        }
        
        .project-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        
        .project-name {
            font-weight: 500;
            color: #171a1e;
        }
        
        .project-id {
            font-size: 12px;
            color: #9fa9b6;
        }
        
        .no-projects {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            color: #9fa9b6;
            gap: 8px;
            
            mat-icon {
                font-size: 48px;
                width: 48px;
                height: 48px;
            }
        }
        
        .selected-count {
            margin-top: 12px;
            padding: 8px 12px;
            background-color: #e3f2fd;
            border-radius: 4px;
            color: #1976d2;
            font-size: 14px;
            text-align: center;
        }
        
        mat-dialog-actions {
            padding: 16px 24px;
            border-top: 1px solid #e0e0e0;
            gap: 12px;
        }
    `]
})
export class ProjectSelectionDialogComponent implements OnInit {
    projects: Project[] = [];
    filteredProjects: Project[] = [];
    selectedProjectIds: string[] = [];
    searchTerm = '';
    isLoading = true;

    constructor(
        private dialogRef: MatDialogRef<ProjectSelectionDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ProjectSelectionDialogData,
        private restService: RestService
    ) {
        // Initialize with previously selected projects
        if (data?.selectedProjectIds) {
            this.selectedProjectIds = [...data.selectedProjectIds];
        }
    }

    ngOnInit(): void {
        this.loadProjects();
    }

    loadProjects(): void {
        this.isLoading = true;
        this.restService.getProjects({ limit: 1000 }).subscribe({
            next: (res: any) => {
                if (res.status === 'success' && res.data) {
                    this.projects = res.data;
                    this.filteredProjects = [...this.projects];
                }
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading projects:', err);
                this.isLoading = false;
            }
        });
    }

    filterProjects(): void {
        if (!this.searchTerm.trim()) {
            this.filteredProjects = [...this.projects];
        } else {
            const term = this.searchTerm.toLowerCase();
            this.filteredProjects = this.projects.filter(p =>
                p.name.toLowerCase().includes(term) ||
                p.id.toString().includes(term)
            );
        }
    }

    isSelected(projectId: string): boolean {
        return this.selectedProjectIds.includes(projectId);
    }

    toggleProject(projectId: string, checked: boolean): void {
        if (checked) {
            if (!this.selectedProjectIds.includes(projectId)) {
                this.selectedProjectIds.push(projectId);
            }
        } else {
            this.selectedProjectIds = this.selectedProjectIds.filter(id => id !== projectId);
        }
    }

    isAllSelected(): boolean {
        return this.filteredProjects.length > 0 &&
            this.filteredProjects.every(p => this.selectedProjectIds.includes(p.id));
    }

    isSomeSelected(): boolean {
        return this.filteredProjects.some(p => this.selectedProjectIds.includes(p.id)) &&
            !this.isAllSelected();
    }

    toggleSelectAll(checked: boolean): void {
        if (checked) {
            // Add all filtered projects
            this.filteredProjects.forEach(p => {
                if (!this.selectedProjectIds.includes(p.id)) {
                    this.selectedProjectIds.push(p.id);
                }
            });
        } else {
            // Remove all filtered projects
            const filteredIds = this.filteredProjects.map(p => p.id);
            this.selectedProjectIds = this.selectedProjectIds.filter(id => !filteredIds.includes(id));
        }
    }

    onCancel(): void {
        this.dialogRef.close(null);
    }

    onConfirm(): void {
        this.dialogRef.close(this.selectedProjectIds);
    }
}

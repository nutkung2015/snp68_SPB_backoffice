import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RestService } from '../../../services/rest.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

@Component({
    selector: 'app-projects',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatIconModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatCardModule,
        MatMenuModule,
        MatButtonToggleModule,
        MatTooltipModule,
        FormsModule,
        FlexLayoutModule,
        PageHeaderComponent
    ],
    templateUrl: './projects.component.html',
    styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit {
    // View mode: 'table' or 'card'
    viewMode: 'table' | 'card' = 'table';

    // Updated columns: sequence, name, unit_count, member_count, created_at, actions
    displayedColumns: string[] = ['sequence', 'name', 'unit_count', 'member_count', 'created_at', 'actions'];
    dataSource: MatTableDataSource<any>;
    isLoading = true;

    // Pagination
    totalRecords = 0;
    pageSize = 10;
    currentPage = 1;
    pageSizeOptions = [10, 25, 50, 100];

    // Filters
    searchTerm = '';

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private restService: RestService,
        private authService: AuthService,
        private router: Router,
        private toast: ToastService
    ) {
        this.dataSource = new MatTableDataSource();
    }

    ngOnInit(): void {
        this.checkPermission();
    }

    /**
     * Check if user has super-admin permission
     */
    private checkPermission(): void {
        const userRole = this.authService.getUserRole();
        console.log('ProjectsComponent: User role:', userRole);

        if (userRole !== 'super-admin') {
            console.warn('ProjectsComponent: Access denied - User is not super-admin');
            this.router.navigate(['/login']);
            return;
        }

        this.loadProjects();
    }

    /**
     * Load projects from API with server-side pagination
     */
    loadProjects(): void {
        this.isLoading = true;

        const params: any = {
            page: this.currentPage,
            limit: this.pageSize
        };

        if (this.searchTerm) {
            params.search = this.searchTerm;
        }

        this.restService.getProjects(params).subscribe({
            next: (res: any) => {
                console.log('ProjectsComponent: API Response:', res);
                if (res.status === 'success') {
                    // Sort by created_at descending (newest first) and add sequence number
                    const sortedData = (res.data || [])
                        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((item: any, index: number) => ({
                            ...item,
                            sequence: index + 1 + ((this.currentPage - 1) * this.pageSize)
                        }));

                    this.dataSource.data = sortedData;
                    this.totalRecords = res.pagination?.total_items || res.data?.length || 0;
                }
                this.isLoading = false;
            },
            error: (err) => {
                console.error('ProjectsComponent: Error loading projects:', err);
                this.isLoading = false;
            }
        });
    }

    /**
     * Toggle between table and card view
     */
    toggleViewMode(mode: 'table' | 'card'): void {
        this.viewMode = mode;
    }

    /**
     * Handle page change event
     */
    onPageChange(event: PageEvent): void {
        this.currentPage = event.pageIndex + 1;
        this.pageSize = event.pageSize;
        this.loadProjects();
    }

    /**
     * Apply filter and reload data
     */
    applyFilter(): void {
        this.currentPage = 1;
        this.loadProjects();
    }

    /**
     * Clear all filters and reload
     */
    clearFilters(): void {
        this.searchTerm = '';
        this.currentPage = 1;
        this.loadProjects();
    }

    /**
     * Format date for display
     */
    formatDate(dateStr: string): string {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Action methods
    onCreateProject(): void {
        this.router.navigate(['/super-admin/projects/create']);
    }

    onViewProject(project: any): void {
        console.log('View project:', project);
        // TODO: Navigate to project detail page
        this.router.navigate(['/super-admin/projects', project.id]);
    }

    onEditProject(project: any): void {
        console.log('Edit project:', project);
        this.router.navigate(['/super-admin/projects/edit', project.id]);
    }

    onManageFeatures(project: any): void {
        console.log('Manage features for project:', project);
        // TODO: Navigate to feature management page
        this.router.navigate(['/super-admin/projects', project.id, 'features']);
    }

    onDeactivateProject(project: any): void {
        if (confirm(`คุณต้องการลบโปรเจค "${project.name}" หรือไม่?`)) {
            this.restService.deleteProject(project.id).subscribe({
                next: (res: any) => {
                    if (res.status === 'success') {
                        this.toast.success(`ลบโปรเจค "${project.name}" สำเร็จ`);
                        this.loadProjects();
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

    onRestoreProject(project: any): void {
        if (confirm(`คุณต้องการกู้คืนโปรเจค "${project.name}" หรือไม่?`)) {
            this.restService.restoreProject(project.id).subscribe({
                next: (res: any) => {
                    if (res.status === 'success') {
                        this.toast.success(`กู้คืนโปรเจค "${project.name}" สำเร็จ`);
                        this.loadProjects();
                    } else {
                        this.toast.error(res.message || 'เกิดข้อผิดพลาดในการกู้คืนโปรเจค');
                    }
                },
                error: (err) => {
                    console.error('Restore project error:', err);
                    this.toast.error(err || 'เกิดข้อผิดพลาดในการกู้คืนโปรเจค');
                }
            });
        }
    }
}


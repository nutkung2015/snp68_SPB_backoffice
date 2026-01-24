import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FlexLayoutModule } from '@angular/flex-layout';
import { BehaviorSubject } from 'rxjs';
import { RestService } from '../../../services/rest.service';
import { Router } from '@angular/router';
import { ToastService } from '../../../shared/toast/toast.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

interface GlobalAnnouncement {
    id: number;
    title: string;
    content: string;
    type: string;
    target_projects: string | null;
    is_active: boolean | number;
    start_date: string | null;
    end_date: string | null;
    created_by: string;
    created_at: string;
}

@Component({
    selector: 'app-global-announcements',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatIconModule,
        MatButtonModule,
        MatSelectModule,
        MatCardModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        FlexLayoutModule,
        PageHeaderComponent
    ],
    templateUrl: './global-announcements.component.html',
    styleUrl: './global-announcements.component.scss'
})
export class GlobalAnnouncementComponent implements OnInit {
    displayedColumns: string[] = ['sequence', 'title', 'content', 'type', 'target', 'schedule', 'status', 'actions'];
    dataSource: MatTableDataSource<GlobalAnnouncement>;

    isLoading = new BehaviorSubject<boolean>(true);
    isLoading$ = this.isLoading.asObservable();

    // Filter states
    selectedStatus: string = 'all';
    selectedType: string = 'all';
    searchTerm: string = '';

    // Pagination
    pageEvent: PageEvent = {
        pageIndex: 0,
        pageSize: 10,
        length: 0
    };

    // All data for filtering
    private allAnnouncements: GlobalAnnouncement[] = [];

    // Type options
    types = [
        { value: 'all', label: 'ทั้งหมด' },
        { value: 'info', label: 'ข้อมูลข่าวสาร' },
        { value: 'warning', label: 'คำเตือน' },
        { value: 'maintenance', label: 'บำรุงรักษา' },
        { value: 'update', label: 'อัปเดตระบบ' },
        { value: 'emergency', label: 'ฉุกเฉิน' }
    ];

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private restService: RestService,
        private router: Router,
        private toast: ToastService
    ) {
        this.dataSource = new MatTableDataSource<GlobalAnnouncement>([]);
    }

    ngOnInit(): void {
        this.loadAnnouncements();
    }

    ngAfterViewInit(): void {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;

        // Custom filter predicate
        this.dataSource.filterPredicate = (data: GlobalAnnouncement, filter: string) => {
            return data.title.toLowerCase().includes(filter.toLowerCase()) ||
                data.content.toLowerCase().includes(filter.toLowerCase());
        };
    }

    loadAnnouncements(): void {
        this.isLoading.next(true);
        this.restService.getGlobalAnnouncements({ limit: 100 }).subscribe({
            next: (res: any) => {
                if (res.status === 'success') {
                    this.allAnnouncements = res.data;
                    this.pageEvent.length = this.allAnnouncements.length;
                    this.updateDisplayedData();
                }
                this.isLoading.next(false);
            },
            error: (err) => {
                console.error('Error loading announcements:', err);
                this.isLoading.next(false);
            }
        });
    }

    updateDisplayedData(): void {
        let filtered = [...this.allAnnouncements];

        // Filter by status
        if (this.selectedStatus !== 'all') {
            filtered = filtered.filter(item => {
                const isActive = item.is_active === 1 || item.is_active === true;
                return this.selectedStatus === 'active' ? isActive : !isActive;
            });
        }

        // Filter by type
        if (this.selectedType !== 'all') {
            filtered = filtered.filter(item => item.type === this.selectedType);
        }

        // Filter by search term
        if (this.searchTerm.trim()) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(item =>
                item.title.toLowerCase().includes(term) ||
                item.content.toLowerCase().includes(term)
            );
        }

        this.pageEvent.length = filtered.length;

        // Apply pagination
        const startIndex = this.pageEvent.pageIndex * this.pageEvent.pageSize;
        this.dataSource.data = filtered.slice(startIndex, startIndex + this.pageEvent.pageSize);
    }

    applyFilter(event: Event): void {
        this.searchTerm = (event.target as HTMLInputElement).value;
        this.pageEvent.pageIndex = 0;
        this.updateDisplayedData();
    }

    filterByStatus(status: string): void {
        this.selectedStatus = status;
        this.pageEvent.pageIndex = 0;
        this.updateDisplayedData();
    }

    filterByType(type: string): void {
        this.selectedType = type;
        this.pageEvent.pageIndex = 0;
        this.updateDisplayedData();
    }

    onReset(): void {
        this.searchTerm = '';
        this.selectedStatus = 'all';
        this.selectedType = 'all';
        this.pageEvent.pageIndex = 0;
        this.updateDisplayedData();
    }

    handlePageEvent(event: PageEvent): void {
        this.pageEvent = event;
        this.updateDisplayedData();
    }

    goToCreate(): void {
        this.router.navigate(['/super-admin/announcements/create']);
    }

    goToEdit(id: number): void {
        this.router.navigate(['/super-admin/announcements/edit', id]);
    }

    deleteAnnouncement(id: number): void {
        if (confirm('คุณต้องการลบประกาศนี้หรือไม่?')) {
            this.restService.deleteGlobalAnnouncement(id).subscribe({
                next: (res: any) => {
                    if (res.status === 'success') {
                        this.toast.success('ลบประกาศสำเร็จ');
                        this.loadAnnouncements();
                    } else {
                        this.toast.error('เกิดข้อผิดพลาดในการลบประกาศ');
                    }
                },
                error: (err) => {
                    console.error('Error deleting announcement:', err);
                    this.toast.error('เกิดข้อผิดพลาดในการลบประกาศ');
                }
            });
        }
    }

    getTypeLabel(type: string): string {
        const typeObj = this.types.find(t => t.value === type);
        return typeObj ? typeObj.label : type;
    }

    getTargetProjectCount(targetProjects: any): number {
        if (!targetProjects) return 0;

        // If it's a string, parse it as JSON
        if (typeof targetProjects === 'string') {
            try {
                const parsed = JSON.parse(targetProjects);
                return Array.isArray(parsed) ? parsed.length : 0;
            } catch (e) {
                return 0;
            }
        }

        // If it's already an array
        if (Array.isArray(targetProjects)) {
            return targetProjects.length;
        }

        return 0;
    }
}

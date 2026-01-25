import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
    RestService,
    Vehicle,
    VehicleStats,
    Zone,
    GetVehiclesParams,
} from '../../services/rest.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/toast/toast.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { FlexLayoutModule } from '@angular/flex-layout';
import { SelectionModel } from '@angular/cdk/collections';
import { VehicleDialogComponent } from './vehicle-dialog/vehicle-dialog.component';

@Component({
    selector: 'app-vehicle-management',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        PageHeaderComponent,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        MatDialogModule,
        MatTooltipModule,
        MatMenuModule,
        FlexLayoutModule,
    ],
    templateUrl: './vehicle-management.component.html',
    styleUrls: ['./vehicle-management.component.scss'],
})
export class VehicleManagementComponent implements OnInit {
    // Stats
    stats: VehicleStats = {
        total_vehicles: 0,
        active_vehicles: 0,
        inactive_vehicles: 0,
        units_with_vehicles: 0,
        total_units: 0,
        units_without_vehicles: 0,
        vehicles_by_zone: [],
        recent_vehicles_7_days: 0,
    };

    // Table
    displayedColumns: string[] = [
        'select',
        'sequence',
        'plate_number',
        'brand',
        'color',
        'unit_number',
        'zone_name',
        'is_active',
        'created_at',
        'actions',
    ];
    dataSource = new MatTableDataSource<Vehicle>([]);
    selection = new SelectionModel<Vehicle>(true, []);

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    // Loading & Project
    isLoading = false;
    projectId: string = '';

    // Pagination
    pageEvent = {
        length: 0,
        pageSize: 20,
        pageIndex: 0,
    };

    // Filters
    searchQuery: string = '';
    activeFilter: 'all' | 'active' | 'inactive' = 'all';
    selectedZoneId: string = '';
    zones: Zone[] = [];

    // Sort
    sortBy: 'plate_number' | 'created_at' | 'unit_number' | 'brand' | 'color' | 'is_active' = 'created_at';
    sortOrder: 'asc' | 'desc' = 'desc';

    constructor(
        private restService: RestService,
        private router: Router,
        private dialog: MatDialog,
        private toast: ToastService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.loadProjectId();
        this.loadZones();
        this.loadStats();
        this.loadVehicles();
    }

    loadProjectId(): void {
        const memberships = this.authService.getProjectMemberships();
        if (memberships && memberships.length > 0) {
            this.projectId = memberships[0].project_id;
        }
    }

    loadZones(): void {
        if (!this.projectId) return;

        this.restService.getZones(this.projectId).subscribe({
            next: (zones) => {
                this.zones = zones || [];
            },
            error: (err) => {
                console.error('Load zones error:', err);
            },
        });
    }

    loadStats(): void {
        if (!this.projectId) return;

        this.restService.getVehicleStats(this.projectId).subscribe({
            next: (res) => {
                if (res.status === 'success' && res.data) {
                    this.stats = res.data;
                }
            },
            error: (err) => {
                console.error('Load stats error:', err);
            },
        });
    }

    loadVehicles(): void {
        if (!this.projectId) {
            console.warn('No project ID found');
            return;
        }

        this.isLoading = true;
        this.selection.clear();

        const params: GetVehiclesParams = {
            project_id: this.projectId,
            page: this.pageEvent.pageIndex + 1,
            limit: this.pageEvent.pageSize,
            sort_by: this.sortBy,
            sort_order: this.sortOrder,
        };

        if (this.searchQuery.trim()) {
            params.search = this.searchQuery.trim();
        }

        if (this.activeFilter !== 'all') {
            params.is_active = this.activeFilter === 'active';
        }

        if (this.selectedZoneId) {
            params.zone_id = this.selectedZoneId;
        }

        this.restService.getVehicles(params).subscribe({
            next: (res) => {
                if (res.status === 'success') {
                    this.dataSource.data = res.data || [];
                    this.pageEvent.length = res.pagination?.total_items || 0;
                }
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Load vehicles error:', err);
                this.toast.error('ไม่สามารถโหลดข้อมูลยานพาหนะได้');
                this.isLoading = false;
            },
        });
    }

    // Filter Handlers
    onSearchChange(): void {
        this.pageEvent.pageIndex = 0;
        this.loadVehicles();
    }

    onFilterChange(filter: 'all' | 'active' | 'inactive'): void {
        this.activeFilter = filter;
        this.pageEvent.pageIndex = 0;
        this.loadVehicles();
    }

    onZoneChange(zoneId: string): void {
        this.selectedZoneId = zoneId;
        this.pageEvent.pageIndex = 0;
        this.loadVehicles();
    }

    handlePageEvent(event: PageEvent): void {
        this.pageEvent.pageIndex = event.pageIndex;
        this.pageEvent.pageSize = event.pageSize;
        this.loadVehicles();
    }

    // Selection
    isAllSelected(): boolean {
        const numSelected = this.selection.selected.length;
        const numRows = this.dataSource.data.length;
        return numSelected === numRows;
    }

    toggleAllRows(): void {
        if (this.isAllSelected()) {
            this.selection.clear();
        } else {
            this.dataSource.data.forEach((row) => this.selection.select(row));
        }
    }

    // CRUD Actions
    openAddDialog(): void {
        const dialogRef = this.dialog.open(VehicleDialogComponent, {
            width: '600px',
            data: { mode: 'add', projectId: this.projectId },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadVehicles();
                this.loadStats();
                this.toast.success('เพิ่มยานพาหนะสำเร็จ');
            }
        });
    }

    openEditDialog(vehicle: Vehicle): void {
        const dialogRef = this.dialog.open(VehicleDialogComponent, {
            width: '600px',
            data: { mode: 'edit', projectId: this.projectId, vehicle },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadVehicles();
                this.loadStats();
                this.toast.success('แก้ไขยานพาหนะสำเร็จ');
            }
        });
    }

    deleteVehicle(vehicle: Vehicle): void {
        if (!confirm(`ต้องการลบยานพาหนะ "${vehicle.plate_number}" หรือไม่?`)) {
            return;
        }

        this.restService.deleteVehicle(vehicle.id, this.projectId).subscribe({
            next: (res) => {
                if (res.status === 'success') {
                    this.toast.success('ลบยานพาหนะสำเร็จ');
                    this.loadVehicles();
                    this.loadStats();
                } else {
                    this.toast.error(res.message || 'ไม่สามารถลบยานพาหนะได้');
                }
            },
            error: (err) => {
                console.error('Delete vehicle error:', err);
                this.toast.error('เกิดข้อผิดพลาดในการลบยานพาหนะ');
            },
        });
    }

    // Bulk Actions
    bulkSetActive(isActive: boolean): void {
        if (this.selection.isEmpty()) {
            this.toast.warning('กรุณาเลือกยานพาหนะอย่างน้อย 1 รายการ');
            return;
        }

        const vehicleIds = this.selection.selected.map((v) => v.id);
        const actionText = isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน';

        if (!confirm(`ต้องการ${actionText} ${vehicleIds.length} รายการ หรือไม่?`)) {
            return;
        }

        this.restService
            .bulkUpdateVehicles({
                project_id: this.projectId,
                vehicle_ids: vehicleIds,
                is_active: isActive,
            })
            .subscribe({
                next: (res) => {
                    if (res.status === 'success') {
                        this.toast.success(`${actionText}สำเร็จ ${res.data.updated_count} รายการ`);
                        this.selection.clear();
                        this.loadVehicles();
                        this.loadStats();
                    } else {
                        this.toast.error(res.message || `ไม่สามารถ${actionText}ได้`);
                    }
                },
                error: (err) => {
                    console.error('Bulk update error:', err);
                    this.toast.error(`เกิดข้อผิดพลาดในการ${actionText}`);
                },
            });
    }

    // Helpers
    refreshData(): void {
        this.loadStats();
        this.loadVehicles();
    }

    clearSearch(): void {
        this.searchQuery = '';
        this.onSearchChange();
    }

    formatDateTime(dateStr: string | null): string {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('th-TH', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });
        } catch (e) {
            return '-';
        }
    }

    getStatusBadgeClass(isActive: boolean): string {
        return isActive ? 'badge-green' : 'badge-gray';
    }

    getStatusText(isActive: boolean): string {
        return isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน';
    }
}

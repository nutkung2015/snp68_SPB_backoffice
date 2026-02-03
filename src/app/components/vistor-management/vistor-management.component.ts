import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RestService } from '../../services/rest.service';
import { AuthService } from '../../services/auth.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FlexLayoutModule } from '@angular/flex-layout';

interface DashboardStats {
  totalEntryToday: number;
  walkInCount: number;
  stampedCount: number;
  insideCount: number;
}

interface EntryLog {
  id: string;
  plate_number: string;
  visitor_name: string;
  visitor_type: 'resident' | 'visitor';
  image_car_url?: string;
  image_driver_url?: string;
  unit_number: string;
  estamp_status: 'pending' | 'approved' | 'rejected' | 'none';
  status: 'inside' | 'exited';
  check_in_time: string;
  check_out_time: string | null;
}

@Component({
  selector: 'app-vistor-management',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FlexLayoutModule
  ],
  templateUrl: './vistor-management.component.html',
  styleUrl: './vistor-management.component.scss'
})
export class VistorManagementComponent implements OnInit, AfterViewInit {
  stats: DashboardStats = {
    totalEntryToday: 0,
    walkInCount: 0,
    stampedCount: 0,
    insideCount: 0
  };

  // MatTable
  displayedColumns: string[] = ['sequence', 'plate_number', 'visitor_name', 'unit_number', 'check_in_time', 'check_out_time', 'status', 'details'];
  dataSource = new MatTableDataSource<EntryLog>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Getter สำหรับข้อมูลที่แสดงในหน้าปัจจุบัน
  get paginatedData(): EntryLog[] {
    const startIndex = this.pageEvent.pageIndex * this.pageEvent.pageSize;
    const endIndex = startIndex + this.pageEvent.pageSize;
    return this.sortedData.slice(startIndex, endIndex);
  }

  // Getter สำหรับข้อมูลที่ sort แล้ว
  get sortedData(): EntryLog[] {
    const data = this.dataSource.filteredData.slice();
    if (!this.sort || !this.sort.active || this.sort.direction === '') {
      return data;
    }
    return data.sort((a, b) => {
      const isAsc = this.sort.direction === 'asc';
      switch (this.sort.active) {
        case 'plate_number': return this.compare(a.plate_number || '', b.plate_number || '', isAsc);
        case 'visitor_name': return this.compare(a.visitor_name || '', b.visitor_name || '', isAsc);
        case 'unit_number': return this.compare(a.unit_number || '', b.unit_number || '', isAsc);
        case 'check_in_time': return this.compare(a.check_in_time || '', b.check_in_time || '', isAsc);
        case 'check_out_time': return this.compare(a.check_out_time || '', b.check_out_time || '', isAsc);
        case 'status': return this.compare(a.status, b.status, isAsc);
        default: return 0;
      }
    });
  }

  compare(a: string | number, b: string | number, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  isLoading = false;
  projectId: string = '';

  // Pagination
  pageEvent = {
    length: 0,
    pageSize: 10,
    pageIndex: 0
  };

  // Filter
  activeFilter: 'all' | 'inside' | 'exited' | 'pending' = 'all';
  private allEntryLogs: EntryLog[] = [];

  constructor(
    private restService: RestService,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadProjectId();
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // เชื่อมต่อ sort หลังจาก view init
    setTimeout(() => {
      if (this.sort) {
        this.dataSource.sort = this.sort;
        // Subscribe to sort changes to reset to first page
        this.sort.sortChange.subscribe(() => {
          this.pageEvent.pageIndex = 0;
        });
      }
    });
  }

  loadProjectId(): void {
    const memberships = this.authService.getProjectMemberships();
    if (memberships && memberships.length > 0) {
      this.projectId = memberships[0].project_id;
    }
  }

  loadDashboardData(): void {
    if (!this.projectId) {
      console.warn('No project ID found');
      return;
    }

    this.isLoading = true;

    // Load stats
    this.restService.getVisitorStats(this.projectId).subscribe({
      next: (res: any) => {
        console.log('=== Visitor Stats API Response ===', res);
        console.log('=== res.data ===', res?.data);
        if (res.status === 'success' && res.data) {
          // Map snake_case from API to camelCase for template
          const data = res.data;
          this.stats = {
            totalEntryToday: data.total_entry_today ?? data.totalEntryToday ?? 0,
            walkInCount: data.walk_in_count ?? data.walkInCount ?? 0,
            stampedCount: data.stamped_count ?? data.stampedCount ?? 0,
            insideCount: data.inside_count ?? data.insideCount ?? 0
          };
          console.log('=== Mapped Stats ===', this.stats);
        }
      },
      error: (err) => {
        console.error('Load stats error:', err);
      }
    });

    // Load entry logs
    this.loadEntryLogs();
  }

  loadEntryLogs(): void {
    const params: any = {
      project_id: this.projectId,
      // โหลดข้อมูลทั้งหมด (ไม่ส่ง page และ limit)
    };

    this.restService.getEntryLogs(params).subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          const logs = res.data || [];
          this.allEntryLogs = logs;
          this.dataSource.data = logs;

          // ตั้งค่า custom filter predicate
          this.dataSource.filterPredicate = (data: EntryLog, filter: string) => {
            if (filter === 'all') return true;
            if (filter === 'inside') return data.status === 'inside';
            if (filter === 'exited') return data.status === 'exited';
            if (filter === 'pending') return data.estamp_status === 'pending' && data.status === 'inside';
            return true;
          };

          // Apply filter
          this.applyFilter();

          // เชื่อมต่อ sort หลังจากโหลดข้อมูล
          if (this.sort) {
            this.dataSource.sort = this.sort;
          }
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Load entry logs error:', err);
        this.isLoading = false;
      }
    });
  }

  applyFilter(): void {
    this.dataSource.filter = this.activeFilter;
    this.pageEvent.length = this.dataSource.filteredData.length;
    this.pageEvent.pageIndex = 0; // รีเซ็ตไปหน้าแรกเมื่อ filter
  }

  onFilterChange(filter: 'all' | 'inside' | 'exited' | 'pending'): void {
    this.activeFilter = filter;
    this.applyFilter();
  }

  handlePageEvent(event: PageEvent): void {
    this.pageEvent = event;
  }

  getStatusBadgeClass(item: EntryLog): string {
    if (item.status === 'exited') return 'badge-gray';
    if (item.visitor_type === 'resident') return 'badge-green';
    if (item.estamp_status === 'approved') return 'badge-green';
    if (item.estamp_status === 'pending') return 'badge-yellow';
    return 'badge-blue';
  }

  getStatusText(item: EntryLog): string {
    if (item.status === 'exited') return 'ออกแล้ว';
    if (item.visitor_type === 'resident') return 'ลูกบ้าน';
    if (item.estamp_status === 'approved') return 'อนุมัติแล้ว';
    if (item.estamp_status === 'pending') return 'รอประทับตรา';
    return 'เข้ามาแล้ว';
  }

  formatDateTime(dateStr: string | null): string {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('th-TH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '-';
    }
  }

  viewAttachmentCarImg(item: EntryLog): void {
    if (!item.image_car_url) return;
    window.open(item.image_car_url, '_blank');
  }

  viewAttachmentDriverImg(item: EntryLog): void {
    if (!item.image_driver_url) return;
    window.open(item.image_driver_url, '_blank');
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  viewDetails(item: EntryLog): void {
    this.router.navigate(['/vistor-management/detail', item.id]);
  }
}

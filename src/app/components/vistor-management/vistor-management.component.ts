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
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
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
      page: this.pageEvent.pageIndex + 1,
      limit: this.pageEvent.pageSize
    };

    if (this.activeFilter !== 'all') {
      params.filter = this.activeFilter;
    }

    this.restService.getEntryLogs(params).subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          this.dataSource.data = res.data || [];
          this.pageEvent.length = res.total || res.data?.length || 0;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Load entry logs error:', err);
        this.isLoading = false;
      }
    });
  }

  onFilterChange(filter: 'all' | 'inside' | 'exited' | 'pending'): void {
    this.activeFilter = filter;
    this.pageEvent.pageIndex = 0;
    this.isLoading = true;
    this.loadEntryLogs();
  }

  handlePageEvent(event: PageEvent): void {
    this.pageEvent.pageIndex = event.pageIndex;
    this.pageEvent.pageSize = event.pageSize;
    this.isLoading = true;
    this.loadEntryLogs();
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

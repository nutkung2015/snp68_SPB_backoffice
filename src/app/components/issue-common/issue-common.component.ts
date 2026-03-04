import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { HttpClientModule } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterModule } from '@angular/router';
import { RestService } from '../../services/rest.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { AuthService } from '../../services/auth.service';
import { CsvExportService, CsvColumn } from '../../services/csv-export.service';

type IssueStatus = 'pending' | 'in_progress' | 'resolved' | 'rejected' | 'all';

interface Issue {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: IssueStatus;
  reportedBy: string;
  reportedTel: string;
  assignedTo: string | null;
  createdAt: Date;
  updatedAt: Date;
  hasAttachment: boolean;
  attachmentUrls?: string[];
}

@Component({
  selector: 'app-issue-common',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSelectModule,
    FlexLayoutModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    HttpClientModule,
    RouterModule,
    PageHeaderComponent,
  ],
  templateUrl: './issue-common.component.html',
  styleUrl: './issue-common.component.scss'
})
export class IssueCommonComponent implements OnInit {
  isLoading = new BehaviorSubject<boolean>(true);
  isLoading$ = this.isLoading.asObservable();

  displayedColumns: string[] = [
    'sequence',
    'title',
    'type',
    'priority',
    'status',
    'reportedBy',
    'reportedTel',
    'assignedTo',
    'createdAt',
    'attachment',
    'details',
  ];

  dataSource: MatTableDataSource<Issue>;
  searchTerm = '';
  selectedStatus: IssueStatus = 'all';
  selectedType: string = 'all';
  selectedPriority: string = 'all';

  pageEvent: PageEvent = {
    pageIndex: 0,
    pageSize: 10,
    length: 0,
  };

  types = [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'AssetsFacilities', label: 'ทรัพย์สินและสาธารณูปโภค' },
    { value: 'LivingRegulations', label: 'การอยู่อาศัยและระเบียบข้อบังคับ' },
    { value: 'other', label: 'อื่นๆ' },
  ];

  priorities = [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'low', label: 'ต่ำ' },
    { value: 'medium', label: 'ปานกลาง' },
    { value: 'high', label: 'สูง' },
    { value: 'critical', label: 'วิกฤต' },
  ];

  statuses = [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'pending', label: 'รอดำเนินการ' },
    { value: 'in_progress', label: 'กำลังดำเนินการ' },
    { value: 'resolved', label: 'เสร็จสิ้น' },
    { value: 'rejected', label: 'ปฏิเสธ' },
  ];

  private allIssues: Issue[] = [];
  selectedRowIndex: number | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Getter สำหรับข้อมูลที่แสดงในหน้าปัจจุบัน
  get paginatedData(): Issue[] {
    const startIndex = this.pageEvent.pageIndex * this.pageEvent.pageSize;
    const endIndex = startIndex + this.pageEvent.pageSize;
    return this.sortedData.slice(startIndex, endIndex);
  }

  // Getter สำหรับข้อมูลที่ sort แล้ว
  get sortedData(): Issue[] {
    const data = this.dataSource.filteredData.slice();
    if (!this.sort || !this.sort.active || this.sort.direction === '') {
      return data;
    }
    return data.sort((a, b) => {
      const isAsc = this.sort.direction === 'asc';
      switch (this.sort.active) {
        case 'title': return this.compare(a.title, b.title, isAsc);
        case 'type': return this.compare(a.type, b.type, isAsc);
        case 'priority': return this.compare(a.priority, b.priority, isAsc);
        case 'status': return this.compare(a.status, b.status, isAsc);
        case 'reportedBy': return this.compare(a.reportedBy, b.reportedBy, isAsc);
        case 'reportedTel': return this.compare(a.reportedTel, b.reportedTel, isAsc);
        case 'assignedTo': return this.compare(a.assignedTo || '', b.assignedTo || '', isAsc);
        case 'createdAt': return this.compare(a.createdAt.getTime(), b.createdAt.getTime(), isAsc);
        default: return 0;
      }
    });
  }

  compare(a: string | number, b: string | number, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  constructor(
    private rest: RestService,
    private router: Router,
    private authService: AuthService,
    private csvExportService: CsvExportService
  ) {
    this.dataSource = new MatTableDataSource<Issue>([]);
  }

  ngOnInit() {
    this.loadIssues();
  }

  ngAfterViewInit() {
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

    // กำหนด filter predicate สำหรับการค้นหา
    this.dataSource.filterPredicate = (data: Issue, filter: string) => {
      const searchLower = filter.toLowerCase();
      return (
        (data.title || '').toLowerCase().includes(searchLower) ||
        (data.description || '').toLowerCase().includes(searchLower) ||
        (data.reportedBy || '').toLowerCase().includes(searchLower) ||
        (data.reportedTel || '').toLowerCase().includes(searchLower)
      );
    };
  }

  loadIssues() {
    this.isLoading.next(true);

    // Get project_id from AuthService
    const memberships = this.authService.getProjectMemberships();
    let projectId: string | null = null;

    if (memberships && memberships.length > 0) {
      projectId = memberships[0].project_id;
    }

    if (!projectId) {
      console.error('No project_id found in user session');
      this.isLoading.next(false);
      return;
    }

    const params: any = {
      project_id: projectId,
      // โหลดข้อมูลทั้งหมด (ไม่ส่ง limit และ offset)
    };

    // Add filters if they are not 'all' or empty
    if (this.selectedStatus !== 'all') {
      params.status = this.selectedStatus;
    }
    if (this.selectedType !== 'all') {
      params.issue_type = this.selectedType;
    }
    if (this.selectedPriority !== 'all') {
      params.priority = this.selectedPriority;
    }
    if (this.searchTerm) {
      params.search = this.searchTerm;
    }

    console.log('Common Issues Request params:', params);

    this.rest.getCommonIssues(params).pipe(
      catchError(error => {
        console.error('Error loading common issues:', error);
        return of({
          status: 'error' as const,
          data: [],
          count: 0,
          pagination: { limit: 10, offset: 0, total: 0 }
        });
      }),
      finalize(() => this.isLoading.next(false))
    ).subscribe({
      next: (response: any) => {
        if (response.status === 'error') {
          console.error('API returned error:', response.message);
          this.allIssues = [];
          this.dataSource.data = [];
          this.pageEvent.length = 0;
          this.pageEvent.pageIndex = 0;
          return;
        }

        const issues = response.data.map((item: any) => this.mapApiDataToIssue(item));
        this.allIssues = issues;
        this.dataSource.data = issues;
        this.pageEvent.length = issues.length;
        this.pageEvent.pageIndex = 0; // รีเซ็ตไปหน้าแรกเมื่อโหลดใหม่

        // เชื่อมต่อ sort หลังจากโหลดข้อมูล
        if (this.sort) {
          this.dataSource.sort = this.sort;
        }
      },
      error: (error) => console.error('Subscription error:', error),
    });
  }

  private mapApiDataToIssue(item: any): Issue {
    const hasAttachment = Array.isArray(item.image_urls) && item.image_urls.length > 0;

    return {
      id: item.id,
      title: item.description || item.issue_description,
      description: item.description || item.issue_description,
      type: item.issue_type,
      priority: item.priority,
      status: (item.status as IssueStatus) || 'pending',
      reportedBy: item.reporter_name,
      reportedTel: item.reporter_tel || '-',
      assignedTo: item.assigned_to,
      createdAt: new Date(item.reported_date || item.created_at),
      updatedAt: new Date(item.updated_at),
      hasAttachment,
      attachmentUrls: hasAttachment ? item.image_urls.map((att: any) => att.url) : []
    };
  }



  onSearch(): void {
    this.pageEvent.pageIndex = 0;
    this.loadIssues();
  }

  onReset(): void {
    this.searchTerm = '';
    this.selectedStatus = 'all';
    this.selectedType = 'all';
    this.selectedPriority = 'all';
    this.pageEvent.pageIndex = 0;
    this.loadIssues();
  }

  onCreateNew(): void {
    // TODO: Navigate to create common issue page
    // this.router.navigate(['/issue-common/create']);
  }

  viewDetails(issue: Issue): void {
    // TODO: Navigate to issue detail page
    this.router.navigate(['/issue-common/detail', issue.id]);
  }

  exportToCSV(): void {
    const columns: CsvColumn[] = [
      { header: 'หัวข้อปัญหา', key: 'title' },
      { header: 'ประเภท', key: 'type', transform: (val) => this.getTypeLabel(val) },
      { header: 'ความสำคัญ', key: 'priority', transform: (val) => this.getPriorityLabel(val) },
      { header: 'สถานะ', key: 'status', transform: (val) => this.getStatusLabel(val) },
      { header: 'ผู้รายงาน', key: 'reportedBy' },
      { header: 'เบอร์โทร', key: 'reportedTel' },
      { header: 'ผู้รับผิดชอบ', key: 'assignedTo' },
      { header: 'วันที่รายงาน', key: 'createdAt', transform: (val) => val ? new Date(val).toLocaleDateString('th-TH') : '-' }
    ];
    this.csvExportService.exportToCSV(this.dataSource.filteredData, columns, 'ปัญหาส่วนกลาง');
  }

  viewAttachment(issue: Issue): void {
    if (issue.attachmentUrls?.[0]) {
      window.open(issue.attachmentUrls[0], '_blank', 'noopener,noreferrer');
    }
  }

  handlePageEvent(event: PageEvent) {
    this.pageEvent = event;
  }

  // Utility methods for labels and badges
  getStatusBadgeClass = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: 'status-pending',
      in_progress: 'status-in-progress',
      resolved: 'status-resolved',
      rejected: 'status-rejected'
    };
    return statusMap[status] || '';
  };

  getTypeLabel = (type: string): string =>
    this.types.find(t => t.value === type)?.label || type;

  getPriorityLabel = (priority: string): string =>
    this.priorities.find(p => p.value === priority)?.label || priority;

  getStatusLabel = (status: string): string =>
    this.statuses.find(s => s.value === status)?.label || status;

  getPriorityBadgeClass = (priority: string): string => `priority-${priority}`;

  // Filter methods
  applyFilter(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
    this.pageEvent.length = this.dataSource.filteredData.length;
    this.pageEvent.pageIndex = 0;
  }

  filterByStatus(event: { value: IssueStatus }): void {
    this.selectedStatus = event.value;
    this.pageEvent.pageIndex = 0;
    this.onSearch();
  }

  filterByType(event: { value: string }): void {
    this.selectedType = event.value;
    this.pageEvent.pageIndex = 0;
    this.onSearch();
  }

  filterByPriority(event: { value: string }): void {
    this.selectedPriority = event.value;
    this.pageEvent.pageIndex = 0;
    this.onSearch();
  }
}

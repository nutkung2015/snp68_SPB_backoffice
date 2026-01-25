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
import { RestService, PersonalRepairResponse, PersonalRepair } from '../../services/rest.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { AuthService } from '../../services/auth.service';

type IssueStatus = 'pending' | 'in_progress' | 'completed' | 'rejected' | 'all';

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
  selector: 'app-issue',
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
  templateUrl: './issue.component.html',
  styleUrls: ['./issue.component.scss'],
})
export class IssueComponent implements OnInit {
  currentView: 'personal' | 'common' = 'personal';
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
    { value: 'plumbing', label: 'ประปา' },
    { value: 'electrical', label: 'ไฟฟ้า' },
    { value: 'door_window', label: 'ประตู-หน้าต่าง' },
    { value: 'wall_ceiling', label: 'ผนัง-เพดาน' },
    { value: 'floor', label: 'พื้น' },
    { value: 'roof', label: 'หลังคา' },
    { value: 'air_conditioning', label: 'เครื่องปรับอากาศ' },
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
    { value: 'completed', label: 'เสร็จสิ้น' },
    { value: 'rejected', label: 'ปฏิเสธ' },
  ];

  private allIssues: Issue[] = [];
  selectedRowIndex: number | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private rest: RestService,
    private router: Router,
    private authService: AuthService // Inject AuthService
  ) {
    this.dataSource = new MatTableDataSource<Issue>([]);
  }

  ngOnInit() {
    this.loadIssues();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
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
      limit: this.pageEvent.pageSize.toString(),
      offset: (this.pageEvent.pageIndex * this.pageEvent.pageSize).toString(),
    };

    // Add filters if they are not 'all' or empty
    if (this.selectedStatus !== 'all') {
      params.status = this.selectedStatus;
    }
    if (this.selectedType !== 'all') {
      params.repair_category = this.selectedType;
    }
    if (this.selectedPriority !== 'all') {
      params.priority = this.selectedPriority;
    }
    if (this.searchTerm) {
      params.search = this.searchTerm;
    }

    console.log('Request params:', params);

    const apiCall = this.currentView === 'personal'
      ? this.rest.getPersonalRepairs(params)
      : this.rest.getCommonIssues(params);

    apiCall.pipe(
      catchError(error => {
        console.error('Error loading issues:', error);
        return of({
          status: 'error' as const,
          data: [],
          count: 0,
          pagination: { limit: 10, offset: 0, total: 0 }
        });
      }),
      finalize(() => this.isLoading.next(false))
    ).subscribe({
      next: (response: PersonalRepairResponse) => {
        if (response.status === 'error') {
          console.error('API returned error:', response.message);
          this.allIssues = [];
          this.updateDataSource([], 0);
          return;
        }

        const issues = response.data.map(item => this.mapApiDataToIssue(item));
        const total = response.pagination?.total || response.count || 0;

        this.allIssues = issues;
        this.updateDataSource(issues, total);
      },
      error: (error) => console.error('Subscription error:', error),
    });
  }

  private mapApiDataToIssue(item: PersonalRepair): Issue {
    const hasAttachment = Array.isArray(item.image_urls) && item.image_urls.length > 0;

    return {
      id: item.id,
      title: item.description,
      description: item.description,
      type: item.repair_category,
      priority: item.priority,
      status: (item.status as IssueStatus) || 'pending',
      reportedBy: item.reporter_name,
      reportedTel: item.reporter_tel,
      assignedTo: item.assigned_to,
      createdAt: new Date(item.submitted_date),
      updatedAt: new Date(item.updated_at),
      hasAttachment,
      attachmentUrls: hasAttachment ? item.image_urls.map(att => att.url) : []
    };
  }

  private updateDataSource(issues: Issue[], total: number) {
    this.dataSource.data = issues;
    this.pageEvent.length = total;
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
    this.router.navigate(['/issue/create']);
  }

  viewDetails(issue: Issue): void {
    this.router.navigate(['/issue/detail', issue.id]);
  }

  viewAttachment(issue: Issue): void {
    if (issue.attachmentUrls?.[0]) {
      window.open(issue.attachmentUrls[0], '_blank', 'noopener,noreferrer');
    }
  }

  handlePageEvent(event: PageEvent) {
    this.pageEvent = event;
    this.loadIssues();
  }

  // Utility methods for labels and badges
  getStatusBadgeClass = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: 'status-pending',
      in_progress: 'status-in-progress',
      completed: 'status-completed',
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
  }

  filterByStatus(event: { value: IssueStatus }): void {
    this.selectedStatus = event.value;
    this.pageEvent.pageIndex = 0;
    this.loadIssues();
  }

  filterByType(event: { value: string }): void {
    this.selectedType = event.value;
    this.pageEvent.pageIndex = 0;
    this.loadIssues();
  }

  filterByPriority(event: { value: string }): void {
    this.selectedPriority = event.value;
    this.pageEvent.pageIndex = 0;
    this.loadIssues();
  }
}
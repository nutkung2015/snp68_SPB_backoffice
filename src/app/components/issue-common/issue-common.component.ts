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
    { value: 'completed', label: 'เสร็จสิ้น' },
    { value: 'rejected', label: 'ปฏิเสธ' },
  ];

  private allIssues: Issue[] = [];
  selectedRowIndex: number | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private rest: RestService, private router: Router) {
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

    // ดึง project_id จาก projectMemberships ใน localStorage หรือที่เก็บไว้
    let projectId = localStorage.getItem('project_id');

    if (!projectId) {
      const membershipsStr = localStorage.getItem('projectMemberships');
      if (membershipsStr) {
        try {
          const memberships = JSON.parse(membershipsStr);
          if (memberships && memberships.length > 0) {
            projectId = memberships[0].project_id;
            localStorage.setItem('project_id', projectId!);
          }
        } catch (e) {
          console.error('Error parsing projectMemberships:', e);
        }
      }
    }

    if (!projectId) {
      console.error('No project_id found');
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
          this.updateDataSource([], 0);
          return;
        }

        const issues = response.data.map((item: any) => this.mapApiDataToIssue(item));
        const total = response.pagination?.total || response.count || 0;

        this.allIssues = issues;
        this.updateDataSource(issues, total);
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
    // TODO: Navigate to create common issue page
    // this.router.navigate(['/issue-common/create']);
  }

  viewDetails(issue: Issue): void {
    // TODO: Navigate to issue detail page
    this.router.navigate(['/issue-common/detail', issue.id]);
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

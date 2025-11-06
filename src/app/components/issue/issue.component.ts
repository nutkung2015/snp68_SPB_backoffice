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

type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'reopened' | 'all';

interface Issue {
  id: number;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: IssueStatus;
  reportedBy: string;
  assignedTo: string | null;
  createdAt: Date;
  updatedAt: Date;
  hasAttachment: boolean;
  attachmentUrls?: string[];
}

// Using PersonalRepairResponse from rest.service.ts instead

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
    'assignedTo',
    'createdAt',
    'actions',
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
    { value: 'building', label: 'อาคาร' },
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
    { value: 'open', label: 'เปิด' },
    { value: 'in_progress', label: 'กำลังดำเนินการ' },
    { value: 'resolved', label: 'แก้ไขแล้ว' },
    { value: 'closed', label: 'ปิด' },
    { value: 'reopened', label: 'เปิดใหม่' },
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
    if (this.currentView === 'personal') {
      this.loadPersonalIssues();
    } else {
      this.loadCommonIssues();
    }
  }

  loadPersonalIssues() {
    this.isLoading.next(true);

    // ดึง project_id จาก projectMemberships ใน localStorage
    const membershipsStr = localStorage.getItem('projectMemberships');
    let projectId = '';
    
    if (membershipsStr) {
      try {
        const memberships = JSON.parse(membershipsStr);
        if (memberships && memberships.length > 0) {
          projectId = memberships[0].project_id;
          // เก็บ project_id ไว้ใช้ต่อ
          localStorage.setItem('project_id', projectId);
        }
      } catch (e) {
        console.error('Error parsing projectMemberships:', e);
      }
    }

    if (!projectId) {
      console.error('No project_id found in projectMemberships');
      this.isLoading.next(false);
      return;
    }

    const params = {
      project_id: projectId,
      limit: this.pageEvent.pageSize.toString(),
      offset: (this.pageEvent.pageIndex * this.pageEvent.pageSize).toString(),
    };

    console.log('Request params:', params);

    this.rest.getPersonalRepairs(params).pipe(
      map((response: PersonalRepairResponse) => {
        if (response.status === 'error') {
          throw new Error(response.message || 'Unknown error');
        }
        return response.data.map(item => this.mapApiDataToIssue(item));
      }),
      catchError(error => {
        console.error('Error loading personal issues:', error);
        return of([]);
      }),
      finalize(() => this.isLoading.next(false))
    ).subscribe({
      next: (issues) => {
        this.allIssues = issues;
        this.updateDataSource(issues);
      },
      error: (error) => console.error('Subscription error:', error),
    });
  }

  loadCommonIssues() {
    // Similar to loadPersonalIssues but for common issues
  }

  private mapApiDataToIssue(item: PersonalRepair): Issue {
    const hasAttachment = Array.isArray(item.image_urls) && item.image_urls.length > 0;
    
    return {
      id: Number(item.id.replace(/^(PR-|CR-)/, '')),
      title: item.description,
      description: item.description,
      type: item.repair_category,
      priority: item.priority,
      status: (item.status as IssueStatus) || 'open',
      reportedBy: item.reporter_name,
      assignedTo: item.assigned_to,
      createdAt: new Date(item.submitted_date),
      updatedAt: new Date(item.updated_at),
      hasAttachment,
      attachmentUrls: hasAttachment ? item.image_urls.map(att => att.url) : []
    };
  }

  private updateDataSource(issues: Issue[]) {
    this.dataSource.data = issues;
    this.pageEvent.length = issues.length;
  }

  onSearch(): void {
    // ดึง project_id จาก localStorage (ที่เราเก็บไว้ตอน loadPersonalIssues)
    const projectId = localStorage.getItem('project_id');
    
    if (!projectId) {
      console.error('No project_id found');
      return;
    }

    const params = {
      project_id: projectId,
      limit: this.pageEvent.pageSize.toString(),
      offset: (this.pageEvent.pageIndex * this.pageEvent.pageSize).toString(),
      ...(this.selectedStatus !== 'all' && { status: this.selectedStatus }),
      ...(this.selectedType !== 'all' && { type: this.selectedType }),
      ...(this.selectedPriority !== 'all' && { priority: this.selectedPriority }),
      ...(this.searchTerm && { search: this.searchTerm })
    };

    const apiCall = this.currentView === 'personal' 
      ? this.rest.getPersonalRepairs(params)
      : this.rest.getCommonIssues(params);

    this.isLoading.next(true);
    
    apiCall.pipe(
      map((response: PersonalRepairResponse) => {
        if (response.status === 'error') {
          throw new Error(response.message);
        }
        return response.data.map(item => this.mapApiDataToIssue(item));
      }),
      catchError(error => {
        console.error('Error searching issues:', error);
        return of([]);
      }),
      finalize(() => this.isLoading.next(false))
    ).subscribe({
      next: (issues) => {
        this.allIssues = issues;
        this.updateDataSource(issues);
      },
      error: (error) => console.error('Search subscription error:', error),
    });
  }

  onReset(): void {
    this.searchTerm = '';
    this.selectedStatus = 'all';
    this.selectedType = 'all';
    this.selectedPriority = 'all';
    this.loadIssues();
  }

  onCreateNew(): void {
    this.router.navigate(['/issue/create']);
  }

  viewDetails(issue: Issue): void {
    this.router.navigate(['/issue/detail', `iss${issue.id}`]);
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
      open: 'status-open',
      in_progress: 'status-in-progress',
      resolved: 'status-resolved',
      closed: 'status-closed',
      reopened: 'status-reopened'
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
  }

  filterByType(event: { value: string }): void {
    this.selectedType = event.value;
  }

  filterByPriority(event: { value: string }): void {
    this.selectedPriority = event.value;
  }
}
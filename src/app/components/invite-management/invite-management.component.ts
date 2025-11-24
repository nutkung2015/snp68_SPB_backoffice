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
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

import { AuthService } from '../../services/auth.service';

type InvitationStatus = StatusType | 'all';
type StatusType = 'pending' | 'sent' | 'accepted' | 'declined' | 'expired';

interface UnitInvitation {
  id: string;
  unit_id: string;
  unit_number: string;
  project_id: string;
  invited_by: string;
  invited_by_name: string;
  code: string;
  qr_code_url?: string | null;
  status: string;
  role: string;
  invited_email?: string | null;
  invited_phone?: string | null;
  expires_at: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
}

interface APIResponse {
  status: string;
  message: string;
  data: {
    all_units_invite: UnitInvitation[];
    unit_invitations: UnitInvitation[];
  };
  count: {
    project: number;
    unit: number;
  };
}

@Component({
  selector: 'app-invite-management',
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
    PageHeaderComponent,
  ],
  templateUrl: './invite-management.component.html',
  styleUrls: ['./invite-management.component.scss'],
})
export class InviteManagementComponent implements OnInit {
  private apiUrl = 'http://localhost:5000/api/units/unit-invitations';

  isLoading = new BehaviorSubject<boolean>(true);
  isLoading$: Observable<boolean> = this.isLoading.asObservable();

  displayedColumns: string[] = [
    'sequence',
    'unit_number',
    'invited_email',
    'role',
    'status',
    'invited_by_name',
    'expires_at',
    'actions',
  ];

  dataSource: MatTableDataSource<UnitInvitation>;
  searchTerm = '';
  pageEvent: PageEvent = {
    pageIndex: 0,
    pageSize: 10,
    length: 0,
  };

  selectedStatus: InvitationStatus = 'all';
  selectedUnitId: string | null = null;
  selectedUnitNumber: string | null = null;

  private allInvitations: UnitInvitation[] = [];
  currentProjectName = '';
  currentProjectId = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {
    this.dataSource = new MatTableDataSource<UnitInvitation>([]);
  }

  ngOnInit() {
    this.loadInvitations();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.filterPredicate = (data: UnitInvitation, filter: string) => {
      const searchLower = filter.toLowerCase();
      return (
        (data.unit_number || '').toLowerCase().includes(searchLower) ||
        (data.invited_email || '').toLowerCase().includes(searchLower) ||
        (data.invited_by_name || '').toLowerCase().includes(searchLower) ||
        (data.code || '').toLowerCase().includes(searchLower)
      );
    };
  }

  private parseDate(dateValue: any): Date | null {
    if (!dateValue) return null;
    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? null : dateValue;
    }
    const parsedDate = new Date(dateValue);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  formatDate(date: Date | null | undefined, format = 'dd/MM/yyyy HH:mm'): string {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return '-';
    }
    const pad = (value: number) => String(value).padStart(2, '0');
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return format
      .replace('dd', day)
      .replace('MM', month)
      .replace('yyyy', String(year))
      .replace('HH', hours)
      .replace('mm', minutes);
  }

  private getHttpHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  private buildParams(): URLSearchParams {
    const params = new URLSearchParams();

    if (this.selectedStatus !== 'all') {
      params.append('status', this.selectedStatus);
    }
    if (this.selectedUnitId) {
      params.append('unit_id', this.selectedUnitId);
    }

    return params;
  }

  loadInvitations() {
    this.isLoading.next(true);
  
    const projectMemberships = this.authService.getProjectMemberships();
    if (!projectMemberships || projectMemberships.length === 0) {
      alert('ไม่พบการเป็นสมาชิกโครงการ กรุณาติดต่อผู้ดูแลระบบ');
      this.isLoading.next(false);
      return;
    }
  
    const firstProject = projectMemberships[0];
    this.currentProjectId = firstProject.project_id;
    this.currentProjectName = firstProject.project_name || 'โครงการ';
  
    const params = this.buildParams();
    params.append('project_id', this.currentProjectId);
  
    const headers = this.getHttpHeaders();
    const url = `${this.apiUrl}?${params.toString()}`;
  
    console.log('Request URL:', url); // เพิ่ม log เพื่อ debug
  
    this.http
      .get<APIResponse>(url, { headers })
      .pipe(
        map((response) => {
          console.log('Full Response:', response); // เพิ่ม log เพื่อ debug
          
          // เช็ค response structure
          if (!response || !response.data) {
            console.warn('Response structure ไม่ถูกต้อง:', response);
            return [];
          }
  
          // ดึงข้อมูลจาก all_units_invite (คำเชิญทั้งหมดใน project)
          const invitations = response.data.all_units_invite || [];
          
          console.log('Invitations found:', invitations.length); // เพิ่ม log เพื่อ debug
  
          // Map และแปลง date
          return invitations.map((item) => ({
            ...item,
            expires_at: this.parseDate(item.expires_at),
            created_at: this.parseDate(item.created_at),
            updated_at: this.parseDate(item.updated_at),
          }));
        }),
        catchError((error) => {
          console.error('Error loading unit invitations:', error);
          console.error('Error details:', error.error); // เพิ่ม log เพื่อ debug
          if (error.error?.message) {
            alert(`เกิดข้อผิดพลาด: ${error.error.message}`);
          }
          return of([] as UnitInvitation[]);
        }),
        finalize(() => this.isLoading.next(false))
      )
      .subscribe((invitations) => {
        console.log('Final invitations:', invitations); // เพิ่ม log เพื่อ debug
        this.allInvitations = invitations;
        this.dataSource.data = invitations;
        this.pageEvent.length = invitations.length;
      });
  }

  onSearch(): void {
    this.loadInvitations();
  }

  onReset(): void {
    this.searchTerm = '';
    this.selectedStatus = 'all';
    this.dataSource.data = this.allInvitations;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  filterByStatus(status: InvitationStatus) {
    this.selectedStatus = status;
    this.onSearch();
  }

  filterByUnit(unitId: string | null) {
    this.selectedUnitId = unitId;
    this.onSearch();
  }

  onCreateNew(): void {
    this.router.navigate(['/invite-management/create']);
  }

  onCreateUnit(): void {
    this.router.navigate(['/invite-management/create-unit']);
  }

  viewDetails(invitation: UnitInvitation): void {
    this.router.navigate(['/invite-management/detail', invitation.id]);
  }

  handlePageEvent(event: PageEvent) {
    this.pageEvent = event;
  }

  openQrCode(url: string | null | undefined): void {
    if (!url) return;
    window.open(url, '_blank', 'noopener');
  }
}
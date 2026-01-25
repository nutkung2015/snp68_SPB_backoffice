import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
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
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';

import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

import { AuthService } from '../../services/auth.service';
import { RestService } from '../../services/rest.service';
import { ToastService } from '../../shared/toast/toast.service';

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
    MatTooltipModule,
  ],
  templateUrl: './invite-management.component.html',
  styleUrls: ['./invite-management.component.scss'],
})
export class InviteManagementComponent implements OnInit {
  // private apiUrl = 'http://localhost:5000/api/units/unit-invitations'; // Removed as RestService handles it

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

  // Getter สำหรับข้อมูลที่แสดงในหน้าปัจจุบัน
  get paginatedData(): UnitInvitation[] {
    const startIndex = this.pageEvent.pageIndex * this.pageEvent.pageSize;
    const endIndex = startIndex + this.pageEvent.pageSize;
    return this.sortedData.slice(startIndex, endIndex);
  }

  // Getter สำหรับข้อมูลที่ sort แล้ว
  get sortedData(): UnitInvitation[] {
    const data = this.dataSource.filteredData.slice();
    if (!this.sort || !this.sort.active || this.sort.direction === '') {
      return data;
    }
    return data.sort((a, b) => {
      const isAsc = this.sort.direction === 'asc';
      switch (this.sort.active) {
        case 'unit_number': return this.compare(a.unit_number, b.unit_number, isAsc);
        case 'invited_email': return this.compare(a.invited_email || '', b.invited_email || '', isAsc);
        case 'role': return this.compare(a.role, b.role, isAsc);
        case 'status': return this.compare(a.status, b.status, isAsc);
        case 'invited_by_name': return this.compare(a.invited_by_name || '', b.invited_by_name || '', isAsc);
        case 'expires_at': return this.compare(a.expires_at?.getTime() || 0, b.expires_at?.getTime() || 0, isAsc);
        default: return 0;
      }
    });
  }

  compare(a: string | number, b: string | number, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private restService: RestService,
    private toast: ToastService
  ) {
    this.dataSource = new MatTableDataSource<UnitInvitation>([]);
  }

  ngOnInit() {
    this.loadInvitations();
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

  // private getHttpHeaders(): HttpHeaders {
  //   // Token handling is now done via HttpOnly cookies and Interceptor
  //   // const token = this.authService.getToken(); // getToken removed
  //   return new HttpHeaders({
  //     // Authorization: `Bearer ${token} `,
  //     'Content-Type': 'application/json',
  //   });
  // }

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
      this.toast.error('ไม่พบการเป็นสมาชิกโครงการ กรุณาติดต่อผู้ดูแลระบบ', 5000);
      this.isLoading.next(false);
      return;
    }

    const firstProject = projectMemberships[0];
    this.currentProjectId = firstProject.project_id;
    this.currentProjectName = firstProject.project_name || 'โครงการ';

    // ใช้ RestService แทน direct http call
    this.restService.getUnitInvitations(this.currentProjectId, this.selectedStatus !== 'all' ? this.selectedStatus : undefined)
      .pipe(
        map((invitations: any[]) => {
          console.log('Invitations found:', invitations.length);

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
          if (error.error?.message) {
            this.toast.error(`เกิดข้อผิดพลาด: ${error.error.message}`);
          }
          return of([] as UnitInvitation[]);
        }),
        finalize(() => this.isLoading.next(false))
      )
      .subscribe((invitations) => {
        console.log('Final invitations:', invitations);
        this.allInvitations = invitations;
        this.dataSource.data = invitations;
        this.pageEvent.length = invitations.length;
        this.pageEvent.pageIndex = 0; // รีเซ็ตไปหน้าแรกเมื่อโหลดใหม่

        // เชื่อมต่อ sort หลังจากโหลดข้อมูล
        if (this.sort) {
          this.dataSource.sort = this.sort;
        }
      });
  }

  onSearch(): void {
    this.loadInvitations();
  }

  onReset(): void {
    this.searchTerm = '';
    this.selectedStatus = 'all';
    this.dataSource.data = this.allInvitations;
    this.dataSource.filter = '';
    this.pageEvent.length = this.allInvitations.length;
    this.pageEvent.pageIndex = 0;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.pageEvent.length = this.dataSource.filteredData.length;
    this.pageEvent.pageIndex = 0;
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
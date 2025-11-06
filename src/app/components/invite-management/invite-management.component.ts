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
import { HttpClient } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

import { AuthService } from '../../services/auth.service';

type InvitationStatus = StatusType | 'all';
type StatusType = 'sent' | 'accepted' | 'declined' | 'pending' | 'expired';

interface Invitation {
  id: string;
  project_id: string;
  sender_id: string;
  invitation_code: string;
  role: string;
  status: string;
  expires_at: Date;
  created_at: Date;
  project_name: string;
  sender_name: string;
  sender_email: string;
}

interface APIResponse {
  status: string;
  message: string;
  data: Invitation[];
  count: number;
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
  private apiUrl = 'http://localhost:5000/api/project_invitations';

  isLoading = new BehaviorSubject<boolean>(true);
  isLoading$: Observable<boolean> = this.isLoading.asObservable();

  displayedColumns: string[] = [
    'sequence',
    'project_name',
    'sender_name',
    'sender_email',
    'role',
    'status',
    'expires_at',
    'created_at',
    'details',
  ];
  dataSource: MatTableDataSource<Invitation>;
  searchTerm = '';

  pageEvent: PageEvent = {
    pageIndex: 0,
    pageSize: 10,
    length: 0,
  };

  searchType = 'project_name';
  selectedStatus: InvitationStatus = 'all';

  private allInvitations: Invitation[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) {
    this.dataSource = new MatTableDataSource<Invitation>([]);
  }

  ngOnInit() {
    this.loadInvitations();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // กำหนด filter predicate สำหรับการค้นหา
    this.dataSource.filterPredicate = (data: Invitation, filter: string) => {
      return data.project_name.toLowerCase().includes(filter.toLowerCase()) ||
             data.sender_name.toLowerCase().includes(filter.toLowerCase()) ||
             data.sender_email.toLowerCase().includes(filter.toLowerCase());
    };
  }

  loadInvitations() {
    const userRole = this.authService.getUserRole();
    const projectMemberships = this.authService.getProjectMemberships();

    const params = new URLSearchParams();
    if (this.selectedStatus !== 'all') {
      params.append('status', this.selectedStatus);
    }

    // ตรรกะตามบทบาทผู้ใช้
    if (userRole === 'super-admin') {
      // ผู้ดูแลระบบสามารถดูคำเชิญทั้งหมดได้
      console.log('กำลังโหลดคำเชิญทั้งหมดในฐานะผู้ดูแลระบบ');
    } else if (userRole === 'juristic') {
      // ผู้ใช้ฝ่ายนิติบุคคลต้องการ project_id จากการเป็นสมาชิก
      if (projectMemberships && projectMemberships.length > 0) {
        // สำหรับความง่าย ใช้การเป็นสมาชิกโครงการแรก
        const firstProject = projectMemberships[0];
        params.append('project_id', firstProject.project_id);
        console.log('กำลังโหลดคำเชิญสำหรับโครงการ:', firstProject.project_id);
      } else {
        console.error('ไม่พบการเป็นสมาชิกโครงการสำหรับผู้ใช้ฝ่ายนิติบุคคล');
        this.isLoading.next(false);
        return;
      }
    }

    this.http
      .get<APIResponse>(`${this.apiUrl}?${params.toString()}`)
      .pipe(
        map((response) => {
          return response.data.map((item) => ({
            ...item,
            expires_at: new Date(item.expires_at),
            created_at: new Date(item.created_at),
          }));
        }),
        catchError((error) => {
          console.error('เกิดข้อผิดพลาดในการโหลดคำเชิญ:', error);
          return of([] as Invitation[]);
        }),
        finalize(() => {
          this.isLoading.next(false);
        })
      )
      .subscribe({
        next: (invitations) => {
          this.allInvitations = invitations;
          this.dataSource.data = invitations;
        },
        error: (error) => console.error('เกิดข้อผิดพลาดในการสมัครรับข้อมูล:', error),
      });
  }

  onSearch(): void {
    this.isLoading.next(true);

    const userRole = this.authService.getUserRole();
    const projectMemberships = this.authService.getProjectMemberships();

    const params = new URLSearchParams();
    if (this.selectedStatus !== 'all') {
      params.append('status', this.selectedStatus);
    }

    // ตรรกะตามบทบาทผู้ใช้สำหรับการค้นหา
    if (userRole === 'super-admin') {
      // ผู้ดูแลระบบสามารถค้นหาคำเชิญทั้งหมดได้
      console.log('กำลังค้นหาคำเชิญทั้งหมดในฐานะผู้ดูแลระบบ');
    } else if (userRole === 'juristic') {
      // ผู้ใช้ฝ่ายนิติบุคคลต้องการ project_id จากการเป็นสมาชิก
      if (projectMemberships && projectMemberships.length > 0) {
        const firstProject = projectMemberships[0];
        params.append('project_id', firstProject.project_id);
        console.log('กำลังค้นหาคำเชิญสำหรับโครงการ:', firstProject.project_id);
      } else {
        console.error('ไม่พบการเป็นสมาชิกโครงการสำหรับผู้ใช้ฝ่ายนิติบุคคล');
        this.isLoading.next(false);
        return;
      }
    }

    this.http
      .get<APIResponse>(`${this.apiUrl}?${params.toString()}`)
      .pipe(
        map((response) => {
          return response.data.map((item) => ({
            ...item,
            expires_at: new Date(item.expires_at),
            created_at: new Date(item.created_at),
          }));
        }),
        catchError((error) => {
          console.error('เกิดข้อผิดพลาดในการค้นหาคำเชิญ:', error);
          return of([] as Invitation[]);
        }),
        finalize(() => {
          this.isLoading.next(false);
        })
      )
      .subscribe((invitations) => {
        this.dataSource.data = invitations;
      });
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

  filterByStatus(status: string) {
    if (status === 'all') {
      this.dataSource.data = this.allInvitations;
    } else {
      this.dataSource.data = this.allInvitations.filter(
        (item) => item.status === status
      );
    }
  }

  onCreateNew(): void {
    this.router.navigate(['/invite-management/create']);
  }

    onCreateUnit(): void {
    this.router.navigate(['/invite-management/create-unit']);
  }

  viewDetails(invitation: Invitation): void {
    this.router.navigate(['/invite-management/detail', invitation.id]);
  }

  handlePageEvent(event: PageEvent) {
    this.pageEvent = event;
  }
}

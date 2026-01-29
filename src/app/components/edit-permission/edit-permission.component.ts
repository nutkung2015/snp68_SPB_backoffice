import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

// Service
import { RestService } from '../../services/rest.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/toast/toast.service';

// Shared component
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { InviteOptionDialogComponent } from '../dialog/invite-option-dialog/invite-option-dialog.component';
// import { EditPermissionDialogComponent } from './edit-permission-dialog.component';

// Interface for Juristic Member
export interface JuristicMember {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  role_in_project: string;
  permissions: Permission;
  created_at: string;
  status: string;
}

export interface Permission {
  canViewAnnouncements: boolean;
  canCreateAnnouncements: boolean;
  canManageResidents: boolean;
  canManageUnits: boolean;
  canManageIssues: boolean;
  canManageVisitors: boolean;
  canManageSettings: boolean;
  canManagePermissions: boolean;
}

// Available permissions list for display (COMMENTED - FOR FUTURE USE)
// export const PERMISSION_LABELS: { [key: string]: string } = {
//   canViewAnnouncements: 'ดูประกาศ',
//   canCreateAnnouncements: 'สร้าง/แก้ไขประกาศ',
//   canManageResidents: 'จัดการผู้อยู่อาศัย',
//   canManageUnits: 'จัดการยูนิต/บ้าน',
//   canManageIssues: 'จัดการแจ้งซ่อม',
//   canManageVisitors: 'จัดการผู้เข้าเยี่ยม',
//   canManageSettings: 'จัดการตั้งค่าโปรเจค',
//   canManagePermissions: 'จัดการสิทธิ์ผู้ใช้',
// };

@Component({
  selector: 'app-edit-permission',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSelectModule,
    MatInputModule,
    FlexLayoutModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    PageHeaderComponent,
  ],
  templateUrl: './edit-permission.component.html',
  styleUrl: './edit-permission.component.scss'
})
export class EditPermissionComponent implements OnInit, AfterViewInit {
  isLoading = new BehaviorSubject<boolean>(true);
  isLoading$: Observable<boolean> = this.isLoading.asObservable();

  // Changed: removed 'permissions' column, added 'actions' for invite/remove
  displayedColumns: string[] = [
    'sequence',
    'fullName',
    'phone',
    'role',
    'status',
    'actions',
  ];
  dataSource: MatTableDataSource<JuristicMember>;
  searchTerm = '';

  selectedRole = 'all';
  selectedStatus = 'all';

  roles: string[] = ['juristicLeader', 'juristicMember', 'security'];
  statuses: string[] = ['active', 'inactive'];

  private allMembers: JuristicMember[] = [];
  projectId: string = '';
  currentUserId: string = '';
  isJuristicLeader = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Page event สำหรับ pagination
  pageEvent = {
    length: 0,
    pageSize: 10,
    pageIndex: 0
  };

  // Getter สำหรับข้อมูลที่แสดงในหน้าปัจจุบัน
  get paginatedData(): JuristicMember[] {
    const startIndex = this.pageEvent.pageIndex * this.pageEvent.pageSize;
    const endIndex = startIndex + this.pageEvent.pageSize;
    return this.sortedData.slice(startIndex, endIndex);
  }

  // Getter สำหรับข้อมูลที่ sort แล้ว
  get sortedData(): JuristicMember[] {
    const data = this.dataSource.filteredData.slice();
    if (!this.sort || !this.sort.active || this.sort.direction === '') {
      return data;
    }
    return data.sort((a, b) => {
      const isAsc = this.sort.direction === 'asc';
      switch (this.sort.active) {
        case 'fullName': return this.compare(a.full_name || '', b.full_name || '', isAsc);
        case 'phone': return this.compare(a.phone || '', b.phone || '', isAsc);
        case 'role': return this.compare(a.role_in_project || '', b.role_in_project || '', isAsc);
        case 'status': return this.compare(a.status || '', b.status || '', isAsc);
        default: return 0;
      }
    });
  }

  compare(a: string | number, b: string | number, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  handlePageEvent(event: any): void {
    this.pageEvent = event;
  }

  constructor(
    private restService: RestService,
    private authService: AuthService,
    private dialog: MatDialog,
    private toast: ToastService,
    private router: Router
  ) {
    this.dataSource = new MatTableDataSource<JuristicMember>([]);
  }

  ngOnInit() {
    this.loadUserData();
    this.loadMembers();
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

    // Custom filtering
    this.dataSource.filterPredicate = (data: JuristicMember, filter: string) => {
      const searchStr = filter.toLowerCase();
      return (
        data.full_name?.toLowerCase().includes(searchStr) ||
        data.phone?.toLowerCase().includes(searchStr)
      );
    };
  }

  loadUserData() {
    const projectMemberships = this.authService.getProjectMemberships();
    if (projectMemberships && projectMemberships.length > 0) {
      this.projectId = projectMemberships[0].project_id;
      // Check if user is JuristicLeader
      const currentRole = projectMemberships[0].role;
      this.isJuristicLeader = currentRole === 'juristicLeader';
    }
    this.currentUserId = this.authService.getUserId() || '';
  }

  loadMembers() {
    if (!this.projectId) {
      this.isLoading.next(false);
      return;
    }

    this.isLoading.next(true);

    this.restService.getJuristicMembersWithPermissions(this.projectId)
      .pipe(
        finalize(() => {
          this.isLoading.next(false);
        }),
        catchError((error) => {
          console.error('Error loading juristic members:', error);
          this.toast.error('ไม่สามารถโหลดข้อมูลได้');
          return of({ status: 'error', data: [] });
        })
      )
      .subscribe({
        next: (response: any) => {
          // API returns { data: { members: [...], count: N } }
          const members = response.data?.members || response.data || [];
          console.log('Loaded members:', members);

          // Map to our interface
          this.allMembers = members.map((m: any) => ({
            user_id: m.id || m.user_id,
            full_name: m.name || m.full_name || 'ไม่ระบุชื่อ',
            email: m.email || '',
            phone: m.phone || '',
            role_in_project: m.role || m.role_in_project || 'juristicMember',
            permissions: m.permissions || this.getDefaultPermissions(m.role || m.role_in_project),
            created_at: m.created_at || new Date().toISOString(),
            status: m.status || 'active',
          }));

          console.log('Mapped members:', this.allMembers);
          this.dataSource.data = this.allMembers;
          this.pageEvent.length = this.allMembers.length;

          // เชื่อมต่อ sort หลังจากโหลดข้อมูล
          if (this.sort) {
            this.dataSource.sort = this.sort;
          }
        }
      });
  }

  getDefaultPermissions(role: string): Permission {
    // Default permissions based on role
    if (role === 'juristicLeader') {
      return {
        canViewAnnouncements: true,
        canCreateAnnouncements: true,
        canManageResidents: true,
        canManageUnits: true,
        canManageIssues: true,
        canManageVisitors: true,
        canManageSettings: true,
        canManagePermissions: true,
      };
    } else if (role === 'juristicMember') {
      return {
        canViewAnnouncements: true,
        canCreateAnnouncements: true,
        canManageResidents: true,
        canManageUnits: true,
        canManageIssues: true,
        canManageVisitors: true,
        canManageSettings: false,
        canManagePermissions: false,
      };
    } else {
      // Security or other
      return {
        canViewAnnouncements: true,
        canCreateAnnouncements: false,
        canManageResidents: false,
        canManageUnits: false,
        canManageIssues: false,
        canManageVisitors: true,
        canManageSettings: false,
        canManagePermissions: false,
      };
    }
  }

  applyFilter() {
    let filteredData = [...this.allMembers];

    // Search term filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filteredData = filteredData.filter(m =>
        m.full_name?.toLowerCase().includes(term) ||
        m.phone?.toLowerCase().includes(term)
      );
    }

    // Role filter
    if (this.selectedRole !== 'all') {
      filteredData = filteredData.filter(m => m.role_in_project === this.selectedRole);
    }

    // Status filter
    if (this.selectedStatus !== 'all') {
      filteredData = filteredData.filter(m => m.status === this.selectedStatus);
    }

    this.dataSource.data = filteredData;
    this.pageEvent.length = filteredData.length;
    this.pageEvent.pageIndex = 0;
  }

  onReset(): void {
    this.searchTerm = '';
    this.selectedRole = 'all';
    this.selectedStatus = 'all';
    this.dataSource.data = this.allMembers;
    this.pageEvent.length = this.allMembers.length;
    this.pageEvent.pageIndex = 0;
  }

  // ============ Permission Display Functions (COMMENTED - FOR FUTURE USE) ============
  // getActivePermissions(permissions: Permission): string[] {
  //   if (!permissions) return [];
  //   return Object.entries(permissions)
  //     .filter(([_, value]) => value === true)
  //     .map(([key, _]) => PERMISSION_LABELS[key] || key)
  //     .slice(0, 3); // Show max 3 for brevity
  // }

  // getPermissionCount(permissions: Permission): number {
  //   if (!permissions) return 0;
  //   return Object.values(permissions).filter(v => v === true).length;
  // }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'juristicLeader':
        return 'role-leader';
      case 'juristicMember':
        return 'role-juristic';
      case 'security':
        return 'role-security';
      default:
        return 'role-default';
    }
  }

  getRoleDisplayName(role: string): string {
    switch (role) {
      case 'juristicLeader':
        return 'หัวหน้านิติบุคคล';
      case 'juristicMember':
        return 'นิติบุคคล';
      case 'security':
        return 'รปภ.';
      default:
        return role;
    }
  }

  // Check if current user can remove this member
  canRemoveMember(member: JuristicMember): boolean {
    // Can only remove if:
    // 1. User is JuristicLeader
    // 2. Not removing self
    // 3. Not removing another JuristicLeader
    return this.isJuristicLeader &&
      member.user_id !== this.currentUserId &&
      member.role_in_project !== 'juristicLeader';
  }

  // Remove member from project
  removeMember(member: JuristicMember): void {
    if (!this.canRemoveMember(member)) {
      this.toast.warning('คุณไม่มีสิทธิ์นำผู้ใช้รายนี้ออก');
      return;
    }

    // Confirm before removing
    if (!confirm(`ต้องการนำ "${member.full_name}" ออกจากโปรเจคหรือไม่?`)) {
      return;
    }

    this.isLoading.next(true);

    this.restService.removeJuristicMember(member.user_id, this.projectId)
      .pipe(finalize(() => this.isLoading.next(false)))
      .subscribe({
        next: (response) => {
          this.toast.success('นำผู้ใช้ออกจากโปรเจคสำเร็จ');
          this.loadMembers();
        },
        error: (err) => {
          console.error('Error removing member:', err);
          this.toast.error('เกิดข้อผิดพลาดในการนำผู้ใช้ออก');
        }
      });
  }

  // Navigate to invite page
  inviteMember(): void {
    const dialogRef = this.dialog.open(InviteOptionDialogComponent, {
      width: '400px',
      panelClass: 'invite-option-dialog-panel'
    });

    dialogRef.afterClosed().subscribe((result: 'create' | 'invite' | null) => {
      if (result === 'create') {
        // Navigate to register-juristic page
        this.router.navigate(['/register']);
      } else if (result === 'invite') {
        // Navigate to invite-management/create page
        this.router.navigate(['/invite-management/create']);
      }
    });
  }

  // ============ Permission Edit Functions (COMMENTED - FOR FUTURE USE) ============
  // canEditMember(member: JuristicMember): boolean {
  //   return this.isJuristicLeader &&
  //     member.user_id !== this.currentUserId &&
  //     member.role_in_project !== 'juristicLeader';
  // }

  // openEditDialog(member: JuristicMember): void {
  //   if (!this.canEditMember(member)) {
  //     this.snackBar.open('คุณไม่มีสิทธิ์แก้ไขผู้ใช้รายนี้', 'ปิด', { duration: 3000 });
  //     return;
  //   }

  //   const dialogRef = this.dialog.open(EditPermissionDialogComponent, {
  //     width: '500px',
  //     maxHeight: '90vh',
  //     data: {
  //       member: { ...member },
  //       permissionLabels: PERMISหSION_LABELS,
  //     },
  //     panelClass: 'permission-dialog'
  //   });

  //   dialogRef.afterClosed().subscribe((result) => {
  //     if (result) {
  //       this.savePermissions(member.user_id, result);
  //     }
  //   });
  // }

  // savePermissions(userId: string, permissions: { [key: string]: boolean }): void {
  //   this.isLoading.next(true);

  //   this.restService.updateJuristicPermissions(userId, permissions, this.projectId)
  //     .pipe(
  //       finalize(() => this.isLoading.next(false))
  //     )
  //     .subscribe({
  //       next: (response) => {
  //         if (response.status === 'success') {
  //           this.snackBar.open('บันทึกสิทธิ์สำเร็จ', 'ปิด', { duration: 3000 });
  //           this.loadMembers();
  //         } else {
  //           this.snackBar.open('เกิดข้อผิดพลาดในการบันทึก', 'ปิด', { duration: 3000 });
  //         }
  //       },
  //       error: (err) => {
  //         console.error('Error saving permissions:', err);
  //         this.snackBar.open('เกิดข้อผิดพลาดในการบันทึก', 'ปิด', { duration: 3000 });
  //       }
  //     });
  // }
}

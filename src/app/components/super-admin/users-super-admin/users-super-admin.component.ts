import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { RestService } from '../../../services/rest.service';
import { EditUserDialogComponent } from './edit-user-dialog/edit-user-dialog.component';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

@Component({
    selector: 'app-users-super-admin',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatIconModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatChipsModule,
        MatMenuModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatCardModule,
        MatDialogModule,
        FormsModule,
        FlexLayoutModule,
        PageHeaderComponent
    ],
    templateUrl: './users-super-admin.component.html',
    styleUrl: './users-super-admin.component.scss'
})
export class SuperAdminUsersComponent implements OnInit {
    displayedColumns: string[] = ['id', 'avatar', 'full_name', 'email', 'phone', 'role', 'created_at', 'actions'];
    dataSource: MatTableDataSource<any>;
    isLoading = true;

    // Pagination
    totalRecords = 0;
    pageSize = 20;
    currentPage = 1;
    pageSizeOptions = [10, 20, 50, 100];

    // Filters
    searchTerm = '';
    selectedRole = '';
    sortBy = 'created_at';
    sortOrder = 'DESC';

    roles = ['resident', 'security', 'juristic', 'super-admin'];

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private restService: RestService, 
        private router: Router,
        private dialog: MatDialog
    ) {
        this.dataSource = new MatTableDataSource();
    }

    ngOnInit(): void {
        this.loadUsers();
    }

    loadUsers(): void {
        this.isLoading = true;

        const params: any = {
            page: this.currentPage,
            limit: this.pageSize,
            sort_by: this.sortBy,
            sort_order: this.sortOrder
        };

        if (this.searchTerm) {
            params.search = this.searchTerm;
        }

        if (this.selectedRole) {
            params.role = this.selectedRole;
        }

        this.restService.getSuperAdminUsers(params).subscribe({
            next: (res: any) => {
                if (res.status === 'success') {
                    this.dataSource.data = res.data;
                    this.totalRecords = res.pagination?.total || 0;
                }
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading users:', err);
                this.isLoading = false;
            }
        });
    }

    onPageChange(event: PageEvent): void {
        this.currentPage = event.pageIndex + 1;
        this.pageSize = event.pageSize;
        this.loadUsers();
    }

    onSortChange(sortState: Sort): void {
        this.sortBy = sortState.active || 'created_at';
        this.sortOrder = sortState.direction === 'asc' ? 'ASC' : 'DESC';
        this.loadUsers();
    }

    applyFilter(): void {
        this.currentPage = 1;
        this.loadUsers();
    }

    clearFilters(): void {
        this.searchTerm = '';
        this.selectedRole = '';
        this.currentPage = 1;
        this.loadUsers();
    }

    getRoleClass(role: string): string {
        switch (role?.toLowerCase()) {
            case 'super-admin': return 'role-super-admin';
            case 'juristic': return 'role-juristic';
            case 'security': return 'role-security';
            default: return 'role-resident';
        }
    }

    formatDate(dateStr: string): string {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Action methods
    onCreateUser(): void {
        this.router.navigate(['/super-admin/users/create-juristic']);
    }

    onEditUser(user: any): void {
        const dialogRef = this.dialog.open(EditUserDialogComponent, {
            width: '500px',
            data: { id: user.id }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result?.success) {
                // Refresh list when user is successfully updated
                this.loadUsers();
            }
        });
    }

    onResetPassword(user: any): void {
        if (confirm(`คุณต้องการส่งลิงก์รีเซ็ตรหัสผ่านไปยัง "${user.email}" หรือไม่?`)) {
            this.restService.sendUserPasswordResetLink(user.id).subscribe({
                next: (res: any) => {
                    if (res.status === 'success') {
                        alert(res.message || 'ส่งลิงก์รีเซ็ตรหัสผ่านสำเร็จ');
                    } else {
                        alert(`เกิดข้อผิดพลาด: ${res.message}`);
                    }
                },
                error: (err) => {
                    console.error('Error sending reset password link:', err);
                    alert('เกิดข้อผิดพลาดในการส่งลิงก์รีเซ็ตรหัสผ่าน');
                }
            });
        }
    }

    onBanUser(user: any): void {
        if (confirm(`คุณต้องการลบผู้ใช้ "${user.full_name}" (และสิทธิ์เข้าถึงทั้งหมด) หรือไม่?\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) {
            this.restService.deleteSuperAdminUser(user.id).subscribe({
                next: (res: any) => {
                    if (res.status === 'success') {
                        alert(res.message || 'ลบผู้ใช้งานสำเร็จ');
                        // Refresh data and keep current page if possible
                        this.loadUsers();
                    } else {
                        alert(`เกิดข้อผิดพลาด: ${res.message}`);
                    }
                },
                error: (err) => {
                    console.error('Error deleting user:', err);
                    const msg = err.error?.message || 'เกิดข้อผิดพลาดในการลบผู้ใช้งาน';
                    alert(`เกิดข้อผิดพลาด: ${msg}`);
                }
            });
        }
    }
}

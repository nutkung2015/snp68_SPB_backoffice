import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RestService } from '../../../services/rest.service';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

@Component({
    selector: 'app-activity-logs',
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
        MatSelectModule,
        MatCardModule,
        MatProgressSpinnerModule,
        FormsModule,
        FlexLayoutModule,
        PageHeaderComponent
    ],
    templateUrl: './activity-logs.component.html',
    styleUrl: './activity-logs.component.scss'
})
export class ActivityLogsComponent implements OnInit {
    displayedColumns: string[] = ['sequence', 'timestamp', 'admin', 'action', 'target', 'details'];
    dataSource: MatTableDataSource<any>;
    isLoading = true;
    searchTerm = '';
    selectedAction = 'all';

    actionTypes = [
        { value: 'all', label: 'ทั้งหมด' },
        { value: 'CREATE', label: 'สร้าง' },
        { value: 'UPDATE', label: 'แก้ไข' },
        { value: 'DELETE', label: 'ลบ' },
        { value: 'LOGIN', label: 'เข้าสู่ระบบ' }
    ];

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(private restService: RestService) {
        this.dataSource = new MatTableDataSource();
    }

    ngOnInit(): void {
        this.loadLogs();
    }

    ngAfterViewInit(): void {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    loadLogs(): void {
        this.isLoading = true;
        this.restService.getSuperAdminLogs({ limit: 100 }).subscribe({
            next: (res: any) => {
                if (res.status === 'success') {
                    // Add sequence number
                    this.dataSource.data = (res.data || []).map((item: any, index: number) => ({
                        ...item,
                        sequence: index + 1
                    }));
                }
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading logs:', err);
                this.isLoading = false;
            }
        });
    }

    applyFilter(): void {
        this.dataSource.filterPredicate = (data: any, filter: string) => {
            const matchSearch = !this.searchTerm ||
                data.admin_name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                data.admin_email?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                data.target_type?.toLowerCase().includes(this.searchTerm.toLowerCase());

            const matchAction = this.selectedAction === 'all' || data.action_type === this.selectedAction;

            return matchSearch && matchAction;
        };
        this.dataSource.filter = Date.now().toString(); // Trigger filter
    }

    filterByAction(action: string): void {
        this.selectedAction = action;
        this.applyFilter();
    }

    onReset(): void {
        this.searchTerm = '';
        this.selectedAction = 'all';
        this.dataSource.filter = '';
    }

    exportCSV(): void {
        // TODO: Implement CSV export
        console.log('Export CSV');
    }

    getActionLabel(type: string): string {
        const action = this.actionTypes.find(a => a.value === type);
        return action ? action.label : type;
    }
}

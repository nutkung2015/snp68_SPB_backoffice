import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { FlexLayoutModule } from '@angular/flex-layout';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { RestService, SuperAdminDashboardStats, ActivityLog } from '../../../services/rest.service';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-super-admin-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatCardModule,
        MatProgressSpinnerModule,
        MatChipsModule,
        FlexLayoutModule,
        NgxChartsModule
    ],
    templateUrl: './super-admin-dashboard.component.html',
    styleUrl: './super-admin-dashboard.component.scss'
})
export class SuperAdminDashboardComponent implements OnInit {
    isLoading = true;
    stats: SuperAdminDashboardStats | null = null;
    recentLogs: ActivityLog[] = [];

    // Chart Data
    usersByRoleChart: any[] = [];

    // Chart Color Scheme
    colorScheme: any = {
        domain: ['#07354E', '#10b981', '#f59e0b', '#ef4444']
    };

    constructor(private restService: RestService) { }

    ngOnInit(): void {
        this.loadDashboardData();
    }

    loadDashboardData(): void {
        this.isLoading = true;
        forkJoin({
            stats: this.restService.getSuperAdminDashboard(),
            logs: this.restService.getSuperAdminLogs({ limit: 5 })
        }).subscribe({
            next: (res: any) => {
                if (res.stats.status === 'success') {
                    this.stats = res.stats.data;
                    this.processChartData();
                }

                if (res.logs.status === 'success') {
                    this.recentLogs = res.logs.data;
                }

                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading super admin dashboard:', err);
                this.isLoading = false;
            }
        });
    }

    processChartData(): void {
        if (!this.stats) return;

        this.usersByRoleChart = [
            { name: 'Residents', value: this.stats.users.resident },
            { name: 'Security', value: this.stats.users.security },
            { name: 'Juristic', value: this.stats.users.juristic },
            { name: 'Super Admin', value: this.stats.users["super-admin"] }
        ];
    }

    getActionColor(type: string): string {
        switch (type) {
            case 'CREATE': return 'primary';
            case 'UPDATE': return 'accent';
            case 'DELETE': return 'warn';
            case 'LOGIN': return 'basic';
            default: return 'basic';
        }
    }

    formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleString('th-TH');
    }
}

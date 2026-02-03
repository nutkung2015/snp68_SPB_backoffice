import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RestService } from '../../services/rest.service';
import { AuthService } from '../../services/auth.service';
import { forkJoin } from 'rxjs';
import { FlexLayoutModule } from '@angular/flex-layout';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    FlexLayoutModule,
    NgxChartsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  isLoading = true;
  today = new Date();

  // Data State
  visitorStats: any = {
    totalEntryToday: 0,
    walkInCount: 0,
    stampedCount: 0,
    insideCount: 0
  };

  recentAnnouncements: any[] = [];
  recentIssues: any[] = [];
  unitsCount = 0;
  residentsCount = 0;

  projectId: string = '';

  // Chart Data
  issueStatusChartData: any[] = [];
  vehicleTypeChartData: any[] = [];
  issueMonthlyData: any[] = [];

  // Chart Options
  colorScheme: any = {
    domain: ['#07354E', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
  };

  pieColorScheme: any = {
    domain: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
  };

  constructor(
    private restService: RestService,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadProjectId();
    this.loadDashboardData();
  }

  loadProjectId(): void {
    const memberships = this.authService.getProjectMemberships();

    if (memberships && memberships.length > 0) {
      this.projectId = memberships[0].project_id;
    }
  }

  loadDashboardData(): void {
    if (!this.projectId) {
      console.warn('Dashboard: No Project ID found');
      this.isLoading = false;
      return;
    }

    this.isLoading = true;

    forkJoin({
      visitorStats: this.restService.getVisitorStats(this.projectId),
      announcements: this.restService.getAnnouncements({ limit: 5, project_id: this.projectId }),
      issues: this.restService.getCommonIssues({ project_id: this.projectId }),
      units: this.restService.getUnits(this.projectId)
    }).subscribe({
      next: (res: any) => {
        // Handle Visitor Stats
        if (res.visitorStats?.status === 'success') {
          this.visitorStats = res.visitorStats.data;
          this.processVehicleTypeData(res.visitorStats.data);
        }

        // Handle Announcements
        let allAnnouncements: any[] = [];
        if (res.announcements?.status === 'success') {
          allAnnouncements = res.announcements.data || [];
        } else if (res.announcements?.data) {
          allAnnouncements = res.announcements.data;
        }
        this.recentAnnouncements = this.filterByLastDays(allAnnouncements, 30, 'created_at').slice(0, 5);

        // Handle Issues
        if (res.issues?.status === 'success') {
          this.recentIssues = res.issues.data || [];
          this.processIssueChartData(this.recentIssues);
        }

        // Handle Units
        if (Array.isArray(res.units)) {
          this.unitsCount = res.units.length;
        } else if (res.units?.data && Array.isArray(res.units.data)) {
          this.unitsCount = res.units.data.length;
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        this.isLoading = false;
      }
    });
  }

  // Process Issue Data for Charts
  processIssueChartData(issues: any[]): void {
    // Status Distribution (Pie Chart)
    const statusCounts: { [key: string]: number } = {};
    issues.forEach(issue => {
      const status = issue.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    this.issueStatusChartData = Object.keys(statusCounts).map(key => ({
      name: this.translateStatus(key),
      value: statusCounts[key]
    }));

    // Monthly Issues (Bar Chart) - Last 6 months
    const monthly: { [key: string]: number } = {};
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${months[d.getMonth()]}`;
      monthly[key] = 0;
    }

    issues.forEach(issue => {
      if (issue.submitted_date || issue.created_at) {
        const date = new Date(issue.submitted_date || issue.created_at);
        const key = `${months[date.getMonth()]}`;
        if (monthly.hasOwnProperty(key)) {
          monthly[key]++;
        }
      }
    });

    this.issueMonthlyData = Object.keys(monthly).map(key => ({
      name: key,
      value: monthly[key]
    }));
  }

  // Process Vehicle Type Data
  processVehicleTypeData(stats: any): void {
    this.vehicleTypeChartData = [
      { name: 'รถยนต์', value: stats.carCount || stats.totalEntryToday - (stats.walkInCount || 0) || 0 },
      { name: 'Walk-in', value: stats.walkInCount || 0 },
      { name: 'ลูกบ้าน', value: stats.residentCount || 0 },
      { name: 'ผู้มาเยือน', value: stats.visitorCount || stats.insideCount || 0 }
    ].filter(item => item.value > 0);

    // If no data, show placeholder
    if (this.vehicleTypeChartData.length === 0) {
      this.vehicleTypeChartData = [
        { name: 'ยังไม่มีข้อมูล', value: 1 }
      ];
    }
  }

  translateStatus(status: string): string {
    const map: { [key: string]: string } = {
      'pending': 'รอดำเนินการ',
      'in_progress': 'กำลังดำเนินการ',
      'completed': 'เสร็จสิ้น',
      'rejected': 'ไม่ผ่าน',
      'unknown': 'ไม่ระบุ'
    };
    return map[status] || status;
  }

  // Navigation Methods
  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'สวัสดีตอนเช้า';
    if (hour < 18) return 'สวัสดีตอนบ่าย';
    return 'สวัสดีตอนเย็น';
  }

  filterByLastDays(items: any[], days: number = 7, dateField: string = 'created_at'): any[] {
    if (!items || items.length === 0) return [];

    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

    return items.filter(item => {
      if (!item[dateField]) return false;
      const itemDate = new Date(item[dateField]);
      return itemDate >= cutoffDate;
    });
  }

  // Calculate percentage change (mock for now)
  getPercentageChange(current: number, type: string): number {
    // Mock percentage - in real app, compare with previous period
    const mockChanges: { [key: string]: number } = {
      'visitors': 12.5,
      'units': 0,
      'issues': -5.2,
      'announcements': 8.3
    };
    return mockChanges[type] || 0;
  }

  // Get pending issues count
  get pendingIssuesCount(): number {
    return this.recentIssues.filter(i => i.status === 'pending').length;
  }

  // Format large numbers
  formatNumber(value: number): string {
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  }
}

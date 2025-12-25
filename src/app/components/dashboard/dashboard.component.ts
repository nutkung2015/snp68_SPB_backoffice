import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RestService } from '../../services/rest.service';
import { forkJoin } from 'rxjs';
import { FlexLayoutModule } from '@angular/flex-layout';

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
    FlexLayoutModule
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

  projectId: string = '';

  constructor(
    private restService: RestService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadProjectId();
    this.loadDashboardData();
  }

  loadProjectId(): void {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.projectMemberships && user.projectMemberships.length > 0) {
          this.projectId = user.projectMemberships[0].project_id;
        }
      } catch (e) {
        console.error('Error parsing userData:', e);
      }
    }
  }

  loadDashboardData(): void {
    if (!this.projectId) {
      console.warn('Dashboard: No Project ID found');
      this.isLoading = false;
      return;
    }

    this.isLoading = true;

    // Use forkJoin to load all independent data in parallel
    forkJoin({
      visitorStats: this.restService.getVisitorStats(this.projectId),
      announcements: this.restService.getAnnouncements({ limit: 5 }), // Use getAnnouncements for Admin/Juristic
      issues: this.restService.getCommonIssues({ limit: 5, status: 'pending' }),
      units: this.restService.getUnits(this.projectId)
    }).subscribe({
      next: (res: any) => {
        // Handle Visitor Stats
        if (res.visitorStats?.status === 'success') {
          this.visitorStats = res.visitorStats.data;
        }

        // Handle Announcements
        if (res.announcements?.status === 'success') {
          this.recentAnnouncements = res.announcements.data || [];
        } else if (res.announcements?.data) {
          this.recentAnnouncements = res.announcements.data;
        }

        // Handle Issues
        if (res.issues?.status === 'success') {
          this.recentIssues = res.issues.data || [];
        }

        // Handle Units
        if (Array.isArray(res.units)) {
          this.unitsCount = res.units.length;
        } else if (res.units?.data && Array.isArray(res.units.data)) {
          this.unitsCount = res.units.data.length;
        } else if (res.units?.length !== undefined) {
          this.unitsCount = res.units.length;
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        this.isLoading = false;
      }
    });
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
}

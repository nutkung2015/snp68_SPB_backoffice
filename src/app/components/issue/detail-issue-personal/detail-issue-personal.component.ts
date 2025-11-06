import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { LoadingDataComponent } from '../../../shared/loading-data/loading-data.component';
import { MatLabel } from '@angular/material/form-field';
import { RestService, PersonalRepair } from '../../../services/rest.service';

interface ImageUrl {
  url: string;
  public_id: string;
  resource_type: string;
}

@Component({
  selector: 'app-detail-issue-personal',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    FlexLayoutModule,
    LoadingDataComponent,
    MatLabel
  ],
  templateUrl: './detail-issue-personal.component.html',
  styleUrl: './detail-issue-personal.component.scss'
})
export class DetailIssuePersonalComponent implements OnInit {
  isLoading = new BehaviorSubject<boolean>(true);
  isLoading$ = this.isLoading.asObservable();

  issue?: PersonalRepair;
  imageUrls: ImageUrl[] = [];

  constructor(
    private http: HttpClient,
    private rest: RestService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.loadIssue(id);
  }

  loadIssue(id: string) {
    // ต้องเพิ่ม method getIssueById ใน RestService
    const params = {
      project_id: localStorage.getItem('project_id'),
      issue_id: id.replace('iss', '')
    };

    this.rest.getPersonalRepairById(params).subscribe({
      next: (data: any) => {
        this.issue = data;
        this.imageUrls = data.image_urls || [];
        this.isLoading.next(false);
      },
      error: (error) => {
        console.error('Error loading issue:', error);
        this.isLoading.next(false);
      }
    });
  }

  getTypeLabel(type: string): string {
    const typeMap: { [key: string]: string } = {
      plumbing: 'ประปา',
      electrical: 'ไฟฟ้า',
      building: 'อาคาร',
      other: 'อื่นๆ'
    };
    return typeMap[type] || type;
  }

  getPriorityLabel(priority: string): string {
    const priorityMap: { [key: string]: string } = {
      low: 'ต่ำ',
      medium: 'ปานกลาง',
      high: 'สูง',
      critical: 'วิกฤต'
    };
    return priorityMap[priority] || priority;
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      open: 'เปิด',
      in_progress: 'กำลังดำเนินการ',
      resolved: 'แก้ไขแล้ว',
      closed: 'ปิด',
      reopened: 'เปิดใหม่'
    };
    return statusMap[status] || status;
  }

  onBack(): void {
    this.router.navigate(['/issue']);
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { RestService } from '../../../services/rest.service';
import { LoadingDataComponent } from '../../../shared/loading-data/loading-data.component';
import { MatLabel } from '@angular/material/form-field';

interface EntryLog {
  id: string;
  plate_number: string;
  visitor_name: string;
  visitor_type: 'resident' | 'visitor';
  image_car_url?: string;
  image_driver_url?: string;
  unit_number: string;
  estamp_status: 'pending' | 'approved' | 'rejected' | 'none';
  status: 'inside' | 'exited';
  check_in_time: string;
  check_out_time: string | null;
}

@Component({
  selector: 'app-vistor-management-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    FlexLayoutModule,
    LoadingDataComponent,
    MatLabel
  ],
  templateUrl: './vistor-management-detail.component.html',
  styleUrl: './vistor-management-detail.component.scss'
})
export class VistorManagementDetailComponent implements OnInit {
  isLoading = new BehaviorSubject<boolean>(true);
  isLoading$ = this.isLoading.asObservable();

  entryLog?: EntryLog;

  constructor(
    private restService: RestService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadEntryLogDetail(id);
  }

  loadEntryLogDetail(id: string): void {
    this.restService.getEntryLogById(id).subscribe({
      next: (res: any) => {
        if (res.status === 'success' && res.data) {
          this.entryLog = res.data;
        }
      },
      error: (err) => {
        console.error('Error loading entry log detail:', err);
      },
      complete: () => {
        this.isLoading.next(false);
      }
    });
  }

  getStatusBadgeClass(item: EntryLog): string {
    if (item.status === 'exited') return 'badge-gray';
    if (item.visitor_type === 'resident') return 'badge-green';
    if (item.estamp_status === 'approved') return 'badge-green';
    if (item.estamp_status === 'pending') return 'badge-yellow';
    return 'badge-blue';
  }

  getStatusText(item: EntryLog): string {
    if (item.status === 'exited') return 'ออกแล้ว';
    if (item.visitor_type === 'resident') return 'ลูกบ้าน';
    if (item.estamp_status === 'approved') return 'อนุมัติแล้ว';
    if (item.estamp_status === 'pending') return 'รอประทับตรา';
    return 'เข้ามาแล้ว';
  }

  formatDateTime(dateStr: string | null): string {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('th-TH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '-';
    }
  }

  viewCarImage(): void {
    if (this.entryLog?.image_car_url) {
      window.open(this.entryLog.image_car_url, '_blank');
    }
  }

  viewDriverImage(): void {
    if (this.entryLog?.image_driver_url) {
      window.open(this.entryLog.image_driver_url, '_blank');
    }
  }

  onBack(): void {
    this.router.navigate(['/vistor-management']);
  }
}

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
import { AnnouncementConfirmDeleteComponent } from '../../dialog/announcement-confirm-delete/announcement-confirm-delete.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RestService, Announcement as ApiAnnouncement } from '../../../services/rest.service';
import { ToastService } from '../../../shared/toast/toast.service';

interface AttachmentUrl {
  url: string;
  public_id: string;
  resource_type: string;
}

interface AnnouncementDetail {
  id: string;
  title: string;
  content: string;
  type: string;
  attachment_urls: string;
  posted_by: string;
  audience: string;
  status: string;
  expires_at?: string; // วันหมดอายุ
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-detail-announcement',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    FlexLayoutModule,
    LoadingDataComponent,
    MatLabel,
    MatDialogModule,
  ],
  templateUrl: './detail-announcement.component.html',
  styleUrl: './detail-announcement.component.scss',
})
export class DetailAnnouncementComponent implements OnInit {
  isLoading = new BehaviorSubject<boolean>(true);
  isLoading$ = this.isLoading.asObservable();

  announcement?: AnnouncementDetail;
  attachmentUrls: AttachmentUrl[] = [];

  constructor(
    private http: HttpClient,
    private rest: RestService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private toast: ToastService
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.loadAnnouncement(id);
  }

  loadAnnouncement(id: string) {
    this.rest
      .getAnnouncementById(id)
      .subscribe({
        next: (data: ApiAnnouncement) => {
          // Normalize to local interface shape
          const raw = (data as any).attachment_urls;
          let attachments: AttachmentUrl[] = [];
          if (Array.isArray(raw)) {
            attachments = raw.map((url: string) => ({ url, public_id: '', resource_type: '' }));
          } else if (typeof raw === 'string') {
            try {
              attachments = JSON.parse(raw) as AttachmentUrl[];
            } catch {
              attachments = [];
            }
          }

          this.announcement = {
            id: data.id,
            title: data.title,
            content: data.content,
            type: data.type,
            attachment_urls: typeof raw === 'string' ? raw : JSON.stringify(attachments),
            posted_by: data.posted_by,
            audience: data.audience,
            status: data.status,
            expires_at: data.expires_at || '', // วันหมดอายุ
            created_at: data.created_at || '',
            updated_at: data.updated_at || ''
          };

          this.attachmentUrls = attachments;
        },
        error: (error) => {
          console.error('Error loading announcement:', error);
        },
        complete: () => {
          this.isLoading.next(false);
        },
      });
  }

  getAudienceLabel(audience: string): string {
    const audienceMap: { [key: string]: string } = {
      all: 'ทั้งหมด',
      residents: 'กรรมการหมู่บ้าน',
      specific_groups: 'รปภ.',
    };
    return audienceMap[audience] || audience;
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      draft: 'แบบร่าง',
      published: 'เผยแพร่แล้ว',
    };
    return statusMap[status] || status;
  }

  onBack(): void {
    this.router.navigate(['/announcement']);
  }

  onEdit(): void {
    if (this.announcement) {
      this.router.navigate([`/announcement/edit/${this.announcement.id}`]);
    }
  }

  onDelete(): void {
    if (this.announcement?.id) {
      // เช็ค id ด้วยเพื่อให้แน่ใจว่ามีค่า
      const dialogRef = this.dialog.open(AnnouncementConfirmDeleteComponent, {
        width: '400px',
        data: {
          toppic: 'คุณต้องการลบประกาศนี้ใช่หรือไม่?',
          cancel: 'ยกเลิก',
          confirm: 'ลบ',
        },
      });

      dialogRef.afterClosed().subscribe((result: boolean) => {
        if (result) {
          if (!this.announcement?.id) { return; }
          this.rest
            .deleteAnnouncement(this.announcement.id)
            .subscribe({
              next: () => {
                this.toast.success('ลบประกาศเรียบร้อยแล้ว');
                this.router.navigate(['/announcement']);
              },
              error: (error) => {
                console.error('Error deleting announcement:', error);
                this.toast.error('ไม่สามารถลบประกาศได้');
              },
            });
        }
      });
    }
  }
}

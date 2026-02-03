import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { LoadingDataComponent } from '../../../shared/loading-data/loading-data.component';
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
  selector: 'app-edit-announcement',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    FlexLayoutModule,
    FormsModule,
    ReactiveFormsModule,
    LoadingDataComponent,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './edit-announcement.component.html',
  styleUrls: ['./edit-announcement.component.scss']
})
export class EditAnnouncementComponent implements OnInit {
  isLoading = new BehaviorSubject<boolean>(true);
  isLoading$ = this.isLoading.asObservable();

  editForm: FormGroup;
  announcement?: AnnouncementDetail;
  attachmentUrls: AttachmentUrl[] = [];
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  uploadProgress = 0;

  // กำหนดวันต่ำสุดของ expires_at (วันนี้)
  minExpiryDate: Date = new Date();

  audienceOptions = [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'residents', label: 'กรรมการหมู่บ้าน' },
    { value: 'specific_groups', label: 'รปภ.' }
  ];

  statusOptions = [
    { value: 'draft', label: 'แบบร่าง' },
    { value: 'published', label: 'เผยแพร่' },
    { value: 'unpublished', label: 'เลิกเผยแพร่' }
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private rest: RestService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {
    this.editForm = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      audience: ['', Validators.required],
      status: ['', Validators.required],
      expiresAt: [null] // วันหมดอายุ (optional)
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.loadAnnouncement(id);
  }

  loadAnnouncement(id: string) {
    this.rest.getAnnouncementById(id)
      .subscribe({
        next: (data: ApiAnnouncement) => {
          // normalize to local interface shape
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
            expires_at: data.expires_at || '',
            created_at: data.created_at || '',
            updated_at: data.updated_at || ''
          };

          this.attachmentUrls = attachments;
          if (this.attachmentUrls.length > 0) {
            this.previewUrl = this.attachmentUrls[0].url;
          }

          this.editForm.patchValue({
            title: this.announcement.title,
            content: this.announcement.content,
            audience: this.announcement.audience,
            status: this.announcement.status,
            expiresAt: this.announcement.expires_at ? new Date(this.announcement.expires_at) : null
          });
        },
        error: (error) => {
          console.error('Error loading announcement:', error);
          this.toast.error('ไม่สามารถโหลดข้อมูลประกาศได้');
        },
        complete: () => {
          this.isLoading.next(false);
        }
      });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  onSubmit() {
    if (this.editForm.valid && this.announcement) {
      const updatePayload: any = {
        title: this.editForm.get('title')?.value,
        content: this.editForm.get('content')?.value,
        audience: this.editForm.get('audience')?.value,
        status: this.editForm.get('status')?.value
      };

      // เพิ่ม expires_at ถ้ามีการกำหนดวันหมดอายุ
      const expiresAtValue = this.editForm.get('expiresAt')?.value;
      if (expiresAtValue) {
        const expiryDate = new Date(expiresAtValue);
        expiryDate.setHours(23, 59, 59, 999);
        updatePayload.expires_at = expiryDate.toISOString();
      } else {
        updatePayload.expires_at = null; // ล้างค่าถ้าไม่ได้เลือก
      }

      // Note: file upload flow should call dedicated upload API first, get URL(s), then include in payload
      // For now, we keep logic simple and only update text fields via RestService

      this.rest.updateAnnouncement(this.announcement.id, updatePayload)
        .subscribe({
          next: () => {
            this.toast.success('บันทึกการแก้ไขเรียบร้อยแล้ว');
            this.router.navigate(['/announcement']);
          },
          error: (error) => {
            console.error('Error updating announcement:', error);
            this.toast.error('เกิดข้อผิดพลาดในการแก้ไขประกาศ');
          }
        });
    }
  }

  onCancel() {
    this.router.navigate(['/announcement']);
  }
}
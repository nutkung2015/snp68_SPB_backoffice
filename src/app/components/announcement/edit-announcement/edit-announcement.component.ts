import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { LoadingDataComponent } from '../../../shared/loading-data/loading-data.component';

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
    FlexLayoutModule,
    FormsModule,
    ReactiveFormsModule,
    LoadingDataComponent
  ],
  templateUrl: './edit-announcement.component.html',
  styleUrl: './edit-announcement.component.scss'
})
export class EditAnnouncementComponent implements OnInit {
  isLoading = new BehaviorSubject<boolean>(true);
  isLoading$ = this.isLoading.asObservable();
  
  editForm: FormGroup;
  announcement?: AnnouncementDetail;
  attachmentUrls: AttachmentUrl[] = [];
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  audienceOptions = [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'residents', label: 'กรรมการหมู่บ้าน' },
    { value: 'specific_groups', label: 'รปภ.' }
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.editForm = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      audience: ['', Validators.required]
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.loadAnnouncement(id);
  }

  loadAnnouncement(id: string) {
    this.http.get<any>(`http://localhost:5000/api/announcements/${id}`)
      .subscribe({
        next: (response) => {
          this.announcement = response.data;
          if (this.announcement) {
            if (this.announcement.attachment_urls) {
              this.attachmentUrls = JSON.parse(this.announcement.attachment_urls);
              if (this.attachmentUrls.length > 0) {
                this.previewUrl = this.attachmentUrls[0].url;
              }
            }
            this.editForm.patchValue({
              title: this.announcement.title,
              content: this.announcement.content,
              audience: this.announcement.audience
            });
          }
          // this.editForm.patchValue({
          //   title: this.announcement.title,
          //   content: this.announcement.content,
          //   audience: this.announcement.audience
          // });
        },
        error: (error) => {
          console.error('Error loading announcement:', error);
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
      const formData = new FormData();
      formData.append('title', this.editForm.get('title')?.value);
      formData.append('content', this.editForm.get('content')?.value);
      formData.append('audience', this.editForm.get('audience')?.value);
      
      if (this.selectedFile) {
        formData.append('image', this.selectedFile);
      }

      this.http.put(`http://localhost:5000/api/announcements/${this.announcement.id}`, formData)
        .subscribe({
          next: () => {
            this.router.navigate(['/announcement']);
          },
          error: (error) => {
            console.error('Error updating announcement:', error);
          }
        });
    }
  }

  onCancel() {
    this.router.navigate(['/announcement']);
  }
}
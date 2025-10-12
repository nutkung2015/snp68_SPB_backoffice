import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { LoadingDataComponent } from '../../../shared/loading-data/loading-data.component';
import { BehaviorSubject } from 'rxjs';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { HttpEventType } from '@angular/common/http'; // เพิ่ม import นี้ที่บรรทัดบนสุด

// import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
// import {
//   faArrowLeft,
//   faPlus,
//   faPen,
//   faTrash,
// } from '@fortawesome/free-solid-svg-icons';
import { FlexLayoutModule } from '@angular/flex-layout'; // เพิ่ม import

interface Announcement {
  id: string; // เปลี่ยนจาก id?: string เป็น id: string
  title: string;
  content: string;
  type: string;
  posted_by: string;
  attachment_urls: string[];
  audience: string;
  status: string;
}

@Component({
  selector: 'app-create-announcement',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    HttpClientModule,
    MatCardModule,
    MatRadioModule,
    LoadingDataComponent,
    // FontAwesomeModule,
    FlexLayoutModule, // เพิ่มตรงนี้
    MatProgressBarModule, // เพิ่มตรงนี้
  ],
  templateUrl: './create-announcement.component.html',
  styleUrl: './create-announcement.component.scss',
})
export class CreateAnnouncementComponent {
  uploadProgress = 0;

  // เพิ่มตัวแปร isLoading
  isLoading = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoading.asObservable();

  announcementForm: FormGroup;
  selectedFile: File | null = null;

  // faArrowLeft = faArrowLeft;
  // faPlus = faPlus;
  // faPen = faPen;
  // faTrash = faTrash;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.announcementForm = this.fb.group({
      title: ['', [Validators.required]],
      content: ['', [Validators.required]],
      type: ['maintenance', [Validators.required]],
      recipient: ['residents', [Validators.required]], // ตั้งค่าเริ่มต้น
      status: ['draft', [Validators.required]],
    });
  }

  recipients = [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'residents', label: 'กรรมการหมู่บ้าน' },
    { value: 'specific_groups', label: 'รปภ.' },
  ];

  statuses = [
    { value: 'draft', label: 'ร่าง' },
    { value: 'published', label: 'เผยแพร่' },
  ];

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (file) {
      // ตรวจสอบประเภทไฟล์
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        alert('รองรับเฉพาะไฟล์ JPG และ PNG เท่านั้น');
        return;
      }

      // ตรวจสอบขนาดไฟล์
      if (file.size > maxSize) {
        alert('ขนาดไฟล์ต้องไม่เกิน 5MB');
        return;
      }

      console.log('Selected file:', file);
      this.selectedFile = file;
    }
  }

  // create-announcement.component.ts
  async onSubmit(): Promise<void> {
    if (this.announcementForm.valid) {
      this.isLoading.next(true);

      try {
        const formValue = this.announcementForm.value;
        const formData = new FormData();

        // เพิ่ม logging
        console.log('Form value:', formValue);

        formData.append(
          'id',
          `annc${Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, '0')}`
        );
        formData.append('title', formValue.title);
        formData.append('content', formValue.content);
        formData.append('type', formValue.type || 'maintenance');
        formData.append('posted_by', 'user001');
        formData.append('audience', formValue.recipient);
        formData.append('status', formValue.status);

        if (this.selectedFile) {
          console.log('Appending file:', this.selectedFile.name); // เพิ่ม log
          formData.append('files', this.selectedFile, this.selectedFile.name);
        }

        // เพิ่ม logging สำหรับ FormData
        formData.forEach((value, key) => {
          console.log(`FormData: ${key} = ${value}`);
        });

        const response = await new Promise((resolve, reject) => {
          this.http
            .post('http://localhost:5000/api/announcements', formData, {
              reportProgress: true,
              observe: 'events',
            })
            .subscribe({
              next: (event: any) => {
                console.log('Upload event:', event); // เพิ่ม log
                if (event.type === HttpEventType.UploadProgress) {
                  this.uploadProgress = Math.round(
                    (100 * event.loaded) / (event.total || 1)
                  );
                  console.log('Upload progress:', this.uploadProgress); // เพิ่ม log
                } else if (event.type === HttpEventType.Response) {
                  resolve(event.body);
                }
              },
              error: (error) => {
                console.error('Upload error:', error); // เพิ่ม log
                reject(error);
              },
              complete: () => {
                console.log('Upload complete'); // เพิ่ม log
                this.uploadProgress = 0;
              },
            });
        });

        console.log('Response:', response);
        this.router.navigate(['/announcement']);
      } catch (error) {
        console.error('Error creating announcement:', error);
        this.uploadProgress = 0;
      } finally {
        this.isLoading.next(false);
      }
    }
  }

  onCancel(): void {
    this.router.navigate(['/announcement']);
  }

  removeFile(): void {
    this.selectedFile = null;
    this.uploadProgress = 0;
  }
}

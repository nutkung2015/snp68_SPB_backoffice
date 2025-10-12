import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

// shared component
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

type AnnouncementStatus = StatusType | 'all';
type StatusType = 'published' | 'draft' | 'unpublished';
// สร้าง interface สำหรับข้อมูล
interface Announcement {
  id: number;
  title: string;
  content: string;
  recipient: string;
  postDate: Date;
  hasAttachment: boolean;
  attachmentUrls?: string[]; // เพิ่ม field นี้
  attachmentName?: string;
  createdBy: string;
  status: AnnouncementStatus;
}

interface APIResponse {
  status: string;
  data: AnnouncementAPI[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

interface AnnouncementAPI {
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

interface AttachmentUrl {
  url: string;
  public_id: string;
  resource_type: string;
}

@Component({
  selector: 'app-announcement',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSelectModule,
    FlexLayoutModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    HttpClientModule,
    PageHeaderComponent,
  ],
  templateUrl: './announcement.component.html',
  styleUrls: ['./announcement.component.scss'],
})
export class AnnouncementComponent implements OnInit {
  private apiUrl = 'http://localhost:5000/api/announcements';

  isLoading = new BehaviorSubject<boolean>(true);
  isLoading$: Observable<boolean> = this.isLoading.asObservable();
  // เพิ่ม property สำหรับ loading state

  displayedColumns: string[] = [
    'sequence',
    'title',
    'content',
    'recipient',
    'postDate',
    'status',
    'attachment',
    'details',
  ];
  dataSource: MatTableDataSource<Announcement>;
  searchTerm = '';
  selectedRecipient = '';
  recipients = [
    { value: '', label: 'ทั้งหมด' },
    { value: 'all', label: 'ลูกบ้านทุกคน' },
    { value: 'committee', label: 'กรรมการหมู่บ้าน' },
    { value: 'security', label: 'รปภ.' },
  ];

  pageEvent: PageEvent = {
    pageIndex: 0,
    pageSize: 10,
    length: 0,
  };

  searchType = 'title';
  selectedStatus: AnnouncementStatus = 'all';

  private allAnnouncements: Announcement[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Mockup data
  // mockAnnouncements: Announcement[] = [
  //   {
  //     id: 1,
  //     title: 'แจ้งซ่อมถนนในหมู่บ้าน',
  //     content: 'จะมีการซ่อมแซมถนนในซอย 5 ในวันที่ 1-3 ตุลาคม 2565',
  //     recipient: 'ลูกบ้านทุกคน',
  //     postDate: new Date('2025-09-28'),
  //     hasAttachment: true,
  //     attachmentName: 'road_repair.pdf',
  //     createdBy: 'admin',
  //     status: 'active'
  //   },
  //   {
  //     id: 2,
  //     title: 'ประชุมคณะกรรมการหมู่บ้าน',
  //     content: 'ขอเชิญประชุมคณะกรรมการหมู่บ้านในวันที่ 5 ตุลาคม 2565',
  //     recipient: 'กรรมการหมู่บ้าน',
  //     postDate: new Date('2025-09-27'),
  //     hasAttachment: true,
  //     attachmentName: 'meeting_agenda.pdf',
  //     createdBy: 'admin',
  //     status: 'active'
  //   },
  //   {
  //     id: 3,
  //     title: 'แจ้งตารางเวร รปภ.',
  //     content: 'ตารางเวรรักษาความปลอดภัยประจำเดือนตุลาคม 2565',
  //     recipient: 'รปภ.',
  //     postDate: new Date('2025-09-26'),
  //     hasAttachment: true,
  //     attachmentName: 'security_schedule.pdf',
  //     createdBy: 'admin',
  //     status: 'active'
  //   },
  //   {
  //     id: 4,
  //     title: 'แจ้งค่าส่วนกลางประจำเดือน',
  //     content: 'แจ้งยอดค่าส่วนกลางประจำเดือนกันยายน 2565',
  //     recipient: 'ลูกบ้านทุกคน',
  //     postDate: new Date('2025-09-25'),
  //     hasAttachment: true,
  //     attachmentName: 'maintenance_fee.pdf',
  //     createdBy: 'admin',
  //     status: 'active'
  //   },
  //   {
  //     id: 5,
  //     title: 'กิจกรรมทำความสะอาดหมู่บ้าน',
  //     content: 'ขอเชิญร่วมกิจกรรมทำความสะอาดหมู่บ้านในวันที่ 10 ตุลาคม 2565',
  //     recipient: 'ลูกบ้านทุกคน',
  //     postDate: new Date('2025-09-24'),
  //     hasAttachment: false,
  //     createdBy: 'admin',
  //     status: 'active'
  //   }
  // ];

  constructor(private http: HttpClient, private router: Router) {
    this.dataSource = new MatTableDataSource<Announcement>([]);
    console.log('Initial selectedStatus:', this.selectedStatus); // เพิ่ม log เพื่อเช็คค่าเริ่มต้น
  }

  ngOnInit() {
    this.loadAnnouncements();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // กำหนด filter predicate สำหรับการค้นหา
    this.dataSource.filterPredicate = (data: Announcement, filter: string) => {
      return data.title.toLowerCase().includes(filter.toLowerCase());
    };
  }

  // ใน loadAnnouncements() ควรเพิ่ม debug logs
  loadAnnouncements() {
    this.isLoading.next(true);
    // console.log('Loading announcements...');

    this.http
      .get<APIResponse>(this.apiUrl)
      .pipe(
        map((response) => {
          return response.data.map((item) => {
            let hasAttachment = false;
            let attachmentUrls: AttachmentUrl[] = [];

            if (item.attachment_urls) {
              try {
                // แปลง JSON string เป็น array ของ AttachmentUrl
                const parsed = JSON.parse(
                  item.attachment_urls
                ) as AttachmentUrl[];
                hasAttachment = Array.isArray(parsed) && parsed.length > 0;
                if (hasAttachment) {
                  attachmentUrls = parsed;
                }
              } catch (e) {
                console.warn('Error parsing attachment_urls:', e);
                hasAttachment = false;
              }
            }

            return {
              id: Number(item.id.replace('annc', '')),
              title: item.title,
              content: item.content,
              recipient: item.audience,
              postDate: new Date(item.created_at),
              hasAttachment: hasAttachment,
              attachmentUrls: attachmentUrls.map((att) => att.url), // เก็บเฉพาะ URL
              createdBy: item.posted_by,
              status: (item.status as StatusType) || 'all',
            };
          });
        }),
        catchError((error) => {
          console.error('Error details:', error);
          return of([]);
        }),
        finalize(() => {
          console.log('Loading completed');
          this.isLoading.next(false);
        })
      )
      .subscribe({
        next: (announcements) => {
          // console.log('Processed announcements:', announcements);
          this.allAnnouncements = announcements;
          this.dataSource.data = announcements;
        },
        error: (error) => console.error('Subscription error:', error),
      });
  }

  onSearch(): void {
    this.isLoading.next(true);

    const params = new URLSearchParams();
    if (this.selectedStatus !== 'all') {
      params.append('status', this.selectedStatus);
    }

    this.http
      .get<APIResponse>(`${this.apiUrl}?${params.toString()}`)
      .pipe(
        map((response) => {
          return response.data.map((item) => {
            let hasAttachment = false;
            let attachmentUrls: AttachmentUrl[] = [];

            if (item.attachment_urls) {
              try {
                const parsed = JSON.parse(
                  item.attachment_urls
                ) as AttachmentUrl[];
                hasAttachment = Array.isArray(parsed) && parsed.length > 0;
                if (hasAttachment) {
                  attachmentUrls = parsed;
                }
              } catch (e) {
                console.warn('Error parsing attachment_urls:', e);
                hasAttachment = false;
              }
            }

            return {
              id: Number(item.id.replace('annc', '')),
              title: item.title,
              content: item.content,
              recipient: item.audience,
              postDate: new Date(item.created_at),
              hasAttachment: hasAttachment,
              attachmentUrls: attachmentUrls.map((att) => att.url),
              createdBy: item.posted_by,
              status: (item.status as StatusType) || 'all',
            };
          });
        }),
        catchError((error) => {
          console.error('Error searching announcements:', error);
          return of([] as Announcement[]);
        }),
        finalize(() => {
          this.isLoading.next(false);
        })
      )
      .subscribe((announcements) => {
        this.dataSource.data = announcements;
      });
  }

  onReset(): void {
    this.searchTerm = '';
    this.selectedStatus = 'all';
    this.dataSource.data = this.allAnnouncements; // ใช้ข้อมูลที่มีอยู่แล้ว
  }

  // onStatusChange(event: any): void {
  //   console.log('Status changed to:', event.value);
  //   this.selectedStatus = event.value;
  //   this.onSearch(); // เรียกค้นหาทันทีเมื่อเปลี่ยน status
  // }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  filterByStatus(status: string) {
    if (status === 'all') {
      this.dataSource.data = this.allAnnouncements;
    } else {
      this.dataSource.data = this.allAnnouncements.filter(
        (item) => item.status === status
      );
    }
  }

  onCreateNew(): void {
    this.router.navigate(['/announcement/create']);
  }

  viewAttachment(announcement: Announcement): void {
    if (announcement.attachmentUrls && announcement.attachmentUrls.length > 0) {
      const url = announcement.attachmentUrls[0];
      // URL จาก Cloudinary เป็น absolute URL อยู่แล้ว ไม่ต้องเพิ่ม base URL
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  viewDetails(announcement: Announcement): void {
    this.router.navigate(['/announcement/detail', `annc${announcement.id}`]);
  }

  handlePageEvent(event: PageEvent) {
    this.pageEvent = event;
    // console.log('Page changed:', {
    //   pageIndex: event.pageIndex,
    //   pageSize: event.pageSize,
    //   length: event.length,
    // });
  }
}

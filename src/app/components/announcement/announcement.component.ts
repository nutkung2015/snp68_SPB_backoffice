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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { RestService, Announcement as ApiAnnouncement, AnnouncementResponse } from '../../services/rest.service';

// shared component
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

type AnnouncementStatus = StatusType | 'all';
type StatusType = 'published' | 'draft' | 'unpublished';
// สร้าง interface สำหรับข้อมูล
interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string; // เพิ่ม type field
  recipient: string;
  postDate: Date | null;
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
  isLoading = new BehaviorSubject<boolean>(true);
  isLoading$: Observable<boolean> = this.isLoading.asObservable();
  // เพิ่ม property สำหรับ loading state

  displayedColumns: string[] = [
    'sequence',
    'title',
    'content',
    'type', // เพิ่ม type column
    'recipient',
    'postDate',
    'status',
    'attachment',
    'details',
  ];
  dataSource: MatTableDataSource<Announcement>;
  searchTerm = '';
  selectedRecipient = '';


  pageEvent: PageEvent = {
    pageIndex: 0,
    pageSize: 10,
    length: 0,
  };

  searchType = 'title';
  selectedStatus: AnnouncementStatus = 'all';
  selectedType: string = 'all'; // เพิ่ม type filter

  types = [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'announcement', label: 'ประกาศ' },
    { value: 'event', label: 'กิจกรรม' },
    { value: 'maintenance', label: 'การบำรุงรักษา' },
    { value: 'emergency', label: 'เหตุฉุกเฉิน' }
  ];

  recipients = [
    { value: '', label: 'ทั้งหมด' },
    { value: 'all', label: 'ทุกคน' },
    { value: 'residents', label: 'ลูกบ้าน' },
    { value: 'committee', label: 'กรรมการหมู่บ้าน' },
    { value: 'security', label: 'รปภ.' },
  ];


  private getRecipientLabel(audience: string): string {
    const recipient = this.recipients.find(r => r.value === audience);
    return recipient ? recipient.label : audience;
  }

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

  constructor(private rest: RestService, private router: Router) {
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
    this.rest
      .getAnnouncementsByProject() // ใช้ getAnnouncementsByProject แทน getAnnouncements
      .pipe(
        map((response: AnnouncementResponse) => {
          return response.data.map((item: ApiAnnouncement) => {
            let hasAttachment = false;
            let attachmentUrls: string[] = [];

            // รองรับทั้งกรณี array จริง และ string ที่ต้อง parse (เพื่อความเข้ากันได้)
            const raw = (item as any).attachment_urls;
            if (Array.isArray(raw)) {
              hasAttachment = raw.length > 0;
              attachmentUrls = raw;
            } else if (typeof raw === 'string') {
              try {
                const parsed = JSON.parse(raw) as AttachmentUrl[];
                hasAttachment = Array.isArray(parsed) && parsed.length > 0;
                if (hasAttachment) {
                  attachmentUrls = parsed.map(a => a.url);
                }
              } catch {
                hasAttachment = false;
              }
            }

            const createdAt = item.created_at && !isNaN(Date.parse(item.created_at))
              ? new Date(item.created_at)
              : null;

            return {
              id: item.id,
              title: item.title,
              content: item.content,
              type: item.type, // เพิ่ม type field  
              recipient: this.getRecipientLabel(item.audience),
              postDate: createdAt,
              hasAttachment: hasAttachment,
              attachmentUrls: attachmentUrls,
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
          this.allAnnouncements = announcements;
          this.pageEvent = {
            pageIndex: 0,
            pageSize: 10,
            length: announcements.length
          };
          this.dataSource.data = this.allAnnouncements.slice(0, 10); // Show first page
        },
        error: (error) => console.error('Subscription error:', error),
      });
  }

  onSearch(): void {
    this.isLoading.next(true);

    const params: any = {};
    if (this.selectedStatus !== 'all') {
      params.status = this.selectedStatus;
    }

    this.rest
      .getAnnouncementsByProject(params) // ใช้ getAnnouncementsByProject แทน getAnnouncements
      .pipe(
        map((response: AnnouncementResponse) => {
          return response.data.map((item: ApiAnnouncement) => {
            let hasAttachment = false;
            let attachmentUrls: string[] = [];
            const raw = (item as any).attachment_urls;
            if (Array.isArray(raw)) {
              hasAttachment = raw.length > 0;
              attachmentUrls = raw;
            } else if (typeof raw === 'string') {
              try {
                const parsed = JSON.parse(raw) as AttachmentUrl[];
                hasAttachment = Array.isArray(parsed) && parsed.length > 0;
                if (hasAttachment) {
                  attachmentUrls = parsed.map(a => a.url);
                }
              } catch {
                hasAttachment = false;
              }
            }

            const createdAt = item.created_at && !isNaN(Date.parse(item.created_at))
              ? new Date(item.created_at)
              : null;

            return {
              id: item.id,
              title: item.title,
              content: item.content,
              type: item.type, // เพิ่ม type field
              recipient: this.getRecipientLabel(item.audience),
              postDate: createdAt,
              hasAttachment: hasAttachment,
              attachmentUrls: attachmentUrls,
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
        this.allAnnouncements = announcements;
        this.pageEvent = {
          pageIndex: 0,
          pageSize: 10,
          length: announcements.length
        };
        this.dataSource.data = this.allAnnouncements.slice(0, 10);
      });
  }

  onReset(): void {
    this.searchTerm = '';
    this.selectedStatus = 'all';
    this.selectedType = 'all'; // รีเซ็ต type filter
    this.dataSource.data = this.allAnnouncements; // ใช้ข้อมูลที่มีอยู่แล้ว
  }

  // เพิ่ม method สำหรับ filter by type
  filterByType(type: string) {
    if (type === 'all') {
      this.dataSource.data = this.allAnnouncements;
    } else {
      this.dataSource.data = this.allAnnouncements.filter(
        (item) => item.type === type
      );
    }
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
    this.router.navigate(['/announcement/detail', announcement.id]);
  }

  handlePageEvent(event: PageEvent) {
    this.pageEvent = event;
    this.dataSource.data = this.allAnnouncements.slice(
      event.pageIndex * event.pageSize,
      (event.pageIndex + 1) * event.pageSize
    );
  }
}

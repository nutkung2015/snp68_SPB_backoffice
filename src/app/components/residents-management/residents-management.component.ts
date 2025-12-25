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

// Service
import { RestService } from '../../services/rest.service';
import { AuthService } from '../../services/auth.service';

// shared component
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

type ResidentStatus = StatusType | 'all';
type StatusType = 'active' | 'inactive' | 'pending';

// สร้าง interface สำหรับข้อมูลผู้อยู่อาศัย
interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  houseNumber: string;
  phone: string;
  email: string;
  moveInDate: Date;
  status: ResidentStatus;
  createdAt: Date;
  updatedAt: Date;
  role: string;
}

interface APIResponse {
  status: string;
  data: ResidentAPI[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

interface ResidentAPI {
  membership_id: string;
  unit_id: string;
  user_id: string;
  unit_role: string;
  joined_at: string;
  full_name: string;
  email: string;
  phone: string;
  unit_number: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

@Component({
  selector: 'app-residents-management',
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
  templateUrl: './residents-management.component.html',
  styleUrls: ['./residents-management.component.scss'],
})
export class ResidentsManagementComponent implements OnInit {
  isLoading = new BehaviorSubject<boolean>(true);
  isLoading$: Observable<boolean> = this.isLoading.asObservable();

  displayedColumns: string[] = [
    'sequence',
    'firstName',
    'lastName',
    'houseNumber',
    'phone',
    'email',
    'moveInDate',
    'status',
    'details',
  ];
  dataSource: MatTableDataSource<Resident>;
  searchTerm = '';

  pageEvent: PageEvent = {
    pageIndex: 0,
    pageSize: 10,
    length: 0,
  };

  searchType = 'firstName';
  selectedStatus: ResidentStatus = 'all';

  private allResidents: Resident[] = [];
  projectId: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private http: HttpClient,
    private router: Router,
    private restService: RestService,
    private authService: AuthService
  ) {
    this.dataSource = new MatTableDataSource<Resident>([]);
  }

  ngOnInit() {
    this.loadProjectData();
    this.loadResidents();
  }

  loadProjectData() {
    const projectMemberships = this.authService.getProjectMemberships();
    if (projectMemberships && projectMemberships.length > 0) {
      this.projectId = projectMemberships[0].project_id;
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // กำหนด filter predicate สำหรับการค้นหา
    this.dataSource.filterPredicate = (data: Resident, filter: string) => {
      return data.firstName.toLowerCase().includes(filter.toLowerCase()) ||
        data.lastName.toLowerCase().includes(filter.toLowerCase());
    };
  }

  loadResidents() {
    this.isLoading.next(true);

    this.restService.getResidents(this.projectId)
      .pipe(
        map((response: any) => {
          let data: ResidentAPI[] = [];

          if (response && response.data) {
            data = response.data;
          } else if (Array.isArray(response)) {
            data = response;
          }

          return data.map((item) => {
            const [firstName, ...lastNameParts] = (item.full_name || '').split(' ');
            return {
              id: item.membership_id,
              firstName: firstName || '',
              lastName: lastNameParts.join(' ') || '',
              houseNumber: item.unit_number,
              phone: item.phone,
              email: item.email,
              moveInDate: new Date(item.joined_at),
              status: (item.status as StatusType) || 'active',
              createdAt: item.created_at ? new Date(item.created_at) : new Date(item.joined_at),
              updatedAt: item.updated_at ? new Date(item.updated_at) : new Date(item.joined_at),
              role: item.unit_role
            };
          });
        }),
        catchError((error) => {
          console.error('Error loading residents:', error);
          return of([] as Resident[]);
        }),
        finalize(() => {
          this.isLoading.next(false);
        })
      )
      .subscribe({
        next: (residents) => {
          this.allResidents = residents;
          this.dataSource.data = residents;
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
          if (this.sort) {
            this.dataSource.sort = this.sort;
          }
        },
        error: (error) => console.error('Subscription error:', error),
      });
  }

  onSearch(): void {
    const filterValue = this.searchTerm.trim().toLowerCase();
    this.dataSource.filter = filterValue;

    if (this.selectedStatus !== 'all') {
      this.dataSource.data = this.allResidents.filter(
        (item) => item.status === this.selectedStatus &&
          (item.firstName.toLowerCase().includes(filterValue) || item.lastName.toLowerCase().includes(filterValue))
      );
    }
  }

  onReset(): void {
    this.searchTerm = '';
    this.selectedStatus = 'all';
    this.dataSource.data = this.allResidents;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  filterByStatus(status: string) {
    this.selectedStatus = status as ResidentStatus;
    if (status === 'all') {
      this.dataSource.data = this.allResidents;
    } else {
      this.dataSource.data = this.allResidents.filter(
        (item) => item.status === status
      );
    }

    // Re-apply search filter if exists
    if (this.searchTerm) {
      this.onSearch();
    }
  }

  onCreateNew(): void {
    this.router.navigate(['/residents-management/create']);
  }

  viewDetails(resident: Resident): void {
    this.router.navigate(['/residents-management/detail', resident.id]);
  }

  handlePageEvent(event: PageEvent) {
    this.pageEvent = event;
  }
}

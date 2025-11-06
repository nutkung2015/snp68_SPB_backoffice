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

type ResidentStatus = StatusType | 'all';
type StatusType = 'active' | 'inactive' | 'pending';

// สร้าง interface สำหรับข้อมูลผู้อยู่อาศัย
interface Resident {
  id: number;
  firstName: string;
  lastName: string;
  houseNumber: string;
  phone: string;
  email: string;
  moveInDate: Date;
  status: ResidentStatus;
  createdAt: Date;
  updatedAt: Date;
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
  id: string;
  first_name: string;
  last_name: string;
  house_number: string;
  phone: string;
  email: string;
  move_in_date: string;
  status: string;
  created_at: string;
  updated_at: string;
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
  private apiUrl = 'http://localhost:5000/api/residents';

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

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private router: Router) {
    this.dataSource = new MatTableDataSource<Resident>([]);
  }

  ngOnInit() {
    this.loadResidents();
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

    this.http
      .get<APIResponse>(this.apiUrl)
      .pipe(
        map((response) => {
          return response.data.map((item) => {
            return {
              id: Number(item.id.replace('res', '')),
              firstName: item.first_name,
              lastName: item.last_name,
              houseNumber: item.house_number,
              phone: item.phone,
              email: item.email,
              moveInDate: new Date(item.move_in_date),
              status: (item.status as StatusType) || 'active',
              createdAt: new Date(item.created_at),
              updatedAt: new Date(item.updated_at),
            };
          });
        }),
        catchError((error) => {
          console.error('Error details:', error);
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
            return {
              id: Number(item.id.replace('res', '')),
              firstName: item.first_name,
              lastName: item.last_name,
              houseNumber: item.house_number,
              phone: item.phone,
              email: item.email,
              moveInDate: new Date(item.move_in_date),
              status: (item.status as StatusType) || 'active',
              createdAt: new Date(item.created_at),
              updatedAt: new Date(item.updated_at),
            };
          });
        }),
        catchError((error) => {
          console.error('Error searching residents:', error);
          return of([] as Resident[]);
        }),
        finalize(() => {
          this.isLoading.next(false);
        })
      )
      .subscribe((residents) => {
        this.dataSource.data = residents;
      });
  }

  onReset(): void {
    this.searchTerm = '';
    this.selectedStatus = 'all';
    this.dataSource.data = this.allResidents;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  filterByStatus(status: string) {
    if (status === 'all') {
      this.dataSource.data = this.allResidents;
    } else {
      this.dataSource.data = this.allResidents.filter(
        (item) => item.status === status
      );
    }
  }

  onCreateNew(): void {
    this.router.navigate(['/residents-management/create']);
  }

  viewDetails(resident: Resident): void {
    this.router.navigate(['/residents-management/detail', `res${resident.id}`]);
  }

  handlePageEvent(event: PageEvent) {
    this.pageEvent = event;
  }
}

import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

// Service
import { RestService, Unit } from '../../services/rest.service';
import { AuthService } from '../../services/auth.service';

// Shared component
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

@Component({
  selector: 'app-unit-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSelectModule,
    MatInputModule,
    FlexLayoutModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    HttpClientModule,
    PageHeaderComponent,
  ],
  templateUrl: './unit-management.component.html',
  styleUrl: './unit-management.component.scss'
})
export class UnitManagementComponent implements OnInit, AfterViewInit {
  isLoading = new BehaviorSubject<boolean>(true);
  isLoading$: Observable<boolean> = this.isLoading.asObservable();

  displayedColumns: string[] = [
    'sequence',
    'unitNumber',
    'zone',
    'building',
    'area',
    'status',
    'actions',
  ];
  dataSource: MatTableDataSource<Unit>;
  searchTerm = '';

  pageEvent: PageEvent = {
    pageIndex: 0,
    pageSize: 10,
    length: 0,
  };

  selectedZone = 'all';
  selectedBuilding = 'all';
  selectedStatus = 'all';

  zones: string[] = [];
  buildings: string[] = [];
  statuses: string[] = ['active', 'inactive'];

  private allUnits: Unit[] = [];
  projectId: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router,
    private restService: RestService,
    private authService: AuthService
  ) {
    this.dataSource = new MatTableDataSource<Unit>([]);
  }

  ngOnInit() {
    this.loadProjectData();
    this.loadUnits();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Custom filtering
    this.dataSource.filterPredicate = (data: Unit, filter: string) => {
      const searchStr = filter.toLowerCase();
      return data.unit_number.toLowerCase().includes(searchStr);
    };
  }

  loadProjectData() {
    const projectMemberships = this.authService.getProjectMemberships();
    if (projectMemberships && projectMemberships.length > 0) {
      this.projectId = projectMemberships[0].project_id;
    }
  }

  loadUnits() {
    this.isLoading.next(true);

    this.restService.getUnits(this.projectId)
      .pipe(
        finalize(() => {
          this.isLoading.next(false);
        }),
        catchError((error) => {
          console.error('Error loading units:', error);
          return of([] as Unit[]);
        })
      )
      .subscribe({
        next: (units) => {
          this.allUnits = units;
          this.dataSource.data = units;

          // Extract unique zones and buildings for filters
          this.zones = Array.from(new Set(units.map(u => u.zone).filter(Boolean).sort()));
          this.buildings = Array.from(new Set(units.map(u => u.building).filter(Boolean).sort()));

          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
          if (this.sort) {
            this.dataSource.sort = this.sort;
          }
        }
      });
  }

  applyFilter() {
    let filteredData = [...this.allUnits];

    // Search term filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filteredData = filteredData.filter(u =>
        u.unit_number.toLowerCase().includes(term)
      );
    }

    // Zone filter
    if (this.selectedZone !== 'all') {
      filteredData = filteredData.filter(u => u.zone === this.selectedZone);
    }

    // Building filter
    if (this.selectedBuilding !== 'all') {
      filteredData = filteredData.filter(u => u.building === this.selectedBuilding);
    }

    // Status filter
    if (this.selectedStatus !== 'all') {
      filteredData = filteredData.filter(u => u.status === this.selectedStatus);
    }

    this.dataSource.data = filteredData;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onReset(): void {
    this.searchTerm = '';
    this.selectedZone = 'all';
    this.selectedBuilding = 'all';
    this.selectedStatus = 'all';
    this.dataSource.data = this.allUnits;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onCreateNew(): void {
    // Navigate to create unit page (if exists)
    // this.router.navigate(['/unit-management/create']);
  }

  viewDetails(unit: Unit): void {
    // Navigate to detail page
    // this.router.navigate(['/unit-management/detail', unit.id]);
  }

  handlePageEvent(event: PageEvent) {
    this.pageEvent = event;
  }
}

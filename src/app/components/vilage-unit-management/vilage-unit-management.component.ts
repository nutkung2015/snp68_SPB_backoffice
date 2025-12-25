import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { SelectionModel } from '@angular/cdk/collections';
import { Zone, RestService, Unit } from '../../services/rest.service';
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
import { MatChipsModule } from '@angular/material/chips';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { ZoneDialogComponent } from './zone-dialog/zone-dialog.component';

@Component({
  selector: 'app-vilage-unit-management',
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
    MatChipsModule,
    PageHeaderComponent,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatDialogModule,
    MatMenuModule,
    ZoneDialogComponent
  ],
  templateUrl: './vilage-unit-management.component.html',
  styleUrl: './vilage-unit-management.component.scss'
})
export class VilageUnitManagementComponent implements OnInit, AfterViewInit {
  isLoading = new BehaviorSubject<boolean>(true);
  isLoading$: Observable<boolean> = this.isLoading.asObservable();

  displayedColumns: string[] = [
    'select',
    'sequence',
    'unitNumber',
    'zone',
    'building',
    'area',
    'status',
    'actions',
  ];
  dataSource: MatTableDataSource<Unit>;
  selection = new SelectionModel<Unit>(true, []);
  searchTerm = '';

  pageEvent: PageEvent = {
    pageIndex: 0,
    pageSize: 10,
    length: 0,
  };

  // View Mode: 'units' | 'zones'
  viewMode: 'units' | 'zones' = 'units';
  unitViewMode: 'grid' | 'table' = 'grid'; // Sub-view for units

  selectedZone = 'all';
  selectedBuilding = 'all';
  selectedStatus = 'all';

  zones: string[] = []; // for filter (legacy string)
  realZones: Zone[] = []; // for Zone Management
  buildings: string[] = [];
  statuses: string[] = ['active', 'inactive'];

  private allUnits: Unit[] = [];
  projectId: string = '';
  projectName: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router,
    private restService: RestService,
    private authService: AuthService,
    private dialog: MatDialog
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
      this.projectName = projectMemberships[0].project_name || 'หมู่บ้าน';
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

  viewDetails(unit: Unit): void {
    // Navigate to detail page
    this.router.navigate(['/village/unit', unit.id]);
  }

  viewResidents(unit: Unit): void {
    // Navigate to unit residents page
    this.router.navigate(['/village/unit', unit.id, 'residents']);
  }

  getStatusClass(status: string | null): string {
    if (!status || status === 'active') {
      return 'status-active';
    }
    return 'status-inactive';
  }

  getStatusText(status: string | null): string {
    if (!status || status === 'active') {
      return 'มีผู้อยู่อาศัย';
    }
    return 'ไม่มีผู้อยู่อาศัย';
  }

  handlePageEvent(event: PageEvent) {
    this.pageEvent = event;
  }

  // Statistics
  get totalUnits(): number {
    return this.allUnits.length;
  }

  get activeUnits(): number {
    return this.allUnits.filter(u => !u.status || u.status === 'active').length;
  }

  get uniqueZones(): number {
    return this.zones.length;
  }

  get uniqueBuildings(): number {
    return this.buildings.length;
  }

  // ============================================
  // Zone Management Logic
  // ============================================

  loadZones() {
    this.restService.getZones(this.projectId).subscribe({
      next: (zones) => {
        this.realZones = zones;
      },
      error: (err) => console.error('Failed to load zones', err)
    });
  }

  onViewModeChange(mode: 'units' | 'zones') {
    this.viewMode = mode;
    if (mode === 'zones' && this.realZones.length === 0) {
      this.loadZones();
    }
  }

  openZoneDialog(zone?: Zone) {
    const dialogRef = this.dialog.open(ZoneDialogComponent, {
      width: '600px',
      data: {
        zone: zone,
        projectId: this.projectId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (zone) {
          // Update
          this.restService.updateZone(zone.id, result).subscribe(() => {
            this.loadZones();
          });
        } else {
          // Create
          this.restService.createZone(result).subscribe(() => {
            this.loadZones();
          });
        }
      }
    });
  }

  deleteZone(zone: Zone) {
    if (confirm(`คุณต้องการลบโซน "${zone.name}" หรือไม่?`)) {
      this.restService.deleteZone(zone.id).subscribe(() => {
        this.loadZones();
      });
    }
  }

  // ============================================
  // Smart Connect Logic
  // ============================================
  autoConnectZones() {
    this.isLoading.next(true);
    this.restService.matchZoneByName(this.projectId)
      .pipe(finalize(() => this.isLoading.next(false)))
      .subscribe({
        next: (res) => {
          alert(`เชื่อมต่อข้อมูลเรียบร้อย`);
          this.loadUnits(); // Reload units to see updated zone_ids
        },
        error: (err) => {
          console.error('Auto connect failed', err);
          alert('เกิดข้อผิดพลาดในการเชื่อมต่อข้อมูล');
        }
      });
  }

  // ============================================
  // Bulk Actions
  // ============================================

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource.data);
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: Unit): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.unit_number}`;
  }

  moveSelectedToZone(zone: Zone) {
    const zoneId = zone.id;
    this.moveSelectedToZoneById(zoneId);
  }

  moveSelectedToZoneById(zoneId: string) {
    if (this.selection.isEmpty()) return;

    const unitIds = this.selection.selected.map(u => u.id);
    this.isLoading.next(true);

    this.restService.bindUnitsToZone(zoneId, unitIds)
      .pipe(finalize(() => this.isLoading.next(false)))
      .subscribe({
        next: () => {
          this.selection.clear();
          this.loadUnits();
          alert('ย้ายเข้าโซนเรียบร้อยแล้ว');
        },
        error: (err) => {
          console.error('Move failed', err);
          alert('เกิดข้อผิดพลาดในการย้ายข้อมูล');
        }
      });
  }
}


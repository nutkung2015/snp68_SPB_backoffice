import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GateZoneManageDialogComponent } from './gate-zone-manage-dialog.component';

describe('GateZoneManageDialogComponent', () => {
  let component: GateZoneManageDialogComponent;
  let fixture: ComponentFixture<GateZoneManageDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GateZoneManageDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GateZoneManageDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

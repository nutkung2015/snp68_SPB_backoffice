import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VilageUnitManagementComponent } from './vilage-unit-management.component';

describe('VilageUnitManagementComponent', () => {
  let component: VilageUnitManagementComponent;
  let fixture: ComponentFixture<VilageUnitManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VilageUnitManagementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VilageUnitManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

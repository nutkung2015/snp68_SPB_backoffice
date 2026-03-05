import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDeleteVehicleComponent } from './confirm-delete-vehicle.component';

describe('ConfirmDeleteVehicleComponent', () => {
  let component: ConfirmDeleteVehicleComponent;
  let fixture: ComponentFixture<ConfirmDeleteVehicleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDeleteVehicleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConfirmDeleteVehicleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

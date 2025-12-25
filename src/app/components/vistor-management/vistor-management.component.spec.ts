import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VistorManagementComponent } from './vistor-management.component';

describe('VistorManagementComponent', () => {
  let component: VistorManagementComponent;
  let fixture: ComponentFixture<VistorManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VistorManagementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VistorManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

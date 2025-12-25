import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VistorManagementDetailComponent } from './vistor-management-detail.component';

describe('VistorManagementDetailComponent', () => {
  let component: VistorManagementDetailComponent;
  let fixture: ComponentFixture<VistorManagementDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VistorManagementDetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VistorManagementDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

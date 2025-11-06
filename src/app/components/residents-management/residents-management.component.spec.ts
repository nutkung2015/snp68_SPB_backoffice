import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResidentsManagementComponent } from './residents-management.component';

describe('ResidentsManagementComponent', () => {
  let component: ResidentsManagementComponent;
  let fixture: ComponentFixture<ResidentsManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResidentsManagementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResidentsManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

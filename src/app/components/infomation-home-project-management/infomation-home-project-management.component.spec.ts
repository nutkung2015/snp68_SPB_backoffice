import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfomationHomeProjectManagementComponent } from './infomation-home-project-management.component';

describe('InfomationHomeProjectManagementComponent', () => {
  let component: InfomationHomeProjectManagementComponent;
  let fixture: ComponentFixture<InfomationHomeProjectManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfomationHomeProjectManagementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InfomationHomeProjectManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

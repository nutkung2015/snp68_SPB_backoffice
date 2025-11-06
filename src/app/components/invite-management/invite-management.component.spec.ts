import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InviteManagementComponent } from './invite-management.component';

describe('InviteManagementComponent', () => {
  let component: InviteManagementComponent;
  let fixture: ComponentFixture<InviteManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InviteManagementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InviteManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

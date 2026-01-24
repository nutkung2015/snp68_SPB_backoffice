import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InviteDetailComponent } from './invite-detail.component';

describe('InviteDetailComponent', () => {
  let component: InviteDetailComponent;
  let fixture: ComponentFixture<InviteDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InviteDetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InviteDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAnnouncementsGlobalComponent } from './create-announcements-global.component';

describe('CreateAnnouncementsGlobalComponent', () => {
  let component: CreateAnnouncementsGlobalComponent;
  let fixture: ComponentFixture<CreateAnnouncementsGlobalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateAnnouncementsGlobalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateAnnouncementsGlobalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

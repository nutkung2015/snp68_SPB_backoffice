import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailAnnouncementComponent } from './detail-announcement.component';

describe('DetailAnnouncementComponent', () => {
  let component: DetailAnnouncementComponent;
  let fixture: ComponentFixture<DetailAnnouncementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailAnnouncementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DetailAnnouncementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

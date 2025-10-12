import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnouncementConfirmDeleteComponent } from './announcement-confirm-delete.component';

describe('AnnouncementConfirmDeleteComponent', () => {
  let component: AnnouncementConfirmDeleteComponent;
  let fixture: ComponentFixture<AnnouncementConfirmDeleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnouncementConfirmDeleteComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AnnouncementConfirmDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

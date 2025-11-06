import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailIssuePersonalComponent } from './detail-issue-personal.component';

describe('DetailIssuePersonalComponent', () => {
  let component: DetailIssuePersonalComponent;
  let fixture: ComponentFixture<DetailIssuePersonalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailIssuePersonalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DetailIssuePersonalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

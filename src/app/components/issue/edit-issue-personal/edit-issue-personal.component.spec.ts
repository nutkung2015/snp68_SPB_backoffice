import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditIssuePersonalComponent } from './edit-issue-personal.component';

describe('EditIssuePersonalComponent', () => {
  let component: EditIssuePersonalComponent;
  let fixture: ComponentFixture<EditIssuePersonalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditIssuePersonalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditIssuePersonalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

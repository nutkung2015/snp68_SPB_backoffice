import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssuePersonalConfirmDeleteComponent } from './issue-personal-confirm-delete.component';

describe('IssuePersonalConfirmDeleteComponent', () => {
  let component: IssuePersonalConfirmDeleteComponent;
  let fixture: ComponentFixture<IssuePersonalConfirmDeleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssuePersonalConfirmDeleteComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IssuePersonalConfirmDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

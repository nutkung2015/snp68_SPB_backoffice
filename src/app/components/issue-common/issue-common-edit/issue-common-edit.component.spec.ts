import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssueCommonEditComponent } from './issue-common-edit.component';

describe('IssueCommonEditComponent', () => {
  let component: IssueCommonEditComponent;
  let fixture: ComponentFixture<IssueCommonEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueCommonEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IssueCommonEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

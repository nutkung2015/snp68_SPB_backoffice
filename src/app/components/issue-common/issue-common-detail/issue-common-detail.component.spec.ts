import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssueCommonDetailComponent } from './issue-common-detail.component';

describe('IssueCommonDetailComponent', () => {
  let component: IssueCommonDetailComponent;
  let fixture: ComponentFixture<IssueCommonDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueCommonDetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IssueCommonDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

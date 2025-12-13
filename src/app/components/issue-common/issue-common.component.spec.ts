import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssueCommonComponent } from './issue-common.component';

describe('IssueCommonComponent', () => {
  let component: IssueCommonComponent;
  let fixture: ComponentFixture<IssueCommonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueCommonComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IssueCommonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

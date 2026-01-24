import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuardPostDialogComponent } from './guard-post-dialog.component';

describe('GuardPostDialogComponent', () => {
  let component: GuardPostDialogComponent;
  let fixture: ComponentFixture<GuardPostDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuardPostDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GuardPostDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

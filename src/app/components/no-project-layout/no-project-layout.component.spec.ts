import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoProjectLayoutComponent } from './no-project-layout.component';

describe('NoProjectLayoutComponent', () => {
  let component: NoProjectLayoutComponent;
  let fixture: ComponentFixture<NoProjectLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoProjectLayoutComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NoProjectLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

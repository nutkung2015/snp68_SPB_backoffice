import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InternalSeverComponent } from './internal-sever.component';

describe('InternalSeverComponent', () => {
  let component: InternalSeverComponent;
  let fixture: ComponentFixture<InternalSeverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InternalSeverComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InternalSeverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

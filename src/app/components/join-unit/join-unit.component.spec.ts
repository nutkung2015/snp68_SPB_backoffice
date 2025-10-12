import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinUnitComponent } from './join-unit.component';

describe('JoinUnitComponent', () => {
  let component: JoinUnitComponent;
  let fixture: ComponentFixture<JoinUnitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JoinUnitComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(JoinUnitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

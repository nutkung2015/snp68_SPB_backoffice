import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HouseGuardComponent } from './house-guard.component';

describe('HouseGuardComponent', () => {
  let component: HouseGuardComponent;
  let fixture: ComponentFixture<HouseGuardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HouseGuardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HouseGuardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

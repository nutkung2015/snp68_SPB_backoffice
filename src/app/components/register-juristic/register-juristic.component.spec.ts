import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterJuristicComponent } from './register-juristic.component';

describe('RegisterJuristicComponent', () => {
  let component: RegisterJuristicComponent;
  let fixture: ComponentFixture<RegisterJuristicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterJuristicComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RegisterJuristicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

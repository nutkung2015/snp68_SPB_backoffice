import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomThemeAppComponent } from './custom-theme-app.component';

describe('CustomThemeAppComponent', () => {
  let component: CustomThemeAppComponent;
  let fixture: ComponentFixture<CustomThemeAppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomThemeAppComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CustomThemeAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateProjectSuperAdminComponent } from './create-project-super-admin.component';

describe('CreateProjectSuperAdminComponent', () => {
  let component: CreateProjectSuperAdminComponent;
  let fixture: ComponentFixture<CreateProjectSuperAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateProjectSuperAdminComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateProjectSuperAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

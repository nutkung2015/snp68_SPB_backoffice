import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarNoProjectComponent } from './sidebar-no-project.component';

describe('SidebarNoProjectComponent', () => {
  let component: SidebarNoProjectComponent;
  let fixture: ComponentFixture<SidebarNoProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarNoProjectComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SidebarNoProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

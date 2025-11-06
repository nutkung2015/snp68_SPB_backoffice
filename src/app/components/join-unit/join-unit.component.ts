import { Component, OnInit } from '@angular/core'; // shared component
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RestService, ProjectMembership } from '../../services/rest.service';

@Component({
  selector: 'app-join-unit',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './join-unit.component.html',
  styleUrls: ['./join-unit.component.scss'],
})
export class JoinUnitComponent implements OnInit {
  joinProjectForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private restService: RestService
  ) {
    this.joinProjectForm = this.fb.group({
      projectCode: ['', Validators.required],
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.joinProjectForm.valid) {
      const invitationCode = this.joinProjectForm.value.projectCode;
      console.log('Project Code Submitted:', invitationCode);

      this.restService.joinProject(invitationCode).subscribe({
        next: (response) => {
          console.log('Project joined successfully:', response);

          // Create projectMemberships from API response
          const projectMemberships: ProjectMembership[] = [{
            project_id: response.project_id,
            project_name: response.project_name,
            role: response.role
          }];

          // Store in localStorage
          localStorage.setItem('projectMemberships', JSON.stringify(projectMemberships));
          console.log('Project memberships stored:', projectMemberships);

          // Show success message and navigate to announcement page
          alert('เข้าโครงการสำเร็จ');
          this.router.navigate(['/announcement']);
        },
        error: (error) => {
          console.error('Error joining project:', error);
          alert('ไม่สามารถเข้าร่วมโครงการได้: ' + (error.message || 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ'));
          this.router.navigate(['/login']);
        }
      });
    } else {
      this.joinProjectForm.markAllAsTouched();
    }
  }
}

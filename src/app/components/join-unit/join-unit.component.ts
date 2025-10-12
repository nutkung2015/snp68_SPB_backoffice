import { Component, OnInit } from '@angular/core'; // shared component
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-join-unit',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './join-unit.component.html',
  styleUrl: './join-unit.component.scss',
})
export class JoinUnitComponent implements OnInit {
  joinProjectForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {
    this.joinProjectForm = this.fb.group({
      projectCode: ['', Validators.required],
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.joinProjectForm.valid) {
      const invitation_code = this.joinProjectForm.value.projectCode;
      console.log('Project Code Submitted:', invitation_code);

      this.http
        .post('http://localhost:5000/api/project_invitations/join', {
          invitation_code,
        })
        .subscribe({
          next: (response) => {
            console.log('Project joined successfully:', response);
            // Optionally, refresh user's project memberships or redirect
            // For now, redirect to announcement page
            this.router.navigate(['/announcement']);
          },
          error: (error) => {
            console.error('Error joining project:', error);
            alert(
              'Failed to join project: ' +
                (error.error.message || 'Unknown error')
            );
          },
        });
    } else {
      this.joinProjectForm.markAllAsTouched();
    }
  }
}

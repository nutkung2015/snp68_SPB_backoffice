import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;
  thaiWarning = {
    email: false,
    password: false
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void { }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const { email, password } = this.loginForm.value;
      this.authService.login({ email, password }).subscribe({
        next: (response) => {
          if (response && response.data && typeof response.data.token === 'string' && response.data.token.length > 0) {
            this.authService.setToken(response.data.token);
            const userRole = this.authService.getUserRole();
            if (userRole === 'juristic' && !this.authService.hasProjectMembership()) {
              this.router.navigate(['/no-project']);
            } else {
              this.router.navigate(['/announcement']);
            }
          } else {
            console.error('Login failed: Token not received or invalid.', response);
            alert('Login failed: Invalid token received from server.');
            this.isLoading = false;
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('Login failed:', error);
          alert('Login failed: ' + (error.error.message || 'Invalid credentials'));
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        },
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach((key) => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName} is required`;
      }
      if (field.errors['email']) {
        return `Invalid email format`;
      }
      if (field.errors['minlength']) {
        return `${fieldName} must be at least 6 characters`;
      }
    }
    return '';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  checkThaiInput(fieldName: 'email' | 'password', event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Check if the input contains Thai characters (Unicode range: 0E00-0E7F)
    const thaiRegex = /[\u0E00-\u0E7F]/;
    const hasThai = thaiRegex.test(value);

    this.thaiWarning[fieldName] = hasThai;

    // If Thai characters are detected, remove them from the input
    if (hasThai) {
      const cleanedValue = value.replace(/[\u0E00-\u0E7F]/g, '');
      this.loginForm.get(fieldName)?.setValue(cleanedValue, { emitEvent: false });
    }
  }
}

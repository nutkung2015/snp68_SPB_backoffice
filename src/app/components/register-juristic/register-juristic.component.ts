import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, RegisterRequest } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-register-juristic',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register-juristic.component.html',
  styleUrl: './register-juristic.component.scss'
})
export class RegisterJuristicComponent implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  thaiWarning = {
    full_name: false,
    email: false,
    password: false,
    confirmPassword: false
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private toast: ToastService
  ) {
    this.registerForm = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern(/^0[0-9]{9}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void { }

  // Custom validator to check if passwords match
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    if (confirmPassword.errors && !confirmPassword.errors['passwordMismatch']) {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      confirmPassword.setErrors(null);
      return null;
    }
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      const { full_name, phone, email, password } = this.registerForm.value;

      const registerData: RegisterRequest = {
        full_name,
        phone,
        email,
        password,
        role: 'juristic'
      };

      this.authService.register(registerData).subscribe({
        next: (response) => {
          console.log('Registration successful:', response);
          this.toast.success('Registration successful! Please login with your credentials.');
          this.router.navigate(['/login']);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Registration failed:', error);
          const errorMessage = error.error?.message || 'Registration failed. Please try again.';
          this.toast.error('Registration failed: ' + errorMessage);
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
    Object.keys(this.registerForm.controls).forEach((key) => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['email']) {
        return `Invalid email format`;
      }
      if (field.errors['minlength']) {
        const minLength = field.errors['minlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} must be at least ${minLength} characters`;
      }
      if (field.errors['pattern']) {
        if (fieldName === 'phone') {
          return `Phone number must be 10 digits starting with 0`;
        }
      }
      if (field.errors['passwordMismatch']) {
        return `Passwords do not match`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      full_name: 'Full name',
      phone: 'Phone number',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm password'
    };
    return labels[fieldName] || fieldName;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  checkThaiInput(fieldName: 'full_name' | 'email' | 'password' | 'confirmPassword', event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Check if the input contains Thai characters (Unicode range: 0E00-0E7F)
    const thaiRegex = /[\u0E00-\u0E7F]/;
    const hasThai = thaiRegex.test(value);

    this.thaiWarning[fieldName] = hasThai;

    // If Thai characters are detected, remove them from the input
    if (hasThai) {
      const cleanedValue = value.replace(/[\u0E00-\u0E7F]/g, '');
      this.registerForm.get(fieldName)?.setValue(cleanedValue, { emitEvent: false });
    }
  }
}

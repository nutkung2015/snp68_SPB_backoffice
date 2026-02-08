import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-new-password',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule
    ],
    templateUrl: './new-password.component.html',
    styleUrls: ['./new-password.component.scss']
})
export class NewPasswordComponent implements OnInit {
    passwordForm: FormGroup;
    firebaseToken: string = '';
    isLoading = false;
    hidePassword = true;
    hideConfirmPassword = true;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private snackBar: MatSnackBar
    ) {
        // Get the token passed from the previous screen
        const navigation = this.router.getCurrentNavigation();
        if (navigation?.extras?.state) {
            this.firebaseToken = navigation.extras.state['token'];
        }

        this.passwordForm = this.fb.group({
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]]
        }, { validators: this.checkPasswords });
    }

    ngOnInit(): void {
        if (!this.firebaseToken) {
            // If no token, redirect back to forgot password or login
            this.snackBar.open('Session expired or invalid. Please try again.', 'Close', { duration: 3000 });
            this.router.navigate(['/forgot-password']);
        }
    }

    checkPasswords(group: FormGroup) {
        const pass = group.get('password')?.value;
        const confirmPass = group.get('confirmPassword')?.value;
        return pass === confirmPass ? null : { notSame: true };
    }

    onSubmit() {
        if (this.passwordForm.invalid || !this.firebaseToken) return;

        this.isLoading = true;
        const password = this.passwordForm.get('password')?.value;

        console.log('Resetting password with token length:', this.firebaseToken?.length);
        console.log('Token preview:', this.firebaseToken?.substring(0, 20) + '...');

        this.authService.resetPassword(password, this.firebaseToken).subscribe({
            next: (res) => {
                this.snackBar.open('Password reset successfully! Please login.', 'Close', { duration: 3000 });
                this.router.navigate(['/login']);
            },
            error: (err) => {
                console.error('Error resetting password', err);
                this.snackBar.open('Failed to reset password. Please try again.', 'Close', { duration: 3000 });
                this.isLoading = false;
            }
        });
    }
}

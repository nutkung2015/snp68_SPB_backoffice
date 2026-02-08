import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { Auth, RecaptchaVerifier } from '@angular/fire/auth';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatStepperModule,
        MatIconModule,
        MatCardModule,
        MatSnackBarModule,
        PageHeaderComponent
    ],
    templateUrl: './reset-password.component.html',
    styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit, OnDestroy, AfterViewInit {
    phoneForm: FormGroup;
    otpForm: FormGroup;
    passwordForm: FormGroup;
    isLinear = true;

    recaptchaVerifier: RecaptchaVerifier | undefined;
    confirmationResult: any;
    firebaseToken: string = '';

    isLoading = false;
    hidePassword = true;
    hideConfirmPassword = true;

    // Current step (0 = phone, 1 = otp, 2 = new password)
    currentStep = 0;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private snackBar: MatSnackBar,
        private auth: Auth
    ) {
        this.phoneForm = this.fb.group({
            phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]]
        });

        this.otpForm = this.fb.group({
            otp: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
        });

        this.passwordForm = this.fb.group({
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]]
        }, { validators: this.checkPasswords });
    }

    ngOnInit(): void {
        // Pre-fill phone from current user if available
        const user = this.authService.getCurrentUser();
        if (user?.phone) {
            this.phoneForm.patchValue({ phone: user.phone });
        }
    }

    ngAfterViewInit() {
        this.initRecaptcha();
    }

    ngOnDestroy() {
        // Only clear when component is destroyed
        if (this.recaptchaVerifier) {
            try {
                this.recaptchaVerifier.clear();
            } catch (e) {
                console.warn('Recaptcha clear error', e);
            }
        }
    }

    checkPasswords(group: FormGroup) {
        const pass = group.get('password')?.value;
        const confirmPass = group.get('confirmPassword')?.value;
        return pass === confirmPass ? null : { notSame: true };
    }

    async initRecaptcha() {
        // Prevent duplicate initialization
        if (this.recaptchaVerifier) return;

        const container = document.getElementById('recaptcha-container');
        if (!container) return;

        try {
            // Initialize once
            this.recaptchaVerifier = new RecaptchaVerifier(this.auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': (response: any) => {
                    console.log('Recaptcha solved - Token received');
                },
                'expired-callback': () => {
                    console.warn('Recaptcha expired');
                    // User needs to click send again, simpler than re-rendering
                    this.snackBar.open('reCAPTCHA หมดอายุ กรุณากดส่งอีกครั้ง', 'ปิด', { duration: 3000 });
                }
            });

            await this.recaptchaVerifier.render();
        } catch (error) {
            console.error('Error initializing recaptcha', error);
        }
    }

    async onSendOTP() {
        if (this.phoneForm.invalid) return;

        const phone = this.phoneForm.get('phone')?.value;
        const formattedPhone = '+66' + phone.substring(1);

        this.isLoading = true;

        this.authService.verifyPhoneOwnership(phone).subscribe({
            next: async (res) => {
                if (res.isOwner) { // Success: Phone matches session
                    try {
                        // Ensure verifier exists
                        if (!this.recaptchaVerifier) await this.initRecaptcha();

                        // Pass the EXISTING verifier instance. Do not create new ones.
                        this.confirmationResult = await this.authService.sendOTP(formattedPhone, this.recaptchaVerifier);
                        this.snackBar.open('ส่ง OTP สำเร็จ!', 'ปิด', { duration: 3000 });
                        this.isLoading = false;
                        this.currentStep = 1;
                    } catch (error: any) {
                        console.error('Error sending OTP (Full)', error);

                        // Helpful error messages based on Firebase codes
                        let msg = 'ส่ง OTP ไม่สำเร็จ';
                        if (error.code === 'auth/invalid-app-credential') {
                            msg = 'ไม่สามารถยืนยันแอปพลิเคชันได้ (Domain/AppCheck)';
                        } else if (error.code === 'auth/too-many-requests') {
                            msg = 'ลองบ่อยเกินไป กรุณารอสักครู่';
                        } else {
                            msg += ': ' + (error.message || error.code);
                        }

                        this.snackBar.open(msg, 'ปิด', { duration: 5000 });
                        this.isLoading = false;

                        // DO NOT clear reCAPTCHA here. 
                        // If the user clicks "Send" again, the same verifier instance will be used to request a new challenge.
                        // Clearing it causes 'already rendered' issues.
                    }
                } else {
                    // Not Owner / Number doesn't match
                    const msg = res.message || 'เบอร์โทรศัพท์ไม่ถูกต้องหรือไม่ตรงกับบัญชีผู้ใช้';
                    this.snackBar.open(msg, 'ปิด', { duration: 3000 });
                    this.isLoading = false;
                }
            },
            error: (err) => {
                console.error('Error verifying phone ownership', err);
                const msg = err.error?.message || 'เกิดข้อผิดพลาดในการตรวจสอบเบอร์โทร';
                this.snackBar.open(msg, 'ปิด', { duration: 3000 });
                this.isLoading = false;
            }
        });
    }

    async onVerifyOTP() {
        if (this.otpForm.invalid) return;

        const otp = this.otpForm.get('otp')?.value;
        this.isLoading = true;

        try {
            const result = await this.authService.verifyOTP(this.confirmationResult, otp);
            this.firebaseToken = await this.authService.getFirebaseToken(result.user);
            this.snackBar.open('ยืนยัน OTP สำเร็จ!', 'ปิด', { duration: 3000 });
            this.currentStep = 2;
            this.isLoading = false;
        } catch (error: any) {
            console.error('Error verifying OTP', error);
            this.snackBar.open('รหัส OTP ไม่ถูกต้อง กรุณาลองใหม่', 'ปิด', { duration: 3000 });
            this.isLoading = false;
        }
    }

    onResetPassword() {
        if (this.passwordForm.invalid || !this.firebaseToken) return;

        this.isLoading = true;
        const password = this.passwordForm.get('password')?.value;

        this.authService.resetPassword(password, this.firebaseToken).subscribe({
            next: (res) => {
                this.snackBar.open('เปลี่ยนรหัสผ่านสำเร็จ!', 'ปิด', { duration: 3000 });
                this.router.navigate(['/profile']);
            },
            error: (err) => {
                console.error('Error resetting password', err);
                this.snackBar.open('เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองใหม่', 'ปิด', { duration: 3000 });
                this.isLoading = false;
            }
        });
    }

    goBack() {
        if (this.currentStep > 0) {
            this.currentStep--;
        } else {
            this.router.navigate(['/profile']);
        }
    }
}

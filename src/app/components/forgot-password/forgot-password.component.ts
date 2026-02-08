import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { Auth, RecaptchaVerifier } from '@angular/fire/auth';

@Component({
    selector: 'app-forgot-password',
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
        MatSnackBarModule
    ],
    templateUrl: './forgot-password.component.html',
    styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
    phoneForm: FormGroup;
    otpForm: FormGroup;
    isLinear = true;

    recaptchaVerifier: RecaptchaVerifier | undefined;
    confirmationResult: any;

    isLoading = false;

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
    }

    ngOnInit(): void {
        // Initialize things if needed, but RecaptchaVerifier needs DOM element
        // We defer initialization to ngAfterViewInit or just before sending
    }

    ngAfterViewInit() {
        this.initRecaptcha();
    }

    ngOnDestroy() {
        if (this.recaptchaVerifier) {
            try {
                this.recaptchaVerifier.clear();
            } catch (e) {
                console.warn('Recaptcha clear error', e);
            }
        }
    }

    clearRecaptcha() {
        if (this.recaptchaVerifier) {
            try {
                this.recaptchaVerifier.clear();
            } catch (e) {
                console.warn('Error clearing recaptcha', e);
            }
            this.recaptchaVerifier = undefined;
        }
        const container = document.getElementById('recaptcha-container');
        if (container) {
            container.innerHTML = '';
        }
    }

    async initRecaptcha() {
        if (this.recaptchaVerifier) return;

        const container = document.getElementById('recaptcha-container');
        if (!container) return;

        try {
            this.recaptchaVerifier = new RecaptchaVerifier(this.auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': (response: any) => {
                    console.log('Recaptcha solved');
                },
                'expired-callback': () => {
                    console.warn('Recaptcha expired');
                    this.snackBar.open('reCAPTCHA หมดอายุ กรุณากดส่งอีกครั้ง', 'ปิด', { duration: 3000 });
                }
            });
            await this.recaptchaVerifier.render();
        } catch (error) {
            console.error('Error rendering recaptcha', error);
        }
    }

    async onSendOTP() {
        if (this.phoneForm.invalid) return;

        const phone = this.phoneForm.get('phone')?.value;
        const formattedPhone = '+66' + phone.substring(1);

        this.isLoading = true;

        this.authService.checkPhoneExists(phone).subscribe({
            next: async (res) => {
                if (res.exists) {
                    try {
                        if (!this.recaptchaVerifier) await this.initRecaptcha();

                        this.confirmationResult = await this.authService.sendOTP(formattedPhone, this.recaptchaVerifier);
                        this.snackBar.open('ส่ง OTP สำเร็จ!', 'ปิด', { duration: 3000 });
                        this.isLoading = false;
                        // Move to next step (handled by mat-stepper)
                    } catch (error: any) {
                        console.error('Error sending OTP', error);

                        let msg = 'ส่ง OTP ไม่สำเร็จ';
                        if (error.code === 'auth/invalid-app-credential') {
                            msg = 'ไม่สามารถยืนยันแอปพลิเคชันได้ (กรุณาเช็ค Identity Toolkit API)';
                        } else if (error.code === 'auth/too-many-requests') {
                            msg = 'ลองบ่อยเกินไป กรุณารอสักครู่';
                        } else {
                            msg += ': ' + error.message;
                        }

                        this.snackBar.open(msg, 'ปิด', { duration: 5000 });
                        this.isLoading = false;

                        // DO NOT clear reCAPTCHA here. Let the user retry with the same instance.
                    }
                } else {
                    this.snackBar.open('ไม่พบเบอร์โทรศัพท์นี้ในระบบ', 'ปิด', { duration: 3000 });
                    this.isLoading = false;
                }
            },
            error: (err) => {
                console.error('Error checking phone', err);
                this.snackBar.open('เกิดข้อผิดพลาดในการตรวจสอบเบอร์โทร', 'ปิด', { duration: 3000 });
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
            // User is now signed in with Firebase
            const token = await this.authService.getFirebaseToken(result.user);

            // Navigate to Reset Password page with token
            // We can pass it via state or query param. State is safer.
            this.router.navigate(['/new-password'], { state: { token: token } });

        } catch (error: any) {
            console.error('Error verifying OTP', error);
            this.snackBar.open('Invalid OTP. Please try again.', 'Close', { duration: 3000 });
            this.isLoading = false;
        }
    }
}

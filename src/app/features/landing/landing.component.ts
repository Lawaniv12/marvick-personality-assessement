import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseService } from '../../core/services/firebase.service';
import { ToastrService } from 'ngx-toastr';
import { EmailValidationService } from '../../core/services/email-validation.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
 emailForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
   emailSuggestion = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private firebaseService: FirebaseService,
    private toastr: ToastrService,
    private emailValidator: EmailValidationService
  ) {
    this.emailForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      age: ['', [Validators.required, Validators.min(5), Validators.max(30)]],
      interests: [''], // Optional
      hobbies: [''], // Optional
      privacyConsent: [false, Validators.requiredTrue]
    });
  }

 async onSubmit() {
    if (this.emailForm.invalid) {
      this.toastr.error('Please fill in all required fields correctly', 'Form Error');
      return;
    }

    const formData = this.emailForm.value;

    // Advanced email validation
    const emailValidation = this.emailValidator.validateEmail(formData.email);
    
    if (!emailValidation.isValid) {
      this.toastr.error(emailValidation.error || 'Invalid email', 'Email Error');
      return;
    }

    // Show suggestion if there's a typo
    if (emailValidation.suggestion) {
      this.emailSuggestion = emailValidation.suggestion;
      this.toastr.info(
        `Did you mean ${emailValidation.suggestion}?`, 
        'Check your email',
        { timeOut: 5000 }
      );
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      // Check if email already exists
      const emailExists = await this.emailValidator.isEmailAlreadyUsed(
        formData.email, 
        this.firebaseService
      );

      if (emailExists) {
        this.toastr.warning(
          'This email has already taken the test. Continuing will overwrite previous results.',
          'Email Already Used',
          { timeOut: 5000 }
        );
      }
      
      // Save user data to Firebase
      await this.firebaseService.saveUser({
        name: formData.name,
        email: formData.email,
        age: formData.age,
        timestamp: new Date(),
        testCompleted: false
      });

      // Store email in session/local storage for later use
      sessionStorage.setItem('userEmail', formData.email);
      sessionStorage.setItem('userName', formData.name);
      sessionStorage.setItem('userAge', formData.age);

      // Success notification
      this.toastr.success(
        `Welcome ${formData.name}! Let's discover your personality 🌟`,
        'Ready to Start!',
        { timeOut: 2000 }
      );
      
      // Navigate to quiz after short delay
      setTimeout(() => {
        this.router.navigate(['/test']);
      }, 1500);

    } catch (error) {
      console.error('Error saving user:', error);
      this.toastr.error(
        'Unable to save your information. Please try again.',
        'Oops!',
        { timeOut: 4000 }
      );
    } finally {
      this.isSubmitting = false;
    }
  }

  get name() { return this.emailForm.get('name'); }
  get email() { return this.emailForm.get('email'); }
  get age() { return this.emailForm.get('age'); }
  get interests() { return this.emailForm.get('interests'); }
  get hobbies() { return this.emailForm.get('hobbies'); }
  get privacyConsent() { return this.emailForm.get('privacyConsent'); }
}
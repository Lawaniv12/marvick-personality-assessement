import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EmailValidationService {
    // List of disposable/temporary email domains to block
  private disposableEmailDomains = [
    'tempmail.com', 'guerrillamail.com', 'mailinator.com', 
    '10minutemail.com', 'throwaway.email', 'maildrop.cc',
    'yopmail.com', 'fakeinbox.com', 'trashmail.com',
    'getnada.com', 'temp-mail.org', 'discard.email'
  ];

   // List of common typos for popular email domains
  private commonTypos: { [key: string]: string } = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gmil.com': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'yaho.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'hotmal.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
    'outloo.com': 'outlook.com'
  };


  constructor(private http: HttpClient) {}
  /**
   * Comprehensive email validation
   */
  validateEmail(email: string): {
    isValid: boolean;
    error?: string;
    suggestion?: string;
  } {
    email = email.toLowerCase().trim();

    // 1. Basic format validation
    if (!this.isValidFormat(email)) {
      return {
        isValid: false,
        error: 'Please enter a valid email address'
      };
    }

    // 2. Check for disposable/temporary email
    if (this.isDisposableEmail(email)) {
      return {
        isValid: false,
        error: 'Temporary email addresses are not allowed. Please use a permanent email.'
      };
    }

    // 3. Check for common typos
    const suggestion = this.checkForTypos(email);
    if (suggestion) {
      return {
        isValid: true, // Still valid, but suggest correction
        suggestion: suggestion
      };
    }

    // 4. Additional checks
    if (!this.hasValidDomain(email)) {
      return {
        isValid: false,
        error: 'Email domain appears to be invalid'
      };
    }

    return { isValid: true };
  }

  /**
   * Basic email format validation (RFC 5322 compliant)
   */
  private isValidFormat(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  /**
   * Check if email is from a disposable email service
   */
  private isDisposableEmail(email: string): boolean {
    const domain = email.split('@')[1];
    return this.disposableEmailDomains.includes(domain);
  }

  /**
   * Check for common typos and suggest corrections
   */
  private checkForTypos(email: string): string | null {
    const domain = email.split('@')[1];
    const localPart = email.split('@')[0];

    if (this.commonTypos[domain]) {
      return `${localPart}@${this.commonTypos[domain]}`;
    }

    return null;
  }

  /**
   * Validate domain has proper structure
   */
  private hasValidDomain(email: string): boolean {
    const domain = email.split('@')[1];
    
    // Must have at least one dot
    if (!domain || !domain.includes('.')) {
      return false;
    }

    // Domain parts should not be empty
    const parts = domain.split('.');
    if (parts.some(part => part.length === 0)) {
      return false;
    }

    // TLD should be at least 2 characters
    const tld = parts[parts.length - 1];
    if (tld.length < 2) {
      return false;
    }

    return true;
  }

  /**
   * Verify email exists using email verification API (Optional - requires API)
   * You can use services like: https://www.abstractapi.com/email-verification-validation-api
   */
  async verifyEmailExists(email: string): Promise<boolean> {
    // This is optional and requires an API key from a service
    // For now, we'll skip this to avoid needing another API
    // But here's how you'd implement it:
    
    /*
    try {
      const apiKey = 'YOUR_API_KEY';
      const url = `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${email}`;
      const response: any = await firstValueFrom(this.http.get(url));
      
      return response.deliverability === 'DELIVERABLE';
    } catch (error) {
      console.error('Email verification failed:', error);
      return true; // Allow on error
    }
    */
    
    return true; // Skip for now
  }

  /**
   * Check if email is already in use (check Firebase)
   */
  async isEmailAlreadyUsed(email: string, firebaseService: any): Promise<boolean> {
    try {
      const exists = await firebaseService.checkEmailExists(email);
      return exists;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  }

  /**
   * Get email provider for display purposes
   */
  getEmailProvider(email: string): string {
    const domain = email.split('@')[1]?.toLowerCase();
    
    const providers: { [key: string]: string } = {
      'gmail.com': 'Gmail',
      'yahoo.com': 'Yahoo',
      'outlook.com': 'Outlook',
      'hotmail.com': 'Hotmail',
      'icloud.com': 'iCloud',
      'aol.com': 'AOL',
      'protonmail.com': 'ProtonMail'
    };

    return providers[domain] || 'Email';
  }
  
}

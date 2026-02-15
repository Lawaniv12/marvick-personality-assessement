import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PdfService } from './pdf.service';
import { PersonalityAnalysis } from './claude.service';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  
  // EmailJS credentials - get these from emailjs.com
  private readonly EMAILJS_SERVICE_ID = 'service_ctncm2g';
  private readonly EMAILJS_TEMPLATE_ID = 'template_znzk5dj';
  private readonly EMAILJS_PUBLIC_KEY = '1kl-hKC6UkDjIhls4';
  private readonly EMAILJS_API_URL = 'https://api.emailjs.com/api/v1.0/email/send';

  constructor(
    private http: HttpClient,
    private pdfService: PdfService
  ) {}

  /**
   * Send personality test results via email with PDF attachment
   */
  async sendResultsEmail(
    userEmail: string,
    userName: string,
    userAge: number,
    analysis: PersonalityAnalysis
  ): Promise<boolean> {
    
    try {
      // Generate PDF as base64
      const pdfBase64 = await this.pdfService.getPDFAsBase64(
        analysis,
        userName,
        userAge,
        userEmail
      );

      // Prepare email template parameters
      const templateParams = {
        to_email: userEmail,
        to_name: userName,
        personality_type: analysis.personalityType,
        description: analysis.description,
        summary: analysis.summary,
        top_strengths: analysis.strengths.slice(0, 3).join(', '),
        top_career: analysis.careerPaths[0].title,
        pdf_attachment: pdfBase64,
        pdf_filename: `${userName.replace(/\s+/g, '_')}_Personality_Profile.pdf`
      };

      // Send email via EmailJS
      const response = await this.sendEmailViaEmailJS(templateParams);

      console.log('Email sent successfully!', response);
      return true;

    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Send email using EmailJS API
   */
  private async sendEmailViaEmailJS(templateParams: any): Promise<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = {
      service_id: this.EMAILJS_SERVICE_ID,
      template_id: this.EMAILJS_TEMPLATE_ID,
      user_id: this.EMAILJS_PUBLIC_KEY,
      template_params: templateParams
    };

    return await firstValueFrom(
      this.http.post(this.EMAILJS_API_URL, body, { headers })
    );
  }

  /**
   * Send simple notification email (without PDF)
   */
  async sendNotificationEmail(
    userEmail: string,
    userName: string,
    personalityType: string
  ): Promise<boolean> {
    
    try {
      const templateParams = {
        to_email: userEmail,
        to_name: userName,
        personality_type: personalityType,
        message: `Your personality test results are ready! You are ${personalityType}.`
      };

      await this.sendEmailViaEmailJS(templateParams);
      return true;

    } catch (error) {
      console.error('Error sending notification email:', error);
      return false;
    }
  }

  /**
   * Add email to mailing list (save to Firebase for now)
   */
  async addToMailingList(
    email: string,
    name: string,
    interests?: string
  ): Promise<boolean> {
    try {
      // This will be saved to Firebase 'users' collection
      // which serves as your email list
      console.log('Email added to mailing list:', email);
      return true;
    } catch (error) {
      console.error('Error adding to mailing list:', error);
      return false;
    }
  }
}
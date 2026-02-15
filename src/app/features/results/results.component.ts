import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClaudeService, PersonalityAnalysis } from '../../core/services/claude.service';
import { FirebaseService } from '../../core/services/firebase.service';
import { PdfService } from '../../core/services/pdf.service';
import { EmailService } from '../../core/services/email.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})
export class ResultsComponent implements OnInit {
  analysis: PersonalityAnalysis | null = null;
  isAnalyzing = true;
  userName = '';
  userEmail = '';
  userAge = 0;
  errorMessage = '';
  
  isGeneratingPdf = false;
  isSendingEmail = false;
  emailSent = false;

  constructor(
    private router: Router,
    private claudeService: ClaudeService,
    private firebaseService: FirebaseService,
    private pdfService: PdfService,
    private emailService: EmailService,
    private toastr: ToastrService
  ) {}

  async ngOnInit() {
    // Debug: Check what's in sessionStorage
    console.log('=== Results Component Debug ===');
    console.log('userName:', sessionStorage.getItem('userName'));
    console.log('userEmail:', sessionStorage.getItem('userEmail'));
    console.log('userAge:', sessionStorage.getItem('userAge'));
    console.log('personalityScores:', sessionStorage.getItem('personalityScores'));
    console.log('userInterests:', sessionStorage.getItem('userInterests'));
    console.log('userHobbies:', sessionStorage.getItem('userHobbies'));
    console.log('==============================');

    // Get user info from session
    this.userName = sessionStorage.getItem('userName') || '';
    this.userEmail = sessionStorage.getItem('userEmail') || '';
    const ageStr = sessionStorage.getItem('userAge') || '18';
    this.userAge = parseInt(ageStr);

    // Redirect if no user data
    if (!this.userEmail) {
      console.error('❌ No userEmail found! Redirecting to landing...');
      this.router.navigate(['/']);
      return;
    }

    // Get quiz scores
    const scoresJson = sessionStorage.getItem('personalityScores');
    if (!scoresJson) {
      console.error('❌ No personalityScores found! Redirecting to quiz...');
      this.router.navigate(['/quiz']);
      return;
    }

    console.log('✅ All data found! Proceeding with analysis...');

    const scores = JSON.parse(scoresJson);

    // Get interests and hobbies
    const userInterests = sessionStorage.getItem('userInterests') || '';
    const userHobbies = sessionStorage.getItem('userHobbies') || '';

    // Analyze personality with Claude AI
    await this.analyzePersonality(scores, userInterests, userHobbies);
  }

  async analyzePersonality(
    scores: { [key: string]: number },
    interests: string,
    hobbies: string
  ) {
    this.isAnalyzing = true;
    this.errorMessage = '';

    try {
      // Call Claude AI service
      this.analysis = await this.claudeService.analyzePersonality(
        scores,
        this.userAge,
        this.userName,
        interests || undefined,
        hobbies || undefined
      );

      // Save results to Firebase
      await this.saveResults(scores);

      // Send results via email
      await this.sendEmailWithResults();

      this.isAnalyzing = false;

    } catch (error) {
      console.error('Error analyzing personality:', error);
      this.errorMessage = 'Something went wrong, but we still have your results!';
      this.isAnalyzing = false;
    }
  }

  async saveResults(scores: { [key: string]: number }) {
    try {
      await this.firebaseService.saveResults({
        email: this.userEmail,
        name: this.userName,
        age: this.userAge,
        scores: scores,
        analysis: this.analysis,
        timestamp: new Date()
      });

      console.log('Results saved to Firebase successfully!');
    } catch (error) {
      console.error('Error saving results to Firebase:', error);
      // Don't show error to user - results still work
    }
  }

  async downloadPDF() {
    if (!this.analysis) return;

    this.isGeneratingPdf = true;

    try {
      await this.pdfService.downloadPDF(
        this.analysis,
        this.userName,
        this.userAge,
        this.userEmail
      );

      this.toastr.success('PDF downloaded successfully! 📄', 'Download Complete');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.toastr.error('Failed to generate PDF. Please try again.', 'PDF Error');
    } finally {
      this.isGeneratingPdf = false;
    }
  }

  async sendEmailWithResults() {
    if (!this.analysis) return;

    this.isSendingEmail = true;

    try {
      const success = await this.emailService.sendResultsEmail(
        this.userEmail,
        this.userName,
        this.userAge,
        this.analysis
      );

      if (success) {
        this.emailSent = true;
        this.toastr.success(
          `Results sent to ${this.userEmail} 📧`,
          'Email Delivered!',
          { timeOut: 4000 }
        );
      } else {
        this.toastr.warning(
          'Email sending failed. You can still download the PDF.',
          'Email Issue',
          { timeOut: 4000 }
        );
      }

    } catch (error) {
      console.error('Error sending email:', error);
      this.toastr.warning(
        'Unable to send email. Download PDF instead.',
        'Email Failed'
      );
    } finally {
      this.isSendingEmail = false;
    }
  }

  retakeTest() {
    // Clear session data
    sessionStorage.clear();
    
    this.toastr.info('Starting fresh! Good luck! 🍀', 'Test Reset');
    
    // Navigate back to landing page
    this.router.navigate(['/']);
  }

  shareResults() {
    // Copy URL to clipboard
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      this.toastr.success(
        'Link copied! Share your personality type with friends 🎉',
        'Ready to Share!'
      );
    }).catch(() => {
      this.toastr.error('Could not copy link. Try manually: ' + url, 'Copy Failed');
    });
  }

  getTopThreeTraits(): string[] {
    if (!this.analysis) return [];
    return this.analysis.strengths.slice(0, 3);
  }

  getPrimaryCategory(scores: { [key: string]: number }): string {
    const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
    return sorted[0][0];
  }
}

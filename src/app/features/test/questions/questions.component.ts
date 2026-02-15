import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FirebaseService } from '../../../core/services/firebase.service';
import { QuizService } from '../../../core/services/quiz.service';


export interface Question {
  id: string;
  text: string;
  options: string[];
  category: string; // For personality scoring
}

export interface Answer {
  questionId: string;
  selectedOption: number;
  category: string;
}

@Component({
  selector: 'app-questions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './questions.component.html',
  styleUrl: './questions.component.scss'
})
export class QuestionsComponent {
  questions: Question[] = [];
  currentQuestionIndex = 0;
  answers: Answer[] = [];
  isLoading = true;
  userName = '';
  userEmail = '';
  isSubmitting = false;

  constructor(
    private router: Router,
    private firebaseService: FirebaseService,
    private quizService: QuizService
  ) {}

  async ngOnInit() {
    // Get user info from session
    this.userName = sessionStorage.getItem('userName') || '';
    this.userEmail = sessionStorage.getItem('userEmail') || '';

    // Redirect if no user info
    if (!this.userEmail) {
      this.router.navigate(['/']);
      return;
    }

    // Load questions
    try {
      this.questions = await this.quizService.getQuestions();
      this.isLoading = false;
    } catch (error) {
      console.error('Error loading questions:', error);
      alert('Failed to load questions. Please try again.');
      this.router.navigate(['/']);
    }
  }

  get currentQuestion(): Question | null {
    return this.questions[this.currentQuestionIndex] || null;
  }

  get progress(): number {
    return ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
  }

  get progressText(): string {
    return `${this.currentQuestionIndex + 1} of ${this.questions.length}`;
  }

  get canGoBack(): boolean {
    return this.currentQuestionIndex > 0;
  }

  get canGoNext(): boolean {
    return this.hasAnsweredCurrent();
  }

  get isLastQuestion(): boolean {
    return this.currentQuestionIndex === this.questions.length - 1;
  }

  hasAnsweredCurrent(): boolean {
    const currentAnswer = this.answers.find(
      a => a.questionId === this.currentQuestion?.id
    );
    return !!currentAnswer;
  }

  getCurrentAnswer(): number | null {
    const answer = this.answers.find(
      a => a.questionId === this.currentQuestion?.id
    );
    return answer ? answer.selectedOption : null;
  }

  selectOption(optionIndex: number) {
    if (!this.currentQuestion) return;

    // Remove existing answer for this question
    this.answers = this.answers.filter(
      a => a.questionId !== this.currentQuestion!.id
    );

    // Add new answer
    this.answers.push({
      questionId: this.currentQuestion.id,
      selectedOption: optionIndex,
      category: this.currentQuestion.category
    });
  }

  goBack() {
    if (this.canGoBack) {
      this.currentQuestionIndex--;
    }
  }

  goNext() {
    if (this.canGoNext && !this.isLastQuestion) {
      this.currentQuestionIndex++;
    } else if (this.isLastQuestion && this.canGoNext) {
      this.submitQuiz();
    }
  }

  async submitQuiz() {
    if (this.answers.length !== this.questions.length) {
      alert('Please answer all questions before submitting!');
      return;
    }

    this.isSubmitting = true;

    try {
      // Calculate personality scores
      const scores = this.calculateScores();
      console.log('=== Quiz Submit Debug ===');
      console.log('Calculated scores:', scores);

      // Save responses to Firebase
      await this.firebaseService.saveTestResponses({
        email: this.userEmail,
        answers: this.answers,
        scores: scores,
        timestamp: new Date(),
        completed: true
      });

      // Store scores for results page
      sessionStorage.setItem('personalityScores', JSON.stringify(scores));
      console.log('✅ Scores saved to sessionStorage');
      console.log('SessionStorage check:', sessionStorage.getItem('personalityScores'));
      console.log('UserEmail in session:', sessionStorage.getItem('userEmail'));

      // Navigate to results
      console.log('🚀 Navigating to /results...');
      this.router.navigate(['/results']);

    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz. Please try again.');
      this.isSubmitting = false;
    }
  }

  calculateScores(): { [key: string]: number } {
    const scores: { [key: string]: number } = {};

    // Count answers per category
    this.answers.forEach(answer => {
      if (!scores[answer.category]) {
        scores[answer.category] = 0;
      }
      scores[answer.category]++;
    });

    return scores;
  }

  getEncouragingMessage(): string {
    const messages = [
      "You're doing great! 🌟",
      "Keep going, superstar! ⭐",
      "Awesome job! 🎉",
      "You're amazing! 🚀",
      "Almost there! 💪",
      "Fantastic! 🎯"
    ];
    
    const index = Math.floor(this.currentQuestionIndex / 3) % messages.length;
    return messages[index];
  }
} 

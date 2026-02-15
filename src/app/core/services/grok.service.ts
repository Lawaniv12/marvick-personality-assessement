import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface PersonalityAnalysis {
  personalityType: string;
  description: string;
  strengths: string[];
  careerPaths: CareerRecommendation[];
  bookRecommendations: BookRecommendation[];
  courseRecommendations: CourseRecommendation[];
  summary: string;
}

export interface CareerRecommendation {
  title: string;
  description: string;
  whyGoodFit: string;
}

export interface BookRecommendation {
  title: string;
  author: string;
  reason: string;
}

export interface CourseRecommendation {
  title: string;
  platform: string;
  description: string;
  level: string;
}

@Injectable({
  providedIn: 'root'
})
export class AIAnalysisService {
  private readonly CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
  private readonly CLAUDE_API_KEY = ''; // Add your Claude API key here
  
  // Set to true to use fallback instead of API (for testing without API key)
  private readonly USE_FALLBACK_ONLY = true;

  constructor(private http: HttpClient) {}

  /**
   * Analyze personality based on quiz responses and generate recommendations
   */
  async analyzePersonality(
    scores: { [key: string]: number },
    userAge: number,
    userName: string
  ): Promise<PersonalityAnalysis> {
    
    // Calculate dominant personality traits
    const sortedScores = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .map(([category, score]) => ({ category, score }));

    const primaryTrait = sortedScores[0].category;
    const secondaryTrait = sortedScores[1]?.category || primaryTrait;

    // If using fallback mode or no API key, skip API call
    if (this.USE_FALLBACK_ONLY || !this.CLAUDE_API_KEY) {
      console.log('Using fallback analysis (no API call)');
      return this.getFallbackAnalysis(primaryTrait, secondaryTrait, userAge);
    }

    // Build the prompt for Claude
    const prompt = this.buildPrompt(scores, userAge, userName, primaryTrait, secondaryTrait);

    try {
      // Call Claude API
      const response = await this.callClaudeAPI(prompt);
      
      // Parse the response
      const analysis = this.parseClaudeResponse(response, primaryTrait, secondaryTrait);
      
      return analysis;

    } catch (error) {
      console.error('Error calling Claude API:', error);
      
      // Fallback to local analysis if API fails
      return this.getFallbackAnalysis(primaryTrait, secondaryTrait, userAge);
    }
  }

  /**
   * Build the prompt for Claude AI
   */
  private buildPrompt(
    scores: { [key: string]: number },
    userAge: number,
    userName: string,
    primaryTrait: string,
    secondaryTrait: string
  ): string {
    return `You are a professional career counselor and personality analyst. Analyze this personality test result and provide detailed, personalized recommendations.

USER PROFILE:
- Name: ${userName}
- Age: ${userAge}
- Personality Scores:
${Object.entries(scores).map(([cat, score]) => `  * ${cat}: ${score} points`).join('\n')}

PRIMARY TRAITS:
- Dominant: ${primaryTrait}
- Secondary: ${secondaryTrait}

Please provide a comprehensive analysis in the following JSON format (RESPOND ONLY WITH VALID JSON):

{
  "personalityType": "A catchy 2-3 word personality type name",
  "description": "A 2-3 sentence description of this personality type",
  "strengths": ["strength 1", "strength 2", "strength 3", "strength 4", "strength 5"],
  "careerPaths": [
    {
      "title": "Career title",
      "description": "What this career involves",
      "whyGoodFit": "Why this suits their personality"
    }
  ],
  "bookRecommendations": [
    {
      "title": "Book title",
      "author": "Author name",
      "reason": "Why this book is recommended"
    }
  ],
  "courseRecommendations": [
    {
      "title": "Course name",
      "platform": "Coursera/Udemy/Khan Academy/etc",
      "description": "What they'll learn",
      "level": "Beginner/Intermediate/Advanced"
    }
  ],
  "summary": "A motivating 2-3 sentence summary"
}

Include 5 items for each array (careers, books, courses). Tailor to age ${userAge}. Make it encouraging and specific to ${primaryTrait} and ${secondaryTrait} traits.`;
  }

  /**
   * Call the Claude API
   */
  private async callClaudeAPI(prompt: string): Promise<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-api-key': this.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    });

    const body = {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    const response = await firstValueFrom(
      this.http.post(this.CLAUDE_API_URL, body, { headers })
    );

    return response;
  }

  /**
   * Parse Claude's response
   */
  private parseClaudeResponse(response: any, primaryTrait: string, secondaryTrait: string): PersonalityAnalysis {
    try {
      // Extract the content from Claude's response
      const content = response.content[0].text;
      
      // Remove any markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/```\n?/g, '');
      }
      
      // Parse JSON
      const parsed = JSON.parse(cleanContent);
      
      return parsed as PersonalityAnalysis;

    } catch (error) {
      console.error('Error parsing Claude response:', error);
      console.log('Raw response:', response);
      
      // Return fallback if parsing fails
      return this.getFallbackAnalysis(primaryTrait, secondaryTrait, 18);
    }
  }

  /**
   * Fallback analysis if API fails or parsing fails
   */
  private getFallbackAnalysis(
    primaryTrait: string,
    secondaryTrait: string,
    userAge: number
  ): PersonalityAnalysis {
    
    const personalityTypes: { [key: string]: any } = {
      analytical: {
        type: 'The Logical Thinker',
        description: 'You have a natural talent for solving problems through careful analysis and logical reasoning. You enjoy understanding how things work and finding patterns.',
        strengths: [
          'Strong problem-solving abilities',
          'Attention to detail',
          'Logical and systematic thinking',
          'Good at research and analysis',
          'Strategic planning skills'
        ],
        careers: [
          { title: 'Software Developer', description: 'Create apps and software solutions', whyGoodFit: 'Your logical thinking helps you write efficient code and debug problems' },
          { title: 'Data Scientist', description: 'Analyze data to find insights', whyGoodFit: 'Your analytical skills help you spot patterns and trends in data' },
          { title: 'Engineer', description: 'Design and build systems', whyGoodFit: 'Your systematic approach helps you create effective solutions' },
          { title: 'Research Scientist', description: 'Conduct experiments and studies', whyGoodFit: 'Your attention to detail ensures accurate research results' },
          { title: 'Financial Analyst', description: 'Analyze financial data and trends', whyGoodFit: 'Your logical thinking helps you make sound financial recommendations' }
        ]
      },
      creative: {
        type: 'The Creative Innovator',
        description: 'You have a vibrant imagination and natural talent for creative expression. You see the world through a unique lens and love bringing new ideas to life.',
        strengths: [
          'Creative and imaginative thinking',
          'Artistic expression',
          'Innovation and original ideas',
          'Visual and aesthetic sense',
          'Storytelling ability'
        ],
        careers: [
          { title: 'Graphic Designer', description: 'Create visual designs and branding', whyGoodFit: 'Your artistic vision helps you create compelling visual stories' },
          { title: 'Content Creator', description: 'Produce videos, podcasts, or written content', whyGoodFit: 'Your creativity helps you engage audiences with unique content' },
          { title: 'UX/UI Designer', description: 'Design user-friendly digital experiences', whyGoodFit: 'Your creative problem-solving creates intuitive interfaces' },
          { title: 'Marketing Specialist', description: 'Develop creative campaigns', whyGoodFit: 'Your innovative ideas help brands stand out' },
          { title: 'Artist/Illustrator', description: 'Create original artwork', whyGoodFit: 'Your imagination brings unique visions to life' }
        ]
      },
      social: {
        type: 'The People Connector',
        description: 'You have exceptional people skills and thrive on meaningful connections. You understand emotions well and naturally bring people together.',
        strengths: [
          'Excellent communication skills',
          'Empathy and emotional intelligence',
          'Team collaboration',
          'Conflict resolution',
          'Building relationships'
        ],
        careers: [
          { title: 'Teacher/Educator', description: 'Help others learn and grow', whyGoodFit: 'Your people skills help you connect with and inspire students' },
          { title: 'Human Resources Manager', description: 'Support employees and build culture', whyGoodFit: 'Your empathy helps you understand and support team members' },
          { title: 'Social Worker', description: 'Help individuals and communities', whyGoodFit: 'Your caring nature drives positive change in people\'s lives' },
          { title: 'Sales Professional', description: 'Build client relationships', whyGoodFit: 'Your communication skills help you understand client needs' },
          { title: 'Counselor/Therapist', description: 'Guide people through challenges', whyGoodFit: 'Your empathy helps people feel heard and supported' }
        ]
      },
      active: {
        type: 'The Dynamic Achiever',
        description: 'You are energetic, hands-on, and love taking action. You learn best by doing and thrive in dynamic, fast-paced environments.',
        strengths: [
          'High energy and enthusiasm',
          'Hands-on learning style',
          'Physical coordination',
          'Quick decision-making',
          'Adaptability'
        ],
        careers: [
          { title: 'Entrepreneur', description: 'Start and run your own business', whyGoodFit: 'Your energy and quick thinking help you seize opportunities' },
          { title: 'Personal Trainer', description: 'Help others achieve fitness goals', whyGoodFit: 'Your active nature and enthusiasm inspire others' },
          { title: 'Event Coordinator', description: 'Plan and execute events', whyGoodFit: 'Your dynamic energy helps you handle fast-paced situations' },
          { title: 'Outdoor Guide', description: 'Lead adventure experiences', whyGoodFit: 'Your love of activity and quick thinking ensure safe adventures' },
          { title: 'Emergency Responder', description: 'Respond to urgent situations', whyGoodFit: 'Your quick reactions and energy help in critical moments' }
        ]
      },
      leader: {
        type: 'The Strategic Leader',
        description: 'You have natural leadership abilities and excel at organizing and motivating others. You see the big picture and know how to achieve goals.',
        strengths: [
          'Leadership and vision',
          'Strategic planning',
          'Decision-making confidence',
          'Goal-oriented mindset',
          'Organizational skills'
        ],
        careers: [
          { title: 'Project Manager', description: 'Lead teams to complete projects', whyGoodFit: 'Your organizational skills keep projects on track' },
          { title: 'Business Manager', description: 'Oversee business operations', whyGoodFit: 'Your strategic thinking drives business success' },
          { title: 'Team Lead', description: 'Guide and motivate team members', whyGoodFit: 'Your leadership inspires team performance' },
          { title: 'Consultant', description: 'Advise organizations on strategy', whyGoodFit: 'Your vision helps organizations improve' },
          { title: 'Operations Director', description: 'Manage organizational systems', whyGoodFit: 'Your planning skills optimize efficiency' }
        ]
      }
    };

    const primaryData = personalityTypes[primaryTrait] || personalityTypes['analytical'];

    return {
      personalityType: primaryData.type,
      description: primaryData.description,
      strengths: primaryData.strengths,
      careerPaths: primaryData.careers,
      bookRecommendations: this.getDefaultBooks(primaryTrait, userAge),
      courseRecommendations: this.getDefaultCourses(primaryTrait),
      summary: `You have incredible potential! Your ${primaryTrait} nature combined with your ${secondaryTrait} traits make you well-suited for many exciting paths. Focus on developing your strengths while exploring new opportunities that align with your personality.`
    };
  }

  /**
   * Get default book recommendations
   */
  private getDefaultBooks(trait: string, age: number): BookRecommendation[] {
    const books: { [key: string]: BookRecommendation[] } = {
      analytical: [
        { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', reason: 'Explores how we think and make decisions' },
        { title: 'The Martian', author: 'Andy Weir', reason: 'Problem-solving adventure in space' },
        { title: 'Sapiens', author: 'Yuval Noah Harari', reason: 'Analytical look at human history' },
        { title: 'Algorithms to Live By', author: 'Brian Christian', reason: 'Apply computer science to daily life' },
        { title: 'Factfulness', author: 'Hans Rosling', reason: 'Data-driven thinking about the world' }
      ],
      creative: [
        { title: 'The War of Art', author: 'Steven Pressfield', reason: 'Overcome creative blocks' },
        { title: 'Big Magic', author: 'Elizabeth Gilbert', reason: 'Embrace creative living' },
        { title: 'Steal Like an Artist', author: 'Austin Kleon', reason: 'Unlock your creative potential' },
        { title: 'The Artist\'s Way', author: 'Julia Cameron', reason: 'Discover and recover your creative self' },
        { title: 'Creative Confidence', author: 'Tom Kelley', reason: 'Build confidence in your creativity' }
      ],
      social: [
        { title: 'How to Win Friends', author: 'Dale Carnegie', reason: 'Master interpersonal skills' },
        { title: 'Emotional Intelligence', author: 'Daniel Goleman', reason: 'Understand and manage emotions' },
        { title: 'The 5 Love Languages', author: 'Gary Chapman', reason: 'Improve relationships' },
        { title: 'Crucial Conversations', author: 'Kerry Patterson', reason: 'Navigate difficult discussions' },
        { title: 'Dare to Lead', author: 'Brené Brown', reason: 'Lead with empathy and courage' }
      ],
      active: [
        { title: 'Atomic Habits', author: 'James Clear', reason: 'Build better habits through action' },
        { title: 'Can\'t Hurt Me', author: 'David Goggins', reason: 'Push past your limits' },
        { title: 'The Obstacle Is the Way', author: 'Ryan Holiday', reason: 'Turn challenges into opportunities' },
        { title: 'Grit', author: 'Angela Duckworth', reason: 'Power of passion and perseverance' },
        { title: 'Deep Work', author: 'Cal Newport', reason: 'Master focused productivity' }
      ],
      leader: [
        { title: 'Start With Why', author: 'Simon Sinek', reason: 'Inspire leadership through purpose' },
        { title: 'The 7 Habits', author: 'Stephen Covey', reason: 'Principles of effective people' },
        { title: 'Good to Great', author: 'Jim Collins', reason: 'What makes companies excel' },
        { title: 'Extreme Ownership', author: 'Jocko Willink', reason: 'Take responsibility as a leader' },
        { title: 'Leaders Eat Last', author: 'Simon Sinek', reason: 'Build trust in teams' }
      ]
    };

    return books[trait] || books['analytical'];
  }

  /**
   * Get default course recommendations
   */
  private getDefaultCourses(trait: string): CourseRecommendation[] {
    const courses: { [key: string]: CourseRecommendation[] } = {
      analytical: [
        { title: 'Introduction to Computer Science', platform: 'Harvard CS50 (edX)', description: 'Learn programming and problem-solving', level: 'Beginner' },
        { title: 'Data Science Fundamentals', platform: 'Coursera', description: 'Analyze data and find insights', level: 'Beginner' },
        { title: 'Critical Thinking Skills', platform: 'Udemy', description: 'Improve logical reasoning', level: 'Beginner' },
        { title: 'Machine Learning', platform: 'Coursera (Andrew Ng)', description: 'AI and predictive modeling', level: 'Intermediate' },
        { title: 'Mathematics for ML', platform: 'Khan Academy', description: 'Math foundations for data science', level: 'Intermediate' }
      ],
      creative: [
        { title: 'Graphic Design Basics', platform: 'Canva Design School', description: 'Master visual design principles', level: 'Beginner' },
        { title: 'Digital Photography', platform: 'Udemy', description: 'Capture and edit stunning photos', level: 'Beginner' },
        { title: 'Creative Writing', platform: 'MasterClass', description: 'Storytelling and narrative techniques', level: 'Beginner' },
        { title: 'UI/UX Design', platform: 'Coursera (Google)', description: 'Design user-friendly experiences', level: 'Intermediate' },
        { title: 'Video Production', platform: 'LinkedIn Learning', description: 'Create compelling video content', level: 'Intermediate' }
      ],
      social: [
        { title: 'Effective Communication', platform: 'Coursera', description: 'Master interpersonal skills', level: 'Beginner' },
        { title: 'Emotional Intelligence', platform: 'Udemy', description: 'Understand and manage emotions', level: 'Beginner' },
        { title: 'Leadership Skills', platform: 'LinkedIn Learning', description: 'Lead and inspire teams', level: 'Intermediate' },
        { title: 'Public Speaking', platform: 'Toastmasters/Udemy', description: 'Speak confidently to audiences', level: 'Beginner' },
        { title: 'Conflict Resolution', platform: 'Coursera', description: 'Navigate difficult conversations', level: 'Intermediate' }
      ],
      active: [
        { title: 'Entrepreneurship Basics', platform: 'Coursera', description: 'Start your own venture', level: 'Beginner' },
        { title: 'Project Management', platform: 'Google Career Certificates', description: 'Manage projects effectively', level: 'Beginner' },
        { title: 'Digital Marketing', platform: 'HubSpot Academy', description: 'Market products and services', level: 'Beginner' },
        { title: 'Fitness & Nutrition', platform: 'Precision Nutrition', description: 'Health and wellness coaching', level: 'Beginner' },
        { title: 'Productivity Mastery', platform: 'Udemy', description: 'Get more done efficiently', level: 'Beginner' }
      ],
      leader: [
        { title: 'Strategic Leadership', platform: 'Coursera', description: 'Lead organizations effectively', level: 'Intermediate' },
        { title: 'Business Strategy', platform: 'Harvard Business School Online', description: 'Develop winning strategies', level: 'Intermediate' },
        { title: 'Team Management', platform: 'LinkedIn Learning', description: 'Build and lead high-performing teams', level: 'Beginner' },
        { title: 'Financial Planning', platform: 'Coursera', description: 'Manage business finances', level: 'Intermediate' },
        { title: 'Change Management', platform: 'Udemy', description: 'Lead organizational transformation', level: 'Advanced' }
      ]
    };

    return courses[trait] || courses['analytical'];
  }
}
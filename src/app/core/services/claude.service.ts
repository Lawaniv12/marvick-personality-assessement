import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
export class ClaudeService {

  constructor(private http: HttpClient) {}

  /**
   * Analyze personality by calling Vercel serverless function
   */
  async analyzePersonality(
    scores: { [key: string]: number },
    userAge: number,
    userName: string,
    userInterests?: string,
    userHobbies?: string
  ): Promise<PersonalityAnalysis> {
    
    const sortedScores = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .map(([category, score]) => ({ category, score }));

    const primaryTrait = sortedScores[0].category;
    const secondaryTrait = sortedScores[1]?.category || primaryTrait;

    try {
      // Call Vercel serverless function (NOT Claude API directly!)
      const response = await firstValueFrom(
        this.http.post<PersonalityAnalysis>(
          '/api/analyze', // This calls your Vercel serverless function
          {
            scores,
            age: userAge,
            name: userName,
            interests: userInterests,
            hobbies: userHobbies
          }
        )
      );

      console.log('Claude AI analysis received from Vercel!');
      return response;

    } catch (error) {
      console.error('Error calling analysis API:', error);
      console.log('Using fallback analysis (pre-built recommendations)');
      return this.getFallbackAnalysis(primaryTrait, secondaryTrait, userAge, userInterests, userHobbies);
    }
  }

  /**
   * Fallback analysis when API fails
   */
  private getFallbackAnalysis(
    primaryTrait: string,
    secondaryTrait: string,
    userAge: number,
    userInterests?: string,
    userHobbies?: string
  ): PersonalityAnalysis {
    
    const types: any = {
      analytical: {
        type: 'The Logical Innovator',
        description: 'You have a brilliant analytical mind that excels at solving complex problems systematically. Your ability to see patterns and think strategically makes you a natural problem-solver who can turn chaos into clarity.',
        strengths: [
          'Exceptional analytical and logical reasoning',
          'Strategic problem-solving abilities',
          'Detail-oriented with high accuracy',
          'Data-driven decision making',
          'Pattern recognition and systems thinking'
        ],
        careers: [
          { title: 'Machine Learning Engineer', description: 'Build AI systems that learn and improve', whyGoodFit: 'Your analytical skills help you design algorithms that solve real-world problems' },
          { title: 'Product Analyst', description: 'Use data to guide product decisions', whyGoodFit: 'Your logical thinking translates user behavior into actionable insights' },
          { title: 'Cybersecurity Specialist', description: 'Protect systems from threats', whyGoodFit: 'Your problem-solving mindset helps you think like both defender and attacker' },
          { title: 'Quantitative Researcher', description: 'Develop mathematical models for finance or science', whyGoodFit: 'Your analytical rigor helps you create predictive models' },
          { title: 'Data Engineer', description: 'Build infrastructure for data-driven companies', whyGoodFit: 'Your systematic thinking creates efficient, scalable data pipelines' }
        ]
      },
      creative: {
        type: 'The Creative Catalyst',
        description: 'You possess a vibrant imagination that transforms ordinary into extraordinary. Your creative vision and innovative thinking allow you to see possibilities others miss, making you a natural innovator in any field you pursue.',
        strengths: [
          'Innovative and original thinking',
          'Strong visual and aesthetic sensibility',
          'Creative problem-solving approach',
          'Storytelling and narrative abilities',
          'Ability to inspire and engage others'
        ],
        careers: [
          { title: 'Creative Technologist', description: 'Blend code and creativity to build experiences', whyGoodFit: 'Your imagination paired with technical skills creates magical digital experiences' },
          { title: 'Brand Strategist', description: 'Shape how companies tell their stories', whyGoodFit: 'Your creative vision helps brands connect emotionally with audiences' },
          { title: 'Experience Designer', description: 'Design immersive physical or digital experiences', whyGoodFit: 'Your imagination creates memorable moments for users' },
          { title: 'Creative Director', description: 'Lead creative vision for projects and teams', whyGoodFit: 'Your innovative thinking inspires teams to push boundaries' },
          { title: 'Innovation Consultant', description: 'Help companies think differently', whyGoodFit: 'Your creative approaches unlock new possibilities for organizations' }
        ]
      },
      social: {
        type: 'The Empathetic Leader',
        description: 'You have an extraordinary ability to understand and connect with people on a deep level. Your emotional intelligence and genuine care for others make you someone people naturally trust and turn to for guidance.',
        strengths: [
          'Exceptional emotional intelligence',
          'Natural relationship building',
          'Effective communication across contexts',
          'Conflict resolution and mediation',
          'Ability to inspire and motivate others'
        ],
        careers: [
          { title: 'Organizational Psychologist', description: 'Improve workplace culture and performance', whyGoodFit: 'Your people skills help organizations unlock human potential' },
          { title: 'Talent Partner', description: 'Build teams and develop people', whyGoodFit: 'Your empathy helps you match people to roles where they thrive' },
          { title: 'Product Researcher', description: 'Understand user needs through qualitative research', whyGoodFit: 'Your connection with people uncovers insights others miss' },
          { title: 'Change Management Consultant', description: 'Guide organizations through transformation', whyGoodFit: 'Your people skills help teams navigate uncertainty' },
          { title: 'Executive Coach', description: 'Develop leadership capabilities in others', whyGoodFit: 'Your empathy and insight help leaders grow' }
        ]
      },
      active: {
        type: 'The Dynamic Builder',
        description: 'You are energized by action and thrive when turning ideas into reality. Your bias toward execution and comfort with ambiguity make you someone who ships, iterates, and improves while others are still planning.',
        strengths: [
          'Bias toward action and execution',
          'Comfort with ambiguity and change',
          'Quick learning through experimentation',
          'High energy and enthusiasm',
          'Resilience and adaptability'
        ],
        careers: [
          { title: 'Founder/Entrepreneur', description: 'Build companies from zero to one', whyGoodFit: 'Your action-orientation helps you ship products and iterate based on feedback' },
          { title: 'Growth Product Manager', description: 'Drive rapid product experimentation', whyGoodFit: 'Your energy and execution speed help you test ideas quickly' },
          { title: 'Venture Builder', description: 'Launch new ventures within organizations', whyGoodFit: 'Your hands-on approach brings concepts to market fast' },
          { title: 'Startup Operations Lead', description: 'Build systems in fast-growing companies', whyGoodFit: 'Your adaptability helps you tackle diverse challenges' },
          { title: 'Performance Marketing Manager', description: 'Drive growth through rapid testing', whyGoodFit: 'Your action bias enables quick experimentation cycles' }
        ]
      },
      leader: {
        type: 'The Visionary Architect',
        description: 'You have a natural ability to see the big picture while managing complex details. Your strategic thinking combined with your ability to inspire others makes you someone who can envision ambitious futures and rally people to build them.',
        strengths: [
          'Strategic vision and planning',
          'Ability to align teams around goals',
          'Confident decision-making',
          'Systems-level thinking',
          'Inspiring and motivating others'
        ],
        careers: [
          { title: 'Head of Strategy', description: 'Define and execute company direction', whyGoodFit: 'Your strategic thinking helps organizations win in their markets' },
          { title: 'Platform Product Lead', description: 'Build products that enable ecosystems', whyGoodFit: 'Your vision helps you see how pieces connect into powerful platforms' },
          { title: 'Chief of Staff', description: 'Partner with executives on key initiatives', whyGoodFit: 'Your strategic mind and organizational skills drive impact' },
          { title: 'Investment Partner', description: 'Evaluate and support portfolio companies', whyGoodFit: 'Your ability to see potential helps you pick winners' },
          { title: 'General Manager', description: 'Run a business unit or product line', whyGoodFit: 'Your leadership and strategic skills drive business results' }
        ]
      }
    };

    const data = types[primaryTrait] || types.analytical;

    return {
      personalityType: data.type,
      description: data.description,
      strengths: data.strengths,
      careerPaths: data.careers,
      bookRecommendations: this.getBooks(primaryTrait),
      courseRecommendations: this.getCourses(primaryTrait),
      summary: `Your ${primaryTrait} nature combined with ${secondaryTrait} traits creates a unique advantage. You have the potential to make a real impact by leaning into your natural strengths while continuing to grow. The opportunities ahead are vast - focus on what energizes you and the rest will follow.`
    };
  }

  private getBooks(trait: string): BookRecommendation[] {
    const books: any = {
      analytical: [
        { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', reason: 'Understand the dual systems that drive how we think and make decisions' },
        { title: 'Range', author: 'David Epstein', reason: 'Learn why generalists triumph in a specialized world' },
        { title: 'The Mom Test', author: 'Rob Fitzpatrick', reason: 'Master asking the right questions to validate ideas' },
        { title: 'Algorithms to Live By', author: 'Brian Christian', reason: 'Apply computer science to everyday decisions' },
        { title: 'Superforecasting', author: 'Philip Tetlock', reason: 'Improve your ability to predict future events' }
      ],
      creative: [
        { title: 'The Creative Act', author: 'Rick Rubin', reason: 'Timeless wisdom on creativity from a legendary producer' },
        { title: 'Show Your Work', author: 'Austin Kleon', reason: 'Build an audience by sharing your creative process' },
        { title: 'The Practice', author: 'Seth Godin', reason: 'Make creativity a daily habit, not a lightning strike' },
        { title: 'Bird by Bird', author: 'Anne Lamott', reason: 'Practical guidance on the creative writing process' },
        { title: 'Creative Confidence', author: 'Tom & David Kelley', reason: 'Unlock your creative potential in any field' }
      ],
      social: [
        { title: 'Never Split the Difference', author: 'Chris Voss', reason: 'Master negotiation through tactical empathy' },
        { title: 'The Culture Map', author: 'Erin Meyer', reason: 'Navigate cultural differences in global teams' },
        { title: 'Radical Candor', author: 'Kim Scott', reason: 'Give feedback that helps people grow' },
        { title: 'Thanks for the Feedback', author: 'Douglas Stone', reason: 'Learn to receive feedback effectively' },
        { title: 'Dare to Lead', author: 'Brené Brown', reason: 'Lead with vulnerability and courage' }
      ],
      active: [
        { title: 'The Lean Startup', author: 'Eric Ries', reason: 'Build products through rapid experimentation' },
        { title: 'Sprint', author: 'Jake Knapp', reason: 'Solve big problems in just five days' },
        { title: 'Traction', author: 'Gabriel Weinberg', reason: 'Get real customers through systematic testing' },
        { title: 'The Mom Test', author: 'Rob Fitzpatrick', reason: 'Validate ideas through customer conversations' },
        { title: 'Amp It Up', author: 'Frank Slootman', reason: 'Drive execution and results at high speed' }
      ],
      leader: [
        { title: 'Good Strategy Bad Strategy', author: 'Richard Rumelt', reason: 'Master strategic thinking and planning' },
        { title: 'High Output Management', author: 'Andy Grove', reason: 'Practical frameworks for effective management' },
        { title: 'The Hard Thing About Hard Things', author: 'Ben Horowitz', reason: 'Real talk about building and leading companies' },
        { title: 'Amp It Up', author: 'Frank Slootman', reason: 'Drive execution at the highest levels' },
        { title: 'Measure What Matters', author: 'John Doerr', reason: 'Set and achieve ambitious goals with OKRs' }
      ]
    };
    return books[trait] || books.analytical;
  }

  private getCourses(trait: string): CourseRecommendation[] {
    const courses: any = {
      analytical: [
        { title: 'CS50', platform: 'Harvard (edX)', description: 'Learn computational thinking through programming', level: 'Beginner' },
        { title: 'Machine Learning', platform: 'Andrew Ng (Coursera)', description: 'Build intelligent systems', level: 'Intermediate' },
        { title: 'SQL for Data Science', platform: 'UC Davis (Coursera)', description: 'Query and analyze data', level: 'Beginner' },
        { title: 'Deep Learning Specialization', platform: 'deeplearning.ai', description: 'Master neural networks and AI', level: 'Advanced' },
        { title: 'Data Structures & Algorithms', platform: 'Princeton (Coursera)', description: 'Master fundamental CS concepts', level: 'Intermediate' }
      ],
      creative: [
        { title: 'Design Thinking', platform: 'IDEO U', description: 'Solve problems through human-centered design', level: 'Beginner' },
        { title: 'Creative Coding', platform: 'Processing Foundation', description: 'Create art and experiences with code', level: 'Beginner' },
        { title: 'Storytelling & Influence', platform: 'MasterClass', description: 'Craft narratives that move people', level: 'Intermediate' },
        { title: 'Brand Strategy', platform: 'Futur Academy', description: 'Build brands that resonate', level: 'Intermediate' },
        { title: 'Service Design', platform: 'Interaction Design Foundation', description: 'Design end-to-end experiences', level: 'Advanced' }
      ],
      social: [
        { title: 'Organizational Leadership', platform: 'Northwestern (Coursera)', description: 'Lead teams effectively', level: 'Intermediate' },
        { title: 'The Science of Well-Being', platform: 'Yale (Coursera)', description: 'Understand human flourishing', level: 'Beginner' },
        { title: 'Coaching Skills', platform: 'UC Davis (Coursera)', description: 'Develop people through coaching', level: 'Intermediate' },
        { title: 'User Research', platform: 'Interaction Design Foundation', description: 'Understand users deeply', level: 'Intermediate' },
        { title: 'Crucial Conversations', platform: 'VitalSmarts', description: 'Navigate difficult discussions', level: 'Beginner' }
      ],
      active: [
        { title: 'How to Build a Startup', platform: 'Steve Blank (Udacity)', description: 'Launch and validate new ventures', level: 'Intermediate' },
        { title: 'Product Management', platform: 'Product School', description: 'Ship products customers love', level: 'Beginner' },
        { title: 'Growth Hacking', platform: 'Reforge', description: 'Drive rapid, scalable growth', level: 'Advanced' },
        { title: 'Agile Development', platform: 'University of Virginia (Coursera)', description: 'Build iteratively with feedback', level: 'Beginner' },
        { title: 'Performance Marketing', platform: 'CXL Institute', description: 'Run profitable marketing campaigns', level: 'Intermediate' }
      ],
      leader: [
        { title: 'Strategic Leadership', platform: 'Harvard Business School Online', description: 'Lead organizations effectively', level: 'Advanced' },
        { title: 'Platform Strategy', platform: 'MIT (edX)', description: 'Build network-effect businesses', level: 'Advanced' },
        { title: 'Business Strategy', platform: 'Darden (Coursera)', description: 'Develop competitive advantage', level: 'Intermediate' },
        { title: 'Financial Management', platform: 'Wharton (Coursera)', description: 'Make data-driven financial decisions', level: 'Intermediate' },
        { title: 'Leading Teams', platform: 'University of Michigan (Coursera)', description: 'Build high-performing teams', level: 'Intermediate' }
      ]
    };
    return courses[trait] || courses.analytical;
  }
}
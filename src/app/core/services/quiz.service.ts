import { Injectable } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';

export interface Question {
  id: string;
  text: string;
  options: string[];
  category: string;
}

@Injectable({
  providedIn: 'root'
})
export class QuizService {

  // Default questions (will try to load from Firebase first)
  private defaultQuestions: Question[] = [
    // Analytical/Logical
    {
      id: 'q1',
      text: 'When solving a puzzle, what do you prefer?',
      options: [
        'Finding patterns and solving it step by step',
        'Trying different creative solutions',
        'Working with friends to solve it together',
        'Using my imagination to think outside the box'
      ],
      category: 'analytical'
    },
    {
      id: 'q2',
      text: 'How do you like to learn new things?',
      options: [
        'Reading books and researching facts',
        'Drawing, painting, or making things',
        'Talking and sharing ideas with others',
        'Moving around and trying hands-on activities'
      ],
      category: 'analytical'
    },
    
    // Creative/Artistic
    {
      id: 'q3',
      text: 'What sounds most fun to you?',
      options: [
        'Building something with blocks or coding',
        'Creating art, music, or stories',
        'Playing games with friends',
        'Exploring nature or trying new sports'
      ],
      category: 'creative'
    },
    {
      id: 'q4',
      text: 'When you have free time, you like to:',
      options: [
        'Play strategy games or solve riddles',
        'Draw, write, or make crafts',
        'Chat with friends or help others',
        'Play outside or dance to music'
      ],
      category: 'creative'
    },
    {
      id: 'q5',
      text: 'If you could design your dream room, it would have:',
      options: [
        'A computer, books, and science experiments',
        'Art supplies, musical instruments, and colorful decorations',
        'Space for friends to hang out and play games',
        'Sports equipment and lots of room to move'
      ],
      category: 'creative'
    },

    // Social/People-Oriented
    {
      id: 'q6',
      text: 'At school, you most enjoy:',
      options: [
        'Math, science, or computer class',
        'Art, music, or drama class',
        'Group projects and presentations',
        'PE, recess, or field trips'
      ],
      category: 'social'
    },
    {
      id: 'q7',
      text: 'When a friend is sad, you:',
      options: [
        'Try to solve their problem logically',
        'Make them a card or drawing',
        'Talk to them and listen carefully',
        'Suggest doing something fun together'
      ],
      category: 'social'
    },
    {
      id: 'q8',
      text: 'Which superpower would you choose?',
      options: [
        'Super intelligence',
        'Ability to create anything I imagine',
        'Reading minds and understanding feelings',
        'Super speed and strength'
      ],
      category: 'social'
    },

    // Active/Kinesthetic
    {
      id: 'q9',
      text: 'Your perfect day would include:',
      options: [
        'Learning something new and interesting',
        'Creating a masterpiece',
        'Hanging out with lots of friends',
        'Being active and adventurous'
      ],
      category: 'active'
    },
    {
      id: 'q10',
      text: 'You learn best when you can:',
      options: [
        'See charts, diagrams, and explanations',
        'Use my imagination and creativity',
        'Discuss and share with others',
        'Touch, build, and do things myself'
      ],
      category: 'active'
    },

    // Leader/Organizer
    {
      id: 'q11',
      text: 'In group activities, you usually:',
      options: [
        'Come up with the plan and strategy',
        'Add creative ideas and make it fun',
        'Make sure everyone feels included',
        'Lead the action and keep things moving'
      ],
      category: 'leader'
    },
    {
      id: 'q12',
      text: 'What motivates you most?',
      options: [
        'Solving difficult challenges',
        'Making something beautiful or unique',
        'Helping others and making friends',
        'Winning and achieving goals'
      ],
      category: 'leader'
    },

    // Curious/Investigative
    {
      id: 'q13',
      text: 'You prefer stories that are:',
      options: [
        'Mysteries or science fiction',
        'Fantasy or adventure',
        'About friendships and feelings',
        'Action-packed and exciting'
      ],
      category: 'analytical'
    },
    {
      id: 'q14',
      text: 'When you see something new, you:',
      options: [
        'Want to know how it works',
        'Imagine all the cool things you could do with it',
        'Wonder who made it and why',
        'Want to try it out right away'
      ],
      category: 'analytical'
    },

    // Expressive/Communicator
    {
      id: 'q15',
      text: 'You express yourself best through:',
      options: [
        'Writing or explaining things clearly',
        'Art, music, or performance',
        'Talking and sharing stories',
        'Actions and demonstrations'
      ],
      category: 'creative'
    },
    {
      id: 'q16',
      text: 'What would you like to be famous for?',
      options: [
        'An amazing invention or discovery',
        'Creating beautiful art or entertainment',
        'Helping lots of people',
        'Achieving something incredible'
      ],
      category: 'leader'
    },

    // Collaborative
    {
      id: 'q17',
      text: 'You prefer to work:',
      options: [
        'Alone, so I can focus deeply',
        'Alone, but sharing my work with others',
        'With a partner or small group',
        'In a big team with lots of energy'
      ],
      category: 'social'
    },
    {
      id: 'q18',
      text: 'What makes you happiest?',
      options: [
        'Understanding something complex',
        'Creating something from my imagination',
        'Making others smile',
        'Accomplishing a challenging task'
      ],
      category: 'social'
    },

    // Adventurous/Explorer
    {
      id: 'q19',
      text: 'Your ideal vacation would be:',
      options: [
        'Visiting museums and historical sites',
        'Going to art galleries and concerts',
        'Beach or theme park with friends',
        'Camping, hiking, or exploring new places'
      ],
      category: 'active'
    },
    {
      id: 'q20',
      text: 'Which describes you best?',
      options: [
        'Thoughtful and logical',
        'Creative and imaginative',
        'Friendly and caring',
        'Energetic and brave'
      ],
      category: 'active'
    }
  ];

  constructor(private firestore: Firestore) {}

  /**
   * Get questions from Firebase or use defaults
   */
  async getQuestions(): Promise<Question[]> {
    try {
      // Try to load from Firebase
      const questionsRef = collection(this.firestore, 'questions');
      const querySnapshot = await getDocs(questionsRef);

      if (!querySnapshot.empty) {
        const questions: Question[] = [];
        querySnapshot.forEach(doc => {
          questions.push(doc.data() as Question);
        });
        
        // Sort by id to maintain order
        questions.sort((a, b) => a.id.localeCompare(b.id));
        
        console.log('Loaded questions from Firebase:', questions.length);
        return questions;
      }
    } catch (error) {
      console.error('Error loading questions from Firebase:', error);
    }

    // Fallback to default questions
    console.log('Using default questions');
    return this.defaultQuestions;
  }

  /**
   * Upload default questions to Firebase (call this once to populate)
   */
  async uploadDefaultQuestions(): Promise<void> {
    try {
      const { addDoc } = await import('@angular/fire/firestore');
      const questionsRef = collection(this.firestore, 'questions');

      for (const question of this.defaultQuestions) {
        await addDoc(questionsRef, question);
      }

      console.log('Default questions uploaded successfully!');
    } catch (error) {
      console.error('Error uploading questions:', error);
      throw error;
    }
  }
}
import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where } from '@angular/fire/firestore';

export interface User {
  name: string;
  email: string;
  age: number;
  timestamp: Date;
  testCompleted: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  
  constructor(private firestore: Firestore) {}

 /**
   * Save user information to Firestore
   */
  async saveUser(userData: User): Promise<string> {
  try {
    // Check if email already exists
    console.log('Checking if email exists:', userData.email);
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('email', '==', userData.email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      console.log('User already exists with ID:', querySnapshot.docs[0].id);
      return querySnapshot.docs[0].id;
    }

    // Add new user
    const docRef = await addDoc(usersRef, {
      ...userData,
      timestamp: new Date()
    });

    console.log('User saved with ID:', docRef.id);
    return docRef.id;

  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
}

  /**
   * Check if user email already exists
   */
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const usersRef = collection(this.firestore, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<any> {
    try {
      const usersRef = collection(this.firestore, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const userData = querySnapshot.docs[0].data();
      return {
        id: querySnapshot.docs[0].id,
        ...userData
      };
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  /**
   * Save test responses to Firestore
   */
  async saveTestResponses(responseData: any): Promise<string> {
    try {
      const responsesRef = collection(this.firestore, 'test_responses');
      const docRef = await addDoc(responsesRef, {
        ...responseData,
        timestamp: new Date()
      });

      console.log('Test responses saved with ID:', docRef.id);
      return docRef.id;

    } catch (error) {
      console.error('Error saving test responses:', error);
      throw error;
    }
  }

  /**
   * Save personality results to Firestore
   */
  async saveResults(resultsData: any): Promise<string> {
    try {
      const resultsRef = collection(this.firestore, 'results');
      const docRef = await addDoc(resultsRef, {
        ...resultsData,
        timestamp: new Date()
      });

      console.log('Results saved with ID:', docRef.id);
      return docRef.id;

    } catch (error) {
      console.error('Error saving results:', error);
      throw error;
    }
  }
}
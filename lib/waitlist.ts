import { db } from './firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

export interface WaitlistEntry {
  email: string;
  timestamp: Timestamp | ReturnType<typeof serverTimestamp>;
  source?: string;
  useCase?: string;
  timezone?: string;
}

// Add email to waitlist
export const addToWaitlist = async (email: string, source = 'landing_page', useCase?: string): Promise<void> => {
  try {
    // Get timezone (useful for knowing where users are from)
    let timezone: string | undefined;
    if (typeof window !== 'undefined') {
      try {
        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch (error) {
        console.log('Could not get timezone:', error);
      }
    }
    
    // Add new entry
    const waitlistRef = collection(db, 'waitlist');
    const docData: WaitlistEntry = {
      email: email.toLowerCase(),
      timestamp: serverTimestamp(),
      source
    };

    // Only add optional fields if they have values
    if (useCase && useCase.trim()) {
      docData.useCase = useCase.trim();
    }
    if (timezone) {
      docData.timezone = timezone;
    }

    await addDoc(waitlistRef, docData);
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    throw error;
  }
};


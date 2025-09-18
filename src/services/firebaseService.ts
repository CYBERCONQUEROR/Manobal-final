import { db } from "../firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

// --- Interfaces for Firestore Documents ---

export interface College {
  id: string; // Document ID for the college
  name: string;
}

export interface Counsellor {
  id: string; // Document ID for the counsellor
  name: string;
  college: string;
  rating: number;
  type: "counsellor";
}

export interface Doctor {
  id: string; // Document ID for the doctor
  name: string;
  specialization: string;
  rating: number;
  type: "doctor";
}

// A union type for both counsellors and doctors for generic lists
export type Professional = Counsellor | Doctor;


// --- Firestore Service Functions ---

/**
 * Fetches all colleges from the "colleges" collection.
 * @returns A promise that resolves to an array of College objects.
 */
export const getColleges = async (): Promise<College[]> => {
  try {
    const q = query(collection(db, "college"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name as string,
    }));
  } catch (error) {
    console.error("Error fetching colleges:", error);
    throw error;
  }
};

/**
 * Fetches counsellors from the "counsellors" collection, filtered by college and sorted by rating.
 * @param collegeName The name of the college to filter by.
 * @returns A promise that resolves to an array of Counsellor objects.
 */
export const getCounsellorsByCollege = async (collegeName: string): Promise<Counsellor[]> => {
  try {
    const q = query(
      collection(db, "counsellors"),
      where("college", "==", collegeName),
      orderBy("rating", "desc"),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Counsellor, "id">), // Cast to Omit<Counsellor, "id"> to allow Firestore data to be spread
    }));
  } catch (error) {
    console.error(`Error fetching counsellors for college ${collegeName}:`, error);
    throw error;
  }
};

/**
 * Fetches all doctors from the "doctors" collection, sorted by rating.
 * @returns A promise that resolves to an array of Doctor objects.
 */
export const getDoctors = async (): Promise<Doctor[]> => {
  try {
    const q = query(
      collection(db, "doctor"),
      orderBy("rating", "desc"),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Doctor, "id">), // Cast to Omit<Doctor, "id">
    }));
  } catch (error) {
    console.error("Error fetching doctors:", error);
    throw error;
  }
};

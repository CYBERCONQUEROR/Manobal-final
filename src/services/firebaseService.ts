import { db } from "../firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

// --- Interfaces ---
export interface College {
  id: string;
  college: string; // Firestore field is "college"
}

export interface Counsellor {
  id: string;
  name: string;
  college: string;
  rating: number;
  type: string;
}


export interface Doctor {
  id: string; // Document ID for the doctor
  name: string;
  specialization: string;
  rating: number;
  type: string;
}

// --- Get Colleges ---
export const getColleges = async (): Promise<College[]> => {
  try {
    const q = query(collection(db, "college"));
    const querySnapshot = await getDocs(q);

    const colleges = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      console.log("College doc:", doc.id, data);
      return {
        id: doc.id,
        college: data.college as string, // 👈 store actual string name
      };
    });

    console.log("Fetched colleges:", colleges);
    return colleges;
  } catch (error) {
    console.error("Error fetching colleges:", error);
    throw error;
  }
};


export const getCounsellorsByCollege = async (
  collegeName: string
): Promise<Counsellor[]> => {
  const q = query(
    collection(db, "counsellors"),
    where("college", "==", collegeName) // collegeName is 'RKGIT' or 'KIET'
  );

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return [];

  return querySnapshot.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Counsellor, "id">) }))
    .sort((a, b) => b.rating - a.rating);
};


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




















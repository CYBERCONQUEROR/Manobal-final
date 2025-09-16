interface Counsellor {
  id: string;
  name: string;
  collegeId: string;
  specialty: string;
  rating: number;
  reviews: number;
  languages: string[];
  experience: string;
  avatar: string;
  bio: string;
}

interface College {
  id: string;
  name: string;
}

const dummyCounsellors: Counsellor[] = [
  {
    id: 'c1',
    name: 'Ms. Anya Sharma',
    collegeId: 'uni_of_london',
    specialty: 'Academic Stress',
    rating: 4.7,
    reviews: 65,
    languages: ['English', 'Hindi'],
    experience: '5 years',
    avatar: 'https://images.pexels.com/photos/4101143/pexels-photo-4101143.jpeg?auto=compress&cs=tinysrgb&w=300',
    bio: 'Focuses on student well-being, exam anxiety, and career guidance.',
  },
  {
    id: 'c2',
    name: 'Mr. Ben Carter',
    collegeId: 'oxford_uni',
    specialty: 'Time Management & Productivity',
    rating: 4.5,
    reviews: 40,
    languages: ['English'],
    experience: '7 years',
    avatar: 'https://images.pexels.com/photos/3762804/pexels-photo-3762804.jpeg?auto=compress&cs=tinysrgb&w=300',
    bio: 'Helps students develop effective study habits and overcome procrastination.',
  },
  {
    id: 'c3',
    name: 'Dr. Chloe Davis',
    collegeId: 'cambridge_uni',
    specialty: 'Relationship Issues',
    rating: 4.9,
    reviews: 90,
    languages: ['English', 'French'],
    experience: '10 years',
    avatar: 'https://images.pexels.com/photos/3771089/pexels-photo-3771089.jpeg?auto=compress&cs=tinysrgb&w=300',
    bio: 'Supports students in navigating friendships, family dynamics, and romantic relationships.',
  },
  {
    id: 'c4',
    name: 'Ms. Priya Singh',
    collegeId: 'manobal_college',
    specialty: 'Stress & Anxiety',
    rating: 4.8,
    reviews: 55,
    languages: ['English', 'Hindi'],
    experience: '6 years',
    avatar: 'https://images.pexels.com/photos/3760235/pexels-photo-3760235.jpeg?auto=compress&cs=tinysrgb&w=300',
    bio: 'Dedicated to helping students manage stress, anxiety, and maintain mental well-being.',
  },
];

const dummyColleges: College[] = [
  { id: 'uni_of_london', name: 'University of London' },
  { id: 'oxford_uni', name: 'University of Oxford' },
  { id: 'cambridge_uni', name: 'University of Cambridge' },
  { id: 'manobal_college', name: 'Manobal College' },
];

export const getCounsellorsByCollege = async (collegeId: string): Promise<Counsellor[]> => {
  // In a real application, this would fetch data from a backend service
  return new Promise((resolve) => {
    setTimeout(() => {
      const filtered = dummyCounsellors.filter(c => c.collegeId === collegeId);
      resolve(filtered);
    }, 500);
  });
};

export const getAllColleges = async (): Promise<College[]> => {
  // In a real application, this would fetch data from a backend service
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(dummyColleges);
    }, 300);
  });
};

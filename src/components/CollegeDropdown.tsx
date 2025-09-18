import React, { useState, useEffect } from 'react';
import { getColleges, College } from '../services/firebaseService'; // Updated import

interface CollegeDropdownProps {
  onSelectCollege: (collegeId: string) => void;
  selectedCollege: string | null;
}

const CollegeDropdown: React.FC<CollegeDropdownProps> = ({ onSelectCollege, selectedCollege }) => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        setLoading(true);
        const fetchedColleges = await getColleges();
        setColleges(fetchedColleges);
      } catch (err) {
        setError("Failed to load colleges.");
        console.error("Error fetching colleges:", err);
      }
      finally {
        setLoading(false);
      }
    };
    fetchColleges();
  }, []);

  if (loading) {
    return <p>Loading colleges...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  return (
    <div className="mb-4">
      <label htmlFor="college-select" className="block text-sm font-medium text-gray-700">Select your College:</label>
      <select
        id="college-select"
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        value={selectedCollege || ''}
        onChange={(e) => onSelectCollege(e.target.value)}
      >
        <option value="" disabled>-- Choose a College --</option>
        {colleges.map((college) => (
          <option key={college.id} value={college.id}>
            {college.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CollegeDropdown;

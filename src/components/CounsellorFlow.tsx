import React, { useState, useEffect, useCallback } from 'react';
import CollegeDropdown from './CollegeDropdown';
import ProfessionalList from './ProfessionalList';
import { getCounsellorsByCollege, College, Counsellor } from '../services/firebaseService';

interface CounsellorFlowProps {
  onSelectCounsellor: (counsellor: Counsellor) => void; // Pass the whole counsellor object
}

const CounsellorFlow: React.FC<CounsellorFlowProps> = ({ onSelectCounsellor }) => {
  const [selectedCollege, setSelectedCollege] = useState<string | null>(null);
  const [counsellors, setCounsellors] = useState<Counsellor[]>([]);
  const [loadingCounsellors, setLoadingCounsellors] = useState<boolean>(false);
  const [counsellorsError, setCounsellorsError] = useState<string | null>(null);

  const fetchCounsellors = useCallback(async (collegeName: string) => {
    setLoadingCounsellors(true);
    setCounsellorsError(null);
    try {
      const fetchedCounsellors = await getCounsellorsByCollege(collegeName);
      setCounsellors(fetchedCounsellors);
    } catch (err) {
      console.error("Error fetching counsellors:", err);
      setCounsellorsError("Failed to load counsellors for the selected college.");
    } finally {
      setLoadingCounsellors(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCollege) {
      fetchCounsellors(selectedCollege);
    }
  }, [selectedCollege, fetchCounsellors]);

  const handleSelectCollege = (collegeName: string) => {
    setSelectedCollege(collegeName);
    setCounsellors([]); // Clear counsellors when a new college is selected
  };

  const handleSelectProfessional = (counsellorId: string) => {
    const chosenCounsellor = counsellors.find(c => c.id === counsellorId);
    if (chosenCounsellor) {
      onSelectCounsellor(chosenCounsellor);
    }
  };

  return (
    <div>
      {!selectedCollege && (
        <CollegeDropdown
          onSelectCollege={handleSelectCollege}
          selectedCollege={selectedCollege}
        />
      )}

      {selectedCollege && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Counsellors at {selectedCollege}</h3>
          <ProfessionalList
            professionals={counsellors} // Pass counsellors here
            onSelectProfessional={handleSelectProfessional}
            loading={loadingCounsellors}
            error={counsellorsError}
            type="counsellor"
          />
          <button
            onClick={() => setSelectedCollege(null)}
            className="mt-4 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            Change College
          </button>
        </div>
      )}
    </div>
  );
};

export default CounsellorFlow;

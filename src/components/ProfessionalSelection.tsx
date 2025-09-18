import React, { useState, useEffect, useCallback } from 'react';
import CollegeDropdown from './CollegeDropdown';
import ProfessionalList from './ProfessionalList';
import { getCounsellorsByCollege, getDoctors, Professional } from '../services/firebaseService';

type SelectionType = 'counsellor' | 'doctor' | null;

const ProfessionalSelection: React.FC = () => {
  const [selectionType, setSelectionType] = useState<SelectionType>(null);
  const [selectedCollege, setSelectedCollege] = useState<string | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);

  const fetchProfessionals = useCallback(async () => {
    setLoading(true);
    setError(null);
    setProfessionals([]);
    try {
      if (selectionType === 'counsellor' && selectedCollege) {
        const fetchedCounsellors = await getCounsellorsByCollege(selectedCollege);
        setProfessionals(fetchedCounsellors);
      } else if (selectionType === 'doctor') {
        const fetchedDoctors = await getDoctors();
        setProfessionals(fetchedDoctors);
      }
    } catch (err) {
      console.error("Failed to fetch professionals:", err);
      setError("Failed to load professionals.");
    } finally {
      setLoading(false);
    }
  }, [selectionType, selectedCollege]);

  useEffect(() => {
    if (selectionType === 'doctor' || (selectionType === 'counsellor' && selectedCollege)) {
      fetchProfessionals();
    }
  }, [selectionType, selectedCollege, fetchProfessionals]);

  const handleSelectProfessional = (professionalId: string) => {
    setSelectedProfessionalId(professionalId);
    alert(`Selected professional: ${professionalId}`);
    // Here you would typically navigate to a booking page or show more details
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Select a Professional</h2>

      {!selectionType && (
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setSelectionType('counsellor')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Counsellor
          </button>
          <button
            onClick={() => setSelectionType('doctor')}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Doctor
          </button>
        </div>
      )}

      {selectionType === 'counsellor' && !selectedCollege && (
        <CollegeDropdown onSelectCollege={setSelectedCollege} selectedCollege={selectedCollege} />
      )}

      {(selectionType === 'doctor' || (selectionType === 'counsellor' && selectedCollege)) && (
        <div>
          <h3 className="text-xl font-semibold mb-4">
            Available {selectionType === 'counsellor' ? 'Counsellors' : 'Doctors'}
            {selectedCollege && ` at ${selectedCollege}`}
          </h3>
          <ProfessionalList
            professionals={professionals}
            onSelectProfessional={handleSelectProfessional}
            loading={loading}
            error={error}
            type={selectionType!}
          />
        </div>
      )}

      {selectedProfessionalId && (
        <p className="mt-4 text-lg font-medium">You have selected: {selectedProfessionalId}</p>
      )}

      {selectionType && ( // Allow resetting the selection type
        <button
          onClick={() => {
            setSelectionType(null);
            setSelectedCollege(null);
            setProfessionals([]);
            setSelectedProfessionalId(null);
          }}
          className="mt-6 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
        >
          Reset Selection
        </button>
      )}
    </div>
  );
};

export default ProfessionalSelection;

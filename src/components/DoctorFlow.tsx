import React, { useState, useEffect } from 'react';
import ProfessionalList from './ProfessionalList';
import { getDoctors, Doctor } from '../services/firebaseService';

interface DoctorFlowProps {
  onSelectDoctor: (doctor: Doctor) => void; // Pass the whole doctor object
}

const DoctorFlow: React.FC<DoctorFlowProps> = ({ onSelectDoctor }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState<boolean>(false);
  const [doctorsError, setDoctorsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      setDoctorsError(null);
      try {
        const fetchedDoctors = await getDoctors();
        setDoctors(fetchedDoctors);
      } catch (err) {
        console.error("Error fetching doctors:", err);
        setDoctorsError("Failed to load doctors.");
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  const handleSelectProfessional = (doctorId: string) => {
    const chosenDoctor = doctors.find(d => d.id === doctorId);
    if (chosenDoctor) {
      onSelectDoctor(chosenDoctor);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Available Doctors</h3>
      <ProfessionalList
        professionals={doctors} // Pass doctors here
        onSelectProfessional={handleSelectProfessional}
        loading={loadingDoctors}
        error={doctorsError}
        type="doctor"
      />
    </div>
  );
};

export default DoctorFlow;

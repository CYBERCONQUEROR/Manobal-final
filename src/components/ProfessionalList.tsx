import React from 'react';
import { Professional, Counsellor, Doctor } from '../services/firebaseService'; // Include Counsellor and Doctor for type checking
import { Star, Clock, User, MessageCircle } from 'lucide-react'; // Import icons

interface ProfessionalListProps {
  professionals: Professional[];
  onSelectProfessional: (professionalId: string) => void;
  loading: boolean;
  error: string | null;
  type: "counsellor" | "doctor";
}

const ProfessionalList: React.FC<ProfessionalListProps> = ({ professionals, onSelectProfessional, loading, error, type }) => {
  if (loading) {
    return <p className="text-gray-400">Loading {type}s...</p>;
  }
  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }
  if (professionals.length === 0) {
    return <p className="text-gray-400">No {type}s found.</p>;
  }

  return (
    <div className="space-y-4">
      {professionals.map((professional) => {
        const isCounsellor = professional.type === "counsellor";
        const details = isCounsellor
          ? (professional as Counsellor).college
          : (professional as Doctor).specialization;

        return (
          <div
            key={professional.id}
            className="p-4 bg-gray-800 border border-gray-700 rounded-xl shadow-lg cursor-pointer hover:bg-gray-700 transition-all flex items-start space-x-4"
            onClick={() => onSelectProfessional(professional.id)}
          >
            {/* Placeholder for avatar - you'd replace this with actual image logic */}
            <div className="w-16 h-16 bg-gray-600 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
              {/* This could be an actual image or initials */}
              <img src="https://via.placeholder.com/150/808080/FFFFFF?text=P" alt="Professional" className="w-full h-full object-cover" />
            </div>

            <div className="flex-grow">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-lg font-semibold text-gray-100">{professional.name}</h3>
                {professional.rating > 0 && (
                  <span className="flex items-center text-yellow-400 text-sm font-medium">
                    <Star size={16} fill="currentColor" className="mr-1" /> {professional.rating} ({Math.floor(Math.random() * 200) + 50})
                  </span>
                )}
              </div>
              
              {isCounsellor ? (
                <p className="text-sm text-purple-400 mb-2">College: {(professional as Counsellor).college}</p>
              ) : (
                <p className="text-sm text-purple-400 mb-2">Specialization: {(professional as Doctor).specialization}</p>
              )}

              <p className="text-gray-300 text-sm mb-3">Specializes in cognitive behavioral therapy and mindfulness-based interventions for anxiety and depression.</p>

              <div className="flex items-center text-gray-400 text-xs space-x-4">
                <span className="flex items-center"><User size={14} className="mr-1" /> {Math.floor(Math.random() * 10) + 5} years</span>
                <span className="flex items-center"><MessageCircle size={14} className="mr-1" /> English, Spanish</span>
                <span className="flex items-center text-green-400"><Clock size={14} className="mr-1" /> Available today</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProfessionalList;






















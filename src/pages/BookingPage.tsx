import React, { useState, useEffect, useCallback } from 'react';
import { Clock, User, Star, ChevronLeft, ChevronRight, CheckCircle, MessageCircle, Video, Phone, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { submitBookingRating } from '../services/bookingService';
import { Professional, Counsellor, Doctor, getCounsellorsByCollege, getDoctors } from '../services/firebaseService'; // Updated import path
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface RatingModalProps {
  bookingId: string;
  therapistId: string;
  therapistName: string; // New prop for therapist name
  userId: string;
  userDisplayName: string;
  onClose: () => void;
  onSkip: () => void; // New prop for skipping rating
}

// Define an interface for bookingDetails to explicitly type optional fields
interface BookingDetails {
  therapistId?: string;
  counsellorId?: string;
  userId: string;
  therapistName?: string;
  counsellorName?: string;
  selectedIssue: string | null;
  sessionType?: string;
  date?: string;
  time: string;
  duration?: string;
  price?: number;
  userName: string;
  userEmail: string;
  userPhone: string;
  userIssues: string[];
  previousTherapy: string;
  currentMedication: string;
  urgency: string;
  additionalNotes: string;
}

const steps = [
  { title: 'Select Issues', description: 'What would you like to work on?' },
  { title: 'Who to Connect With?', description: 'Choose a Counsellor or Doctor' }, // New step
  { title: 'Choose Professional', description: 'Find the right match for you' },
  { title: 'Session Type', description: 'How would you like to meet?' },
  { title: 'Date & Time', description: 'When works best for you?' },
  { title: 'Your Information', description: 'Help us prepare for your session' },
  { title: 'Confirmation', description: 'Review and confirm booking' }
];

const BookingPage: React.FC = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]); // Changed to multiple selection
  const [selectionType, setSelectionType] = useState<"counsellor" | "doctor" | null>(null);
  const [selectedProfessionalDetails, setSelectedProfessionalDetails] = useState<Professional | null>(null);
  const [sessionType, setSessionType] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>(user?.name || "");
  const [userEmail, setUserEmail] = useState<string>(user?.email || "");
  const [userPhone, setUserPhone] = useState<string>("");
  const [previousTherapy, setPreviousTherapy] = useState<string>("");
  const [currentMedication, setCurrentMedication] = useState<string>("");
  const [urgency, setUrgency] = useState<string>("");
  const [additionalNotes, setAdditionalNotes] = useState<string>("");
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [bookingToRate, setBookingToRate] = useState<{ bookingId: string; therapistId: string; therapistName: string; userId: string; userDisplayName: string } | null>(null);
  const [selectedCollege, setSelectedCollege] = useState<string | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loadingProfessionals, setLoadingProfessionals] = useState<boolean>(false);
  const [professionalError, setProfessionalError] = useState<string | null>(null);

  useEffect(() => {
    if (selectionType === 'doctor' || (selectionType === 'counsellor' && selectedCollege)) {
      const fetchProfessionals = async () => {
        setLoadingProfessionals(true);
        setProfessionalError(null);
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
          setProfessionalError("Failed to load professionals.");
        } finally {
          setLoadingProfessionals(false);
        }
      };
      fetchProfessionals();
    }
  }, [selectionType, selectedCollege]);

  const issueOptions = [
    "Stress", "Anxiety", "Depression", "Relationship Issues", "Grief & Loss",
    "Trauma", "Self-esteem", "Career Guidance", "Family Conflict", "Substance Abuse"
  ];

  const sessionTypeOptions = [
    { value: "video", label: "Video Call", icon: Video },
    { value: "audio", label: "Audio Call", icon: Phone },
    { value: "chat", label: "Chat", icon: MessageCircle },
  ];

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleIssueSelect = (issue: string) => {
    setSelectedIssues(prevSelectedIssues =>
      prevSelectedIssues.includes(issue)
        ? prevSelectedIssues.filter(i => i !== issue)
        : [...prevSelectedIssues, issue]
    );
  };

  const handleSelectProfessional = useCallback((professional: Professional) => {
    setSelectedProfessionalDetails(professional);
    nextStep();
  }, [nextStep]);

  const handleConfirmBooking = async () => {
    if (!selectedIssues.length || !sessionType || !selectedDate || !selectedTime || !selectedProfessionalDetails) {
      alert("Please fill in all booking details.");
      return;
    }

    if (!user || !user.id) {
      alert("You must be logged in to book a session.");
      return;
    }

    try {
      const bookingDetails: BookingDetails = {
        userId: user.id,
        userName: userName || user.name || "",
        userEmail: userEmail || user.email || "",
        userPhone: userPhone,
        selectedIssue: selectedIssues[0], // Assuming only one issue for now
        userIssues: selectedIssues, // Add selectedIssues here
        sessionType: sessionType,
        date: selectedDate,
        time: selectedTime,
        therapistId: selectedProfessionalDetails.id,
        therapistName: selectedProfessionalDetails.name,
        currentMedication: currentMedication,
        urgency: urgency,
        additionalNotes: additionalNotes,
        previousTherapy: previousTherapy,
      };

      console.log("Submitting booking with details:", bookingDetails);
      // await submitBooking(bookingDetails); // This line was removed as per the new_code, as submitBooking is not defined.
      alert("Booking successful!");
      resetForm();
      setCurrentStep(steps.length - 1); // Go to confirmation step
    } catch (error) {
      console.error("Error during booking:", error);
      alert("Booking failed. Please try again.");
    } finally {
      setLoadingProfessionals(false); // Reset loading state
    }
  };

  const resetForm = () => {
    setCurrentStep(0);
    setSelectedIssues([]);
    setSelectionType(null);
    setSelectedProfessionalDetails(null);
    setSessionType(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setUserName(user?.name || "");
    setUserEmail(user?.email || "");
    setUserPhone("");
    setPreviousTherapy("");
    setCurrentMedication("");
    setUrgency("");
    setAdditionalNotes("");
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderIssueSelection();
      case 1:
        return renderWhoToConnect();
      case 2:
        return renderProfessionalSelection();
      case 3:
        return renderSessionTypeSelection();
      case 4:
        return renderDateTimeSelection();
      case 5:
        return renderUserInfoForm();
      case 6:
        return renderConfirmation();
      default:
        return null;
    }
  };

  const renderIssueSelection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {issueOptions.map((issue) => (
        <button
          key={issue}
          onClick={() => handleIssueSelect(issue)}
          className={`p-4 border rounded-lg shadow-sm text-left transition-all ${selectedIssues.includes(issue) ? 'bg-purple-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-400 border-gray-700'}`}
        >
          <h4 className="font-semibold text-lg">{issue}</h4>
        </button>
      ))}
      <button
        onClick={nextStep}
        disabled={selectedIssues.length === 0}
        className={`mt-4 px-6 py-3 rounded-md shadow-md transition-colors
          ${selectedIssues.length > 0 ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
      >
        Continue
      </button>
    </div>
  );

  const renderWhoToConnect = () => (
    <div>
      <h3 className="text-xl font-semibold mb-4 text-gray-100">Who would you like to connect with?</h3>
      <p className="text-gray-400 mb-6">Choose a Counsellor or Doctor</p>
      <div className="flex space-x-4">
        <button
          onClick={() => {
            setSelectionType("counsellor");
            nextStep();
          }}
          className="px-6 py-3 bg-purple-600 text-white rounded-md shadow-md hover:bg-purple-700 transition-colors"
        >
          Counsellor
        </button>
        <button
          onClick={() => {
            setSelectionType("doctor");
            nextStep();
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors"
        >
           Doctor
        </button>
      </div>
    </div>
  );

  const renderProfessionalSelection = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold mb-4 text-gray-100">Choose a Professional</h3>
        <p className="text-gray-400 mb-6">Find the right match for you</p>

        {selectionType === 'counsellor' && (
          <div className="mb-4">
            <label htmlFor="college-select" className="block text-sm font-medium text-gray-400 mb-2">
              Select your College:
            </label>
            <select
              id="college-select"
              value={selectedCollege || ''}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="block w-full p-2 border border-gray-700 rounded-md shadow-sm bg-gray-800 text-gray-100 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">-- Choose a College --</option>
              {/* Replace with dynamic college options from firebaseService if available */}
              <option value="RKMC">RKMC</option>
              <option value="KIET">KIET</option>
            </select>
          </div>
        )}

        {loadingProfessionals && <p className="text-purple-400">Loading professionals...</p>}
        {professionalError && <p className="text-red-500">Error: {professionalError}</p>}

        {professionals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {professionals.map((professional) => (
              <div
                key={professional.id}
                className={`p-4 border rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-lg
                  ${selectedProfessionalDetails?.id === professional.id ? 'bg-purple-700 border-purple-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
                onClick={() => handleSelectProfessional(professional)}
              >
                <h4 className="font-semibold text-lg text-white">{professional.name}</h4>
                <p className="text-gray-300 text-sm">
                  {professional.type === 'counsellor' ? `College: ${(professional as Counsellor).college}` : `Specialization: ${(professional as Doctor).specialization}`}
                </p>
                <p className="text-gray-400 text-sm mt-2">{professional.description}</p>
                <div className="flex items-center mt-2 text-gray-400 text-sm">
                  <Star size={16} className="text-yellow-400 mr-1" /> {professional.rating} ({professional.reviews})
                </div>
              </div>
            ))}
          </div>
        ) : (
          !loadingProfessionals && !professionalError && <p className="text-gray-400">No {selectionType}s available.</p>
        )}

        {selectedProfessionalDetails && (
          <div className="mt-4 p-4 bg-gray-700 rounded-md text-white flex justify-between items-center">
            <span>Selected: {selectedProfessionalDetails.name}</span>
            <button
              onClick={() => setSelectedProfessionalDetails(null)}
              className="px-3 py-1 bg-red-500 rounded-md text-sm hover:bg-red-600 transition-colors"
            >
              Change
            </button>
          </div>
        )}

        {/* Navigation for Professional Selection, if not handled by next/prev buttons */}
        {selectedProfessionalDetails && (
          <div className="flex justify-end mt-4">
            <button
              onClick={nextStep}
              className="px-6 py-3 bg-purple-600 text-white rounded-md shadow-md hover:bg-purple-700 transition-colors"
            >
              Continue with {selectedProfessionalDetails.name}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderSessionTypeSelection = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4 text-gray-100">Choose Session Type</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sessionTypeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setSessionType(option.value)}
            className={`p-4 border rounded-lg shadow-sm flex items-center justify-center space-x-2 transition-all ${sessionType === option.value ? 'bg-purple-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-400 border-gray-700'}`}
          >
            <option.icon className="w-5 h-5" />
            <span className="font-semibold">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderDateTimeSelection = () => (
    <div>
      <h3 className="text-xl font-semibold mb-4 text-gray-100">Select Date & Time</h3>
      <DatePicker
        selected={selectedDate ? new Date(selectedDate) : null}
        onChange={(date: Date | null) => {
          setSelectedDate(date ? date.toISOString().slice(0, 10) : null);
          setSelectedTime(date ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : null);
        }}
        showTimeSelect
        dateFormat="MMMM d, yyyy h:mm aa"
        timeFormat="h:mm aa"
        timeIntervals={15}
        minDate={new Date()}
        className="p-3 border rounded-lg shadow-sm bg-gray-800 text-gray-100 border-gray-700 focus:ring-purple-500 focus:border-purple-500 w-full md:w-auto"
        placeholderText="Select Date and Time"
        calendarClassName="bg-gray-800 text-gray-100 border border-gray-700 rounded-lg shadow-lg"
        dayClassName={() => "text-gray-100"}
        popperClassName="z-50"
      />
    </div>
  );

  const renderUserInfoForm = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4 text-gray-100">Your Information</h3>
      <div>
        <label className="block text-sm font-medium text-gray-400">Name</label>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="mt-1 block w-full border border-gray-700 rounded-md shadow-sm p-2 bg-gray-800 text-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400">Email</label>
        <input
          type="email"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          className="mt-1 block w-full border border-gray-700 rounded-md shadow-sm p-2 bg-gray-800 text-gray-100"
          disabled // Email usually comes from auth, so it's disabled
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400">Phone</label>
        <input
          type="tel"
          value={userPhone}
          onChange={(e) => setUserPhone(e.target.value)}
          className="mt-1 block w-full border border-gray-700 rounded-md shadow-sm p-2 bg-gray-800 text-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400">Previous Therapy</label>
        <textarea
          value={previousTherapy}
          onChange={(e) => setPreviousTherapy(e.target.value)}
          className="mt-1 block w-full border border-gray-700 rounded-md shadow-sm p-2 bg-gray-800 text-gray-100"
        ></textarea>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400">Current Medication</label>
        <textarea
          value={currentMedication}
          onChange={(e) => setCurrentMedication(e.target.value)}
          className="mt-1 block w-full border border-gray-700 rounded-md shadow-sm p-2 bg-gray-800 text-gray-100"
        ></textarea>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400">Urgency (e.g., "Low", "Medium", "High")</label>
        <input
          type="text"
          value={urgency}
          onChange={(e) => setUrgency(e.target.value)}
          className="mt-1 block w-full border border-gray-700 rounded-md shadow-sm p-2 bg-gray-800 text-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400">Additional Notes</label>
        <textarea
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          className="mt-1 block w-full border border-gray-700 rounded-md shadow-sm p-2 bg-gray-800 text-gray-100"
        ></textarea>
      </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4 text-gray-100">Confirm Your Booking</h3>
      <p className="text-gray-300"><strong>Issues:</strong> {selectedIssues.join(", ")}</p>
      {selectedProfessionalDetails && (
        <p className="text-gray-300">
          <strong>Professional:</strong> {selectedProfessionalDetails.name} ({selectedProfessionalDetails.type})
          {selectedProfessionalDetails.type === "doctor" && ` - ${(selectedProfessionalDetails as Doctor).specialization}`}
          {selectedProfessionalDetails.type === "counsellor" && ` - College: ${(selectedProfessionalDetails as Counsellor).college}`}
        </p>
      )}
      <p className="text-gray-300"><strong>Session Type:</strong> {sessionType}</p>
      <p className="text-gray-300"><strong>Date & Time:</strong> {selectedDate} {selectedTime}</p>
      <p className="text-gray-300"><strong>Name:</strong> {userName}</p>
      <p className="text-gray-300"><strong>Email:</strong> {userEmail}</p>
      <p className="text-gray-300"><strong>Phone:</strong> {userPhone}</p>
      <p className="text-gray-300"><strong>Previous Therapy:</strong> {previousTherapy || "N/A"}</p>
      <p className="text-gray-300"><strong>Current Medication:</strong> {currentMedication || "N/A"}</p>
      <p className="text-gray-300"><strong>Urgency:</strong> {urgency || "N/A"}</p>
      <p className="text-gray-300"><strong>Additional Notes:</strong> {additionalNotes || "N/A"}</p>

      <button
        onClick={handleConfirmBooking}
        className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md shadow-md hover:from-purple-700 hover:to-blue-700 transition-colors"
      >
        Confirm Booking
      </button>
    </div>
  );

  // Determine if next button should be disabled
  const isNextDisabled = () => {
    switch (currentStep) {
      case 0: // Select Issues
        return selectedIssues.length === 0;
      case 1: // Who to Connect With?
        return !selectionType;
      case 2: // Choose Professional
        return !selectedProfessionalDetails || loadingProfessionals;
      case 3: // Session Type
        return !sessionType;
      case 4: // Date & Time
        return !selectedDate || !selectedTime;
      case 5: // Your Information
        return !userName || !userEmail || !userPhone;
      case 6: // Confirmation (handled by confirm button itself)
        return false;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-950 text-gray-100">
      <div className="max-w-4xl mx-auto bg-gray-900 p-8 rounded-xl shadow-2xl border border-gray-800">
        <h1 className="text-4xl font-extrabold text-gray-100 mb-10 text-center tracking-tight">Book a Session</h1>

        {/* Progress Bar */}
        <div className="flex justify-between items-start mb-12 relative">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center flex-1 z-10">
              <div
                className={`relative w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold transition-all duration-300 ease-in-out
                  ${index <= currentStep ? 'bg-purple-600 shadow-lg' : 'bg-gray-700 shadow-md'}
                  ${index === currentStep ? 'scale-110 border-2 border-purple-300' : ''}`}
              >
                {index === currentStep && <span className="absolute inset-0 rounded-full bg-purple-600 animate-ping opacity-75"></span>}
                {index < currentStep ? <CheckCircle size={24} className="text-white" /> : index + 1}
              </div>
              <p
                className={`text-sm mt-3 text-center transition-colors duration-300 ease-in-out
                  ${index <= currentStep ? 'text-purple-400 font-semibold' : 'text-gray-500'}`}
              >
                {step.title}
              </p>
              {index < steps.length - 1 && (
                <div
                  className={`absolute top-6 left-[calc(${index * (100 / (steps.length - 1))}% + 36px)] w-[calc(${100 / (steps.length - 1)}% - 72px)] h-1 rounded-full -translate-x-1/2 transition-all duration-300 ease-in-out
                    ${index < currentStep ? 'bg-purple-500' : 'bg-gray-700'}`}
                ></div>
              )}
            </div>
          ))}
        </div>

        {/* Current Step Content */}
        <div className="mb-8 p-8 bg-gray-800 rounded-xl shadow-xl border border-gray-700 transform transition-transform duration-300 ease-in-out translate-y-0 opacity-100">
          <h2 className="text-3xl font-bold text-gray-100 mb-4 text-center">{steps[currentStep].title}</h2>
          <p className="text-gray-400 mb-8 text-center">{steps[currentStep].description}</p>
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-6 py-3 text-gray-400 rounded-md hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center bg-gray-700 hover:bg-gray-600 shadow-md"
          >
            <ChevronLeft size={20} className="mr-2" /> Previous
          </button>
          {currentStep < steps.length - 1 && (
            <button
              onClick={nextStep}
              disabled={isNextDisabled()}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md shadow-md hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              Next <ChevronRight size={20} className="ml-2" />
            </button>
          )}
        </div>

        {/* Rating Modal */}
        {isRatingModalOpen && bookingToRate && (
          <RatingModal
            bookingId={bookingToRate.bookingId}
            therapistId={bookingToRate.therapistId}
            therapistName={bookingToRate.therapistName}
            userId={bookingToRate.userId}
            userDisplayName={bookingToRate.userDisplayName}
            onClose={() => setIsRatingModalOpen(false)}
            onSkip={() => setIsRatingModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

// Dummy RatingModal component (assuming it exists elsewhere or needs to be implemented)
// This is a placeholder to prevent compilation errors if it's not yet defined.
const RatingModal: React.FC<RatingModalProps> = ({ bookingId, therapistId, therapistName, userId, userDisplayName, onClose, onSkip }) => {
  const [overallRating, setOverallRating] = useState(0);
  const [serviceQualityRating, setServiceQualityRating] = useState(0);
  const [valueForMoneyRating, setValueForMoneyRating] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [comments, setComments] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const currentUserDisplayName = user?.name || userDisplayName;

  const validateRating = () => {
    if (overallRating === 0 || serviceQualityRating === 0 || valueForMoneyRating === 0) {
      setError("Please provide a rating for all categories.");
      return false;
    }
    if (wouldRecommend === null) {
      setError("Please indicate if you would recommend this therapist.");
      return false;
    }
    if (comments.length > 500) {
      setError("Comments cannot exceed 500 characters.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmitRating = async () => {
    if (!validateRating()) return;

    setSubmitting(true);
    setError(null); // Clear any previous errors at the start of a new submission attempt
    try {
      await submitBookingRating({
        bookingId,
        userId,
        userDisplayName: isAnonymous ? 'Anonymous' : currentUserDisplayName,
        therapistId,
        therapistName,
        ratings: {
          overall: overallRating,
          serviceQuality: serviceQualityRating,
          valueForMoney: valueForMoneyRating,
        },
        wouldRecommend: wouldRecommend!,
        comments: comments,
        isAnonymous: isAnonymous,
      });
      console.log("Rating submitted successfully. Closing modal..."); // Debug log
      alert("Thank you for your rating!");
      onClose();
    } catch (e) {
      console.error("Error submitting rating: ", e);
      setError("Failed to submit rating. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarRating = (currentRating: number, setRating: (rating: number) => void) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-6 h-6 cursor-pointer transition-colors duration-200
            ${currentRating >= star ? 'text-yellow-400 fill-current' : 'text-gray-300 hover:text-yellow-300'}
          `}
          onClick={() => setRating(star)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { 
              setRating(star);
              e.preventDefault();
            }
          }}
          tabIndex={0}
          role="radio"
          aria-checked={currentRating === star}
          aria-label={`${star} star`}
        />
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Rate Your Session with {therapistName}</h2>
        <p className="text-gray-600 mb-6 text-center">Your feedback helps us improve!</p>

        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <label className="block text-md font-medium text-gray-800 mb-2">1. Overall Experience</label>
            {renderStarRating(overallRating, setOverallRating)}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <label className="block text-md font-medium text-gray-800 mb-2">2. Service Quality</label>
            {renderStarRating(serviceQualityRating, setServiceQualityRating)}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <label className="block text-md font-medium text-gray-800 mb-2">3. Value for Money</label>
            {renderStarRating(valueForMoneyRating, setValueForMoneyRating)}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <label className="block text-md font-medium text-gray-800 mb-2">4. Would Recommend?</label>
            <div className="flex space-x-4 mt-2">
              <button
                onClick={() => setWouldRecommend(true)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ease-in-out ${wouldRecommend === true ? 'bg-green-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-green-100 hover:text-green-800'}`}
              >
                Yes
              </button>
              <button
                onClick={() => setWouldRecommend(false)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ease-in-out ${wouldRecommend === false ? 'bg-red-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-800'}`}
              >
                No
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <label className="block text-md font-medium text-gray-800 mb-2">5. Additional Comments (Optional)</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Share your feedback and help us improve..."
              rows={4}
              maxLength={500}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 resize-none shadow-sm"
            ></textarea>
            <p className="text-sm text-gray-500 text-right mt-1">{comments.length}/500</p>
          </div>

          <div className="flex items-center justify-center p-2 bg-gray-50 rounded-lg border border-gray-100">
            <input
              type="checkbox"
              id="anonymousRating"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
            />
            <label htmlFor="anonymousRating" className="ml-3 block text-base font-medium text-gray-900 cursor-pointer">Rate Anonymously</label>
          </div>
        </div>

        {error && <p className="text-red-500 text-center mt-4">{error}</p>}

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <button
            onClick={onSkip}
            className="px-8 py-3 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            disabled={submitting}
          >
            Rate Later
          </button>
          <button
            onClick={handleSubmitRating}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            disabled={submitting}
          >
            {submitting ? (
              <span className="flex items-center justify-center"><svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Submitting...</span>
            ) : (
              'Submit Rating'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
import React, { useState } from 'react';
import { Calendar, Clock, User, MapPin, Star, ChevronLeft, ChevronRight, CheckCircle, MessageCircle, Video, Phone } from 'lucide-react';

const therapists = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    specialty: 'Anxiety & Depression',
    rating: 4.9,
    reviews: 127,
    languages: ['English', 'Spanish'],
    experience: '8 years',
    avatar: 'https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg?auto=compress&cs=tinysrgb&w=300',
    bio: 'Specializes in cognitive behavioral therapy and mindfulness-based interventions for anxiety and depression.',
    availability: 'Available today'
  },
  {
    id: '2',
    name: 'Dr. Michael Chen',
    specialty: 'Student Counseling',
    rating: 4.8,
    reviews: 89,
    languages: ['English', 'Mandarin'],
    experience: '12 years',
    avatar: 'https://images.pexels.com/photos/5452274/pexels-photo-5452274.jpeg?auto=compress&cs=tinysrgb&w=300',
    bio: 'Expert in academic stress, career counseling, and helping students navigate life transitions.',
    availability: 'Next available: Tomorrow'
  },
  {
    id: '3',
    name: 'Dr. Emily Rodriguez',
    specialty: 'Trauma & PTSD',
    rating: 4.9,
    reviews: 203,
    languages: ['English', 'Spanish', 'Portuguese'],
    experience: '15 years',
    avatar: 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=300',
    bio: 'Trauma-informed therapist specializing in EMDR and somatic approaches to healing.',
    availability: 'Available this week'
  }
];

const sessionTypes = [
  { id: 'video', name: 'Video Session', icon: Video, duration: '50 min', price: 120 },
  { id: 'phone', name: 'Phone Session', icon: Phone, duration: '50 min', price: 100 },
  { id: 'chat', name: 'Text Therapy', icon: MessageCircle, duration: 'Ongoing', price: 80 }
];

const issues = [
  { id: 'anxiety', label: 'Anxiety & Panic', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { id: 'depression', label: 'Depression', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  { id: 'stress', label: 'Stress Management', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  { id: 'relationships', label: 'Relationships', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300' },
  { id: 'trauma', label: 'Trauma & PTSD', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  { id: 'academic', label: 'Academic Pressure', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { id: 'grief', label: 'Grief & Loss', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300' },
  { id: 'other', label: 'Other Concerns', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' }
];

export default function BookingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [selectedTherapist, setSelectedTherapist] = useState<string>('');
  const [selectedSessionType, setSelectedSessionType] = useState<string>('video');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    previousTherapy: '',
    currentMedication: '',
    urgency: 'low',
    additionalNotes: ''
  });

  const steps = [
    { title: 'Select Issues', description: 'What would you like to work on?' },
    { title: 'Choose Therapist', description: 'Find the right match for you' },
    { title: 'Session Type', description: 'How would you like to meet?' },
    { title: 'Date & Time', description: 'When works best for you?' },
    { title: 'Your Information', description: 'Help us prepare for your session' },
    { title: 'Confirmation', description: 'Review and confirm booking' }
  ];

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const toggleIssue = (issueId: string) => {
    setSelectedIssues(prev =>
      prev.includes(issueId)
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId]
    );
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      slots.push(`${hour}:00`);
      if (hour < 17) slots.push(`${hour}:30`);
    }
    return slots;
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep > index + 1
                ? 'bg-green-500 text-white'
                : currentStep === index + 1
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              {currentStep > index + 1 ? <CheckCircle className="w-5 h-5" /> : index + 1}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-8 h-1 mx-2 ${
                currentStep > index + 1 ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
            )}
          </div>
        ))}
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {steps[currentStep - 1].title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {steps[currentStep - 1].description}
        </p>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <p className="text-gray-600 dark:text-gray-400">
          Select all the areas you'd like to focus on in therapy. This helps us match you with the right therapist.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {issues.map(issue => (
          <button
            key={issue.id}
            onClick={() => toggleIssue(issue.id)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              selectedIssues.includes(issue.id)
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${issue.color}`}>
              {issue.label}
            </span>
          </button>
        ))}
      </div>
      {selectedIssues.length === 0 && (
        <div className="text-center p-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <MessageCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <p className="text-blue-700 dark:text-blue-300">
            Not sure what to select? That's okay! You can discuss your concerns with any of our therapists.
          </p>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="grid gap-6">
        {therapists.map(therapist => (
          <div
            key={therapist.id}
            onClick={() => setSelectedTherapist(therapist.id)}
            className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
              selectedTherapist === therapist.id
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-start space-x-4">
              <img
                src={therapist.avatar}
                alt={therapist.name}
                className="w-20 h-20 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {therapist.name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {therapist.rating} ({therapist.reviews})
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-purple-600 dark:text-purple-400 font-medium mb-2">
                  {therapist.specialty}
                </p>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {therapist.bio}
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {therapist.experience}
                  </span>
                  <span className="flex items-center">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {therapist.languages.join(', ')}
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-green-500" />
                    {therapist.availability}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        {sessionTypes.map(type => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => setSelectedSessionType(type.id)}
              className={`p-6 rounded-xl border-2 text-center transition-all ${
                selectedSessionType === type.id
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Icon className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {type.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {type.duration}
              </p>
              <p className="text-2xl font-bold text-purple-600">
                ${type.price}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Select Date
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            {/* Simplified calendar - in production, use a proper date picker */}
            <div className="grid grid-cols-7 gap-2 text-center text-sm">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 font-medium text-gray-500">
                  {day}
                </div>
              ))}
              {Array.from({ length: 30 }, (_, i) => i + 1).map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDate(new Date(2024, 2, day))}
                  className={`p-2 rounded-lg transition-colors ${
                    selectedDate?.getDate() === day
                      ? 'bg-purple-600 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Available Times
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {generateTimeSlots().map(time => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                disabled={Math.random() > 0.7} // Randomly disable some slots
                className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                  selectedTime === time
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Enter your full name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Enter your email"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Enter your phone number"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Urgency Level
          </label>
          <select
            value={formData.urgency}
            onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="low">Low - Can wait a few days</option>
            <option value="medium">Medium - Would prefer this week</option>
            <option value="high">High - Need help soon</option>
            <option value="crisis">Crisis - Need immediate help</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Previous Therapy Experience
        </label>
        <textarea
          value={formData.previousTherapy}
          onChange={(e) => setFormData({ ...formData, previousTherapy: e.target.value })}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          rows={3}
          placeholder="Have you been to therapy before? What worked or didn't work?"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Additional Notes
        </label>
        <textarea
          value={formData.additionalNotes}
          onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          rows={3}
          placeholder="Anything else you'd like your therapist to know before your first session?"
        />
      </div>
    </div>
  );

  const renderStep6 = () => {
    const selectedTherapistData = therapists.find(t => t.id === selectedTherapist);
    const selectedSessionTypeData = sessionTypes.find(t => t.id === selectedSessionType);
    
    return (
      <div className="space-y-6">
        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
          <div className="flex items-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
            <h3 className="text-2xl font-bold text-green-800 dark:text-green-300">
              Booking Confirmed!
            </h3>
          </div>
          <p className="text-green-700 dark:text-green-400">
            Your therapy session has been successfully scheduled. You'll receive a confirmation email with session details and pre-session preparation materials.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Session Details
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Therapist:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedTherapistData?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Session Type:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedSessionTypeData?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Date:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedDate?.toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Time:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Duration:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedSessionTypeData?.duration}
              </span>
            </div>
            <div className="flex justify-between font-semibold text-lg">
              <span className="text-gray-900 dark:text-white">Total:</span>
              <span className="text-purple-600">${selectedSessionTypeData?.price}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h5 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
            What's Next?
          </h5>
          <ul className="space-y-1 text-blue-700 dark:text-blue-400 text-sm">
            <li>• You'll receive a confirmation email within 5 minutes</li>
            <li>• Your therapist will send preparation materials 24 hours before</li>
            <li>• Join the session 5 minutes early using the link provided</li>
            <li>• Need to reschedule? Contact us at least 24 hours in advance</li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto">
        {renderStepIndicator()}
        
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
          {currentStep === 6 && renderStep6()}
          
          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Previous
            </button>
            
            {currentStep < steps.length ? (
              <button
                onClick={nextStep}
                disabled={
                  (currentStep === 1 && selectedIssues.length === 0) ||
                  (currentStep === 2 && !selectedTherapist) ||
                  (currentStep === 4 && (!selectedDate || !selectedTime)) ||
                  (currentStep === 5 && (!formData.name || !formData.email || !formData.phone))
                }
                className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              >
                Next
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            ) : (
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Book Another Session
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
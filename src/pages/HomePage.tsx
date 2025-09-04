import React, { useState } from 'react';
import { MessageCircle, Calendar, Users, BookOpen, Shield, Phone, Play, Star, TrendingUp } from 'lucide-react';
import ThreeBackground from '../components/ThreeBackground';
import ChatBot from '../components/ChatBot';

interface HomePageProps {
  onPageChange: (page: string) => void;
}

export default function HomePage({ onPageChange }: HomePageProps) {
  const [showChatBot, setShowChatBot] = useState(false);

  const features = [
    {
      icon: MessageCircle,
      title: 'AI Mental Health Chatbot',
      description: 'Get instant support with our 24/7 AI companion trained in crisis intervention and therapeutic techniques.',
      color: 'from-purple-500 to-purple-700',
      action: () => setShowChatBot(true)
    },
    {
      icon: Calendar,
      title: 'Book Therapy Sessions',
      description: 'Schedule appointments with licensed therapists who specialize in anxiety, depression, and student counseling.',
      color: 'from-blue-500 to-blue-700',
      action: () => onPageChange('booking')
    },
    {
      icon: Users,
      title: 'Peer Support Community',
      description: 'Connect anonymously with others facing similar challenges in our moderated support forums.',
      color: 'from-green-500 to-green-700',
      action: () => onPageChange('community')
    },
    {
      icon: BookOpen,
      title: 'Educational Resources',
      description: 'Access guided meditations, coping strategies, and evidence-based mental health resources.',
      color: 'from-orange-500 to-orange-700',
      action: () => onPageChange('resources')
    },
    {
      icon: Shield,
      title: 'Crisis Intervention',
      description: 'Immediate access to crisis hotlines and emergency mental health support when you need it most.',
      color: 'from-red-500 to-red-700',
      action: () => setShowChatBot(true)
    },
    {
      icon: TrendingUp,
      title: 'Progress Tracking',
      description: 'Monitor your mental health journey with mood tracking, goal setting, and wellness insights.',
      color: 'from-indigo-500 to-indigo-700',
      action: () => setShowChatBot(true)
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Lives Supported', icon: Users },
    { number: '25,000+', label: 'Sessions Completed', icon: Calendar },
    { number: '500+', label: 'Resources Available', icon: BookOpen },
    { number: '24/7', label: 'Support Available', icon: MessageCircle }
  ];

  const testimonials = [
    {
      name: 'Sarah M.',
      role: 'College Student',
      text: 'The AI chatbot helped me through my worst anxiety attacks. Having 24/7 support made all the difference.',
      rating: 5
    },
    {
      name: 'Alex R.',
      role: 'Graduate Student',
      text: 'Booking therapy sessions was so easy, and the therapists really understand student life pressures.',
      rating: 5
    },
    {
      name: 'Jamie L.',
      role: 'Community Member',
      text: 'The peer support forum made me feel less alone. Everyone is so supportive and understanding.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ThreeBackground />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 bg-clip-text text-transparent leading-tight">
            Your Journey to Mental Wellness Starts Here
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed">
            Connect with AI-powered support, licensed therapists, and a caring community. 
            Get the help you deserve, whenever you need it.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => setShowChatBot(true)}
              className="group bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-purple-500/25 flex items-center space-x-3"
            >
              <MessageCircle className="w-6 h-6" />
              <span>Start Chatting Now</span>
            </button>
            <button
              onClick={() => onPageChange('community')}
              className="group bg-white/10 backdrop-blur-md text-gray-900 dark:text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white/20 transition-all duration-300 transform hover:scale-105 border border-white/20 flex items-center space-x-3"
            >
              <Users className="w-6 h-6" />
              <span>Join Community</span>
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900 dark:text-white">
            Comprehensive Mental Health Support
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  onClick={feature.action}
                  className="group relative bg-white/10 dark:bg-gray-800/10 backdrop-blur-md rounded-3xl p-8 hover:bg-white/20 dark:hover:bg-gray-800/20 transition-all duration-300 cursor-pointer transform hover:scale-105 border border-white/20 dark:border-gray-700/20 hover:shadow-2xl"
                >
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600/10 to-blue-600/10 backdrop-blur-md">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900 dark:text-white">
            Making a Real Impact
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 font-medium">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900 dark:text-white">
            Real Stories, Real Impact
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white/10 dark:bg-gray-800/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 dark:border-gray-700/20">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
                  "{testimonial.text}"
                </p>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Crisis Support Banner */}
      <section className="py-12 px-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-md border-y border-red-300/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <Phone className="w-8 h-8 text-red-600 dark:text-red-400 mr-3" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Need Immediate Help?
            </h3>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            If you're having thoughts of self-harm or suicide, please reach out for immediate support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:988"
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Phone className="w-5 h-5" />
              <span>Call 988 - Suicide & Crisis Lifeline</span>
            </a>
            <button
              onClick={() => setShowChatBot(true)}
              className="bg-white/20 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition-colors border border-white/30"
            >
              Chat with Crisis Support
            </button>
          </div>
        </div>
      </section>

      {/* Floating Chat Button */}
      {!showChatBot && (
        <button
          onClick={() => setShowChatBot(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full shadow-2xl hover:shadow-purple-500/25 hover:scale-110 transition-all duration-300 flex items-center justify-center z-40"
          aria-label="Open chat support"
        >
          <MessageCircle className="w-7 h-7" />
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold">AI</span>
          </div>
        </button>
      )}

      <ChatBot isOpen={showChatBot} onClose={() => setShowChatBot(false)} />
    </div>
  );
}
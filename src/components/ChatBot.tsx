import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Download, Phone, AlertTriangle } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  mood?: 'positive' | 'neutral' | 'concerning' | 'crisis';
}

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatBot({ isOpen, onClose }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi there! I'm your mental health support companion. How are you feeling today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'hurt myself', 'die', 'overdose'];
  const anxietyKeywords = ['anxious', 'panic', 'worried', 'stress', 'overwhelmed', 'scared'];
  const depressionKeywords = ['depressed', 'sad', 'hopeless', 'lonely', 'worthless', 'empty'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const detectMood = (text: string): 'positive' | 'neutral' | 'concerning' | 'crisis' => {
    const lowerText = text.toLowerCase();
    
    if (crisisKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'crisis';
    }
    
    if (anxietyKeywords.some(keyword => lowerText.includes(keyword)) ||
        depressionKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'concerning';
    }
    
    const positiveKeywords = ['good', 'great', 'happy', 'better', 'excellent', 'wonderful'];
    if (positiveKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'positive';
    }
    
    return 'neutral';
  };

  const generateResponse = (userMessage: string, mood: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Crisis intervention
    if (mood === 'crisis') {
      return `I'm very concerned about what you've shared. Please know that you're not alone, and there are people who want to help you right now.

🚨 **Immediate Help Available:**
• National Suicide Prevention Lifeline: 988
• Crisis Text Line: Text HOME to 741741
• Emergency Services: 911

Would you like me to help you connect with a counselor for an appointment? Your life has value, and there are people who care about you.`;
    }
    
    // Anxiety support
    if (anxietyKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return `I understand you're feeling anxious. Let's try a quick grounding exercise:

**5-4-3-2-1 Technique:**
• 5 things you can see around you
• 4 things you can touch
• 3 things you can hear
• 2 things you can smell
• 1 thing you can taste

Take slow, deep breaths. Would you like some coping strategies for managing anxiety, or should we talk about what's causing these feelings?`;
    }
    
    // Depression support
    if (depressionKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return `I hear that you're going through a difficult time. Depression can make everything feel overwhelming, but you've taken an important step by reaching out.

**Small steps that can help:**
• Try to maintain a daily routine
• Get some sunlight or fresh air
• Connect with someone you trust
• Practice self-compassion

Remember: These feelings are temporary, even when they don't feel that way. Would you like to explore some coping strategies or talk about connecting with a professional counselor?`;
    }
    
    // Sleep issues
    if (lowerMessage.includes('sleep') || lowerMessage.includes('insomnia') || lowerMessage.includes('tired')) {
      return `Sleep issues can really impact your mental health. Here are some tips for better sleep hygiene:

**Sleep Wellness Tips:**
• Keep a consistent bedtime routine
• Limit screens 1 hour before bed
• Create a cool, dark environment
• Try relaxation techniques like deep breathing
• Avoid caffeine after 2 PM

Would you like me to guide you through a quick relaxation exercise, or do you want to discuss what might be affecting your sleep?`;
    }
    
    // Study/academic stress
    if (lowerMessage.includes('study') || lowerMessage.includes('exam') || lowerMessage.includes('school') || lowerMessage.includes('assignment')) {
      return `Academic stress is very common! Let's break this down into manageable steps:

**Study Stress Management:**
• Break large tasks into smaller, specific goals
• Use the Pomodoro Technique (25 min study, 5 min break)
• Practice self-compassion - you're doing your best
• Remember: grades don't define your worth

**Quick stress relief:**
• Take 5 deep breaths
• Do a brief walk or stretch
• Listen to calming music

Would you like specific study strategies or stress management techniques?`;
    }
    
    // Positive responses
    if (mood === 'positive') {
      return `That's wonderful to hear! I'm glad you're feeling good. Maintaining positive mental health is just as important as addressing challenges.

**Ways to maintain wellbeing:**
• Practice gratitude daily
• Stay connected with supportive people
• Engage in activities you enjoy
• Keep up healthy routines

Is there anything specific that's been helping you feel good lately? I'd love to hear about it!`;
    }
    
    // Default supportive response
    const responses = [
      "Thank you for sharing that with me. How are you feeling right now? I'm here to listen and support you.",
      "I appreciate you opening up. Would you like to talk more about what's on your mind?",
      "It sounds like you have a lot going on. What would be most helpful for you right now?",
      "I'm here to support you. Would you like some coping strategies, or would you prefer to talk through your feelings?",
      "Sometimes it helps just to have someone listen. What's been the most challenging part of your day?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)] + "\n\n💡 I can also help you book an appointment with a professional counselor if you'd like to talk to someone in person.";
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isBot: false,
      timestamp: new Date()
    };

    const mood = detectMood(input);
    userMessage.mood = mood;

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate bot thinking time
    await new Promise(resolve => setTimeout(resolve, 1000));

    const botResponse: Message = {
      id: (Date.now() + 1).toString(),
      text: generateResponse(input, mood),
      isBot: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botResponse]);
    setIsTyping(false);
  };

  const exportChat = () => {
    const chatText = messages
      .map(msg => `[${msg.timestamp.toLocaleTimeString()}] ${msg.isBot ? 'Bot' : 'You'}: ${msg.text}`)
      .join('\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mental-health-chat-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl h-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Mental Health Support</h3>
                <p className="text-sm opacity-90">AI-powered companion • Available 24/7</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={exportChat}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Export chat"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[80%] ${message.isBot ? 'order-1' : 'order-2'}`}>
                <div
                  className={`p-3 rounded-2xl ${
                    message.isBot
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                      : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                  } ${
                    message.mood === 'crisis' ? 'border-2 border-red-500' : ''
                  }`}
                >
                  {message.mood === 'crisis' && message.isBot && (
                    <div className="flex items-center space-x-2 mb-2 p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800 dark:text-red-400">Crisis Support Activated</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  <p className={`text-xs mt-2 opacity-70`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              {message.isBot && (
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3 order-2">
                  AI
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                AI
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Crisis hotline banner */}
        <div className="bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 p-3">
          <div className="flex items-center justify-center space-x-2 text-red-700 dark:text-red-400">
            <Phone className="w-4 h-4" />
            <span className="text-sm font-medium">Crisis Support: Call 988 | Text HOME to 741741</span>
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Share what's on your mind..."
              className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isTyping}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Download, Phone, AlertTriangle, Mic } from 'lucide-react';

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
  const [isRecording, setIsRecording] = useState(false); // New state for recording
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null); // New ref for SpeechSynthesis

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();

    // Initialize SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript); // Set transcribed text to input field
        setIsRecording(false);
        if (transcript.trim()) {
          // Auto-send the transcribed text
          handleSend(transcript); // Pass transcript directly to handleSend
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
        // Optionally, show a user-friendly error message
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    } else {
      console.warn('Web Speech API not supported in this browser.');
      // Optionally, disable the mic button or show a warning to the user
    }

    // Initialize SpeechSynthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    } else {
      console.warn('Text-to-Speech not supported in this browser.');
    }

    // Cleanup function to stop speech when component unmounts or chat closes
    return () => {
      synthRef.current?.cancel();
    };

  }, [messages]);

  const speak = (text: string) => {
    if (synthRef.current && text) {
      synthRef.current.cancel(); // Stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      synthRef.current.speak(utterance);
    }
  };

  const handleSend = async (voiceInput?: string) => {
    const messageToSend = voiceInput || input;
    if (!messageToSend.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageToSend,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    synthRef.current?.cancel(); // Cancel speech if user sends new message

    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      speak(botResponse.text); // Speak the bot response
    } catch (error) {
      console.error("Error communicating with backend:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting to my services right now. Please try again later.",
        isBot: true,
        timestamp: new Date(),
        mood: 'concerning'
      };
      setMessages(prev => [...prev, errorMessage]);
      speak(errorMessage.text); // Speak the error message
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceInput = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      // Request microphone permissions here if not already granted
      // For simplicity, directly start recognition. Browser will prompt.
      recognitionRef.current?.start();
      setIsRecording(true);
    }
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
              disabled={isTyping || isRecording}
            />
            <button
              onClick={handleVoiceInput} // Updated to call handleVoiceInput
              className={`p-3 rounded-xl transition-colors ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
              aria-label="Voice input"
              disabled={isTyping}
            >
              <Mic className={`w-5 h-5 ${isRecording ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`} />
            </button>
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
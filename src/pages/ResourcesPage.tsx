import React, { useState } from 'react';
import { Play, Download, BookOpen, Heart, Star, Search, Filter, Clock, User } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'article' | 'audio' | 'tool';
  category: string;
  duration?: string;
  author: string;
  rating: number;
  thumbnail: string;
  isFavorite: boolean;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

const categories = [
  { id: 'all', name: 'All Resources' },
  { id: 'anxiety', name: 'Anxiety Support' },
  { id: 'depression', name: 'Depression Help' },
  { id: 'stress', name: 'Stress Management' },
  { id: 'mindfulness', name: 'Mindfulness' },
  { id: 'sleep', name: 'Sleep Health' },
  { id: 'relationships', name: 'Relationships' },
  { id: 'academic', name: 'Academic Success' },
  { id: 'crisis', name: 'Crisis Support' }
];

const sampleResources: Resource[] = [
  {
    id: '1',
    title: '5-Minute Daily Meditation for Anxiety',
    description: 'A gentle guided meditation designed specifically for managing anxiety symptoms. Perfect for beginners and can be done anywhere.',
    type: 'audio',
    category: 'anxiety',
    duration: '5 min',
    author: 'Dr. Sarah Wellness',
    rating: 4.8,
    thumbnail: 'https://images.pexels.com/photos/3094230/pexels-photo-3094230.jpeg?auto=compress&cs=tinysrgb&w=300',
    isFavorite: false,
    tags: ['meditation', 'breathing', 'quick-relief'],
    difficulty: 'beginner'
  },
  {
    id: '2',
    title: 'Understanding Depression: A Complete Guide',
    description: 'Comprehensive article covering symptoms, causes, and treatment options for depression. Written in accessible language with practical tips.',
    type: 'article',
    category: 'depression',
    duration: '15 min read',
    author: 'Mental Health Foundation',
    rating: 4.9,
    thumbnail: 'https://images.pexels.com/photos/6931988/pexels-photo-6931988.jpeg?auto=compress&cs=tinysrgb&w=300',
    isFavorite: true,
    tags: ['education', 'symptoms', 'treatment'],
    difficulty: 'beginner'
  },
  {
    id: '3',
    title: 'Cognitive Behavioral Therapy Techniques',
    description: 'Learn practical CBT techniques you can use daily. Interactive exercises and worksheets included for hands-on practice.',
    type: 'tool',
    category: 'anxiety',
    duration: '30 min',
    author: 'CBT Institute',
    rating: 4.7,
    thumbnail: 'https://images.pexels.com/photos/7176319/pexels-photo-7176319.jpeg?auto=compress&cs=tinysrgb&w=300',
    isFavorite: false,
    tags: ['cbt', 'worksheets', 'interactive'],
    difficulty: 'intermediate'
  },
  {
    id: '4',
    title: 'Sleep Hygiene for Better Mental Health',
    description: 'Video guide on establishing healthy sleep patterns to support your mental wellbeing. Includes practical bedtime routine suggestions.',
    type: 'video',
    category: 'sleep',
    duration: '12 min',
    author: 'Dr. Michael Sleep',
    rating: 4.6,
    thumbnail: 'https://images.pexels.com/photos/3771069/pexels-photo-3771069.jpeg?auto=compress&cs=tinysrgb&w=300',
    isFavorite: false,
    tags: ['sleep-hygiene', 'routine', 'health'],
    difficulty: 'beginner'
  },
  {
    id: '5',
    title: 'Mindful Study Techniques for Academic Success',
    description: 'Combine mindfulness with effective study methods to reduce academic stress and improve focus. Perfect for students at any level.',
    type: 'article',
    category: 'academic',
    duration: '10 min read',
    author: 'Education & Wellness Center',
    rating: 4.8,
    thumbnail: 'https://images.pexels.com/photos/4145190/pexels-photo-4145190.jpeg?auto=compress&cs=tinysrgb&w=300',
    isFavorite: true,
    tags: ['study-skills', 'focus', 'stress-reduction'],
    difficulty: 'intermediate'
  },
  {
    id: '6',
    title: 'Crisis Support Planning Worksheet',
    description: 'Interactive tool to help you create a personalized crisis support plan. Includes emergency contacts and coping strategies.',
    type: 'tool',
    category: 'crisis',
    duration: '20 min',
    author: 'Crisis Prevention Network',
    rating: 4.9,
    thumbnail: 'https://images.pexels.com/photos/6146953/pexels-photo-6146953.jpeg?auto=compress&cs=tinysrgb&w=300',
    isFavorite: false,
    tags: ['crisis-planning', 'emergency', 'safety'],
    difficulty: 'beginner'
  }
];

export default function ResourcesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [resources, setResources] = useState(sampleResources);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [filterType, setFilterType] = useState('all');

  const filteredResources = resources.filter(resource => {
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || resource.type === filterType;
    
    return matchesCategory && matchesSearch && matchesType;
  }).sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'duration') {
      const getDurationMinutes = (duration: string) => {
        const match = duration.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };
      return getDurationMinutes(a.duration || '0') - getDurationMinutes(b.duration || '0');
    }
    return 0;
  });

  const toggleFavorite = (resourceId: string) => {
    setResources(prev => prev.map(resource => 
      resource.id === resourceId 
        ? { ...resource, isFavorite: !resource.isFavorite }
        : resource
    ));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Play;
      case 'article': return BookOpen;
      case 'audio': return Play;
      case 'tool': return Download;
      default: return BookOpen;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'article': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'audio': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'tool': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Mental Health Resources
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Curated educational content, tools, and resources to support your mental wellness journey
          </p>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resources by title, description, or tags..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Types</option>
                <option value="video">Videos</option>
                <option value="article">Articles</option>
                <option value="audio">Audio</option>
                <option value="tool">Tools</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="rating">Highest Rated</option>
                <option value="title">A-Z</option>
                <option value="duration">Duration</option>
              </select>
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-purple-500'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Resources Grid */}
        {filteredResources.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No resources found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search terms or category filter
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map(resource => {
              const TypeIcon = getTypeIcon(resource.type);
              return (
                <div key={resource.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="relative">
                    <img
                      src={resource.thumbnail}
                      alt={resource.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(resource.type)}`}>
                        {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleFavorite(resource.id)}
                      className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-sm transition-colors ${
                        resource.isFavorite
                          ? 'bg-red-500 text-white'
                          : 'bg-white/80 text-gray-600 hover:bg-white'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${resource.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    {resource.duration && (
                      <div className="absolute bottom-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {resource.duration}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(resource.difficulty)}`}>
                        {resource.difficulty}
                      </span>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {resource.rating}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {resource.title}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                      {resource.description}
                    </p>
                    
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <User className="w-4 h-4 mr-1" />
                      <span>{resource.author}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {resource.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                      {resource.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full">
                          +{resource.tags.length - 3}
                        </span>
                      )}
                    </div>
                    
                    <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 flex items-center justify-center space-x-2">
                      <TypeIcon className="w-5 h-5" />
                      <span>
                        {resource.type === 'video' ? 'Watch Now' :
                         resource.type === 'audio' ? 'Listen Now' :
                         resource.type === 'tool' ? 'Use Tool' : 'Read Now'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Featured Collections */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Featured Collections
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-6 rounded-xl text-white">
              <h3 className="text-xl font-semibold mb-2">Crisis Support Kit</h3>
              <p className="text-purple-100 mb-4">Essential resources for immediate mental health support and crisis intervention.</p>
              <button className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors">
                Explore Collection
              </button>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-xl text-white">
              <h3 className="text-xl font-semibold mb-2">Student Success Bundle</h3>
              <p className="text-blue-100 mb-4">Study techniques, stress management, and academic wellness resources for students.</p>
              <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
                View Bundle
              </button>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-green-700 p-6 rounded-xl text-white">
              <h3 className="text-xl font-semibold mb-2">Mindfulness Journey</h3>
              <p className="text-green-100 mb-4">Guided meditation, breathing exercises, and mindfulness practices for daily wellness.</p>
              <button className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors">
                Start Journey
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Plus, Heart, MessageCircle, Share, Flag, TrendingUp, Users, Clock, Search, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  timestamp: Date;
  likes: number;
  comments: number;
  isLiked: boolean;
  tags: string[];
  contentWarning?: string;
}

interface Comment {
  id: string;
  postId: string;
  author: string;
  content: string;
  timestamp: Date;
  likes: number;
  isLiked: boolean;
}

const categories = [
  { id: 'all', name: 'All Posts', color: 'bg-gray-100 text-gray-800' },
  { id: 'success', name: 'Success Stories', color: 'bg-green-100 text-green-800' },
  { id: 'struggles', name: 'Daily Struggles', color: 'bg-blue-100 text-blue-800' },
  { id: 'coping', name: 'Coping Strategies', color: 'bg-purple-100 text-purple-800' },
  { id: 'academic', name: 'Academic Stress', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'relationships', name: 'Relationships', color: 'bg-pink-100 text-pink-800' },
  { id: 'anxiety', name: 'Anxiety Support', color: 'bg-orange-100 text-orange-800' },
  { id: 'depression', name: 'Depression Support', color: 'bg-indigo-100 text-indigo-800' }
];

const samplePosts: Post[] = [
  {
    id: '1',
    title: 'Finally overcame my social anxiety after 2 years of therapy',
    content: `I wanted to share this with everyone because this community has been such a huge support for me. Two years ago, I couldn't even order food at a restaurant without having a panic attack. Today, I gave a presentation to 50 people at work and actually enjoyed it!

The journey wasn't easy. There were setbacks, moments where I wanted to give up, and days when progress felt impossible. But with the right therapist, medication that worked for me, and the support from communities like this, I kept going.

For anyone struggling with social anxiety: it gets better. It really does. Take it one day at a time, be patient with yourself, and don't be afraid to ask for help. You're stronger than you know. ❤️`,
    author: 'Anonymous User',
    category: 'success',
    timestamp: new Date(Date.now() - 3600000),
    likes: 127,
    comments: 23,
    isLiked: false,
    tags: ['social-anxiety', 'therapy', 'success-story', 'recovery']
  },
  {
    id: '2',
    title: 'Struggling with finals and need some encouragement',
    content: `Finals season is hitting me hard this year. I've been having panic attacks almost daily, and I can't seem to focus on studying. The pressure feels overwhelming, and I keep thinking I'm going to fail everything.

Has anyone else dealt with severe test anxiety? What helped you get through it? I've tried meditation and deep breathing, but my mind keeps racing. I feel like I'm drowning.`,
    author: 'Anonymous User',
    category: 'academic',
    timestamp: new Date(Date.now() - 7200000),
    likes: 45,
    comments: 18,
    isLiked: true,
    tags: ['test-anxiety', 'finals', 'panic-attacks', 'study-stress'],
    contentWarning: 'Academic stress, anxiety'
  },
  {
    id: '3',
    title: '5-Minute Daily Gratitude Practice That Changed My Life',
    content: `I started a simple gratitude practice 6 months ago, and it's honestly transformed how I see the world. Every morning, I write down 3 things I'm grateful for - they can be tiny things like my morning coffee or bigger things like supportive friends.

Here's what I've noticed:
- My overall mood is more stable
- I notice positive things more easily
- Bad days don't feel as overwhelming
- I sleep better at night

It sounds simple (maybe too simple?), but it's been more effective than I expected. The key is consistency - even on really tough days, I try to find something, even if it's just "I'm grateful this day is almost over."

Anyone else have a gratitude practice? What's worked for you?`,
    author: 'Anonymous User',
    category: 'coping',
    timestamp: new Date(Date.now() - 86400000),
    likes: 89,
    comments: 31,
    isLiked: false,
    tags: ['gratitude', 'mindfulness', 'daily-practice', 'mental-health']
  }
];

export default function CommunityPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [posts, setPosts] = useState(samplePosts);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'struggles',
    tags: '',
    contentWarning: ''
  });

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'recent') return b.timestamp.getTime() - a.timestamp.getTime();
    if (sortBy === 'popular') return b.likes - a.likes;
    if (sortBy === 'discussed') return b.comments - a.comments;
    return 0;
  });

  const handleLikePost = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, likes: post.isLiked ? post.likes - 1 : post.likes + 1, isLiked: !post.isLiked }
        : post
    ));
  };

  const handleSubmitPost = (e: React.FormEvent) => {
    e.preventDefault();
    
    const post: Post = {
      id: Date.now().toString(),
      title: newPost.title,
      content: newPost.content,
      author: 'Anonymous User',
      category: newPost.category,
      timestamp: new Date(),
      likes: 0,
      comments: 0,
      isLiked: false,
      tags: newPost.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      contentWarning: newPost.contentWarning || undefined
    };

    setPosts(prev => [post, ...prev]);
    setNewPost({ title: '', content: '', category: 'struggles', tags: '', contentWarning: '' });
    setShowNewPostForm(false);
  };

  return (
    <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Peer Support Community
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                A safe space for anonymous support, shared experiences, and encouragement
              </p>
            </div>
            <button
              onClick={() => setShowNewPostForm(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 flex items-center space-x-2 mt-4 md:mt-0"
            >
              <Plus className="w-5 h-5" />
              <span>Share Your Story</span>
            </button>
          </div>

          {/* Community Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">2,847</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active Members</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <MessageCircle className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">1,234</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Posts This Month</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Heart className="w-8 h-8 text-red-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">8,901</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Support Given</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">24/7</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Community Support</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts, tags, or topics..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Liked</option>
                <option value="discussed">Most Discussed</option>
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
                    : `${category.color} hover:opacity-80`
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No posts found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Try adjusting your search or category filter
                </p>
                <button
                  onClick={() => setShowNewPostForm(true)}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Start a new conversation
                </button>
              </div>
            ) : (
              filteredPosts.map(post => (
                <div key={post.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
                  {post.contentWarning && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                      <p className="text-yellow-800 dark:text-yellow-400 text-sm font-medium">
                        Content Warning: {post.contentWarning}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                      {post.author.charAt(0)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {post.author}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(post.timestamp, { addSuffix: true })}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          categories.find(c => c.id === post.category)?.color || 'bg-gray-100 text-gray-800'
                        }`}>
                          {categories.find(c => c.id === post.category)?.name}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        {post.title}
                      </h3>
                      
                      <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
                        {post.content}
                      </p>
                      
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <button
                          onClick={() => handleLikePost(post.id)}
                          className={`flex items-center space-x-1 hover:text-red-600 transition-colors ${
                            post.isLiked ? 'text-red-600' : ''
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                          <span>{post.likes}</span>
                        </button>
                        
                        <button className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.comments}</span>
                        </button>
                        
                        <button className="flex items-center space-x-1 hover:text-green-600 transition-colors">
                          <Share className="w-4 h-4" />
                          <span>Share</span>
                        </button>
                        
                        <button className="flex items-center space-x-1 hover:text-orange-600 transition-colors">
                          <Flag className="w-4 h-4" />
                          <span>Report</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Community Guidelines */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Community Guidelines
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Be kind and respectful to all members</li>
                <li>• Use content warnings for sensitive topics</li>
                <li>• No medical advice - encourage professional help</li>
                <li>• Maintain anonymity and respect privacy</li>
                <li>• Report concerning posts immediately</li>
              </ul>
            </div>

            {/* Crisis Resources */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-6">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-4">
                Crisis Resources
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-red-800 dark:text-red-300">Suicide & Crisis Lifeline</p>
                  <p className="text-red-700 dark:text-red-400">Call or Text: 988</p>
                </div>
                <div>
                  <p className="font-medium text-red-800 dark:text-red-300">Crisis Text Line</p>
                  <p className="text-red-700 dark:text-red-400">Text HOME to 741741</p>
                </div>
                <div>
                  <p className="font-medium text-red-800 dark:text-red-300">Emergency Services</p>
                  <p className="text-red-700 dark:text-red-400">Call: 911</p>
                </div>
              </div>
            </div>

            {/* Trending Topics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Trending Topics
              </h3>
              <div className="space-y-2">
                {['#finals-stress', '#anxiety-coping', '#therapy-wins', '#self-care', '#study-balance'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSearchQuery(tag.replace('#', ''))}
                    className="block w-full text-left px-3 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Post Modal */}
      {showNewPostForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Share Your Story
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Your experience could help someone else. All posts are anonymous.
              </p>
            </div>
            
            <form onSubmit={handleSubmitPost} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Give your post a descriptive title..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={newPost.category}
                  onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {categories.slice(1).map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Story *
                </label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={6}
                  placeholder="Share your experience, thoughts, or ask for support..."
                  required
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newPost.tags}
                    onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="anxiety, coping, support..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Content Warning (optional)
                  </label>
                  <input
                    type="text"
                    value={newPost.contentWarning}
                    onChange={(e) => setNewPost({ ...newPost, contentWarning: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., mentions of self-harm"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowNewPostForm(false)}
                  className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  Post Anonymously
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
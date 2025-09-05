import React, { useState, useEffect } from 'react';
import { Play, Download, BookOpen, Heart, Star, Search, Filter, Clock, User, MessageSquare, Share2, Flag, Bookmark } from 'lucide-react';
import { Resource, fetchCommunityResources, toggleResourceLike } from '../services/resourceService';
import { useAuth } from '../contexts/AuthContext'; // Assuming AuthContext provides user info

interface YouTubeVideoPlayerProps {
  videoUrl: string;
  onClose: () => void;
}

const YouTubeVideoPlayer: React.FC<YouTubeVideoPlayerProps> = ({ videoUrl, onClose }) => {
  const getYouTubeEmbedUrl = (url: string) => {
    const videoIdMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([^\s&?]+)/);
    return videoIdMatch ? `https://www.youtube.com/embed/${videoIdMatch[1]}?autoplay=1` : null;
  };

  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  if (!embedUrl) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-lg w-full">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Invalid Video URL</h3>
          <p className="text-gray-600 dark:text-gray-400">The provided YouTube URL is not valid. Please check it and try again.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="relative w-full max-w-4xl aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
        <iframe
          className="w-full h-full"
          src={embedUrl}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video player"
        ></iframe>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/75 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

interface PdfViewerProps {
  pdfUrl: string;
  onClose: () => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ pdfUrl, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="relative w-full max-w-4xl h-5/6 bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-2xl flex flex-col">
        <div className="flex justify-end p-2">
          <a 
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="mr-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Download className="w-5 h-5 mr-2" /> Download PDF
          </a>
          <button
            onClick={onClose}
            className="p-2 bg-black/50 text-white rounded-full hover:bg-black/75 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <iframe
          className="flex-grow"
          src={pdfUrl}
          title="PDF Viewer"
          frameBorder="0"
        ></iframe>
      </div>
    </div>
  );
};

interface ArticleReaderProps {
  articleUrl: string;
  onClose: () => void;
}

const ArticleReader: React.FC<ArticleReaderProps> = ({ articleUrl, onClose }) => {
  const [articleContent, setArticleContent] = useState<any | null>(null);
  const [loadingArticle, setLoadingArticle] = useState(true);
  const [articleError, setArticleError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticleContent = async () => {
      setLoadingArticle(true);
      setArticleError(null);
      try {
        const response = await fetch('http://localhost:5000/fetch_article_metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ article_url: articleUrl }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch article content');
        }

        const data = await response.json();
        setArticleContent(data);
      } catch (err: any) {
        console.error("Error fetching article content: ", err);
        setArticleError(err.message || "Failed to load article content.");
      } finally {
        setLoadingArticle(false);
      }
    };
    fetchArticleContent();
  }, [articleUrl]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-3xl w-full h-5/6 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{articleContent?.title || "Article Reader"}</h2>
          <button
            onClick={onClose}
            className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
          {loadingArticle ? (
            <p className="text-gray-600 dark:text-gray-400">Loading article...</p>
          ) : articleError ? (
            <p className="text-red-500">Error: {articleError}</p>
          ) : (
            <article className="prose dark:prose-invert max-w-none">
              {articleContent?.thumbnail && <img src={articleContent.thumbnail} alt={articleContent.title} className="w-full rounded-lg mb-4" />}
              <p className="text-gray-700 dark:text-gray-300 mb-4">{articleContent?.description}</p>
              <div dangerouslySetInnerHTML={{ __html: articleContent?.summary || 'No content available.' }} />
            </article>
          )}
        </div>
      </div>
    </div>
  );
};

interface ResourceMetadata {
  title?: string;
  thumbnail?: string;
  duration?: number; // for videos (in seconds)
  authors?: string[]; // for research papers
  publishDate?: Date; // Convert Firestore Timestamp to JS Date
  summary?: string;
  viewCount?: number; // For YouTube videos
  uploadDate?: Date; // For YouTube videos
}

interface Resource {
  id: string; // Corresponds to postId
  userId: string;
  userDisplayName: string;
  userPhotoURL: string;
  title: string;
  description: string;
  resourceType: 'youtube' | 'research_paper' | 'article' | 'funny_video'; // Updated types
  resourceURL: string;
  resourceMetadata?: ResourceMetadata;
  tags: string[];
  likes: number;
  likedBy: string[];
  createdAt: Date;
  updatedAt: Date;
  // Existing fields from ResourcesPage.tsx that are not directly in communityPosts schema but relevant for display/filtering
  category: string;
  rating: number; // For overall resource rating, or funny video rating
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
  // REMOVE THIS BLOCK - It will be replaced by data from Firestore
];

export default function ResourcesPage() {
  const { user } = useAuth(); // Get current user from AuthContext
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [resources, setResources] = useState<Resource[]>([]); // Initialize as empty array
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date'); // Default sort by date
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null); // State for video player
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null); // State for PDF viewer
  const [selectedArticleUrl, setSelectedArticleUrl] = useState<string | null>(null); // New state for article reader

  useEffect(() => {
    const getResources = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedResources = await fetchCommunityResources({
          category: selectedCategory,
          resourceType: filterType,
          sortBy: sortBy,
          searchQuery: searchQuery,
        });
        setResources(fetchedResources);
      } catch (err) {
        console.error("Failed to fetch resources:", err);
        setError("Failed to load resources. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    getResources();
  }, [selectedCategory, filterType, sortBy, searchQuery]);

  const filteredResources = resources.filter(resource => {
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (resource.resourceMetadata?.summary?.toLowerCase().includes(searchQuery.toLowerCase())) || // Search summary as well
      resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || resource.resourceType === filterType;
    
    return matchesCategory && matchesSearch && matchesType;
  }); 

  const handleToggleLike = async (resourceId: string, isCurrentlyLiked: boolean) => {
    if (!user) {
      alert("You need to be logged in to like resources.");
      return;
    }
    try {
      await toggleResourceLike(resourceId, user.uid, isCurrentlyLiked);
      setResources(prev => prev.map(resource => {
        if (resource.id === resourceId) {
          const newLikes = isCurrentlyLiked ? resource.likes - 1 : resource.likes + 1;
          const newLikedBy = isCurrentlyLiked 
            ? resource.likedBy.filter(id => id !== user.uid)
            : [...resource.likedBy, user.uid];
          return { ...resource, likes: newLikes, likedBy: newLikedBy };
        }
        return resource;
      }));
    } catch (e) {
      console.error("Error toggling like: ", e);
      alert("Failed to update like status. Please try again.");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'youtube': return Play;
      case 'research_paper': return BookOpen;
      case 'article': return BookOpen;
      case 'funny_video': return Play; 
      default: return BookOpen;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'youtube': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'research_paper': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'article': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'funny_video': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
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

  // Function to open the video player modal
  const openVideoPlayer = (url: string) => {
    setSelectedVideoUrl(url);
  };

  // Function to close the video player modal
  const closeVideoPlayer = () => {
    setSelectedVideoUrl(null);
  };

  // Function to open the PDF viewer modal
  const openPdfViewer = (url: string) => {
    setSelectedPdfUrl(url);
  };

  // Function to close the PDF viewer modal
  const closePdfViewer = () => {
    setSelectedPdfUrl(null);
  };

  // Function to open the Article reader modal
  const openArticleReader = (url: string) => {
    setSelectedArticleUrl(url);
  };

  // Function to close the Article reader modal
  const closeArticleReader = () => {
    setSelectedArticleUrl(null);
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
                <option value="youtube">YouTube Videos</option>
                <option value="research_paper">Research Papers</option>
                <option value="article">Articles</option>
                <option value="funny_video">Funny Videos</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="date">Newest</option>
                <option value="popularity">Most Liked</option>
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

        {/* Loading and Error States */}
        {loading && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">Loading resources...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-red-500">
            <p>{error}</p>
          </div>
        )}

        {/* Resources Grid */}
        {!loading && !error && filteredResources.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No resources found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search terms or category filter
            </p>
          </div>
        ) : (!loading && !error && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map(resource => {
              const TypeIcon = getTypeIcon(resource.resourceType);
              const isLiked = user ? resource.likedBy.includes(user.uid) : false;

              const handleResourceClick = () => {
                if (resource.resourceType === 'youtube' || resource.resourceType === 'funny_video') {
                  openVideoPlayer(resource.resourceURL);
                } else if (resource.resourceType === 'research_paper') {
                  openPdfViewer(resource.resourceURL); 
                } else if (resource.resourceType === 'article') {
                  openArticleReader(resource.resourceURL); // Open article in reader mode
                }
              };

              return (
                <div key={resource.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="relative">
                    <img
                      src={resource.resourceMetadata?.thumbnail || 'https://via.placeholder.com/300x200'}
                      alt={resource.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(resource.resourceType)}`}>
                        {resource.resourceType.charAt(0).toUpperCase() + resource.resourceType.slice(1)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleLike(resource.id!, isLiked)}
                      className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-sm transition-colors ${
                        isLiked
                          ? 'bg-red-500 text-white'
                          : 'bg-white/80 text-gray-600 hover:bg-white'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    </button>
                    {resource.resourceMetadata?.duration && (
                      <div className="absolute bottom-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {Math.floor(resource.resourceMetadata.duration / 60)}m {resource.resourceMetadata.duration % 60}s
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
                          {resource.rating} ({resource.likes})
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
                      <span>{resource.userDisplayName}</span>
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
                    
                    <button 
                      onClick={handleResourceClick}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 flex items-center justify-center space-x-2">
                      <TypeIcon className="w-5 h-5" />
                      <span>
                        {resource.resourceType === 'youtube' || resource.resourceType === 'funny_video' ? 'Watch Now' :
                         resource.resourceType === 'research_paper' ? 'View PDF' :
                         resource.resourceType === 'article' ? 'Read Now' : 'View Resource'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {selectedVideoUrl && (
          <YouTubeVideoPlayer videoUrl={selectedVideoUrl} onClose={closeVideoPlayer} />
        )}

        {selectedPdfUrl && (
          <PdfViewer pdfUrl={selectedPdfUrl} onClose={closePdfViewer} />
        )}

        {selectedArticleUrl && (
          <ArticleReader articleUrl={selectedArticleUrl} onClose={closeArticleReader} />
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
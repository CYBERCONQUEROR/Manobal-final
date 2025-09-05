import React, { useState, useEffect } from 'react';
import { Plus, Heart, MessageCircle, Share, Flag, TrendingUp, Users, Clock, Search, Filter } from 'lucide-react'; // Removed X
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth
import { db } from '../firebase'; // Import db from firebase
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, where, updateDoc, doc, arrayUnion, arrayRemove, increment, getDoc, FieldValue, deleteDoc } from "firebase/firestore";
import { Document, Page, pdfjs } from 'react-pdf'; // New imports for react-pdf
import 'react-pdf/dist/Page/AnnotationLayer.css'; // Default styles
import 'react-pdf/dist/Page/TextLayer.css'; // Default styles

// Configure pdfjs worker source (important!)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface Post {
  id: string;
  title?: string; // Made optional
  content?: string; // Made optional
  author: string;
  category: string;
  timestamp: Date; // Keep as Date for client-side sorting and display
  likes: number;
  comments: number;
  isLiked: boolean;
  tags: string[];
  contentWarning?: string | null; // Allow null as per previous fix
  userId: string; // Add userId to Post interface for internal use
  likedBy?: string[]; // New: Array to store UIDs of users who liked the post
  rating?: number; // New: Average rating for funny videos
  ratedBy?: string[]; // New: Array to store UIDs of users who rated the post
  
  // New fields for shared resources
  resourceType?: "youtube" | "research_paper" | "article" | "funny_video" | "story"; // 'story' is the default if no resource
  resourceURL?: string;
  resourceMetadata?: {
    title?: string;
    thumbnail?: string;
    duration?: number; // for videos
    authors?: string[]; // for research papers
    publishDate?: Date; // Convert Firestore Timestamp to JS Date, or undefined if not set
    summary?: string; // For articles and potentially videos
    viewCount?: string; // for videos (YouTube API returns string)
    uploadDate?: Date; // for videos (Firestore Timestamp converted to Date)
    favicon?: string; // For articles
    url?: string; // For articles, to store the canonical URL if different
  };
}

// New: Define interface for FunnyPlaylist
interface FunnyPlaylist {
  id: string;
  name: string;
  createdAt: Date;
  videoIds: string[]; // Array of communityPost IDs (funny videos)
}

// New: Define interface for Comment
interface Comment {
  id: string;
  postId: string;
  author: string;
  userId: string;
  content?: string; // Made optional
  timestamp: Date;
}

// Type for data actually sent to Firestore, allowing FieldValue for timestamps
interface FirestorePostData extends Omit<Post, 'timestamp' | 'resourceMetadata' | 'id'> {
  timestamp: FieldValue;
  resourceMetadata?: Omit<NonNullable<Post['resourceMetadata']>, 'publishDate' | 'uploadDate'> & {
    publishDate?: FieldValue;
    uploadDate?: FieldValue;
  };
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

// Add new resource types to categories for the dropdown
const resourceCategories: { id: "youtube" | "research_paper" | "article" | "funny_video" | "story"; name: string; color: string; }[] = [
  { id: 'story', name: 'Personal Story', color: 'bg-gray-100 text-gray-800' },
  { id: 'youtube', name: 'YouTube Video', color: 'bg-red-100 text-red-800' },
  { id: 'funny_video', name: 'Funny Video', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'research_paper', name: 'Research Paper', color: 'bg-blue-100 text-blue-800' },
  { id: 'article', name: 'Web Article', color: 'bg-green-100 text-green-800' },
];

const funnyTags = [
  'comedy',
  'humor',
  'funny',
  'memes',
  'lol',
  'lighthearted',
];

// Removed samplePosts as they will be fetched from Firestore

export default function CommunityPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [posts, setPosts] = useState<Post[]>([]); // Initialize as empty array
  const [isFetchingPosts, setIsFetchingPosts] = useState(true); // New state for loading
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedResourceType, setSelectedResourceType] = useState<Post['resourceType'] | 'all'>('all'); // New state for resource type filter
  const { user } = useAuth(); // Get authenticated user
  const [newPost, setNewPost] = useState<{
    title: string;
    content: string;
    category: string;
    tags: string;
    contentWarning: string;
    resourceType: "youtube" | "research_paper" | "article" | "funny_video" | "story";
    resourceURL: string;
    selectedFunnyTags: string[]; // New state for funny video tags
  }>({
    title: '',
    content: '',
    category: 'struggles',
    tags: '',
    contentWarning: '',
    resourceType: 'story', // Default to story
    resourceURL: '',
    selectedFunnyTags: [], // Initialize as an empty array
  });

  const [youtubeMetadata, setYoutubeMetadata] = useState<NonNullable<Post['resourceMetadata']> | null>(null);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  // New states for PDF metadata
  const [pdfMetadata, setPdfMetadata] = useState<NonNullable<Post['resourceMetadata']> | null>(null);
  const [isFetchingPdfMetadata, setIsFetchingPdfMetadata] = useState(false);
  const [pdfMetadataError, setPdfMetadataError] = useState<string | null>(null);

  // New states for Article metadata
  const [articleMetadata, setArticleMetadata] = useState<NonNullable<Post['resourceMetadata']> | null>(null);
  const [isFetchingArticleMetadata, setIsFetchingArticleMetadata] = useState(false);
  const [articleMetadataError, setArticleMetadataError] = useState<string | null>(null);

  // New states for citation generation
  const [showCitationsModal, setShowCitationsModal] = useState(false);
  const [currentCitations, setCurrentCitations] = useState<Record<string, string> | null>(null);
  const [isGeneratingCitations, setIsGeneratingCitations] = useState(false);
  const [citationError, setCitationError] = useState<string | null>(null);

  // New states for PDF full-text search
  const [pdfSearchQuery, setPdfSearchQuery] = useState('');
  const [pdfSearchResults, setPdfSearchResults] = useState<any[] | null>(null);
  const [isSearchingPdf, setIsSearchingPdf] = useState(false);
  const [pdfSearchError, setPdfSearchError] = useState<string | null>(null);

  // New state for saving resources
  const [isSavingResource, setIsSavingResource] = useState(false);

  // New states for Article Reader Mode
  const [showReaderModal, setShowReaderModal] = useState(false);
  const [currentArticleContent, setCurrentArticleContent] = useState<any | null>(null);
  const [isFetchingArticleContent, setIsFetchingArticleContent] = useState(false);
  const [articleContentError, setArticleContentError] = useState<string | null>(null);

  // New states for user's saved resources
  const [savedResources, setSavedResources] = useState<Post[]>([]);
  const [isFetchingSavedResources, setIsFetchingSavedResources] = useState(false);

  // New states for funny video recommendations
  const [recommendedFunnyVideos, setRecommendedFunnyVideos] = useState<Post[]>([]);
  const [isFetchingRecommendations, setIsFetchingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);

  // New states for comments modal
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [currentPostComments, setCurrentPostComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [selectedPostForComments, setSelectedPostForComments] = useState<Post | null>(null);

  // New states for funny video playlists
  const [userPlaylists, setUserPlaylists] = useState<FunnyPlaylist[]>([]);
  const [isFetchingPlaylists, setIsFetchingPlaylists] = useState(false);
  const [playlistError, setPlaylistError] = useState<string | null>(null);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedVideosForPlaylist, setSelectedVideosForPlaylist] = useState<string[]>([]); // To hold IDs of videos to add
  const [showAddVideoToPlaylistModal, setShowAddVideoToPlaylistModal] = useState(false);
  const [selectedPostForPlaylist, setSelectedPostForPlaylist] = useState<Post | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsFetchingPosts(true);
      try {
        const postsCollectionRef = collection(db, "communityPosts");
        let q = query(postsCollectionRef, orderBy('timestamp', 'desc'));

        if (selectedCategory !== 'all') {
          q = query(q, where('category', '==', selectedCategory));
        }

        if (selectedResourceType !== 'all') {
          q = query(q, where('resourceType', '==', selectedResourceType));
        }

        const querySnapshot = await getDocs(q);
        const fetchedPosts = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const resourceMetadata = data.resourceMetadata ? {
            ...data.resourceMetadata,
            publishDate: data.resourceMetadata.publishDate?.toDate(), // Convert to Date
            uploadDate: data.resourceMetadata.uploadDate?.toDate(), // Convert to Date
          } : undefined;

          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp.toDate(), // Convert Firestore Timestamp to JS Date
            isLiked: user ? (data.likedBy?.includes(user.id) || false) : false, // Determine isLiked status here
            likedBy: data.likedBy || [], // Ensure likedBy is always an array
            resourceMetadata: resourceMetadata,
            title: data.title || resourceMetadata?.title || '(No Title)', // Ensure title is always a string
            content: data.content || '', // Ensure content is always a string
            author: data.author || 'Anonymous User', // Ensure author is always a string
          } as Post;
        });

        setPosts(fetchedPosts);

      } catch (error) {
        console.error("Error fetching community posts:", error);
      } finally {
        setIsFetchingPosts(false);
      }
    };

    fetchPosts();
  }, [selectedCategory, user?.id, selectedResourceType]); // Re-fetch when category changes and user is logged in

  // Effect to fetch YouTube metadata
  useEffect(() => {
    const youtubeRegex = /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([^\s&?]+)/;

    const fetchMetadata = async () => {
      if ((newPost.resourceType === 'youtube' || newPost.resourceType === 'funny_video') && newPost.resourceURL && youtubeRegex.test(newPost.resourceURL)) {
        setIsFetchingMetadata(true);
        setMetadataError(null);
        setYoutubeMetadata(null); // Clear previous metadata on new fetch

        try {
          const response = await fetch('https://manobal-finall.onrender.com/fetch_youtube_metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ youtube_url: newPost.resourceURL }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch YouTube metadata');
          }

          const data = await response.json();
          setYoutubeMetadata({
            title: data.metadata.title,
            thumbnail: data.metadata.thumbnail,
            duration: data.metadata.duration,
            viewCount: data.metadata.viewCount, // This is a string from YouTube API
            uploadDate: data.metadata.uploadDate ? new Date(data.metadata.uploadDate) : undefined,
          });
        } catch (error) {
          console.error("Error fetching YouTube metadata:", error);
          setMetadataError((error as Error).message);
          setYoutubeMetadata(null); // Clear on error
        } finally {
          setIsFetchingMetadata(false);
        }
      } else {
        setYoutubeMetadata(null); // Clear when not a YouTube resource
        setMetadataError(null);
      }
    };

    // Debounce the fetch to avoid too many requests
    const handler = setTimeout(() => {
      fetchMetadata();
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [newPost.resourceURL, newPost.resourceType]);

  // Effect to fetch PDF metadata
  useEffect(() => {
    const fetchPdfMetadata = async () => {
      if (newPost.resourceType === 'research_paper' && newPost.resourceURL && newPost.resourceURL.endsWith('.pdf')) {
        setIsFetchingPdfMetadata(true);
        setPdfMetadataError(null);
        setPdfMetadata(null); // Clear previous metadata on new fetch

        try {
          const response = await fetch('https://manobal-finall.onrender.com/fetch_pdf_metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pdf_url: newPost.resourceURL }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch PDF metadata');
          }

          const data = await response.json();
          setPdfMetadata({
            title: data.metadata.title,
            authors: data.metadata.author ? [data.metadata.author] : undefined, // Convert author string to array if exists
            publishDate: data.metadata.creationDate ? new Date(data.metadata.creationDate) : undefined,
            // Other PDF-specific metadata can be added here
          });
        } catch (error) {
          console.error("Error fetching PDF metadata:", error);
          setPdfMetadataError((error as Error).message);
          setPdfMetadata(null); // Clear on error
        } finally {
          setIsFetchingPdfMetadata(false);
        }
      } else {
        setPdfMetadata(null); // Clear when not a research paper resource
        setPdfMetadataError(null);
      }
    };

    const handler = setTimeout(() => {
      fetchPdfMetadata();
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [newPost.resourceURL, newPost.resourceType]);

  // Effect to fetch Article metadata
  useEffect(() => {
    const fetchArticleMetadata = async () => {
      if (newPost.resourceType === 'article' && newPost.resourceURL) {
        setIsFetchingArticleMetadata(true);
        setArticleMetadataError(null);
        setArticleMetadata(null); // Clear previous metadata on new fetch

        try {
          const response = await fetch('https://manobal-finall.onrender.com/fetch_article_metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ article_url: newPost.resourceURL }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch article metadata');
          }

          const data = await response.json();
          setArticleMetadata({
            title: data.metadata.title,
            summary: data.metadata.summary,
            favicon: data.metadata.favicon,
            url: data.metadata.url, // Store the canonical URL
          });
        } catch (error) {
          console.error("Error fetching article metadata:", error);
          setArticleMetadataError((error as Error).message);
          setArticleMetadata(null); // Clear on error
        } finally {
          setIsFetchingArticleMetadata(false);
        }
      } else {
        setArticleMetadata(null); // Clear when not an article resource
        setArticleMetadataError(null);
      }
    };

    const handler = setTimeout(() => {
      fetchArticleMetadata();
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [newPost.resourceURL, newPost.resourceType]);

  // Filter and sort posts locally based on fetched data
  const filteredPosts = posts.filter(post => {
    // Category filtering is now handled by Firestore query in useEffect
    const matchesSearch = searchQuery === '' || 
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) || // Use optional chaining for title
      post.content?.toLowerCase().includes(searchQuery.toLowerCase()) || // Use optional chaining for content
      (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (post.resourceMetadata?.title && post.resourceMetadata.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (post.resourceMetadata?.authors && post.resourceMetadata.authors.some(author => author.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (post.resourceMetadata?.summary && post.resourceMetadata.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'recent') return b.timestamp.getTime() - a.timestamp.getTime();
    if (sortBy === 'popular') return b.likes - a.likes;
    if (sortBy === 'discussed') return b.comments - a.comments;
    return 0;
  });

  const handleLikePost = async (postId: string) => {
    if (!user) {
      alert("You must be logged in to like a post.");
      return;
    }

    try {
      const postRef = doc(db, "communityPosts", postId);
      const postDoc = await getDoc(postRef); // Fetch the current post document

      if (!postDoc.exists()) {
        console.error("Post not found!");
        return;
      }

      const currentPostData = postDoc.data() as Post;
      const currentLikedBy = currentPostData.likedBy || [];
      const hasLiked = currentLikedBy.includes(user.id);

      if (hasLiked) {
        // User already liked, unlike it
        await updateDoc(postRef, {
          likes: increment(-1),
          likedBy: arrayRemove(user.id)
        });
    setPosts(prev => prev.map(post => 
      post.id === postId 
            ? { ...post, likes: post.likes - 1, isLiked: false, likedBy: post.likedBy?.filter(id => id !== user.id) || [] } // Safely filter
        : post
    ));
      } else {
        // User did not like, like it
        await updateDoc(postRef, {
          likes: increment(1),
          likedBy: arrayUnion(user.id)
        });
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, likes: post.likes + 1, isLiked: true, likedBy: [...(post.likedBy || []), user.id] } // Safely spread
            : post
        ));
      }
    } catch (error) {
      console.error("Error handling like/unlike:", error);
      alert("Failed to update like status. Please try again.");
    }
  };

  const handleOpenComments = async (post: Post) => {
    if (!user) {
      alert("You must be logged in to view or post comments.");
      return;
    }
    setSelectedPostForComments(post);
    setCommentInput(''); // Clear previous comment input
    setCurrentPostComments([]); // Clear previous comments
    setShowCommentsModal(true);

    try {
      const commentsCollectionRef = collection(db, "communityPosts", post.id, "comments");
      const q = query(commentsCollectionRef, orderBy('timestamp', 'asc'));
      const querySnapshot = await getDocs(q);
      const fetchedComments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      })) as Comment[];
      setCurrentPostComments(fetchedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      alert("Failed to fetch comments. Please try again.");
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !selectedPostForComments || commentInput.trim() === '') {
      alert("Please enter a comment and ensure you are logged in.");
      return;
    }

    try {
      const newCommentData = {
        postId: selectedPostForComments.id,
        author: 'Anonymous User', // Comments are also anonymous
        userId: user.id,
        content: commentInput.trim(),
        timestamp: serverTimestamp(),
      };

      const commentsCollectionRef = collection(db, "communityPosts", selectedPostForComments.id, "comments");
      const docRef = await addDoc(commentsCollectionRef, newCommentData);
      console.log("Comment added with ID:", docRef.id);

      // Update post's comment count
      const postRef = doc(db, "communityPosts", selectedPostForComments.id);
      await updateDoc(postRef, {
        comments: increment(1)
      });

      // Update local state
      const tempComment: Comment = {
        id: docRef.id,
        ...newCommentData,
        timestamp: new Date(), // For immediate display
      };
      setCurrentPostComments(prev => [...prev, tempComment]);
      setCommentInput('');

      // Also update the comments count in the main posts state
      setPosts(prev => prev.map(post => 
        post.id === selectedPostForComments.id 
          ? { ...post, comments: post.comments + 1 }
          : post
      ));

    } catch (error) {
      console.error("Error adding comment:", error);
      alert(`Failed to post comment: ${(error as Error).message}. Please try again.`);
    }
  };

  const handleGenerateCitations = async (post: Post) => {
    if (!post.resourceMetadata?.title || !post.resourceMetadata?.authors || !post.resourceMetadata?.publishDate) {
      alert("Missing metadata for citation generation.");
      return;
    }

    setIsGeneratingCitations(true);
    setCitationError(null);
    setCurrentCitations(null);

    try {
      const response = await fetch('https://manobal-finall.onrender.com/generate_citation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: post.resourceMetadata.title,
          authors: post.resourceMetadata.authors,
          publishDate: post.resourceMetadata.publishDate.toISOString(), // Send as ISO string
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate citations');
      }

      const data = await response.json();
      setCurrentCitations(data);
      setShowCitationsModal(true);
    } catch (error) {
      console.error("Error generating citations:", error);
      setCitationError((error as Error).message);
    } finally {
      setIsGeneratingCitations(false);
    }
  };

  const handleSearchPdf = async (pdfUrl: string, query: string) => {
    if (!pdfUrl || !query.trim()) {
      setPdfSearchError("Please provide both a PDF URL and a search query.");
      setPdfSearchResults(null);
      return;
    }

    setIsSearchingPdf(true);
    setPdfSearchError(null);
    setPdfSearchResults(null);

    try {
      const response = await fetch('https://manobal-finall.onrender.com/search_pdf_text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdf_url: pdfUrl,
          search_query: query,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search PDF text');
      }

      const data = await response.json();
      if (data.results.length === 0) {
        setPdfSearchError('No matches found.');
      } else {
        setPdfSearchResults(data.results);
      }
    } catch (error) {
      console.error("Error searching PDF:", error);
      setPdfSearchError((error as Error).message);
    } finally {
      setIsSearchingPdf(false);
    }
  };

  const handleSaveResource = async (post: Post) => {
    if (!user) {
      alert("You must be logged in to save resources.");
      return;
    }

    if (!post.resourceType || !post.resourceURL) {
      alert("This post is not a savable resource.");
      return;
    }

    setIsSavingResource(true);

    try {
      const userResourceRef = collection(db, `users/${user.id}/resources`);
      
      // Check if the resource already exists in the user's collection
      const q = query(userResourceRef, where("resourceURL", "==", post.resourceURL));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Resource is already saved, so unsave it
        const docToRemove = querySnapshot.docs[0];
        await deleteDoc(doc(db, `users/${user.id}/resources`, docToRemove.id));
        setSavedResources(prev => prev.filter(res => res.resourceURL !== post.resourceURL));
        alert("Resource unsaved from your collection!");
      } else {
        // Resource is not saved, so save it
        const newResourceDocRef = await addDoc(userResourceRef, {
          communityPostId: post.id,
          resourceType: post.resourceType,
          resourceURL: post.resourceURL,
          resourceMetadata: post.resourceMetadata || null,
          savedAt: serverTimestamp(),
        });

        // Update local state with the newly saved resource for immediate display
        const tempSavedResource: Post = {
          id: newResourceDocRef.id,
          title: post.resourceMetadata?.title || post.title || '(No Title)',
          content: post.content || '',
          author: post.author || 'Anonymous User',
          category: post.category || 'resource',
          timestamp: new Date(), // For immediate display
          likes: 0,
          comments: 0,
          isLiked: false,
          tags: post.tags || [],
          contentWarning: post.contentWarning || null,
          userId: user.id,
          resourceType: post.resourceType,
          resourceURL: post.resourceURL,
          resourceMetadata: post.resourceMetadata,
        };
        setSavedResources(prev => [tempSavedResource, ...prev]);
        alert("Resource saved to your collection!");
      }
    } catch (error) {
      console.error("Error saving/unsaving resource:", error);
      alert("Failed to update resource save status. Please try again.");
    } finally {
      setIsSavingResource(false);
    }
  };

  const handleRateFunnyVideo = async (postId: string, newRating: number) => {
    if (!user) {
      alert("You must be logged in to rate a video.");
      return;
    }

    if (newRating < 1 || newRating > 5) {
      alert("Rating must be between 1 and 5.");
      return;
    }

    try {
      const postRef = doc(db, "communityPosts", postId);
      const postDoc = await getDoc(postRef);

      if (!postDoc.exists()) {
        console.error("Post not found!");
        return;
      }

      const currentPostData = postDoc.data() as Post;
      const currentRatedBy = currentPostData.ratedBy || [];
      const hasRated = currentRatedBy.includes(user.id);

      let updatedRating = currentPostData.rating || 0;
      let updatedRatedBy = [...currentRatedBy];

      if (hasRated) {
        alert("You have already rated this video.");
        return;
      } else {
        // Add new rating
        updatedRatedBy.push(user.id);
        const totalRatings = updatedRatedBy.length;
        
        // This is a simplified average. For a more robust system, store individual ratings.
        // For now, we'll assume initial rating is based on current user's rating.
        // For an accurate average, you'd need to fetch all ratings or store sum/count.
        updatedRating = ((currentPostData.rating || 0) * (totalRatings - 1) + newRating) / totalRatings;
      }

      await updateDoc(postRef, {
        rating: updatedRating,
        ratedBy: updatedRatedBy,
      });

      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, rating: updatedRating, ratedBy: updatedRatedBy } 
          : post
      ));
      alert("Thank you for rating!");

    } catch (error) {
      console.error("Error rating video:", error);
      alert("Failed to submit rating. Please try again.");
    }
  };

  const handleOpenReaderMode = async (articleUrl: string) => {
    if (!articleUrl) {
      alert("No article URL provided.");
      return;
    }

    setShowReaderModal(true);
    setIsFetchingArticleContent(true);
    setCurrentArticleContent(null);
    setArticleContentError(null);

    try {
      const response = await fetch('https://manobal-finall.onrender.com/fetch_article_content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_url: articleUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch article content');
      }

      const data = await response.json();
      setCurrentArticleContent(data);
    } catch (error) {
      console.error("Error fetching article content:", error);
      setArticleContentError((error as Error).message);
    } finally {
      setIsFetchingArticleContent(false);
    }
  };

  // Effect to fetch user's saved resources
  useEffect(() => {
    const fetchSavedResources = async () => {
      if (!user) {
        setSavedResources([]);
        return;
      }

      setIsFetchingSavedResources(true);
      try {
        const userResourcesCollectionRef = collection(db, `users/${user.id}/resources`);
        const q = query(userResourcesCollectionRef, orderBy('savedAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const fetchedResources = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const resourceMetadata = data.resourceMetadata ? {
            ...data.resourceMetadata,
            publishDate: data.resourceMetadata.publishDate?.toDate(), // Convert to Date
            uploadDate: data.resourceMetadata.uploadDate?.toDate(), // Convert to Date
          } : undefined;
          
          return {
            id: doc.id,
            title: data.resourceMetadata?.title || data.title || '(No Title)',
            content: data.content || '',
            author: data.author || 'Anonymous User',
            category: data.category || 'resource', // Default category for saved resources
            timestamp: data.savedAt.toDate(), // Use savedAt for sorting
            likes: 0, // Saved resources don't have likes/comments directly
            comments: 0,
            isLiked: false,
            tags: data.tags || [],
            contentWarning: data.contentWarning || null,
            userId: user.id,
            resourceType: data.resourceType,
            resourceURL: data.resourceURL,
            resourceMetadata: resourceMetadata,
          } as Post;
        });
        setSavedResources(fetchedResources);
      } catch (error) {
        console.error("Error fetching saved resources:", error);
      } finally {
        setIsFetchingSavedResources(false);
      }
    };

    fetchSavedResources();
  }, [user]); // Re-fetch when user changes

  // Effect to fetch funny video recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user) {
        setRecommendedFunnyVideos([]);
        return;
      }

      setIsFetchingRecommendations(true);
      setRecommendationError(null);
      try {
        const response = await fetch('https://manobal-finall.onrender.com/recommend_funny_videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch recommendations');
        }

        const data = await response.json();
        // Convert Firebase Timestamps in metadata to Date objects
        const recommendationsWithDates = data.recommendations.map((rec: any) => {
          if (rec.resourceMetadata?.uploadDate?.seconds) {
            rec.resourceMetadata.uploadDate = new Date(rec.resourceMetadata.uploadDate.seconds * 1000);
          }
          return rec;
        }) as Post[];
        setRecommendedFunnyVideos(recommendationsWithDates);

      } catch (error) {
        console.error("Error fetching recommendations:", error);
        setRecommendationError((error as Error).message);
      } finally {
        setIsFetchingRecommendations(false);
      }
    };

    fetchRecommendations();
  }, [user]); // Re-fetch when user changes

  // Effect to fetch user's funny video playlists
  useEffect(() => {
    const fetchUserPlaylists = async () => {
      if (!user) {
        setUserPlaylists([]);
        return;
      }

      setIsFetchingPlaylists(true);
      setPlaylistError(null);
      try {
        const playlistsCollectionRef = collection(db, `users/${user.id}/funnyPlaylists`);
        const q = query(playlistsCollectionRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const fetchedPlaylists = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          createdAt: doc.data().createdAt.toDate(),
          videoIds: doc.data().videoIds || [],
        })) as FunnyPlaylist[];
        setUserPlaylists(fetchedPlaylists);
      } catch (error) {
        console.error("Error fetching user playlists:", error);
        setPlaylistError((error as Error).message);
      } finally {
        setIsFetchingPlaylists(false);
      }
    };

    fetchUserPlaylists();
  }, [user]); // Re-fetch when user changes

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert("You must be logged in to post.");
      return;
    }

    // Validation for content/URL based on resource type
    if (newPost.resourceType === 'story' && (!newPost.title.trim() || !newPost.content.trim())) {
      alert("Please provide both a title and your story content.");
      return;
    }

    if ((newPost.resourceType === 'youtube' || newPost.resourceType === 'funny_video') && (!newPost.title.trim() && !youtubeMetadata?.title || !newPost.resourceURL.trim() || !youtubeMetadata || !youtubeMetadata.title)) {
      alert("Please provide a title and a valid YouTube URL, and wait for the preview to load.");
      return;
    }

    if (newPost.resourceType === 'research_paper' && (!newPost.title.trim() && !pdfMetadata?.title || !newPost.resourceURL.trim() || !newPost.resourceURL.endsWith('.pdf'))) {
      alert("Please provide a title and a valid PDF URL for the research paper, and wait for metadata to load.");
      return;
    }

    if (newPost.resourceType === 'article' && (!newPost.title.trim() && !articleMetadata?.title || !newPost.resourceURL.trim() || !articleMetadata || !articleMetadata.title)) {
      alert("Please provide a title and a valid Article URL, and wait for the preview to load.");
      return;
    }

    const basePostData = {
      title: newPost.title.trim() || youtubeMetadata?.title || pdfMetadata?.title || articleMetadata?.title || '(No Title)',
      author: 'Anonymous User',
      category: newPost.category,
      likes: 0,
      comments: 0,
      isLiked: false,
      tags: newPost.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      contentWarning: newPost.contentWarning || null,
      timestamp: serverTimestamp(),
      userId: user.id,
      likedBy: [],
      resourceType: newPost.resourceType as Post['resourceType'], // Explicitly cast here
    };

    // Append selectedFunnyTags if the resourceType is funny_video
    if (newPost.resourceType === 'funny_video' && newPost.selectedFunnyTags.length > 0) {
      basePostData.tags = [...basePostData.tags, ...newPost.selectedFunnyTags];
    }

    let firestorePostData: FirestorePostData = {
      ...basePostData,
      content: '', // Initialize content to empty string for FirestorePostData
    };

    if (newPost.resourceType === 'story') {
      firestorePostData.content = newPost.content;
    } else if (newPost.resourceType === 'youtube' || newPost.resourceType === 'funny_video') {
      firestorePostData.resourceURL = newPost.resourceURL;
      firestorePostData.resourceMetadata = youtubeMetadata ? { 
        title: youtubeMetadata.title,
        thumbnail: youtubeMetadata.thumbnail,
        duration: youtubeMetadata.duration,
        viewCount: youtubeMetadata.viewCount,
        uploadDate: youtubeMetadata.uploadDate ? serverTimestamp() : undefined, // Convert Date to FieldValue
      } : undefined;
    } else if (newPost.resourceType === 'research_paper') {
      firestorePostData.resourceURL = newPost.resourceURL;
      firestorePostData.resourceMetadata = pdfMetadata ? {
        title: pdfMetadata.title,
        authors: pdfMetadata.authors,
        publishDate: pdfMetadata.publishDate ? serverTimestamp() : undefined, // Convert Date to FieldValue
      } : undefined;
    } else if (newPost.resourceType === 'article') {
      firestorePostData.resourceURL = newPost.resourceURL;
      firestorePostData.resourceMetadata = articleMetadata ? {
        title: articleMetadata.title,
        summary: articleMetadata.summary,
        favicon: articleMetadata.favicon,
        url: articleMetadata.url,
      } : undefined;
    }

    let communityPostDocRef: any; 

    try {
      communityPostDocRef = await addDoc(collection(db, "communityPosts"), firestorePostData);
      console.log("Community post saved to Firestore with ID:", communityPostDocRef.id);

      const tempPost: Post = {
        id: communityPostDocRef.id,
        ...basePostData,
        title: basePostData.title || '', 
        content: firestorePostData.content || '', 
        timestamp: new Date(), 
        resourceMetadata: (
          (newPost.resourceType === 'youtube' || newPost.resourceType === 'funny_video') && youtubeMetadata ? { ...youtubeMetadata, uploadDate: youtubeMetadata.uploadDate } : 
          newPost.resourceType === 'research_paper' && pdfMetadata ? { ...pdfMetadata, publishDate: pdfMetadata.publishDate } : 
          newPost.resourceType === 'article' && articleMetadata ? { ...articleMetadata } : 
          undefined
        ),
      };

      setPosts(prev => [tempPost, ...prev]); 

    } catch (error) {
      console.error("Error saving community post:", error);
      alert("Failed to post story to community. Please try again.");
      return; 
    }

    try {
      const userStoryRef = collection(db, `users/${user.id}/stories`);
      await addDoc(userStoryRef, {
        title: newPost.title.trim() || youtubeMetadata?.title || pdfMetadata?.title || articleMetadata?.title || '(No Title)',
        content: newPost.content || '',
        category: newPost.category,
        tags: newPost.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        contentWarning: newPost.contentWarning || null,
        timestamp: serverTimestamp(),
        communityPostId: communityPostDocRef.id,
        resourceType: newPost.resourceType,
        resourceURL: newPost.resourceURL,
        resourceMetadata: (
          (newPost.resourceType === 'youtube' || newPost.resourceType === 'funny_video') && youtubeMetadata ? { ...youtubeMetadata, uploadDate: youtubeMetadata.uploadDate ? serverTimestamp() : undefined } : 
          newPost.resourceType === 'research_paper' && pdfMetadata ? { ...pdfMetadata, publishDate: pdfMetadata.publishDate ? serverTimestamp() : undefined } : 
          newPost.resourceType === 'article' && articleMetadata ? { ...articleMetadata } : 
          undefined
        ),
      });
      console.log("Story saved to user profile history!");
    } catch (error) {
      console.error("Error saving story to user profile:", error);
      alert("Story posted to community, but failed to save to your personal history.");
    }

    setNewPost({ title: '', content: '', category: 'struggles', tags: '', contentWarning: '', resourceType: 'story', resourceURL: '', selectedFunnyTags: [] });
    setYoutubeMetadata(null); // Clear metadata on successful post
    setPdfMetadata(null); // Clear PDF metadata on successful post
    setArticleMetadata(null); // Clear Article metadata on successful post
    setMetadataError(null);
    setPdfMetadataError(null);
    setArticleMetadataError(null);
    setShowNewPostForm(false);
  };

  const handleSharePost = async (post: Post) => {
    if (!user) {
      alert("You must be logged in to share a post.");
      return;
    }

    try {
      const shareUrl = `${window.location.origin}/community/${post.id}`;
      
      if (navigator.share) {
        await navigator.share({
          title: post.title || post.resourceMetadata?.title || 'Manobal Community Post',
          text: post.content || post.resourceMetadata?.summary || 'Check out this post on Manobal!',
          url: shareUrl,
        });
        alert("Post shared successfully!");
      } else {
        // Fallback for browsers that do not support Web Share API
        await navigator.clipboard.writeText(shareUrl);
        alert("Post link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing post:", error);
      alert("Failed to share post. Please try again.");
    }
  };

  const handleReportPost = async (post: Post) => {
    if (!user) {
      alert("You must be logged in to report a post.");
      return;
    }
    const reportReason = prompt("Please enter the reason for reporting this post:");
    if (reportReason) {
      try {
        const reportRef = collection(db, "reports");
        await addDoc(reportRef, {
          postId: post.id,
          userId: user.id,
          reason: reportReason,
          timestamp: serverTimestamp(),
        });
        alert("Post reported successfully!");
        // Optionally, remove the post from the community feed
        // This requires a more complex state management to re-fetch all posts
        // For now, we'll just show a success message.
      } catch (error) {
        console.error("Error reporting post:", error);
        alert("Failed to report post. Please try again.");
      }
    }
  };

  // Function to create a new playlist
  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPlaylistName.trim()) {
      alert("Please enter a playlist name and ensure you are logged in.");
      return;
    }

    try {
      const playlistsCollectionRef = collection(db, `users/${user.id}/funnyPlaylists`);
      const newPlaylistDocRef = await addDoc(playlistsCollectionRef, {
        name: newPlaylistName.trim(),
        createdAt: serverTimestamp(),
        videoIds: [], // Start with an empty array of video IDs
      });
      
      const tempPlaylist: FunnyPlaylist = {
        id: newPlaylistDocRef.id,
        name: newPlaylistName.trim(),
        createdAt: new Date(),
        videoIds: [],
      };
      setUserPlaylists(prev => [tempPlaylist, ...prev]);
      setNewPlaylistName('');
      setShowCreatePlaylistModal(false);
      alert("Playlist created successfully!");
    } catch (error) {
      console.error("Error creating playlist:", error);
      setPlaylistError((error as Error).message);
      alert("Failed to create playlist. Please try again.");
    }
  };

  // Function to add/remove a video to/from a playlist
  const handleToggleVideoInPlaylist = async (playlistId: string, videoId: string) => {
    if (!user) {
      alert("You must be logged in to manage playlists.");
      return;
    }

    try {
      const playlistRef = doc(db, `users/${user.id}/funnyPlaylists`, playlistId);
      const playlistDoc = await getDoc(playlistRef);

      if (!playlistDoc.exists()) {
        console.error("Playlist not found!");
        return;
      }

      const currentVideoIds = playlistDoc.data()?.videoIds || [];
      const isVideoInPlaylist = currentVideoIds.includes(videoId);

      let updatedVideoIds;
      if (isVideoInPlaylist) {
        updatedVideoIds = arrayRemove(videoId);
      } else {
        updatedVideoIds = arrayUnion(videoId);
      }

      await updateDoc(playlistRef, {
        videoIds: updatedVideoIds,
      });

      // Update local state
      setUserPlaylists(prev => prev.map(playlist => 
        playlist.id === playlistId 
          ? { 
              ...playlist, 
              videoIds: isVideoInPlaylist 
                ? playlist.videoIds.filter(id => id !== videoId) 
                : [...playlist.videoIds, videoId] 
            }
          : playlist
      ));

      alert(isVideoInPlaylist ? "Video removed from playlist!" : "Video added to playlist!");
    } catch (error) {
      console.error("Error toggling video in playlist:", error);
      alert("Failed to update playlist. Please try again.");
    }
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
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{posts.length}</div> {/* Dynamic count */}
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Posts</div> {/* Changed from Active Members */}
                </div>
              </div>
            </div>
            {/* ... other stats can be made dynamic later if needed ... */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <MessageCircle className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{posts.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Posts This Month</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Heart className="w-8 h-8 text-red-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{posts.reduce((acc, post) => acc + post.likes, 0)}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Likes</div>
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

            {/* Resource Type Filter */}
            <div className="flex items-center space-x-2">
              <label htmlFor="resource-type-filter" className="text-gray-700 dark:text-gray-300 text-sm">Type:</label>
              <select
                id="resource-type-filter"
                value={selectedResourceType}
                onChange={(e) => setSelectedResourceType(e.target.value as Post['resourceType'] | 'all')}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Types</option>
                {resourceCategories.map(resCat => (
                  <option key={resCat.id} value={resCat.id}>
                    {resCat.name}
                  </option>
                ))}
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
            {isFetchingPosts ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading community posts...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
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
                      A {/* Always show 'A' for Anonymous */}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          Anonymous User {/* Always display Anonymous User */}
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
                        {post.title || '(No Title)'}
                      </h3>
                      
                      {(post.resourceType === 'youtube' || post.resourceType === 'funny_video') && post.resourceURL && (
                        <div className="my-4">
                          <iframe
                            className="w-full aspect-video rounded-lg shadow-md"
                            // Extract video ID for embedding. Supports watch?v= and youtu.be/ links
                            src={`https://www.youtube.com/embed/${post.resourceURL.split('v=')[1]?.split('&')[0] || post.resourceURL.split('youtu.be/')[1]?.split('?')[0]}`}
                            title={post.resourceMetadata?.title || post.title || '(No Title)'}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-in-picture" 
                            allowFullScreen
                          ></iframe>
                          {post.resourceMetadata && (
                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              {post.resourceMetadata.duration && (
                                <p>Duration: {Math.floor(post.resourceMetadata.duration / 60)}m {post.resourceMetadata.duration % 60}s</p>
                              )}
                              {post.resourceMetadata.viewCount && (
                                <p>Views: {parseInt(post.resourceMetadata.viewCount as string).toLocaleString()}</p>
                              )}
                              {post.resourceMetadata.uploadDate && (
                                <p>Uploaded: {post.resourceMetadata.uploadDate.toLocaleDateString()}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {post.resourceType === 'research_paper' && post.resourceURL && (
                        <div className="my-4">
                          <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden max-h-96 overflow-y-auto">
                            <Document
                              file={post.resourceURL}
                              loading={<div className="p-4 text-center text-gray-600 dark:text-gray-400">Loading PDF...</div>}
                              error={<div className="p-4 text-center text-red-600 dark:text-red-400">Failed to load PDF.</div>}
                            >
                              <Page pageNumber={1} width={550} /> {/* Displaying only the first page in the feed for brevity */}
                            </Document>
                          </div>
                          {post.resourceMetadata && (
                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              {post.resourceMetadata.title && <p>Title: {post.resourceMetadata.title}</p>}
                              {post.resourceMetadata.authors && <p>Author(s): {post.resourceMetadata.authors.join(', ')}</p>}
                              {post.resourceMetadata.publishDate && <p>Published: {post.resourceMetadata.publishDate.toLocaleDateString()}</p>}
                            </div>
                          )}
                          <a
                            href={post.resourceURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mt-2 text-sm"
                          >
                            Download Paper (PDF)
                          </a>

                          {post.resourceMetadata?.title && post.resourceMetadata?.authors && post.resourceMetadata?.publishDate && (
                            <button
                              onClick={() => handleGenerateCitations(post)}
                              disabled={isGeneratingCitations} // Disable button while generating
                              className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:underline mt-2 ml-4 text-sm"
                            >
                              {isGeneratingCitations ? 'Generating Citations...' : 'Generate Citations'}
                            </button>
                          )}

                          {/* PDF Full-Text Search Input */}
                          {post.resourceURL && (
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Search within Paper:</h4>
                              <div className="flex space-x-2">
                                <input
                                  type="text"
                                  value={pdfSearchQuery}
                                  onChange={(e) => setPdfSearchQuery(e.target.value)}
                                  placeholder="Enter keywords..."
                                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                                />
                                <button
                                  onClick={() => handleSearchPdf(post.resourceURL as string, pdfSearchQuery)}
                                  disabled={isSearchingPdf || !pdfSearchQuery.trim()}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                  {isSearchingPdf ? 'Searching...' : 'Search'}
                                </button>
                              </div>

                              {pdfSearchError && (
                                <div className="mt-2 text-red-600 dark:text-red-400 text-sm">
                                  Error: {pdfSearchError}
                                </div>
                              )}

                              {pdfSearchResults && pdfSearchResults.length > 0 && (
                                <div className="mt-4 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800">
                                  <p className="font-medium text-gray-900 dark:text-white mb-2">Found {pdfSearchResults.length} matches:</p>
                                  {pdfSearchResults.map((result, index) => (
                                    <div key={index} className="mb-3 p-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                                      <p className="text-sm text-gray-700 dark:text-gray-300">
                                        <span className="font-semibold">Page {result.page}:</span> {' '}
                                        {result.snippet.substring(0, result.start_char)}
                                        <span className="bg-yellow-200 dark:bg-yellow-700 text-black dark:text-white font-bold">
                                          {result.snippet.substring(result.start_char, result.end_char)}
                                        </span>
                                        {result.snippet.substring(result.end_char)}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {(post.resourceType === 'funny_video') && (
                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              <p className="font-medium text-gray-900 dark:text-white">Rate this video:</p>
                              <div className="flex items-center space-x-1 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    onClick={() => handleRateFunnyVideo(post.id, star)}
                                    disabled={user ? post.ratedBy?.includes(user.id) : true} // Disable if not logged in or already rated
                                    className={`text-xl ${star <= (post.rating || 0) ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'} ${user && !post.ratedBy?.includes(user.id) ? 'hover:text-yellow-400' : 'cursor-not-allowed'}`}
                                  >
                                    ★
                                  </button>
                                ))}
                                {post.rating !== undefined && (
                                  <span className="ml-2 text-gray-700 dark:text-gray-300">({post.rating.toFixed(1)} / 5)</span>
                                )}
                              </div>
                              {user && (
                                <button
                                  onClick={() => {
                                    setSelectedPostForPlaylist(post);
                                    setShowAddVideoToPlaylistModal(true);
                                  }}
                                  className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                                >
                                  Add to Playlist
                                </button>
                              )}
                            </div>
                          )}

                        </div>
                      )}

                      {(!post.resourceType || post.resourceType === 'story') && (
                      <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
                        {post.content}
                      </p>
                      )}

                      {post.resourceType === 'article' && post.resourceURL && post.resourceMetadata && (
                        <div className="my-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-inner flex items-center space-x-4">
                          {post.resourceMetadata.favicon && (
                            <img src={post.resourceMetadata.favicon} alt="Favicon" className="w-10 h-10 rounded-full" />
                          )}
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">{post.resourceMetadata.title || '(No Title)'}</h4>
                            {post.resourceMetadata.summary && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{post.resourceMetadata.summary}</p>
                            )}
                            <a 
                              href={post.resourceURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline mt-2 text-sm inline-block"
                            >
                              Read Article
                            </a>

                            <button
                              onClick={() => handleOpenReaderMode(post.resourceURL as string)}
                              className="text-purple-600 dark:text-purple-400 hover:underline mt-2 ml-4 text-sm inline-block"
                            >
                              Reader Mode
                            </button>

                          </div>
                        </div>
                      )}
                      
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
                        
                        <button 
                          onClick={() => handleOpenComments(post)}
                          className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.comments}</span>
                        </button>
                        
                        <button 
                          onClick={() => handleSharePost(post)}
                          className="flex items-center space-x-1 hover:text-green-600 transition-colors">
                          <Share className="w-4 h-4" />
                          <span>Share</span>
                        </button>
                        
                        <button 
                          onClick={() => handleReportPost(post)}
                          className="flex items-center space-x-1 hover:text-orange-600 transition-colors">
                          <Flag className="w-4 h-4" />
                          <span>Report</span>
                        </button>

                        {(post.resourceType && post.resourceType !== 'story') && (
                          <button
                            onClick={() => handleSaveResource(post)}
                            disabled={isSavingResource} // Disable while saving
                            className="flex items-center space-x-1 hover:text-green-600 transition-colors disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                            <span>{isSavingResource ? 'Updating...' : (savedResources.some(res => res.resourceURL === post.resourceURL) ? 'Unsave Resource' : 'Save Resource')}</span>
                          </button>
                        )}

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

            {/* My Saved Resources */}
            {user && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  My Saved Resources
                </h3>
                {isFetchingSavedResources ? (
                  <div className="text-center text-gray-600 dark:text-gray-400 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading saved resources...
                  </div>
                ) : savedResources.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400 text-sm">No resources saved yet.</p>
                ) : (
                  <div className="space-y-4">
                    {savedResources.map(resource => (
                      <div key={resource.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md shadow-sm">
                        <p className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                          {resource.resourceMetadata?.title || resource.title || '(No Title)'}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {resource.resourceURL}
                        </p>
                        <a 
                          href={resource.resourceURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline text-xs mt-1 inline-block"
                        >
                          View Resource
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recommended Funny Videos */}
            {user && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Recommended Funny Videos
                </h3>
                {isFetchingRecommendations ? (
                  <div className="text-center text-gray-600 dark:text-gray-400 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading recommendations...
                  </div>
                ) : recommendationError ? (
                  <div className="text-red-600 dark:text-red-400 text-sm">
                    Error: {recommendationError}
                  </div>
                ) : recommendedFunnyVideos.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400 text-sm">No recommendations yet. Rate some videos to get started!</p>
                ) : (
                  <div className="space-y-4">
                    {recommendedFunnyVideos.map(video => (
                      <div key={video.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md shadow-sm">
                        <p className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                          {video.resourceMetadata?.title || video.title || '(No Title)'}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {video.resourceURL}
                        </p>
                        <a 
                          href={video.resourceURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline text-xs mt-1 inline-block"
                        >
                          Watch Video
                        </a>
                        {video.rating !== undefined && (
                          <span className="ml-2 text-yellow-500 text-xs">★ {video.rating.toFixed(1)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* My Playlists */}
            {user && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  My Funny Video Playlists
                </h3>
                {isFetchingPlaylists ? (
                  <div className="text-center text-gray-600 dark:text-gray-400 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading playlists...
                  </div>
                ) : playlistError ? (
                  <div className="text-red-600 dark:text-red-400 text-sm">
                    Error: {playlistError}
                  </div>
                ) : userPlaylists.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400 text-sm">No playlists created yet.</p>
                ) : (
                  <div className="space-y-4">
                    {userPlaylists.map(playlist => (
                      <div key={playlist.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md shadow-sm">
                        <p className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                          {playlist.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {playlist.videoIds.length} videos • Created: {playlist.createdAt.toLocaleDateString()}
                        </p>
                        {/* TODO: Add a button to view playlist details/videos */}
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setShowCreatePlaylistModal(true)}
                  className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Playlist</span>
                </button>
              </div>
            )}

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
                <label htmlFor="post-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Post Type *
                </label>
                <select
                  id="post-type"
                  value={newPost.resourceType}
                  onChange={(e) => {
                    setNewPost(prev => ({
                      ...prev,
                      resourceType: e.target.value as Post['resourceType'],
                      resourceURL: '',
                      resourceMetadata: undefined,
                      content: '', // Clear content if switching from story
                      selectedFunnyTags: [], // Clear funny tags on type change
                    }));
                    setYoutubeMetadata(undefined);
                    setPdfMetadata(undefined);
                    setArticleMetadata(undefined);
                    setMetadataError(undefined);
                    setPdfMetadataError(undefined);
                    setArticleMetadataError(undefined);
                  }}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="story">Share Your Story</option>
                  <option value="youtube">YouTube Video</option>
                  <option value="funny_video">Funny YouTube Video</option>
                  <option value="research_paper">Research Paper</option>
                  <option value="article">Article Link</option>
                </select>
              </div>

              {/* Conditional inputs based on post type */}
              {newPost.resourceType === 'youtube' && (
                <div>
                  <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    YouTube Video URL *
                  </label>
                  <input
                    type="url"
                    id="youtube-url"
                    value={newPost.resourceURL}
                    onChange={(e) => setNewPost({ ...newPost, resourceURL: e.target.value })}
                    onBlur={fetchYoutubeMetadata}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., https://www.youtube.com/watch?v=..."
                    required
                  />
                  {isFetchingMetadata && <p className="text-purple-500 mt-2">Fetching YouTube video details...</p>}
                  {youtubeMetadata && (
                    <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center space-x-3">
                      <img src={youtubeMetadata.thumbnail} alt="Video Thumbnail" className="w-24 h-14 object-cover rounded" />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{youtubeMetadata.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{youtubeMetadata.duration} | {youtubeMetadata.viewCount} views</p>
                      </div>
                    </div>
                  )}
                  {metadataError && <p className="text-red-500 mt-2">{metadataError}</p>}
                </div>
              )}

              {newPost.resourceType === 'funny_video' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="funny-video-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Funny YouTube Video URL *
                    </label>
                    <input
                      type="url"
                      id="funny-video-url"
                      value={newPost.resourceURL}
                      onChange={(e) => setNewPost({ ...newPost, resourceURL: e.target.value })}
                      onBlur={fetchYoutubeMetadata}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., https://www.youtube.com/watch?v=..."
                      required
                    />
                    {isFetchingMetadata && <p className="text-purple-500 mt-2">Fetching funny video details...</p>}
                    {youtubeMetadata && (
                      <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center space-x-3">
                        <img src={youtubeMetadata.thumbnail} alt="Video Thumbnail" className="w-24 h-14 object-cover rounded" />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{youtubeMetadata.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{youtubeMetadata.duration} | {youtubeMetadata.viewCount} views</p>
                        </div>
                      </div>
                    )}
                    {metadataError && <p className="text-red-500 mt-2">{metadataError}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Funny Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {funnyTags.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setNewPost(prev => ({
                              ...prev,
                              selectedFunnyTags: prev.selectedFunnyTags.includes(tag)
                                ? prev.selectedFunnyTags.filter(t => t !== tag)
                                : [...prev.selectedFunnyTags, tag],
                            }));
                          }}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${newPost.selectedFunnyTags.includes(tag) ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {newPost.resourceType === 'research_paper' && (
                <div>
                  <label htmlFor="pdf-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Research Paper PDF URL *
                  </label>
                  <input
                    type="url"
                    id="pdf-url"
                    value={newPost.resourceURL}
                    onChange={(e) => setNewPost({ ...newPost, resourceURL: e.target.value })}
                    onBlur={fetchPdfMetadata}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., https://example.com/paper.pdf"
                    required
                  />
                  {isFetchingPdfMetadata && <p className="text-purple-500 mt-2">Fetching PDF details...</p>}
                  {pdfMetadata && (
                    <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <p className="font-semibold text-gray-900 dark:text-white">{pdfMetadata.title || 'No Title'}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{pdfMetadata.author || 'Unknown Author'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Published: {pdfMetadata.creationDate ? new Date(pdfMetadata.creationDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  )}
                  {pdfMetadataError && <p className="text-red-500 mt-2">{pdfMetadataError}</p>}
                </div>
              )}

              {newPost.resourceType === 'article' && (
                <div>
                  <label htmlFor="article-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Article URL *
                  </label>
                  <input
                    type="url"
                    id="article-url"
                    value={newPost.resourceURL}
                    onChange={(e) => setNewPost({ ...newPost, resourceURL: e.target.value })}
                    onBlur={fetchArticleMetadata}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., https://example.com/article"
                    required
                  />
                  {isFetchingArticleMetadata && <p className="text-purple-500 mt-2">Fetching article details...</p>}
                  {articleMetadata && (
                    <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center space-x-3">
                      {articleMetadata.favicon && <img src={articleMetadata.favicon} alt="Favicon" className="w-6 h-6 object-cover rounded" />}
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{articleMetadata.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{articleMetadata.summary?.substring(0, 100)}...</p>
                      </div>
                    </div>
                  )}
                  {articleMetadataError && <p className="text-red-500 mt-2">{articleMetadataError}</p>}
                </div>
              )}

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
                  required={newPost.resourceType === 'story' || !!newPost.resourceURL}
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

              {newPost.resourceType === 'story' && (
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
              )}

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

      {/* Comments Modal */}
      {showCommentsModal && selectedPostForComments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Comments for "{selectedPostForComments.title}"
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Share your thoughts or ask for support. All comments are anonymous.
              </p>
            </div>
            
            <form onSubmit={handleSubmitComment} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Comment *
                </label>
                <textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={4}
                  placeholder="Share your thoughts or ask for support..."
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowCommentsModal(false)}
                  className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  Post Comment
                </button>
              </div>
            </form>

            <div className="p-6 pt-0 space-y-6">
              {currentPostComments.length === 0 ? (
                <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                  No comments yet. Be the first to share your thoughts!
                </div>
              ) : (
                currentPostComments.map(comment => (
                  <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-800 dark:text-gray-200 mb-2">
                      {comment.content || ''}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Anonymous User on {formatDistanceToNow(comment.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Citations Modal */}
      {showCitationsModal && currentCitations && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Generated Citations
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Copy citations in various formats for your research.
              </p>
            </div>

            <div className="p-6 space-y-4">
              {citationError && (
                <div className="text-red-600 dark:text-red-400 text-sm mb-4">
                  Error: {citationError}
                </div>
              )}

              {Object.entries(currentCitations).map(([style, citation]) => (
                <div key={style} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="font-semibold text-gray-900 dark:text-white mb-2 uppercase">
                    {style} Style:
                  </p>
                  <div className="flex items-center space-x-2">
                    <p className="flex-1 text-gray-800 dark:text-gray-200 break-words">
                      {citation}
                    </p>
                    <button
                      onClick={() => navigator.clipboard.writeText(citation)}
                      className="ml-auto px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end p-6 pt-0 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowCitationsModal(false)}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Article Reader Mode Modal */}
      {showReaderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Reader Mode
              </h3>
              <button
                onClick={() => setShowReaderModal(false)}
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors text-xl font-semibold"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
              {isFetchingArticleContent ? (
                <div className="text-center py-12 text-gray-600 dark:text-gray-400 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p>Loading article content...</p>
                </div>
              ) : articleContentError ? (
                <div className="text-center py-12 text-red-600 dark:text-red-400">
                  Error: {articleContentError}
                </div>
              ) : currentArticleContent ? (
                <article className="prose dark:prose-invert max-w-none">
                  <h1 className="text-gray-900 dark:text-white mb-4">{currentArticleContent.title}</h1>
                  {currentArticleContent.authors && currentArticleContent.authors.length > 0 && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm italic">By {currentArticleContent.authors.join(', ')}</p>
                  )}
                  {currentArticleContent.publish_date && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Published on: {new Date(currentArticleContent.publish_date).toLocaleDateString()}</p>
                  )}
                  {currentArticleContent.top_image && (
                    <img src={currentArticleContent.top_image} alt="Article Top Image" className="w-full h-auto object-cover rounded-lg my-4" />
                  )}
                  <div className="text-gray-800 dark:text-gray-200 leading-relaxed">
                    {/* Render article text, splitting by newlines for paragraph breaks */}
                    {currentArticleContent.text.split(/\n\s*\n/).map((paragraph: string, index: number) => (
                      <p key={index} className="mb-4">{paragraph}</p>
                    ))}
                  </div>
                  {currentArticleContent.keywords && currentArticleContent.keywords.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Keywords:</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentArticleContent.keywords.map((keyword: string) => (
                          <span key={keyword} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {currentArticleContent.summary && (
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">AI Summary:</h4>
                      <p className="text-blue-700 dark:text-blue-400 text-sm">{currentArticleContent.summary}</p>
                    </div>
                  )}
                </article>
              ) : null}
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowReaderModal(false)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all"
              >
                Close Reader
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Playlist Modal */}
      {showCreatePlaylistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create New Funny Video Playlist
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Organize your favorite funny videos!
              </p>
            </div>
            
            <form onSubmit={handleCreatePlaylist} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Playlist Name *
                </label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., My Top Comedy Clips"
                  required
                />
              </div>
              {playlistError && (
                <div className="text-red-600 dark:text-red-400 text-sm">
                  Error: {playlistError}
                </div>
              )}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowCreatePlaylistModal(false)}
                  className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  Create Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Video to Playlist Modal */}
      {showAddVideoToPlaylistModal && selectedPostForPlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Add to Playlist: "{selectedPostForPlaylist.title || '(No Title)'}"
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Select one or more playlists to add this video to.
              </p>
            </div>

            <div className="p-6 space-y-4">
              {isFetchingPlaylists ? (
                <div className="text-center text-gray-600 dark:text-gray-400 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Loading playlists...
                </div>
              ) : playlistError ? (
                <div className="text-red-600 dark:text-red-400 text-sm">
                  Error: {playlistError}
                </div>
              ) : userPlaylists.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-sm">No playlists found. Create one first!</p>
              ) : (
                <div className="space-y-3">
                  {userPlaylists.map(playlist => (
                    <div key={playlist.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <label htmlFor={`playlist-checkbox-${playlist.id}`} className="flex items-center space-x-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          id={`playlist-checkbox-${playlist.id}`}
                          checked={playlist.videoIds.includes(selectedPostForPlaylist.id)}
                          onChange={() => handleToggleVideoInPlaylist(playlist.id, selectedPostForPlaylist.id)}
                          className="form-checkbox h-5 w-5 text-purple-600 transition duration-150 ease-in-out dark:bg-gray-600 dark:border-gray-500 rounded"
                        />
                        <span className="text-gray-900 dark:text-white font-medium">{playlist.name} ({playlist.videoIds.length} videos)</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end p-6 pt-0 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowAddVideoToPlaylistModal(false)}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
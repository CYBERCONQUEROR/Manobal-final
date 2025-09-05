import { db } from "../firebase";
import { collection, addDoc, getDocs, query, orderBy, where, doc, updateDoc, arrayUnion, arrayRemove, Timestamp, deleteDoc, getDoc } from "firebase/firestore";

export interface ResourceMetadata {
  title?: string;
  thumbnail?: string;
  duration?: number; // for videos (in seconds)
  authors?: string[]; // for research papers
  publishDate?: Date; // Convert Firestore Timestamp to JS Date
  summary?: string;
  viewCount?: number; // For YouTube videos
  uploadDate?: Date; // For YouTube videos
}

export interface Resource {
  id?: string; // Optional for creation, required for updates
  userId: string;
  userDisplayName: string;
  userPhotoURL: string;
  title: string;
  description: string;
  resourceType: 'youtube' | 'research_paper' | 'article' | 'funny_video';
  resourceURL: string;
  resourceMetadata?: ResourceMetadata;
  tags: string[];
  likes: number;
  likedBy: string[];
  createdAt: Date;
  updatedAt: Date;
  category: string; // Used for filtering/display in ResourcesPage
  rating: number; // For overall resource rating, or funny video rating
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface Comment {
  id?: string;
  resourceId: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string;
  content: string;
  createdAt: Date;
}

export interface ReportedResource {
  id: string;
  resourceId: string;
  reportedBy: string; // userId of the reporter
  reason: string;
  reportedAt: Date;
  status: 'pending' | 'reviewed' | 'resolved' | 'deleted';
  resourceTitle?: string; // Optional: to display in admin panel without fetching full resource
  resourceType?: string; // Optional: to display in admin panel
}

// Converts a Firestore document snapshot to a Resource object
const documentToResource = (doc: any): Resource => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    userDisplayName: data.userDisplayName,
    userPhotoURL: data.userPhotoURL,
    title: data.title,
    description: data.description,
    resourceType: data.resourceType,
    resourceURL: data.resourceURL,
    resourceMetadata: data.resourceMetadata ? {
      title: data.resourceMetadata.title,
      thumbnail: data.resourceMetadata.thumbnail,
      duration: data.resourceMetadata.duration,
      authors: data.resourceMetadata.authors,
      publishDate: data.resourceMetadata.publishDate?.toDate(),
      summary: data.resourceMetadata.summary,
      viewCount: data.resourceMetadata.viewCount,
      uploadDate: data.resourceMetadata.uploadDate?.toDate(),
    } : undefined,
    tags: data.tags || [],
    likes: data.likes || 0,
    likedBy: data.likedBy || [],
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    category: data.category,
    rating: data.rating || 0,
    difficulty: data.difficulty || 'beginner',
  };
};

// Create a new community post resource
export const createCommunityResource = async (resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>) => {
  try {
    const docRef = await addDoc(collection(db, "communityPosts"), {
      ...resource,
      likes: 0,
      likedBy: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      resourceMetadata: resource.resourceMetadata ? {
        ...resource.resourceMetadata,
        publishDate: resource.resourceMetadata.publishDate ? Timestamp.fromDate(resource.resourceMetadata.publishDate) : null,
        uploadDate: resource.resourceMetadata.uploadDate ? Timestamp.fromDate(resource.resourceMetadata.uploadDate) : null,
      } : null,
    });
    return docRef.id;
  } catch (e) {
    console.error("Error adding document: ", e);
    throw e;
  }
};

// Fetch community resources with optional filtering and sorting
export const fetchCommunityResources = async (options?: { category?: string; resourceType?: string; sortBy?: string; searchQuery?: string }) => {
  const cacheKey = `resourcesCache_${JSON.stringify(options || {})}`;
  const cachedData = localStorage.getItem(cacheKey);
  const cacheTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  if (cachedData && cacheTimestamp && (Date.now() - parseInt(cacheTimestamp, 10) < CACHE_DURATION)) {
    console.log("Fetching resources from cache...");
    let resources = JSON.parse(cachedData);
    // Re-instantiate Date objects from ISO strings
    resources = resources.map((resource: Resource) => ({
      ...resource,
      createdAt: new Date(resource.createdAt),
      updatedAt: new Date(resource.updatedAt),
      resourceMetadata: resource.resourceMetadata ? {
        ...resource.resourceMetadata,
        publishDate: resource.resourceMetadata.publishDate ? new Date(resource.resourceMetadata.publishDate) : undefined,
        uploadDate: resource.resourceMetadata.uploadDate ? new Date(resource.resourceMetadata.uploadDate) : undefined,
      } : undefined,
    }));
    
    // Apply client-side filtering/sorting that might not be covered by Firestore query options
    if (options?.searchQuery) {
      const searchLower = options.searchQuery.toLowerCase();
      resources = resources.filter((resource: Resource) => 
        resource.title.toLowerCase().includes(searchLower) ||
        resource.description.toLowerCase().includes(searchLower) ||
        resource.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        (resource.resourceMetadata?.summary?.toLowerCase().includes(searchLower))
      );
    }

    if (options?.sortBy === 'rating') {
      resources.sort((a: Resource, b: Resource) => b.rating - a.rating);
    }
    if (options?.sortBy === 'title') {
      resources.sort((a: Resource, b: Resource) => a.title.localeCompare(b.title));
    }
    if (options?.sortBy === 'duration') {
      resources.sort((a: Resource, b: Resource) => (b.resourceMetadata?.duration || 0) - (a.resourceMetadata?.duration || 0));
    }
    return resources;
  }

  try {
    let queryRef = query(collection(db, "communityPosts"), orderBy('createdAt', 'desc'));

    if (options?.category && options.category !== 'all') {
      queryRef = query(queryRef, where('category', '==', options.category));
    }

    if (options?.resourceType && options.resourceType !== 'all') {
      queryRef = query(queryRef, where('resourceType', '==', options.resourceType));
    }

    if (options?.searchQuery) {
      // For full-text search, a dedicated solution like Algolia or a server-side index would be better.
      // For now, we'll filter client-side after fetching, or implement a more specific 'where' clause if feasible.
      // Firebase currently doesn't support 'OR' queries across different fields or full-text search directly.
    }

    if (options?.sortBy) {
      switch (options.sortBy) {
        case 'date':
          // Already ordered by createdAt at the top of the function. No need to add again.
          break;
        case 'popularity':
          queryRef = query(queryRef, orderBy('likes', 'desc'));
          break;
        // For rating and title, client-side sort might be necessary unless we implement custom indexes or fields.
      }
    }

    // Apply other sorting/filtering at the client side if not handled by Firestore
    const querySnapshot = await getDocs(queryRef);
    let resources: Resource[] = querySnapshot.docs.map(documentToResource);

    // Client-side filtering for search query and specific sorting not handled by Firestore query
    if (options?.searchQuery) {
      const searchLower = options.searchQuery.toLowerCase();
      resources = resources.filter(resource => 
        resource.title.toLowerCase().includes(searchLower) ||
        resource.description.toLowerCase().includes(searchLower) ||
        resource.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        (resource.resourceMetadata?.summary?.toLowerCase().includes(searchLower)) // Search summary
      );
    }

    if (options?.sortBy === 'rating') {
      resources.sort((a, b) => b.rating - a.rating);
    }
    if (options?.sortBy === 'title') {
      resources.sort((a, b) => a.title.localeCompare(b.title));
    }
    if (options?.sortBy === 'duration') {
      resources.sort((a, b) => (b.resourceMetadata?.duration || 0) - (a.resourceMetadata?.duration || 0));
    }

    localStorage.setItem(cacheKey, JSON.stringify(resources));
    localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());

    return resources;
  } catch (e) {
    console.error("Error fetching community resources: ", e);
    throw e;
  }
};

// Toggle like status for a community resource
export const toggleResourceLike = async (resourceId: string, userId: string, isLiked: boolean) => {
  try {
    const resourceRef = doc(db, "communityPosts", resourceId);
    if (isLiked) {
      await updateDoc(resourceRef, {
        likes: arrayRemove(userId), // Decrement likes (Firestore rule will handle count)
        likedBy: arrayRemove(userId),
      });
    } else {
      await updateDoc(resourceRef, {
        likes: arrayUnion(userId), // Increment likes (Firestore rule will handle count)
        likedBy: arrayUnion(userId),
      });
    }
  } catch (e) {
    console.error("Error toggling like: ", e);
    throw e;
  }
};

// Add a comment to a community resource
export const addCommentToResource = async (comment: Omit<Comment, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, `communityPosts/${comment.resourceId}/comments`), {
      ...comment,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (e) {
    console.error("Error adding comment: ", e);
    throw e;
  }
};

// Fetch comments for a resource
export const fetchCommentsForResource = async (resourceId: string) => {
  try {
    const q = query(collection(db, `communityPosts/${resourceId}/comments`), orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        resourceId: data.resourceId,
        userId: data.userId,
        userDisplayName: data.userDisplayName,
        userPhotoURL: data.userPhotoURL,
        content: data.content,
        createdAt: data.createdAt.toDate(),
      };
    });
  } catch (e) {
    console.error("Error fetching comments: ", e);
    throw e;
  }
};

// Report a resource
export const reportResource = async (resourceId: string, userId: string, reason: string) => {
  try {
    console.log(`Reporting resource ${resourceId} by user ${userId} for reason: ${reason}`);
    const docRef = await addDoc(collection(db, "resourceReports"), {
      resourceId,
      reportedBy: userId,
      reason,
      reportedAt: Timestamp.now(),
      status: 'pending', // 'pending', 'reviewed', 'resolved'
    });

    // Optionally fetch resource title and type to store with report for easier admin view
    const resourceDoc = await getDoc(doc(db, "communityPosts", resourceId));
    if (resourceDoc.exists()) {
      const resourceData = resourceDoc.data();
      await updateDoc(docRef, {
        resourceTitle: resourceData.title,
        resourceType: resourceData.resourceType,
      });
    }
    return { success: true, reportId: docRef.id };
  } catch (e) {
    console.error("Error reporting resource: ", e);
    throw e;
  }
};

// Fetch reported resources for admin panel
export const fetchReportedResources = async (): Promise<ReportedResource[]> => {
  try {
    const q = query(collection(db, "resourceReports"), orderBy('reportedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        resourceId: data.resourceId,
        reportedBy: data.reportedBy,
        reason: data.reason,
        reportedAt: data.reportedAt.toDate(),
        status: data.status,
        resourceTitle: data.resourceTitle || 'N/A',
        resourceType: data.resourceType || 'N/A',
      };
    });
  } catch (e) {
    console.error("Error fetching reported resources: ", e);
    throw e;
  }
};

// Update status of a reported resource
export const updateReportedResourceStatus = async (reportId: string, newStatus: 'pending' | 'reviewed' | 'resolved' | 'deleted') => {
  try {
    const reportRef = doc(db, "resourceReports", reportId);
    await updateDoc(reportRef, {
      status: newStatus,
    });
    return { success: true };
  } catch (e) {
    console.error("Error updating report status: ", e);
    throw e;
  }
};

// Delete a reported resource (and optionally the original resource if it's inappropriate)
export const deleteReportedResource = async (reportId: string, resourceId: string, deleteOriginalResource: boolean) => {
  try {
    // Delete the report itself
    await deleteDoc(doc(db, "resourceReports", reportId));

    // Optionally delete the original resource
    if (deleteOriginalResource) {
      await deleteDoc(doc(db, "communityPosts", resourceId));
      console.log(`Original resource ${resourceId} also deleted.`);
    }
    return { success: true };
  } catch (e) {
    console.error("Error deleting resource or report: ", e);
    throw e;
  }
};

// Create a new user-specific resource
export const createUserResource = async (userId: string, resource: Omit<Resource, 'id' | 'userId' | 'userDisplayName' | 'userPhotoURL' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy' | 'category' | 'rating' | 'difficulty'> & { notes?: string; isPublic?: boolean }) => {
  try {
    const docRef = await addDoc(collection(db, `users/${userId}/resources`), {
      ...resource,
      savedAt: Timestamp.now(),
      notes: resource.notes || '',
      isPublic: resource.isPublic || false,
      metadata: resource.resourceMetadata ? {
        ...resource.resourceMetadata,
        publishDate: resource.resourceMetadata.publishDate ? Timestamp.fromDate(resource.resourceMetadata.publishDate) : null,
        uploadDate: resource.resourceMetadata.uploadDate ? Timestamp.fromDate(resource.resourceMetadata.uploadDate) : null,
      } : null,
    });
    return docRef.id;
  } catch (e) {
    console.error("Error adding user resource: ", e);
    throw e;
  }
};

// Fetch user-specific resources
export const fetchUserResources = async (userId: string) => {
  try {
    const q = query(collection(db, `users/${userId}/resources`), orderBy('savedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type, // This 'type' refers to the resourceType in the main Resource interface
        url: data.url,
        metadata: data.metadata,
        savedAt: data.savedAt.toDate(),
        notes: data.notes,
        isPublic: data.isPublic,
      };
    });
  } catch (e) {
    console.error("Error fetching user resources: ", e);
    throw e;
  }
};

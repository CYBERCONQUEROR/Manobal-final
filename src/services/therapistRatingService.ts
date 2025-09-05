import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, query, where, updateDoc, Timestamp } from "firebase/firestore";
import { BookingRating } from "./bookingService"; // Assuming BookingRating interface is exported from bookingService

export interface TherapistRatingSummary {
  therapistId: string;
  averageOverall: number;
  averageServiceQuality: number;
  averageValueForMoney: number;
  totalRatings: number;
  recommendationPercentage: number;
  ratingDistribution: {
    "5": number; "4": number; "3": number; "2": number; "1": number;
  };
  lastRatingUpdate: Date;
}

// Function to fetch all ratings for a specific therapist
export const fetchTherapistRatings = async (therapistId: string): Promise<BookingRating[]> => {
  try {
    const q = query(collection(db, "ratings"), where("therapistId", "==", therapistId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        bookingId: data.bookingId,
        userId: data.userId,
        userDisplayName: data.userDisplayName,
        therapistId: data.therapistId,
        therapistName: data.therapistName,
        ratings: data.ratings,
        wouldRecommend: data.wouldRecommend,
        comments: data.comments,
        isAnonymous: data.isAnonymous,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      };
    });
  } catch (e) {
    console.error("Error fetching therapist ratings: ", e);
    throw e;
  }
};

// Function to calculate and update the therapist's rating summary
export const calculateAndUpdateTherapistRatingSummary = async (therapistId: string): Promise<void> => {
  try {
    const ratings = await fetchTherapistRatings(therapistId);

    if (ratings.length === 0) {
      // Optionally, set default/empty rating summary if no ratings exist
      const therapistRef = doc(db, "therapists", therapistId);
      await updateDoc(therapistRef, {
        ratings: {
          averageOverall: 0,
          averageServiceQuality: 0,
          averageValueForMoney: 0,
          totalRatings: 0,
          recommendationPercentage: 0,
          ratingDistribution: {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0},
        },
        lastRatingUpdate: Timestamp.now(),
      });
      return; 
    }

    let totalOverall = 0;
    let totalServiceQuality = 0;
    let totalValueForMoney = 0;
    let totalRecommended = 0;
    const ratingDistribution = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0};

    ratings.forEach(rating => {
      totalOverall += rating.ratings.overall;
      totalServiceQuality += rating.ratings.serviceQuality;
      totalValueForMoney += rating.ratings.valueForMoney;
      if (rating.wouldRecommend) {
        totalRecommended++;
      }
      // Update rating distribution, ensuring the key is a string
      const starRating = String(rating.ratings.overall) as "1" | "2" | "3" | "4" | "5";
      ratingDistribution[starRating]++;
    });

    const totalRatings = ratings.length;
    const averageOverall = totalOverall / totalRatings;
    const averageServiceQuality = totalServiceQuality / totalRatings;
    const averageValueForMoney = totalValueForMoney / totalRatings;
    const recommendationPercentage = (totalRecommended / totalRatings) * 100;

    const summary: TherapistRatingSummary = {
      therapistId,
      averageOverall: parseFloat(averageOverall.toFixed(1)),
      averageServiceQuality: parseFloat(averageServiceQuality.toFixed(1)),
      averageValueForMoney: parseFloat(averageValueForMoney.toFixed(1)),
      totalRatings,
      recommendationPercentage: parseFloat(recommendationPercentage.toFixed(1)),
      ratingDistribution,
      lastRatingUpdate: new Date(),
    };

    // Update the therapist's document in the 'therapists' collection with the new summary
    const therapistRef = doc(db, "therapists", therapistId);
    await updateDoc(therapistRef, {
      ratings: {
        averageOverall: summary.averageOverall,
        averageServiceQuality: summary.averageServiceQuality,
        averageValueForMoney: summary.averageValueForMoney,
        totalRatings: summary.totalRatings,
        recommendationPercentage: summary.recommendationPercentage,
        ratingDistribution: summary.ratingDistribution,
      },
      lastRatingUpdate: Timestamp.now(),
    });

    console.log("Updated Therapist Rating Summary for", therapistId, ":", summary);

  } catch (e) {
    console.error("Error calculating therapist rating summary: ", e);
    throw e;
  }
};

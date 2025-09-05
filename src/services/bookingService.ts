import { db } from "../firebase";
import { collection, addDoc, Timestamp, doc, updateDoc } from "firebase/firestore";
import { calculateAndUpdateTherapistRatingSummary } from "./therapistRatingService"; // Import the new service

export interface BookingRating {
  id?: string;
  bookingId: string;           // Reference to booking
  userId: string;              // User who rated
  userDisplayName: string;     // User's display name
  therapistId: string;           // ID of rated service/resource (renamed from serviceId to therapistId)
  therapistName: string;        // Service/resource title (renamed from serviceTitle to therapistName)
  
  ratings: {
    overall: number;           // Overall experience (1-5)
    serviceQuality: number;    // Service quality (1-5)
    valueForMoney: number;     // Value for money (1-5)
  };
  
  wouldRecommend: boolean;     // Recommendation status
  comments?: string;            // User feedback (optional)
  isAnonymous: boolean;        // Anonymous rating flag
  
  createdAt?: Date;        // Rating creation time
  updatedAt?: Date;         // Last modification time
}

export const submitBookingRating = async (ratingData: Omit<BookingRating, 'id' | 'createdAt' | 'updatedAt'>) => {
  console.log("Attempting to submit rating:", ratingData); // Debug log
  try {
    // 1. Add the new rating to the 'ratings' collection
    console.log("Adding rating to 'ratings' collection..."); // Debug log
    const ratingDocRef = await addDoc(collection(db, "ratings"), {
      ...ratingData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      // Ensure nested ratings object is correctly passed
      ratings: {
        overall: ratingData.ratings.overall,
        serviceQuality: ratingData.ratings.serviceQuality,
        valueForMoney: ratingData.ratings.valueForMoney,
      },
    });
    console.log("Rating added with ID:", ratingDocRef.id); // Debug log

    // 2. Update the corresponding booking document in the 'bookings' collection
    console.log("Updating booking document:", ratingData.bookingId); // Debug log
    const bookingRef = doc(db, "bookings", ratingData.bookingId);
    await updateDoc(bookingRef, {
      hasRated: true,
      ratingId: ratingDocRef.id,
      ratingReminderSent: false, // Reset if a reminder was pending
      lastReminderDate: null,   // Clear reminder date
    });
    console.log("Booking document updated successfully."); // Debug log

    // 3. Recalculate and update the therapist's overall rating summary
    console.log("Calculating and updating therapist rating summary..."); // Debug log
    await calculateAndUpdateTherapistRatingSummary(ratingData.therapistId);
    console.log("Therapist rating summary updated."); // Debug log

    return ratingDocRef.id;
  } catch (e) {
    console.error("Error submitting booking rating: ", e);
    throw e;
  }
};

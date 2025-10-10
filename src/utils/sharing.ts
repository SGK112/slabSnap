import { Share } from "react-native";
import { Listing } from "../types/marketplace";

export const shareListingToSocial = async (listing: Listing) => {
  const message = `${listing.title} - $${listing.price}\n${listing.location}\n\nView on cutStone`;
  
  try {
    await Share.share({
      message,
      title: listing.title,
    });
  } catch (error) {
    console.error("Error sharing:", error);
  }
};

export const shareReferralCode = async (referralCode: string) => {
  const message = `Join cutStone - Buy & sell stone\n\nUse code: ${referralCode}`;
  
  try {
    await Share.share({
      message,
      title: "Join cutStone",
    });
  } catch (error) {
    console.error("Error sharing referral:", error);
  }
};

export const shareAchievement = async (achievementTitle: string) => {
  const message = `Unlocked: ${achievementTitle} on cutStone`;
  
  try {
    await Share.share({
      message,
      title: "Achievement",
    });
  } catch (error) {
    console.error("Error sharing achievement:", error);
  }
};

export type JobCategory =
  | "Countertop Installation"
  | "Backsplash"
  | "Flooring"
  | "Bathroom Vanity"
  | "Fireplace Surround"
  | "Custom Work"
  | "Repair"
  | "Other";

export type JobStatus = "open" | "in_progress" | "completed" | "cancelled";

export interface Job {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRating: number;
  title: string;
  description: string;
  category: JobCategory;
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  budget?: {
    min: number;
    max: number;
  };
  images: string[];
  status: JobStatus;
  createdAt: number;
  deadline?: number;
  bidCount: number;
}

export interface Bid {
  id: string;
  jobId: string;
  contractorId: string;
  contractorName: string;
  contractorAvatar?: string;
  contractorRating: number;
  amount: number;
  message: string;
  timeline: string; // e.g., "2 weeks", "1 month"
  createdAt: number;
  status: "pending" | "accepted" | "rejected";
}

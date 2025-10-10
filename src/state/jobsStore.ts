import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Job, Bid } from "../types/jobs";

interface JobsState {
  jobs: Job[];
  bids: Bid[];
  addJob: (job: Job) => void;
  updateJob: (jobId: string, updates: Partial<Job>) => void;
  deleteJob: (jobId: string) => void;
  getJobById: (jobId: string) => Job | undefined;
  getJobsByUser: (userId: string) => Job[];
  addBid: (bid: Bid) => void;
  updateBid: (bidId: string, updates: Partial<Bid>) => void;
  getBidsByJob: (jobId: string) => Bid[];
  getBidsByContractor: (contractorId: string) => Bid[];
  acceptBid: (bidId: string) => void;
  rejectBid: (bidId: string) => void;
  loadMockJobs: () => void;
}

export const useJobsStore = create<JobsState>()(
  persist(
    (set, get) => ({
      jobs: [],
      bids: [],

      addJob: (job) =>
        set((state) => ({
          jobs: [job, ...state.jobs],
        })),

      updateJob: (jobId, updates) =>
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === jobId ? { ...job, ...updates } : job
          ),
        })),

      deleteJob: (jobId) =>
        set((state) => ({
          jobs: state.jobs.filter((job) => job.id !== jobId),
          bids: state.bids.filter((bid) => bid.jobId !== jobId),
        })),

      getJobById: (jobId) => {
        return get().jobs.find((job) => job.id === jobId);
      },

      getJobsByUser: (userId) => {
        return get().jobs.filter((job) => job.userId === userId);
      },

      addBid: (bid) =>
        set((state) => {
          const job = state.jobs.find((j) => j.id === bid.jobId);
          if (job) {
            return {
              bids: [bid, ...state.bids],
              jobs: state.jobs.map((j) =>
                j.id === bid.jobId ? { ...j, bidCount: j.bidCount + 1 } : j
              ),
            };
          }
          return state;
        }),

      updateBid: (bidId, updates) =>
        set((state) => ({
          bids: state.bids.map((bid) =>
            bid.id === bidId ? { ...bid, ...updates } : bid
          ),
        })),

      getBidsByJob: (jobId) => {
        return get().bids.filter((bid) => bid.jobId === jobId);
      },

      getBidsByContractor: (contractorId) => {
        return get().bids.filter((bid) => bid.contractorId === contractorId);
      },

      acceptBid: (bidId) =>
        set((state) => {
          const acceptedBid = state.bids.find((bid) => bid.id === bidId);
          if (!acceptedBid) return state;

          return {
            bids: state.bids.map((bid) =>
              bid.jobId === acceptedBid.jobId
                ? {
                    ...bid,
                    status: bid.id === bidId ? "accepted" : "rejected",
                  }
                : bid
            ),
            jobs: state.jobs.map((job) =>
              job.id === acceptedBid.jobId
                ? { ...job, status: "in_progress" }
                : job
            ),
          };
        }),

      rejectBid: (bidId) =>
        set((state) => ({
          bids: state.bids.map((bid) =>
            bid.id === bidId ? { ...bid, status: "rejected" } : bid
          ),
        })),

      loadMockJobs: () =>
        set({
          jobs: [
            {
              id: "job-1",
              userId: "user-2",
              userName: "Sarah Johnson",
              userRating: 4.8,
              title: "Kitchen Countertop Installation",
              description:
                "Looking for experienced contractor to install Carrara marble countertops in my kitchen. Approximately 45 sq ft. Need precise measurements and professional installation.",
              category: "Countertop Installation",
              location: "Phoenix, AZ",
              budget: { min: 2000, max: 3500 },
              images: [
                "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800",
                "https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800",
              ],
              status: "open",
              createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
              deadline: Date.now() + 30 * 24 * 60 * 60 * 1000,
              bidCount: 3,
            },
            {
              id: "job-2",
              userId: "user-3",
              userName: "Mike Davis",
              userRating: 4.9,
              title: "Bathroom Vanity Installation",
              description:
                "Need to install a new granite vanity top in master bathroom. Includes sink cutout and faucet installation. Material already purchased.",
              category: "Bathroom Vanity",
              location: "Scottsdale, AZ",
              budget: { min: 800, max: 1200 },
              images: [
                "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800",
              ],
              status: "open",
              createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
              deadline: Date.now() + 14 * 24 * 60 * 60 * 1000,
              bidCount: 5,
            },
            {
              id: "job-3",
              userId: "user-4",
              userName: "Jennifer Smith",
              userRating: 5.0,
              title: "Custom Fireplace Surround",
              description:
                "Looking for skilled fabricator to create custom fireplace surround using travertine. Unique design with curved edges. Portfolio required.",
              category: "Fireplace Surround",
              location: "Tempe, AZ",
              budget: { min: 3000, max: 5000 },
              images: [
                "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800",
              ],
              status: "open",
              createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
              bidCount: 2,
            },
            {
              id: "job-4",
              userId: "user-5",
              userName: "Robert Wilson",
              userRating: 4.7,
              title: "Marble Backsplash Installation",
              description:
                "Installing marble backsplash in kitchen. Need experienced installer for herringbone pattern. Approximately 20 sq ft.",
              category: "Backsplash",
              location: "Mesa, AZ",
              budget: { min: 1200, max: 1800 },
              images: [
                "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800",
              ],
              status: "open",
              createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
              bidCount: 4,
            },
          ],
          bids: [],
        }),
    }),
    {
      name: "jobs-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

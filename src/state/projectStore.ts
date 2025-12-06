import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Project, ProjectMaterial, ProjectMilestone, ProjectCollaborator, Quote, Lead, SampleRequest, BudgetEstimate } from "../types/marketplace";

interface ProjectState {
  projects: Project[];
  quotes: Quote[];
  leads: Lead[];
  sampleRequests: SampleRequest[];
  budgetEstimates: BudgetEstimate[];

  // Project actions
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addMaterialToProject: (projectId: string, material: ProjectMaterial) => void;
  updateProjectMaterial: (projectId: string, materialId: string, updates: Partial<ProjectMaterial>) => void;
  removeMaterialFromProject: (projectId: string, materialId: string) => void;
  addMilestone: (projectId: string, milestone: ProjectMilestone) => void;
  updateMilestone: (projectId: string, milestoneId: string, updates: Partial<ProjectMilestone>) => void;
  addCollaborator: (projectId: string, collaborator: ProjectCollaborator) => void;
  removeCollaborator: (projectId: string, collaboratorId: string) => void;

  // Quote actions
  addQuote: (quote: Quote) => void;
  updateQuote: (id: string, updates: Partial<Quote>) => void;
  deleteQuote: (id: string) => void;

  // Lead actions
  addLead: (lead: Lead) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;

  // Sample request actions
  addSampleRequest: (request: SampleRequest) => void;
  updateSampleRequest: (id: string, updates: Partial<SampleRequest>) => void;

  // Budget actions
  addBudgetEstimate: (estimate: BudgetEstimate) => void;

  // Getters
  getProjectById: (id: string) => Project | undefined;
  getUserProjects: (userId: string) => Project[];
  getProjectsAsCollaborator: (userId: string) => Project[];
  getQuotesByPro: (proId: string) => Quote[];
  getQuotesByCustomer: (customerId: string) => Quote[];
  getLeadsByPro: (proId: string) => Lead[];

  // Load mock data
  loadMockData: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      quotes: [],
      leads: [],
      sampleRequests: [],
      budgetEstimates: [],

      // Project actions
      addProject: (project) => {
        set((state) => ({
          projects: [project, ...state.projects],
        }));
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
          ),
        }));
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        }));
      },

      addMaterialToProject: (projectId, material) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, materials: [...p.materials, material], updatedAt: Date.now() }
              : p
          ),
        }));
      },

      updateProjectMaterial: (projectId, materialId, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  materials: p.materials.map((m) =>
                    m.id === materialId ? { ...m, ...updates } : m
                  ),
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
      },

      removeMaterialFromProject: (projectId, materialId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  materials: p.materials.filter((m) => m.id !== materialId),
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
      },

      addMilestone: (projectId, milestone) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, milestones: [...p.milestones, milestone], updatedAt: Date.now() }
              : p
          ),
        }));
      },

      updateMilestone: (projectId, milestoneId, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  milestones: p.milestones.map((m) =>
                    m.id === milestoneId ? { ...m, ...updates } : m
                  ),
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
      },

      addCollaborator: (projectId, collaborator) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, collaborators: [...p.collaborators, collaborator], updatedAt: Date.now() }
              : p
          ),
        }));
      },

      removeCollaborator: (projectId, collaboratorId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  collaborators: p.collaborators.filter((c) => c.userId !== collaboratorId),
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
      },

      // Quote actions
      addQuote: (quote) => {
        set((state) => ({
          quotes: [quote, ...state.quotes],
        }));
      },

      updateQuote: (id, updates) => {
        set((state) => ({
          quotes: state.quotes.map((q) =>
            q.id === id ? { ...q, ...updates, updatedAt: Date.now() } : q
          ),
        }));
      },

      deleteQuote: (id) => {
        set((state) => ({
          quotes: state.quotes.filter((q) => q.id !== id),
        }));
      },

      // Lead actions
      addLead: (lead) => {
        set((state) => ({
          leads: [lead, ...state.leads],
        }));
      },

      updateLead: (id, updates) => {
        set((state) => ({
          leads: state.leads.map((l) =>
            l.id === id ? { ...l, ...updates, updatedAt: Date.now() } : l
          ),
        }));
      },

      deleteLead: (id) => {
        set((state) => ({
          leads: state.leads.filter((l) => l.id !== id),
        }));
      },

      // Sample request actions
      addSampleRequest: (request) => {
        set((state) => ({
          sampleRequests: [request, ...state.sampleRequests],
        }));
      },

      updateSampleRequest: (id, updates) => {
        set((state) => ({
          sampleRequests: state.sampleRequests.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        }));
      },

      // Budget actions
      addBudgetEstimate: (estimate) => {
        set((state) => ({
          budgetEstimates: [estimate, ...state.budgetEstimates],
        }));
      },

      // Getters
      getProjectById: (id) => {
        return get().projects.find((p) => p.id === id);
      },

      getUserProjects: (userId) => {
        return get().projects.filter((p) => p.ownerId === userId);
      },

      getProjectsAsCollaborator: (userId) => {
        return get().projects.filter((p) =>
          p.collaborators.some((c) => c.userId === userId)
        );
      },

      getQuotesByPro: (proId) => {
        return get().quotes.filter((q) => q.proId === proId);
      },

      getQuotesByCustomer: (customerId) => {
        return get().quotes.filter((q) => q.customerId === customerId);
      },

      getLeadsByPro: (proId) => {
        return get().leads.filter((l) => l.proId === proId);
      },

      // Load mock data
      loadMockData: () => {
        const mockProjects: Project[] = [
          {
            id: "proj-1",
            ownerId: "mock-user-1",
            ownerName: "Demo User",
            title: "Kitchen Remodel",
            description: "Complete kitchen renovation with new countertops, cabinets, and appliances",
            roomType: "kitchen",
            status: "planning",
            budget: { min: 15000, max: 25000 },
            estimatedCost: 22000,
            materials: [
              {
                id: "mat-1",
                name: "Calacatta Gold Quartz",
                category: "Stone & Tile",
                brand: "MSI",
                color: "White/Gold Veins",
                price: 85,
                quantity: 45,
                quantityUnit: "sq_ft",
                status: "considering",
              },
              {
                id: "mat-2",
                name: "White Shaker Cabinets",
                category: "Kitchen",
                brand: "Kraftmaid",
                price: 4500,
                quantity: 1,
                quantityUnit: "each",
                status: "selected",
              },
            ],
            milestones: [
              {
                id: "mile-1",
                title: "Design Finalized",
                status: "completed",
                completedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
              },
              {
                id: "mile-2",
                title: "Materials Ordered",
                status: "in_progress",
              },
              {
                id: "mile-3",
                title: "Demo Complete",
                status: "pending",
              },
              {
                id: "mile-4",
                title: "Installation",
                status: "pending",
              },
            ],
            collaborators: [
              {
                userId: "pro-1",
                name: "Arizona Cabinets",
                role: "contractor",
                addedAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
              },
            ],
            measurements: {
              length: 15,
              width: 12,
              sqft: 180,
            },
            createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
            updatedAt: Date.now() - 1000 * 60 * 60 * 24,
          },
        ];

        const mockLeads: Lead[] = [
          {
            id: "lead-1",
            proId: "mock-user-1",
            customerName: "John Smith",
            customerEmail: "john@example.com",
            customerPhone: "(480) 555-1234",
            projectType: "kitchen",
            description: "Looking for quartz countertops, approx 50 sq ft",
            budget: { min: 3000, max: 5000 },
            timeline: "Within 2 months",
            source: "marketplace",
            status: "new",
            priority: "high",
            createdAt: Date.now() - 1000 * 60 * 60 * 2,
            updatedAt: Date.now() - 1000 * 60 * 60 * 2,
          },
          {
            id: "lead-2",
            proId: "mock-user-1",
            customerName: "Sarah Johnson",
            customerEmail: "sarah@example.com",
            projectType: "bathroom",
            description: "Master bath renovation, need vanity and tile",
            budget: { min: 8000, max: 12000 },
            timeline: "Next month",
            source: "referral",
            status: "contacted",
            priority: "medium",
            createdAt: Date.now() - 1000 * 60 * 60 * 24,
            updatedAt: Date.now() - 1000 * 60 * 60 * 12,
          },
          {
            id: "lead-3",
            proId: "mock-user-1",
            customerName: "Mike Davis",
            customerEmail: "mike@example.com",
            projectType: "outdoor",
            description: "Patio pavers, about 400 sq ft",
            budget: { min: 5000, max: 8000 },
            source: "sample_request",
            status: "new",
            priority: "low",
            createdAt: Date.now() - 1000 * 60 * 60 * 48,
            updatedAt: Date.now() - 1000 * 60 * 60 * 48,
          },
        ];

        set({
          projects: mockProjects,
          leads: mockLeads,
        });
      },
    }),
    {
      name: "project-storage",
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    }
  )
);

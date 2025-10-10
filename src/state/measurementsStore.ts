import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface MeasurementPoint {
  x: number;
  y: number;
}

export interface Measurement {
  id: string;
  userId: string;
  imageUri: string;
  points: MeasurementPoint[];
  measurements: Array<{
    id: string;
    start: MeasurementPoint;
    end: MeasurementPoint;
    length: number; // in inches
    label: string;
  }>;
  totalLength?: number;
  totalWidth?: number;
  notes?: string;
  type: "remnant" | "space"; // seller measuring remnant or buyer measuring space
  createdAt: number;
}

interface MeasurementsState {
  measurements: Measurement[];
  addMeasurement: (measurement: Omit<Measurement, "id" | "createdAt">) => void;
  updateMeasurement: (id: string, updates: Partial<Measurement>) => void;
  deleteMeasurement: (id: string) => void;
  getUserMeasurements: (userId: string) => Measurement[];
}

export const useMeasurementsStore = create<MeasurementsState>()(
  persist(
    (set, get) => ({
      measurements: [],

      addMeasurement: (measurement) => {
        const newMeasurement: Measurement = {
          ...measurement,
          id: "measurement-" + Date.now(),
          createdAt: Date.now(),
        };
        set((state) => ({
          measurements: [newMeasurement, ...state.measurements],
        }));
      },

      updateMeasurement: (id, updates) => {
        set((state) => ({
          measurements: state.measurements.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        }));
      },

      deleteMeasurement: (id) => {
        set((state) => ({
          measurements: state.measurements.filter((m) => m.id !== id),
        }));
      },

      getUserMeasurements: (userId) => {
        return get().measurements.filter((m) => m.userId === userId);
      },
    }),
    {
      name: "measurements-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

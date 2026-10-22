import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  ColorScheme,
  FractalParams,
  FractalType,
  SavedFractal,
  DEFAULT_FRACTALS,
} from "@/utils/fractal";

interface FractalContextValue {
  currentParams: FractalParams;
  savedFractals: SavedFractal[];
  updateParams: (partial: Partial<FractalParams>) => void;
  setFractalType: (type: FractalType) => void;
  saveFractal: (name: string) => Promise<void>;
  deleteFractal: (id: string) => Promise<void>;
  loadFractal: (fractal: SavedFractal) => void;
  iterationCount: number;
  setIterationCount: (n: number) => void;
}

const FractalContext = createContext<FractalContextValue | undefined>(undefined);

const STORAGE_KEY = "quantum_fractals_saved";

const defaultParams: FractalParams = {
  ...DEFAULT_FRACTALS.mandelbrot,
  colorScheme: "quantum",
};

export function FractalProvider({ children }: { children: React.ReactNode }) {
  const [currentParams, setCurrentParams] = useState<FractalParams>(defaultParams);
  const [savedFractals, setSavedFractals] = useState<SavedFractal[]>([]);
  const [iterationCount, setIterationCount] = useState(100);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setSavedFractals(JSON.parse(raw));
        } catch {
          setSavedFractals([]);
        }
      }
    });
  }, []);

  const updateParams = useCallback((partial: Partial<FractalParams>) => {
    setCurrentParams((prev) => ({ ...prev, ...partial }));
  }, []);

  const setFractalType = useCallback((type: FractalType) => {
    setCurrentParams((prev) => ({
      ...prev,
      ...DEFAULT_FRACTALS[type],
      colorScheme: prev.colorScheme,
    }));
  }, []);

  const saveFractal = useCallback(
    async (name: string) => {
      const fractal: SavedFractal = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name,
        params: { ...currentParams },
        createdAt: Date.now(),
      };
      const updated = [fractal, ...savedFractals];
      setSavedFractals(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    },
    [currentParams, savedFractals]
  );

  const deleteFractal = useCallback(
    async (id: string) => {
      const updated = savedFractals.filter((f) => f.id !== id);
      setSavedFractals(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    },
    [savedFractals]
  );

  const loadFractal = useCallback((fractal: SavedFractal) => {
    setCurrentParams(fractal.params);
  }, []);

  return (
    <FractalContext.Provider
      value={{
        currentParams,
        savedFractals,
        updateParams,
        setFractalType,
        saveFractal,
        deleteFractal,
        loadFractal,
        iterationCount,
        setIterationCount,
      }}
    >
      {children}
    </FractalContext.Provider>
  );
}

export function useFractal() {
  const ctx = useContext(FractalContext);
  if (!ctx) throw new Error("useFractal must be inside FractalProvider");
  return ctx;
}

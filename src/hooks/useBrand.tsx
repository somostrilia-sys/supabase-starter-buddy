import { createContext, useContext, useState, ReactNode } from "react";
import logoObjetiva from "@/assets/logo-objetiva.jpg";

interface BrandConfig {
  name: string;
  subtitle: string;
  logoUrl: string;
  headerBg: string;       // HSL string for header/sidebar dark bg
  headerAccent: string;   // HSL string for accent icons on dark bg
  tabBg: string;          // HSL string for tab bar background
  tabActiveBg: string;    // HSL string for active tab bg
  tabActiveText: string;  // color for active tab text
}

const defaultBrand: BrandConfig = {
  name: "Objetivo Auto & Truck",
  subtitle: "Proteção Veicular",
  logoUrl: logoObjetiva,
  headerBg: "212 35% 18%",
  headerAccent: "210 55% 70%",
  tabBg: "210 30% 94%",
  tabActiveBg: "212 35% 30%",
  tabActiveText: "#ffffff",
};

interface BrandContextType {
  brand: BrandConfig;
  updateBrand: (partial: Partial<BrandConfig>) => void;
}

const BrandContext = createContext<BrandContextType>({
  brand: defaultBrand,
  updateBrand: () => {},
});

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<BrandConfig>(() => {
    try {
      const saved = localStorage.getItem("brand-config");
      if (saved) return { ...defaultBrand, ...JSON.parse(saved) };
    } catch {}
    return defaultBrand;
  });

  const updateBrand = (partial: Partial<BrandConfig>) => {
    setBrand((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem("brand-config", JSON.stringify(next));
      return next;
    });
  };

  return (
    <BrandContext.Provider value={{ brand, updateBrand }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}

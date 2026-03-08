import { createContext, useContext, useState, ReactNode } from "react";
import logoObjetiva from "@/assets/logo-objetiva.png";

interface BrandConfig {
  name: string;
  subtitle: string;
  logoUrl: string;
  headerBg: string;
  headerAccent: string;
  tabBg: string;
  tabActiveBg: string;
  tabActiveText: string;
}

const defaultBrand: BrandConfig = {
  name: "Objetivo Auto & Truck",
  subtitle: "Proteção Veicular",
  logoUrl: logoObjetiva,
  headerBg: "222 47% 11%",
  headerAccent: "217 90% 62%",
  tabBg: "220 20% 94%",
  tabActiveBg: "222 47% 18%",
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
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultBrand, ...parsed, logoUrl: defaultBrand.logoUrl };
      }
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

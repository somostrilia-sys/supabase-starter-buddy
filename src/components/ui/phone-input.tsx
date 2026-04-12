import { useState, useRef, useEffect } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { ChevronDown } from "lucide-react";

interface Country {
  code: string;
  name: string;
  dial: string;
  flag: string;
  maxDigits: number;
  mask: string;
}

const COUNTRIES: Country[] = [
  { code: "BR", name: "Brasil", dial: "+55", flag: "🇧🇷", maxDigits: 11, mask: "(##) #####-####" },
  { code: "US", name: "Estados Unidos", dial: "+1", flag: "🇺🇸", maxDigits: 10, mask: "(###) ###-####" },
  { code: "PT", name: "Portugal", dial: "+351", flag: "🇵🇹", maxDigits: 9, mask: "### ### ###" },
  { code: "AR", name: "Argentina", dial: "+54", flag: "🇦🇷", maxDigits: 10, mask: "## ####-####" },
  { code: "PY", name: "Paraguai", dial: "+595", flag: "🇵🇾", maxDigits: 9, mask: "### ### ###" },
  { code: "UY", name: "Uruguai", dial: "+598", flag: "🇺🇾", maxDigits: 8, mask: "#### ####" },
  { code: "CL", name: "Chile", dial: "+56", flag: "🇨🇱", maxDigits: 9, mask: "# #### ####" },
  { code: "CO", name: "Colômbia", dial: "+57", flag: "🇨🇴", maxDigits: 10, mask: "### ### ####" },
  { code: "MX", name: "México", dial: "+52", flag: "🇲🇽", maxDigits: 10, mask: "## #### ####" },
  { code: "PE", name: "Peru", dial: "+51", flag: "🇵🇪", maxDigits: 9, mask: "### ### ###" },
];

function applyMask(value: string, mask: string): string {
  const digits = value.replace(/\D/g, "");
  let result = "";
  let digitIdx = 0;
  for (let i = 0; i < mask.length && digitIdx < digits.length; i++) {
    if (mask[i] === "#") {
      result += digits[digitIdx++];
    } else {
      result += mask[i];
    }
  }
  return result;
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function PhoneInput({ value, onChange, placeholder, className }: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);

  // Detect country from existing value on mount
  useEffect(() => {
    if (value) {
      const digits = value.replace(/\D/g, "");
      // If starts with country dial code, detect it
      for (const c of COUNTRIES) {
        const dialDigits = c.dial.replace(/\D/g, "");
        if (digits.startsWith(dialDigits) && digits.length > dialDigits.length) {
          setCountry(c);
          return;
        }
      }
    }
  }, []);

  const handleChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, country.maxDigits);
    const masked = applyMask(digits, country.mask);
    onChange(masked);
  };

  const selectCountry = (c: Country) => {
    setCountry(c);
    setOpen(false);
    // Re-apply mask with new country limits
    const digits = value.replace(/\D/g, "").slice(0, c.maxDigits);
    const masked = applyMask(digits, c.mask);
    onChange(masked);
  };

  return (
    <div className={`flex gap-1 ${className || ""}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 px-2 shrink-0 gap-1 text-xs font-normal">
            <span className="text-base leading-none">{country.flag}</span>
            <span className="text-muted-foreground">{country.dial}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1" align="start">
          <div className="max-h-48 overflow-y-auto">
            {COUNTRIES.map(c => (
              <button
                key={c.code}
                onClick={() => selectCountry(c)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-accent transition-colors ${c.code === country.code ? "bg-accent" : ""}`}
              >
                <span className="text-base leading-none">{c.flag}</span>
                <span className="flex-1 text-left">{c.name}</span>
                <span className="text-muted-foreground">{c.dial}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <Input
        value={value}
        onChange={e => handleChange(e.target.value)}
        placeholder={placeholder || country.mask.replace(/#/g, "0")}
        className="h-9 flex-1"
        maxLength={country.mask.length}
      />
    </div>
  );
}

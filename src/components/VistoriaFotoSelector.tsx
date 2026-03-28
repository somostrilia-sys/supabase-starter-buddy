import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Camera, CheckCircle2 } from "lucide-react";

import imgFrente from "@/assets/vistoria/frente.jpg";
import imgTraseira from "@/assets/vistoria/traseira.jpg";
import imgLateralEsq from "@/assets/vistoria/lateral-esquerda.jpg";
import imgLateralDir from "@/assets/vistoria/lateral-direita.jpg";
import imgInterior from "@/assets/vistoria/interior-painel.jpg";
import imgBancoDiant from "@/assets/vistoria/banco-dianteiro.jpg";
import imgBancoTras from "@/assets/vistoria/banco-traseiro.jpg";
import imgTeto from "@/assets/vistoria/teto.jpg";
import imgMotor from "@/assets/vistoria/motor-capo.jpg";
import imgPortaMalas from "@/assets/vistoria/porta-malas.jpg";
import imgRodas from "@/assets/vistoria/rodas-pneus.jpg";
import imgDocumentos from "@/assets/vistoria/documentos.jpg";

export interface VistoriaParte {
  id: string;
  label: string;
  img: string;
}

const partes: VistoriaParte[] = [
  { id: "frente", label: "Frente", img: imgFrente },
  { id: "traseira", label: "Traseira", img: imgTraseira },
  { id: "lateral_esquerda", label: "Lateral Esquerda", img: imgLateralEsq },
  { id: "lateral_direita", label: "Lateral Direita", img: imgLateralDir },
  { id: "interior_painel", label: "Interior / Painel", img: imgInterior },
  { id: "banco_dianteiro", label: "Banco Dianteiro", img: imgBancoDiant },
  { id: "banco_traseiro", label: "Banco Traseiro", img: imgBancoTras },
  { id: "teto", label: "Teto", img: imgTeto },
  { id: "motor_capo", label: "Motor / Capô", img: imgMotor },
  { id: "porta_malas", label: "Porta-malas", img: imgPortaMalas },
  { id: "rodas_pneus", label: "Rodas e Pneus", img: imgRodas },
  { id: "documentos", label: "Documentos", img: imgDocumentos },
];

interface Props {
  selected?: string[];
  onChange?: (selected: string[]) => void;
}

export default function VistoriaFotoSelector({ selected: controlledSelected, onChange }: Props) {
  const [internalSelected, setInternalSelected] = useState<string[]>(partes.map(p => p.id));
  const selected = controlledSelected ?? internalSelected;

  const toggle = (id: string) => {
    const next = selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id];
    if (onChange) onChange(next);
    else setInternalSelected(next);
  };

  const toggleAll = () => {
    const next = selected.length === partes.length ? [] : partes.map(p => p.id);
    if (onChange) onChange(next);
    else setInternalSelected(next);
  };

  return (
    <fieldset className="space-y-3">
      <div className="flex items-center justify-between">
        <legend className="text-sm font-bold text-[hsl(212_35%_18%)] border-b pb-1 flex items-center gap-2">
          <Camera className="h-4 w-4" />
          FOTOS OBRIGATÓRIAS DA VISTORIA
        </legend>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="rounded-none text-xs gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {selected.length}/{partes.length} selecionadas
          </Badge>
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs text-[hsl(212_55%_40%)] hover:underline font-medium"
          >
            {selected.length === partes.length ? "Desmarcar todas" : "Selecionar todas"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {partes.map((parte) => {
          const isSelected = selected.includes(parte.id);
          return (
            <button
              key={parte.id}
              type="button"
              onClick={() => toggle(parte.id)}
              className={`relative group rounded-none overflow-hidden border-2 transition-all cursor-pointer ${
                isSelected
                  ? "border-[hsl(212_35%_18%)] shadow-md"
                  : "border-border opacity-60 hover:opacity-90"
              }`}
            >
              {/* Thumbnail */}
              <div className="aspect-[4/3] relative">
                <img
                  src={parte.img}
                  alt={parte.label}
                  className="w-full h-full object-cover"
                />
                {/* Overlay */}
                <div className={`absolute inset-0 transition-colors ${
                  isSelected ? "bg-[hsl(212_35%_18%/0.1)]" : "bg-black/20"
                }`} />

                {/* Checkbox */}
                <div className="absolute top-2 left-2">
                  <Checkbox
                    checked={isSelected}
                    className="h-5 w-5 border-2 border-white bg-white/80 data-[state=checked]:bg-[hsl(212_35%_18%)] data-[state=checked]:border-[hsl(212_35%_18%)]"
                    tabIndex={-1}
                  />
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="h-5 w-5 text-white drop-shadow-lg" />
                  </div>
                )}
              </div>

              {/* Label */}
              <div className={`px-2 py-1.5 text-center text-xs font-semibold transition-colors ${
                isSelected
                  ? "bg-[hsl(212_35%_18%)] text-white"
                  : "bg-muted text-muted-foreground"
              }`}>
                {parte.label}
              </div>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

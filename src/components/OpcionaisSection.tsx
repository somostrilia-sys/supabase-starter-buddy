import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";

/* ─── Types ─── */
export interface OpcionalItem {
  opcional_id: string;
  nome: string;
  categoria: string;
  valor_mensal: number;
}

interface Props {
  negociacaoId: string;
  tipoVeiculo: string; // "Automóvel" | "Motocicleta" | "Caminhão"
  selected: OpcionalItem[];
  onChange: (selected: OpcionalItem[]) => void;
}

/* ─── Helpers ─── */
const TIPO_MAP: Record<string, string[]> = {
  "Automóvel": ["leves", "todos"],
  "Motocicleta": ["motos", "todos"],
  "Caminhão": ["pesados", "todos"],
};

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* ─── Component ─── */
export default function OpcionaisSection({ negociacaoId, tipoVeiculo, selected, onChange }: Props) {
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});

  const tiposPermitidos = TIPO_MAP[tipoVeiculo] ?? ["todos"];

  /* Fetch opcionais_catalogo */
  const { data: catalogo = [], isLoading } = useQuery({
    queryKey: ["opcionais_catalogo", tipoVeiculo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opcionais_catalogo")
        .select("*")
        .in("tipo_veiculo", tiposPermitidos)
        .eq("ativo", true)
        .order("categoria")
        .order("nome");
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        nome: string;
        categoria: string;
        valor_mensal: number;
        tipo_veiculo: string;
      }>;
    },
  });

  /* Group by categoria */
  const grouped = useMemo(() => {
    const map: Record<string, typeof catalogo> = {};
    for (const item of catalogo) {
      if (!map[item.categoria]) map[item.categoria] = [];
      map[item.categoria].push(item);
    }
    return map;
  }, [catalogo]);

  const categorias = Object.keys(grouped).sort();

  /* Selection helpers */
  const selectedIds = useMemo(() => new Set(selected.map((s) => s.opcional_id)), [selected]);

  const toggle = (item: (typeof catalogo)[number]) => {
    const id = item.id;
    if (selectedIds.has(id)) {
      onChange(selected.filter((s) => s.opcional_id !== id));
    } else {
      onChange([
        ...selected,
        { opcional_id: id, nome: item.nome, categoria: item.categoria, valor_mensal: item.valor_mensal },
      ]);
    }
  };

  const toggleCat = (cat: string) => {
    setOpenCats((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  /* Running total */
  const total = useMemo(() => selected.reduce((acc, s) => acc + s.valor_mensal, 0), [selected]);

  /* ─── Render ─── */
  if (isLoading) {
    return (
      <div className="text-xs text-muted-foreground py-4 text-center">
        Carregando opcionais...
      </div>
    );
  }

  if (categorias.length === 0) {
    return (
      <div className="text-xs text-muted-foreground py-4 text-center">
        Nenhum opcional disponível para este tipo de veículo.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-[#1A3A5C]">Opcionais</h3>

      {categorias.map((cat) => {
        const isOpen = openCats[cat] ?? false;
        const items = grouped[cat];
        const selectedInCat = items.filter((i) => selectedIds.has(i.id)).length;

        return (
          <div key={cat} className="border rounded-none">
            {/* Category header */}
            <button
              type="button"
              onClick={() => toggleCat(cat)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className="text-xs font-medium text-[#1A3A5C]">{cat}</span>
                {selectedInCat > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-none">
                    {selectedInCat}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground">{items.length} itens</span>
            </button>

            {/* Items */}
            {isOpen && (
              <div className="border-t px-3 py-2 space-y-2">
                {items.map((item) => {
                  const checked = selectedIds.has(item.id);
                  return (
                    <label
                      key={item.id}
                      className="flex items-center justify-between gap-2 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggle(item)}
                        />
                        <span className="text-xs text-[#1A3A5C] group-hover:underline">
                          {item.nome}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                        {formatBRL(item.valor_mensal)}/mês
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Running total */}
      <div className="flex items-center justify-between border rounded-none px-3 py-2 bg-muted/30">
        <span className="text-xs font-medium text-[#1A3A5C]">
          Total opcionais ({selected.length} selecionado{selected.length !== 1 ? "s" : ""})
        </span>
        <span className="text-sm font-semibold text-[#1A3A5C]">
          +{formatBRL(total)}/mês
        </span>
      </div>
    </div>
  );
}

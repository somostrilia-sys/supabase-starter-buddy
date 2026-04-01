import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, callEdgePublic } from "@/integrations/supabase/client";
import {
  Shield,
  CheckCircle,
  Phone,
  Car,
  Loader2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const LOGO_URL =
  "https://objetivoauto.com.br/wp-content/uploads/2025/11/IMG_1299.png";
const WHATSAPP_NUMBER = "5511915395063";
const PHONE_0800 = "0800 111 3400";
const CNPJ = "58.506.161/0001-31";

function formatBRL(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** (XX) XXXXX-XXXX */
function maskPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7)
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** ABC1D23 → ABC-1D23 */
function maskPlaca(raw: string): string {
  const clean = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 7);
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)}-${clean.slice(3)}`;
}

function unmaskedDigits(val: string): string {
  return val.replace(/\D/g, "");
}

function unmaskedPlaca(val: string): string {
  return val.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

interface VehicleInfo {
  modelo: string;
  marca?: string;
  ano?: string;
  valor_fipe?: number;
  tipo_veiculo?: string;
}

const TRUST_ITEMS = [
  "Sem análise de perfil",
  "Cobertura completa",
  "Assistência 24h nacional",
  "Licenciado SUSEP",
];

const UF_LIST = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA",
  "PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

export default function CotacaoFormPublica() {
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [placa, setPlaca] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");

  const [vehicle, setVehicle] = useState<VehicleInfo | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Auto-lookup when plate reaches 7 chars
  const handlePlacaChange = useCallback(
    async (raw: string) => {
      const masked = maskPlaca(raw);
      setPlaca(masked);

      const clean = unmaskedPlaca(raw);
      if (clean.length === 7) {
        setLookupLoading(true);
        setLookupError(null);
        setVehicle(null);
        try {
          const result = await callEdgePublic("gia-buscar-placa", {
            body: { placa: clean },
          });
          if (result?.error || !result?.modelo) {
            setLookupError(
              result?.error || "Veículo não encontrado. Verifique a placa."
            );
          } else {
            setVehicle(result as VehicleInfo);
          }
        } catch {
          setLookupError("Erro ao consultar placa. Tente novamente.");
        } finally {
          setLookupLoading(false);
        }
      } else {
        setVehicle(null);
        setLookupError(null);
      }
    },
    []
  );

  const canSubmit =
    nome.trim().length > 0 &&
    unmaskedDigits(telefone).length >= 10 &&
    unmaskedPlaca(placa).length === 7 &&
    vehicle != null &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !vehicle) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const cleanPlaca = unmaskedPlaca(placa);
      const cleanPhone = unmaskedDigits(telefone);

      // 1. Insert negociacao
      const { data: neg, error: negErr } = await supabase
        .from("negociacoes" as any)
        .insert({
          lead_nome: nome.trim(),
          telefone: cleanPhone,
          email: email.trim() || null,
          veiculo_placa: cleanPlaca,
          veiculo_modelo: vehicle.modelo,
          valor_plano: vehicle.valor_fipe || null,
          stage: "novo_lead",
          origem: "Site Objetivo",
          cidade: cidade.trim() || null,
          uf: uf || null,
        } as any)
        .select("id")
        .single();

      if (negErr || !neg) throw new Error(negErr?.message || "Erro ao salvar lead.");

      const negId = (neg as any).id;

      // 2. Query tabela_precos for matching plans
      let matchQuery = supabase
        .from("tabela_precos" as any)
        .select("*")
        .eq("ativo", true);

      if (vehicle.valor_fipe) {
        matchQuery = matchQuery
          .lte("fipe_min", vehicle.valor_fipe)
          .gte("fipe_max", vehicle.valor_fipe);
      }
      if (vehicle.tipo_veiculo) {
        matchQuery = matchQuery.eq("tipo_veiculo", vehicle.tipo_veiculo);
      }

      const { data: planos } = await matchQuery;

      // 3. Insert cotacao
      const { data: cot, error: cotErr } = await supabase
        .from("cotacoes" as any)
        .insert({
          negociacao_id: negId,
          todos_planos: (planos || []) as any,
        } as any)
        .select("id")
        .single();

      if (cotErr || !cot) throw new Error(cotErr?.message || "Erro ao gerar cotação.");

      const cotId = (cot as any).id;

      // 4. Redirect to the cotacao landing page
      navigate(`/cotacao/${cotId}`);
    } catch (err: any) {
      setSubmitError(err?.message || "Erro ao processar cotação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen font-sans flex flex-col">
      {/* Header */}
      <header className="bg-[#002b5e] text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <img
            src={LOGO_URL}
            alt="Objetivo Auto"
            className="h-10 sm:h-12 object-contain"
          />
          <a
            href={`tel:${PHONE_0800.replace(/\s/g, "")}`}
            className="flex items-center gap-2 text-sm sm:text-base font-semibold hover:text-[#7ed6f1] transition-colors"
          >
            <Phone className="w-4 h-4" />
            {PHONE_0800}
          </a>
        </div>
      </header>

      {/* Hero + Form */}
      <section className="flex-1 bg-gradient-to-br from-[#002b5e] via-[#003572] to-[#004a9e] px-4 py-10 sm:py-16">
        <div className="max-w-xl mx-auto text-center text-white mb-8">
          <Shield className="w-12 h-12 text-[#7ed6f1] mx-auto mb-4" />
          <h1 className="text-2xl sm:text-4xl font-bold leading-tight">
            Proteção Veicular
            <br />
            com Tecnologia
          </h1>
          <p className="mt-3 text-lg sm:text-xl text-[#7ed6f1]">
            Faça sua cotação em segundos
          </p>
        </div>

        {/* Form Card */}
        <Card className="max-w-xl mx-auto shadow-2xl">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nome */}
              <div>
                <Label htmlFor="nome" className="text-[#002b5e] font-semibold">
                  Nome completo *
                </Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  className="mt-1"
                />
              </div>

              {/* WhatsApp + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefone" className="text-[#002b5e] font-semibold">
                    WhatsApp *
                  </Label>
                  <Input
                    id="telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(maskPhone(e.target.value))}
                    placeholder="(11) 91234-5678"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-[#002b5e] font-semibold">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Placa */}
              <div>
                <Label htmlFor="placa" className="text-[#002b5e] font-semibold">
                  Placa do Veículo *
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="placa"
                    value={placa}
                    onChange={(e) => handlePlacaChange(e.target.value)}
                    placeholder="ABC-1D23"
                    required
                    maxLength={8}
                    className="uppercase pr-10"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {lookupLoading ? (
                      <Loader2 className="w-5 h-5 text-[#7ed6f1] animate-spin" />
                    ) : (
                      <Search className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Vehicle result */}
                {vehicle && (
                  <div className="mt-3 flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
                    <Car className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-800">
                        {vehicle.marca ? `${vehicle.marca} ` : ""}
                        {vehicle.modelo}
                        {vehicle.ano ? ` ${vehicle.ano}` : ""}
                      </p>
                      {vehicle.valor_fipe != null && (
                        <p className="text-sm text-green-700">
                          FIPE: {formatBRL(vehicle.valor_fipe)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Lookup error */}
                {lookupError && (
                  <p className="mt-2 text-sm text-red-600">{lookupError}</p>
                )}
              </div>

              {/* Cidade + UF */}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
                <div>
                  <Label htmlFor="cidade" className="text-[#002b5e] font-semibold">
                    Cidade
                  </Label>
                  <Input
                    id="cidade"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Sua cidade"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="uf" className="text-[#002b5e] font-semibold">
                    Estado
                  </Label>
                  <select
                    id="uf"
                    value={uf}
                    onChange={(e) => setUf(e.target.value)}
                    className="mt-1 flex h-10 w-full sm:w-20 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">UF</option>
                    {UF_LIST.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit error */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              {/* CTA */}
              <Button
                type="submit"
                disabled={!canSubmit}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-lg font-bold py-6 rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Gerando cotação...
                  </>
                ) : (
                  "FAZER MINHA COTAÇÃO"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Trust badges */}
        <div className="max-w-xl mx-auto mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TRUST_ITEMS.map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 text-white/90 text-sm"
            >
              <CheckCircle className="w-5 h-5 text-[#7ed6f1] flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#002b5e] text-white/60 py-6 px-4 text-center text-sm">
        <p>
          CNPJ {CNPJ} | Objetivo Proteção Veicular
        </p>
        <div className="mt-2 flex items-center justify-center gap-4">
          <a
            href={`tel:${PHONE_0800.replace(/\s/g, "")}`}
            className="hover:text-white transition-colors"
          >
            {PHONE_0800}
          </a>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            WhatsApp
          </a>
        </div>
      </footer>
    </div>
  );
}

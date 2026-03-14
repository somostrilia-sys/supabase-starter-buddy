import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Search, Car, User, DollarSign, FileText, Clock, Eye, Pencil,
  ArrowLeft, Save, Upload, Trash2, Plus, Download, Printer,
  ChevronLeft, ChevronRight, Users, Package, ClipboardCheck,
  AlertTriangle, FileSignature, Phone as PhoneIcon,
} from "lucide-react";

// ─── Types & Mock ───
interface Veiculo {
  id: string; nome: string; placa: string; chassi: string; idExterno: string;
  modelo: string; marca: string; anoFab: number; anoMod: number; cor: string;
  valorFipe: number; cota: string; combustivel: string; km: number;
  regional: string; cooperativa: string; tipoAdesao: string;
  dataCadastro: string; dataContrato: string; diaVenc: number;
  sitVeiculo: string; sitAssociado: string;
  condutores: { nome: string; cpf: string; cnh: string; dataNasc: string; situacao: string }[];
  lancamentos: { nTitulo: string; nBanco: string; tipo: string; banco: string; dtEmissao: string; dataVenc: string; dataPgto: string; valor: number; valorPago: number; parcela: string; nControle: string; status: string }[];
  agregados: { tipo: string; placa: string; cota: string; marcaModelo: string; valor: number; data: string; situacao: string }[];
  vistorias: { data: string; tipo: string; resultado: string; obs: string; usuario: string }[];
  documentos: { nome: string; tipo: string; data: string }[];
  observacoes: { data: string; descricao: string; usuario: string }[];
  fornecedores: { protocolo: string; fornecedor: string; produto: string; servico: string; motivo: string; situacao: string; dataAbertura: string; dataFechamento: string }[];
  contratos: { contrato: string; termo: string; status: string; ip: string; dataHoraEnvio: string; arquivo: string }[];
}

const calcIdade = (dn: string) => {
  const h = new Date(); const n = new Date(dn);
  let a = h.getFullYear() - n.getFullYear();
  if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) a--;
  return a;
};

const mockVeiculos: Veiculo[] = [
  {
    id: "V001", nome: "Carlos Alberto Silva", placa: "BRA-2E19", chassi: "9BWZZZ377VT004251", idExterno: "EXT-142",
    modelo: "T-Cross 200 TSI", marca: "Volkswagen", anoFab: 2023, anoMod: 2024, cor: "Branco",
    valorFipe: 119500, cota: "Cota 120", combustivel: "Flex", km: 12500,
    regional: "Regional Capital", cooperativa: "Cooperativa São Paulo", tipoAdesao: "Normal",
    dataCadastro: "2022-01-15", dataContrato: "2022-01-20", diaVenc: 10,
    sitVeiculo: "Ativo", sitAssociado: "Ativo",
    condutores: [
      { nome: "Carlos Alberto Silva", cpf: "342.876.541-09", cnh: "04512367890", dataNasc: "1985-03-15", situacao: "Ativo" },
      { nome: "Maria Helena Silva", cpf: "456.789.123-00", cnh: "98765432100", dataNasc: "1988-07-22", situacao: "Ativo" },
    ],
    lancamentos: [
      { nTitulo: "T-2026-001", nBanco: "B-001", tipo: "Mensalidade", banco: "Bradesco", dtEmissao: "2026-03-01", dataVenc: "2026-03-10", dataPgto: "", valor: 189.90, valorPago: 0, parcela: "03/12", nControle: "CTL-001", status: "Pendente" },
      { nTitulo: "T-2026-002", nBanco: "B-002", tipo: "Mensalidade", banco: "Bradesco", dtEmissao: "2026-02-01", dataVenc: "2026-02-10", dataPgto: "2026-02-10", valor: 189.90, valorPago: 189.90, parcela: "02/12", nControle: "CTL-002", status: "Pago" },
      { nTitulo: "T-2026-003", nBanco: "B-003", tipo: "Mensalidade", banco: "Bradesco", dtEmissao: "2026-01-01", dataVenc: "2026-01-10", dataPgto: "2026-01-10", valor: 189.90, valorPago: 189.90, parcela: "01/12", nControle: "CTL-003", status: "Pago" },
      { nTitulo: "T-2025-012", nBanco: "B-012", tipo: "Mensalidade", banco: "Bradesco", dtEmissao: "2025-12-01", dataVenc: "2025-12-10", dataPgto: "2025-12-10", valor: 189.90, valorPago: 189.90, parcela: "12/12", nControle: "CTL-012", status: "Pago" },
      { nTitulo: "T-2025-011", nBanco: "B-011", tipo: "Rateio", banco: "Bradesco", dtEmissao: "2025-11-01", dataVenc: "2025-11-10", dataPgto: "", valor: 45.00, valorPago: 0, parcela: "-", nControle: "CTL-R01", status: "Atrasado" },
    ],
    agregados: [
      { tipo: "Reboque", placa: "RBQ-1A23", cota: "Cota 80", marcaModelo: "Carretinha Fazendinha", valor: 15000, data: "2023-06-01", situacao: "Ativo" },
    ],
    vistorias: [
      { data: "2022-01-18", tipo: "Presencial", resultado: "Aprovada", obs: "Veículo em perfeito estado", usuario: "vistoriador@gia.com" },
      { data: "2024-01-20", tipo: "App Visto", resultado: "Aprovada", obs: "Renovação anual ok", usuario: "sistema" },
    ],
    documentos: [
      { nome: "CRLV_BRA2E19.pdf", tipo: "CRLV", data: "15/01/2022" },
      { nome: "Fotos_Vistoria_2022.zip", tipo: "Fotos", data: "18/01/2022" },
      { nome: "Laudo_Vistoria_2024.pdf", tipo: "Laudo", data: "20/01/2024" },
    ],
    observacoes: [
      { data: "05/03/2026", descricao: "Solicitação de troca de plano para Premium", usuario: "admin@gia.com" },
      { data: "10/01/2026", descricao: "Atualização do KM: 12.500", usuario: "operador@gia.com" },
      { data: "15/11/2025", descricao: "Renovação de contrato realizada", usuario: "financeiro@gia.com" },
    ],
    fornecedores: [
      { protocolo: "PROT-2025-001", fornecedor: "Guincho Express", produto: "Assistência 24h", servico: "Guincho", motivo: "Pane mecânica", situacao: "Concluído", dataAbertura: "2025-09-15", dataFechamento: "2025-09-15" },
      { protocolo: "PROT-2026-003", fornecedor: "Auto Glass", produto: "Vidros", servico: "Troca Parabrisa", motivo: "Pedra na estrada", situacao: "Em Andamento", dataAbertura: "2026-02-28", dataFechamento: "" },
    ],
    contratos: [
      { contrato: "CTR-2022-0142", termo: "Contrato de Adesão", status: "Assinado", ip: "189.45.123.67", dataHoraEnvio: "20/01/2022 14:30", arquivo: "contrato_adesao_142.pdf" },
      { contrato: "CTR-2024-0890", termo: "Termo de Renovação", status: "Assinado", ip: "189.45.123.67", dataHoraEnvio: "20/01/2024 10:15", arquivo: "renovacao_890.pdf" },
    ],
  },
  {
    id: "V002", nome: "Maria Aparecida Santos", placa: "CPS-3G78", chassi: "93HFC6860PZ000123", idExterno: "EXT-256",
    modelo: "Civic EXL 2.0", marca: "Honda", anoFab: 2023, anoMod: 2023, cor: "Prata",
    valorFipe: 135000, cota: "Cota 150", combustivel: "Flex", km: 8700,
    regional: "Regional Interior", cooperativa: "Cooperativa Campinas", tipoAdesao: "Normal",
    dataCadastro: "2023-05-10", dataContrato: "2023-05-15", diaVenc: 15,
    sitVeiculo: "Ativo", sitAssociado: "Ativo",
    condutores: [{ nome: "Maria Aparecida Santos", cpf: "456.123.789-00", cnh: "98765432100", dataNasc: "1990-07-22", situacao: "Ativo" }],
    lancamentos: [
      { nTitulo: "T-2026-101", nBanco: "B-101", tipo: "Mensalidade", banco: "Itaú", dtEmissao: "2026-03-01", dataVenc: "2026-03-15", dataPgto: "", valor: 249.90, valorPago: 0, parcela: "03/12", nControle: "CTL-101", status: "Pendente" },
      { nTitulo: "T-2026-102", nBanco: "B-102", tipo: "Mensalidade", banco: "Itaú", dtEmissao: "2026-02-01", dataVenc: "2026-02-15", dataPgto: "2026-02-15", valor: 249.90, valorPago: 249.90, parcela: "02/12", nControle: "CTL-102", status: "Pago" },
    ],
    agregados: [],
    vistorias: [{ data: "2023-05-12", tipo: "App Visto", resultado: "Aprovada", obs: "OK", usuario: "sistema" }],
    documentos: [{ nome: "CRLV_CPS3G78.pdf", tipo: "CRLV", data: "10/05/2023" }],
    observacoes: [{ data: "01/03/2026", descricao: "Solicitação de 2ª via boleto", usuario: "atendimento@gia.com" }],
    fornecedores: [],
    contratos: [{ contrato: "CTR-2023-0256", termo: "Contrato de Adesão", status: "Assinado", ip: "200.12.45.89", dataHoraEnvio: "15/05/2023 09:00", arquivo: "contrato_256.pdf" }],
  },
  {
    id: "V003", nome: "José Roberto Oliveira", placa: "RJO-5K34", chassi: "9BR53ZEC1LG012345", idExterno: "EXT-089",
    modelo: "Hilux SRV 4x4", marca: "Toyota", anoFab: 2022, anoMod: 2022, cor: "Preto",
    valorFipe: 220000, cota: "Cota 150", combustivel: "Diesel", km: 45000,
    regional: "Regional Litoral", cooperativa: "Cooperativa Rio", tipoAdesao: "Transferência",
    dataCadastro: "2021-08-20", dataContrato: "2021-08-25", diaVenc: 5,
    sitVeiculo: "Inadimplente", sitAssociado: "Suspenso",
    condutores: [{ nome: "José Roberto Oliveira", cpf: "789.654.321-55", cnh: "11223344556", dataNasc: "1978-11-03", situacao: "Suspenso" }],
    lancamentos: [
      { nTitulo: "T-2026-201", nBanco: "B-201", tipo: "Mensalidade", banco: "BB", dtEmissao: "2026-03-01", dataVenc: "2026-03-05", dataPgto: "", valor: 139.90, valorPago: 0, parcela: "03/12", nControle: "CTL-201", status: "Atrasado" },
      { nTitulo: "T-2026-202", nBanco: "B-202", tipo: "Mensalidade", banco: "BB", dtEmissao: "2026-02-01", dataVenc: "2026-02-05", dataPgto: "", valor: 139.90, valorPago: 0, parcela: "02/12", nControle: "CTL-202", status: "Atrasado" },
      { nTitulo: "T-2026-203", nBanco: "B-203", tipo: "Mensalidade", banco: "BB", dtEmissao: "2026-01-01", dataVenc: "2026-01-05", dataPgto: "", valor: 139.90, valorPago: 0, parcela: "01/12", nControle: "CTL-203", status: "Atrasado" },
    ],
    agregados: [],
    vistorias: [{ data: "2021-08-22", tipo: "Presencial", resultado: "Aprovada", obs: "Transferência de titularidade", usuario: "vistoriador@gia.com" }],
    documentos: [{ nome: "CRLV_RJO5K34.pdf", tipo: "CRLV", data: "20/08/2021" }],
    observacoes: [{ data: "01/03/2026", descricao: "3 mensalidades em atraso - suspensão automática", usuario: "sistema" }],
    fornecedores: [],
    contratos: [{ contrato: "CTR-2021-0089", termo: "Contrato de Adesão", status: "Assinado", ip: "177.55.67.12", dataHoraEnvio: "25/08/2021 16:00", arquivo: "contrato_089.pdf" }],
  },
  {
    id: "V004", nome: "Ana Paula Ferreira", placa: "BHZ-1A45", chassi: "9CDFC48B0MB123456", idExterno: "EXT-310",
    modelo: "Compass Limited", marca: "Jeep", anoFab: 2024, anoMod: 2024, cor: "Vermelho",
    valorFipe: 195000, cota: "Cota 120", combustivel: "Flex", km: 3200,
    regional: "Regional Capital", cooperativa: "Cooperativa Minas", tipoAdesao: "Normal",
    dataCadastro: "2024-02-01", dataContrato: "2024-02-05", diaVenc: 20,
    sitVeiculo: "Ativo", sitAssociado: "Ativo",
    condutores: [
      { nome: "Ana Paula Ferreira", cpf: "123.456.789-10", cnh: "55667788990", dataNasc: "1992-05-18", situacao: "Ativo" },
      { nome: "Pedro Henrique Ferreira", cpf: "321.654.987-00", cnh: "44556677889", dataNasc: "1990-02-14", situacao: "Ativo" },
    ],
    lancamentos: [
      { nTitulo: "T-2026-301", nBanco: "B-301", tipo: "Mensalidade", banco: "Nubank", dtEmissao: "2026-03-01", dataVenc: "2026-03-20", dataPgto: "", valor: 249.90, valorPago: 0, parcela: "02/12", nControle: "CTL-301", status: "Pendente" },
      { nTitulo: "T-2026-302", nBanco: "B-302", tipo: "Mensalidade", banco: "Nubank", dtEmissao: "2026-02-01", dataVenc: "2026-02-20", dataPgto: "2026-02-20", valor: 249.90, valorPago: 249.90, parcela: "01/12", nControle: "CTL-302", status: "Pago" },
    ],
    agregados: [],
    vistorias: [{ data: "2024-02-03", tipo: "App Visto", resultado: "Aprovada", obs: "Veículo zero km", usuario: "sistema" }],
    documentos: [{ nome: "CRLV_BHZ1A45.pdf", tipo: "CRLV", data: "01/02/2024" }, { nome: "NF_Compass.pdf", tipo: "Nota Fiscal", data: "01/02/2024" }],
    observacoes: [],
    fornecedores: [],
    contratos: [{ contrato: "CTR-2024-0310", termo: "Contrato de Adesão", status: "Assinado", ip: "201.33.44.55", dataHoraEnvio: "05/02/2024 11:30", arquivo: "contrato_310.pdf" }],
  },
  {
    id: "V005", nome: "Adriana Souza Rodrigues", placa: "CWB-4E23", chassi: "9BHBG51DBTP112233", idExterno: "EXT-445",
    modelo: "Creta Platinum", marca: "Hyundai", anoFab: 2024, anoMod: 2024, cor: "Azul",
    valorFipe: 145000, cota: "Cota 120", combustivel: "Flex", km: 5600,
    regional: "Regional Capital", cooperativa: "Cooperativa Sul", tipoAdesao: "Normal",
    dataCadastro: "2023-09-01", dataContrato: "2023-09-05", diaVenc: 15,
    sitVeiculo: "Ativo", sitAssociado: "Ativo",
    condutores: [{ nome: "Adriana Souza Rodrigues", cpf: "654.987.321-88", cnh: "66778899001", dataNasc: "1988-09-12", situacao: "Ativo" }],
    lancamentos: [
      { nTitulo: "T-2026-401", nBanco: "B-401", tipo: "Mensalidade", banco: "Inter", dtEmissao: "2026-03-01", dataVenc: "2026-03-15", dataPgto: "", valor: 139.90, valorPago: 0, parcela: "07/12", nControle: "CTL-401", status: "Pendente" },
    ],
    agregados: [],
    vistorias: [{ data: "2023-09-03", tipo: "App Visto", resultado: "Aprovada", obs: "OK", usuario: "sistema" }],
    documentos: [{ nome: "CRLV_CWB4E23.pdf", tipo: "CRLV", data: "01/09/2023" }],
    observacoes: [],
    fornecedores: [],
    contratos: [{ contrato: "CTR-2023-0445", termo: "Contrato de Adesão", status: "Assinado", ip: "187.22.33.44", dataHoraEnvio: "05/09/2023 14:00", arquivo: "contrato_445.pdf" }],
  },
  {
    id: "V006", nome: "Paulo Henrique Almeida", placa: "GYN-6F45", chassi: "9BR53ZHE7MG654321", idExterno: "EXT-567",
    modelo: "SW4 SRX 2.8", marca: "Toyota", anoFab: 2023, anoMod: 2023, cor: "Preto",
    valorFipe: 310000, cota: "Cota 150", combustivel: "Diesel", km: 28000,
    regional: "Regional Interior", cooperativa: "Cooperativa Centro-Oeste", tipoAdesao: "Normal",
    dataCadastro: "2022-11-01", dataContrato: "2022-11-05", diaVenc: 10,
    sitVeiculo: "Ativo", sitAssociado: "Ativo",
    condutores: [
      { nome: "Paulo Henrique Almeida", cpf: "987.321.654-77", cnh: "22334455667", dataNasc: "1982-04-30", situacao: "Ativo" },
      { nome: "Sandra Almeida", cpf: "111.222.333-44", cnh: "33445566778", dataNasc: "1985-06-15", situacao: "Ativo" },
    ],
    lancamentos: [
      { nTitulo: "T-2026-501", nBanco: "B-501", tipo: "Mensalidade", banco: "Santander", dtEmissao: "2026-03-01", dataVenc: "2026-03-10", dataPgto: "", valor: 189.90, valorPago: 0, parcela: "05/12", nControle: "CTL-501", status: "Pendente" },
      { nTitulo: "T-2026-502", nBanco: "B-502", tipo: "Mensalidade", banco: "Santander", dtEmissao: "2026-02-01", dataVenc: "2026-02-10", dataPgto: "2026-02-10", valor: 189.90, valorPago: 189.90, parcela: "04/12", nControle: "CTL-502", status: "Pago" },
    ],
    agregados: [
      { tipo: "Reboque", placa: "GYN-0R12", cota: "Cota 80", marcaModelo: "Carretinha Randon", valor: 25000, data: "2023-03-10", situacao: "Ativo" },
    ],
    vistorias: [{ data: "2022-11-03", tipo: "Presencial", resultado: "Aprovada", obs: "Veículo em excelente estado", usuario: "vistoriador@gia.com" }],
    documentos: [{ nome: "CRLV_GYN6F45.pdf", tipo: "CRLV", data: "01/11/2022" }],
    observacoes: [{ data: "01/01/2026", descricao: "Agregado reboque vinculado", usuario: "admin@gia.com" }],
    fornecedores: [
      { protocolo: "PROT-2025-045", fornecedor: "Guincho Master", produto: "Assistência 24h", servico: "Guincho Pesado", motivo: "Pneu furado", situacao: "Concluído", dataAbertura: "2025-06-20", dataFechamento: "2025-06-20" },
    ],
    contratos: [{ contrato: "CTR-2022-0567", termo: "Contrato de Adesão", status: "Assinado", ip: "170.11.22.33", dataHoraEnvio: "05/11/2022 15:00", arquivo: "contrato_567.pdf" }],
  },
  {
    id: "V007", nome: "Juliana Cristina Nascimento", placa: "BSB-3A78", chassi: "9BGKT08DXRG789012", idExterno: "EXT-678",
    modelo: "Tracker Premier 1.2T", marca: "Chevrolet", anoFab: 2024, anoMod: 2024, cor: "Azul",
    valorFipe: 155000, cota: "Cota 120", combustivel: "Flex", km: 4200,
    regional: "Regional Capital", cooperativa: "Cooperativa Centro-Oeste", tipoAdesao: "Normal",
    dataCadastro: "2024-06-01", dataContrato: "2024-06-05", diaVenc: 5,
    sitVeiculo: "Pendente", sitAssociado: "Ativo",
    condutores: [{ nome: "Juliana Cristina Nascimento", cpf: "111.222.333-44", cnh: "99887766554", dataNasc: "1995-12-08", situacao: "Ativo" }],
    lancamentos: [
      { nTitulo: "T-2026-601", nBanco: "B-601", tipo: "Mensalidade", banco: "Nubank", dtEmissao: "2026-03-01", dataVenc: "2026-03-05", dataPgto: "", valor: 349.90, valorPago: 0, parcela: "10/12", nControle: "CTL-601", status: "Pendente" },
    ],
    agregados: [],
    vistorias: [{ data: "2024-06-03", tipo: "App Visto", resultado: "Pendente", obs: "Aguardando aprovação do laudo", usuario: "sistema" }],
    documentos: [{ nome: "CRLV_BSB3A78.pdf", tipo: "CRLV", data: "01/06/2024" }],
    observacoes: [{ data: "05/03/2026", descricao: "Vistoria pendente de aprovação", usuario: "admin@gia.com" }],
    fornecedores: [],
    contratos: [{ contrato: "CTR-2024-0678", termo: "Contrato de Adesão", status: "Pendente", ip: "", dataHoraEnvio: "", arquivo: "" }],
  },
  {
    id: "V008", nome: "Francisco das Chagas Lima", placa: "FOR-2D56", chassi: "9BD195227L0123456", idExterno: "EXT-099",
    modelo: "Strada Freedom 1.3", marca: "Fiat", anoFab: 2021, anoMod: 2021, cor: "Branco",
    valorFipe: 78000, cota: "Cota 100", combustivel: "Flex", km: 62000,
    regional: "Regional Metropolitana", cooperativa: "Cooperativa Nordeste", tipoAdesao: "Normal",
    dataCadastro: "2020-06-15", dataContrato: "2020-06-20", diaVenc: 25,
    sitVeiculo: "Inativo", sitAssociado: "Inativo",
    condutores: [{ nome: "Francisco das Chagas Lima", cpf: "321.654.987-00", cnh: "33445566778", dataNasc: "1970-01-25", situacao: "Inativo" }],
    lancamentos: [
      { nTitulo: "T-2025-801", nBanco: "B-801", tipo: "Mensalidade", banco: "Caixa", dtEmissao: "2025-06-01", dataVenc: "2025-06-25", dataPgto: "", valor: 89.90, valorPago: 0, parcela: "06/12", nControle: "CTL-801", status: "Atrasado" },
    ],
    agregados: [],
    vistorias: [{ data: "2020-06-17", tipo: "Presencial", resultado: "Aprovada", obs: "OK", usuario: "vistoriador@gia.com" }],
    documentos: [{ nome: "CRLV_FOR2D56.pdf", tipo: "CRLV", data: "15/06/2020" }],
    observacoes: [{ data: "01/07/2025", descricao: "Cancelamento por inadimplência", usuario: "sistema" }],
    fornecedores: [],
    contratos: [{ contrato: "CTR-2020-0099", termo: "Contrato de Adesão", status: "Cancelado", ip: "200.99.88.77", dataHoraEnvio: "20/06/2020 10:00", arquivo: "contrato_099.pdf" }],
  },
];

// sitBadge replaced by StatusBadge component

const finBadge = (s: string) => {
  const m: Record<string,string> = { "Pago": "bg-emerald-100 text-emerald-700 border-emerald-200", "Pendente": "bg-amber-100 text-amber-700 border-amber-200", "Atrasado": "bg-red-100 text-red-700 border-red-200" };
  return m[s] || "";
};

export default function ConsultarVeiculo() {
  const [filters, setFilters] = useState({ placa: "", chassi: "", idExterno: "", proprietario: "", idVeiculo: "", sitVeiculo: "Todos", sitAssociado: "Todos", cooperativa: "Todos" });
  const [results, setResults] = useState<Veiculo[]>([]);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<Veiculo | null>(null);
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [condutorModal, setCondutorModal] = useState(false);
  const [newObs, setNewObs] = useState("");

  const setF = (k: string, v: string) => setFilters(p => ({ ...p, [k]: v }));

  const buscar = () => {
    let r = [...mockVeiculos];
    if (filters.placa) r = r.filter(v => v.placa.toLowerCase().replace("-","").includes(filters.placa.toLowerCase().replace("-","")));
    if (filters.chassi) r = r.filter(v => v.chassi.toLowerCase().includes(filters.chassi.toLowerCase()));
    if (filters.idExterno) r = r.filter(v => v.idExterno.toLowerCase().includes(filters.idExterno.toLowerCase()));
    if (filters.proprietario) r = r.filter(v => v.nome.toLowerCase().includes(filters.proprietario.toLowerCase()));
    if (filters.idVeiculo) r = r.filter(v => v.id.toLowerCase().includes(filters.idVeiculo.toLowerCase()));
    if (filters.sitVeiculo !== "Todos") r = r.filter(v => v.sitVeiculo === filters.sitVeiculo);
    if (filters.sitAssociado !== "Todos") r = r.filter(v => v.sitAssociado === filters.sitAssociado);
    if (filters.cooperativa !== "Todos") r = r.filter(v => v.cooperativa === filters.cooperativa);
    setResults(r);
    setSearched(true);
    setPage(1);
  };

  const limpar = () => { setFilters({ placa:"",chassi:"",idExterno:"",proprietario:"",idVeiculo:"",sitVeiculo:"Todos",sitAssociado:"Todos",cooperativa:"Todos" }); setResults([]); setSearched(false); };

  const paged = results.slice((page-1)*perPage, page*perPage);
  const totalPages = Math.ceil(results.length / perPage);

  // ── LIST VIEW ──
  if (!selected) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-lg font-bold">Consultar / Alterar Veículo</h2>
          <p className="text-sm text-muted-foreground">Busca avançada de veículos com edição completa</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
              <div><Label className="text-xs">Placa</Label><Input value={filters.placa} onChange={e => setF("placa", e.target.value)} placeholder="ABC-1234" /></div>
              <div><Label className="text-xs">Chassi</Label><Input value={filters.chassi} onChange={e => setF("chassi", e.target.value)} /></div>
              <div><Label className="text-xs">Id Externo</Label><Input value={filters.idExterno} onChange={e => setF("idExterno", e.target.value)} /></div>
              <div><Label className="text-xs">Proprietário</Label><Input value={filters.proprietario} onChange={e => setF("proprietario", e.target.value)} /></div>
              <div><Label className="text-xs">Id Veículo</Label><Input value={filters.idVeiculo} onChange={e => setF("idVeiculo", e.target.value)} /></div>
              <div><Label className="text-xs">Sit. Veículo</Label>
                <Select value={filters.sitVeiculo} onValueChange={v => setF("sitVeiculo", v)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Todos","Ativo","Inativo","Negado","Pendente","Inadimplente"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label className="text-xs">Sit. Associado</Label>
                <Select value={filters.sitAssociado} onValueChange={v => setF("sitAssociado", v)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Todos","Ativo","Inativo","Suspenso"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label className="text-xs">Cooperativa</Label>
                <Select value={filters.cooperativa} onValueChange={v => setF("cooperativa", v)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Todos","Cooperativa São Paulo","Cooperativa Campinas","Cooperativa Rio","Cooperativa Minas","Cooperativa Sul","Cooperativa Centro-Oeste","Cooperativa Nordeste"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={buscar} className="gap-1.5"><Search className="h-4 w-4" />Pesquisar</Button>
              <Button variant="outline" onClick={limpar}>Limpar</Button>
            </div>
          </CardContent>
        </Card>

        {searched && (
          <Card>
            <CardContent className="p-0">
              {results.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-12">Nenhum veículo encontrado.</p>
              ) : (
                <>
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead><TableHead>Placa</TableHead><TableHead>Regional</TableHead>
                          <TableHead>Dt Cadastro</TableHead><TableHead>Dt Contrato</TableHead><TableHead>Venc</TableHead>
                          <TableHead>Valor FIPE</TableHead><TableHead>Cota</TableHead>
                          <TableHead>Sit. Veículo</TableHead><TableHead>Sit. Assoc.</TableHead>
                          <TableHead>Cooperativa</TableHead><TableHead>Tipo</TableHead><TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paged.map(v => (
                          <TableRow key={v.id}>
                            <TableCell className="text-sm font-medium">{v.nome}</TableCell>
                            <TableCell className="font-mono text-sm">{v.placa}</TableCell>
                            <TableCell className="text-xs">{v.regional}</TableCell>
                            <TableCell className="text-xs">{new Date(v.dataCadastro).toLocaleDateString("pt-BR")}</TableCell>
                            <TableCell className="text-xs">{new Date(v.dataContrato).toLocaleDateString("pt-BR")}</TableCell>
                            <TableCell className="text-xs">Dia {v.diaVenc}</TableCell>
                            <TableCell className="text-xs">R$ {v.valorFipe.toLocaleString("pt-BR")}</TableCell>
                            <TableCell className="text-xs">{v.cota}</TableCell>
                            <TableCell><StatusBadge status={v.sitVeiculo} /></TableCell>
                            <TableCell><StatusBadge status={v.sitAssociado} /></TableCell>
                            <TableCell className="text-xs">{v.cooperativa}</TableCell>
                            <TableCell className="text-xs">{v.tipoAdesao}</TableCell>
                            <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelected(v)}><Pencil className="h-3.5 w-3.5" /></Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                  <div className="flex items-center justify-between p-3 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{results.length} resultado(s)</span>
                      <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setPage(1); }}>
                        <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>{[10,25,50].map(n => <SelectItem key={n} value={String(n)}>{n}/pág</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={page<=1} onClick={() => setPage(p=>p-1)}><ChevronLeft className="h-4 w-4" /></Button>
                      <span className="text-sm px-2">{page}/{totalPages||1}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={page>=totalPages} onClick={() => setPage(p=>p+1)}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ── EDIT VIEW ──
  const sel = selected;
  const totalLanc = sel.lancamentos.reduce((s,l) => s + l.valor, 0);
  const pagos = sel.lancamentos.filter(l => l.status === "Pago").length;
  const atrasados = sel.lancamentos.filter(l => l.status === "Atrasado").length;

  return (
    <div className="max-w-7xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="gap-1.5 mb-4 text-muted-foreground"><ArrowLeft className="h-4 w-4" />Voltar</Button>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Car className="h-5 w-5 text-primary" /></div>
        <div>
          <h2 className="text-lg font-bold">{sel.placa} — {sel.modelo}</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">{sel.marca} {sel.anoFab}/{sel.anoMod} • {sel.nome} • <StatusBadge status={sel.sitVeiculo} /></p>
        </div>
      </div>

      <Tabs defaultValue="dados">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-auto">
            <TabsTrigger value="dados" className="text-xs gap-1"><Car className="h-3 w-3" />Dados</TabsTrigger>
            <TabsTrigger value="condutores" className="text-xs gap-1"><Users className="h-3 w-3" />Condutores</TabsTrigger>
            <TabsTrigger value="financeiro" className="text-xs gap-1"><DollarSign className="h-3 w-3" />Financeiro</TabsTrigger>
            <TabsTrigger value="agregados" className="text-xs gap-1"><Package className="h-3 w-3" />Agregados</TabsTrigger>
            <TabsTrigger value="vistorias" className="text-xs gap-1"><ClipboardCheck className="h-3 w-3" />Vistorias</TabsTrigger>
            <TabsTrigger value="documentos" className="text-xs gap-1"><FileText className="h-3 w-3" />Documentos</TabsTrigger>
            <TabsTrigger value="observacoes" className="text-xs gap-1"><FileText className="h-3 w-3" />Obs</TabsTrigger>
            <TabsTrigger value="fornecedores" className="text-xs gap-1"><PhoneIcon className="h-3 w-3" />Fornecedores</TabsTrigger>
            <TabsTrigger value="contratos" className="text-xs gap-1"><FileSignature className="h-3 w-3" />Contratos</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* TAB 1 - DADOS */}
        <TabsContent value="dados" className="mt-4">
          <Card><CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div><Label className="text-xs">Placa</Label><Input defaultValue={sel.placa} /></div>
              <div><Label className="text-xs">Chassi</Label><Input defaultValue={sel.chassi} /></div>
              <div><Label className="text-xs">Modelo</Label><Input defaultValue={sel.modelo} /></div>
              <div><Label className="text-xs">Marca</Label><Input defaultValue={sel.marca} /></div>
              <div><Label className="text-xs">Ano Fab</Label><Input defaultValue={String(sel.anoFab)} /></div>
              <div><Label className="text-xs">Ano Mod</Label><Input defaultValue={String(sel.anoMod)} /></div>
              <div><Label className="text-xs">Cor</Label><Input defaultValue={sel.cor} /></div>
              <div><Label className="text-xs">Combustível</Label><Input defaultValue={sel.combustivel} /></div>
              <div><Label className="text-xs">KM</Label><Input defaultValue={String(sel.km)} /></div>
              <div><Label className="text-xs">Valor FIPE (R$)</Label><Input defaultValue={sel.valorFipe.toLocaleString("pt-BR")} /></div>
              <div><Label className="text-xs">Cota</Label><Input defaultValue={sel.cota} /></div>
              <div><Label className="text-xs">Regional</Label><Input defaultValue={sel.regional} /></div>
              <div><Label className="text-xs">Cooperativa</Label><Input defaultValue={sel.cooperativa} /></div>
              <div><Label className="text-xs">Tipo Adesão</Label><Input defaultValue={sel.tipoAdesao} /></div>
              <div><Label className="text-xs">Dia Vencimento</Label><Input defaultValue={String(sel.diaVenc)} /></div>
              <div><Label className="text-xs">Data Reativação</Label><Input type="date" /></div>
            </div>
            <div className="flex justify-end mt-4"><Button className="gap-1.5" onClick={() => toast.success("Dados salvos!")}><Save className="h-4 w-4" />Salvar</Button></div>
          </CardContent></Card>
        </TabsContent>

        {/* TAB 2 - CONDUTORES */}
        <TabsContent value="condutores" className="mt-4 space-y-4">
          <div className="flex justify-end"><Button size="sm" className="gap-1.5" onClick={() => setCondutorModal(true)}><Plus className="h-3.5 w-3.5" />Adicionar Condutor</Button></div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>CPF</TableHead><TableHead>CNH</TableHead><TableHead>Data Nasc</TableHead><TableHead>Idade</TableHead><TableHead>Situação</TableHead></TableRow></TableHeader>
              <TableBody>
                {sel.condutores.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm font-medium">{c.nome}</TableCell>
                    <TableCell className="text-sm">{c.cpf}</TableCell>
                    <TableCell className="text-sm">{c.cnh}</TableCell>
                    <TableCell className="text-sm">{new Date(c.dataNasc).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-sm">{calcIdade(c.dataNasc)} anos</TableCell>
                    <TableCell><StatusBadge status={c.situacao} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
          <Dialog open={condutorModal} onOpenChange={setCondutorModal}>
            <DialogContent>
              <DialogHeader><DialogTitle>Adicionar Condutor</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nome</Label><Input /></div>
                <div><Label>CPF</Label><Input placeholder="000.000.000-00" /></div>
                <div><Label>CNH</Label><Input /></div>
                <div><Label>Data Nascimento</Label><Input type="date" /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setCondutorModal(false)}>Cancelar</Button><Button onClick={() => { toast.success("Condutor adicionado!"); setCondutorModal(false); }}>Salvar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* TAB 3 - FINANCEIRO */}
        <TabsContent value="financeiro" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold text-primary">R$ {totalLanc.toFixed(2).replace(".",",")}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Pagos</p><p className="text-xl font-bold text-emerald-600">{pagos}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Atrasados</p><p className="text-xl font-bold text-destructive">{atrasados}</p></CardContent></Card>
          </div>
          <Card><CardContent className="p-0">
            <ScrollArea className="w-full">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Nº Título</TableHead><TableHead>Nº Banco</TableHead><TableHead>Tipo</TableHead><TableHead>Banco</TableHead>
                  <TableHead>Dt Emissão</TableHead><TableHead>Data Venc</TableHead><TableHead>Data Pgto</TableHead>
                  <TableHead>Valor</TableHead><TableHead>Valor Pago</TableHead><TableHead>Parcela</TableHead>
                  <TableHead>Nº Controle</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {sel.lancamentos.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-mono">{l.nTitulo}</TableCell>
                      <TableCell className="text-xs">{l.nBanco}</TableCell>
                      <TableCell className="text-xs">{l.tipo}</TableCell>
                      <TableCell className="text-xs">{l.banco}</TableCell>
                      <TableCell className="text-xs">{new Date(l.dtEmissao).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-xs">{new Date(l.dataVenc).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-xs">{l.dataPgto ? new Date(l.dataPgto).toLocaleDateString("pt-BR") : "-"}</TableCell>
                      <TableCell className="text-xs">R$ {l.valor.toFixed(2).replace(".",",")}</TableCell>
                      <TableCell className="text-xs">R$ {l.valorPago.toFixed(2).replace(".",",")}</TableCell>
                      <TableCell className="text-xs">{l.parcela}</TableCell>
                      <TableCell className="text-xs font-mono">{l.nControle}</TableCell>
                      <TableCell><Badge variant="outline" className={`${finBadge(l.status)} text-xs`}>{l.status}</Badge></TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-7 w-7"><Printer className="h-3.5 w-3.5" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent></Card>
        </TabsContent>

        {/* TAB 4 - AGREGADOS */}
        <TabsContent value="agregados" className="mt-4">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Placa</TableHead><TableHead>Cota</TableHead><TableHead>Marca/Modelo</TableHead><TableHead>Valor</TableHead><TableHead>Data</TableHead><TableHead>Situação</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {sel.agregados.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">Nenhum agregado.</TableCell></TableRow>
                ) : sel.agregados.map((a, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{a.tipo}</TableCell>
                    <TableCell className="font-mono text-sm">{a.placa}</TableCell>
                    <TableCell className="text-sm">{a.cota}</TableCell>
                    <TableCell className="text-sm">{a.marcaModelo}</TableCell>
                    <TableCell className="text-sm">R$ {a.valor.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-sm">{new Date(a.data).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell><StatusBadge status={a.situacao} /></TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* TAB 5 - VISTORIAS */}
        <TabsContent value="vistorias" className="mt-4">
          <Card><CardContent className="p-4">
            <div className="space-y-4">
              {sel.vistorias.map((v, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full shrink-0 mt-1 ${v.resultado === "Aprovada" ? "bg-emerald-500" : v.resultado === "Pendente" ? "bg-amber-500" : "bg-destructive"}`} />
                    {i < sel.vistorias.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                  </div>
                  <div className="pb-4 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={v.resultado} />
                      <span className="text-xs text-muted-foreground">{new Date(v.data).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <p className="text-sm"><span className="font-medium">Tipo:</span> {v.tipo}</p>
                    <p className="text-sm text-muted-foreground">{v.obs}</p>
                    <p className="text-xs text-muted-foreground mt-1">por {v.usuario}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* TAB 6 - DOCUMENTOS */}
        <TabsContent value="documentos" className="mt-4 space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Arraste arquivos ou clique para selecionar</p>
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Data</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {sel.documentos.map((d, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{d.nome}</TableCell>
                    <TableCell><Badge variant="outline">{d.tipo}</Badge></TableCell>
                    <TableCell className="text-sm">{d.data}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Download className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* TAB 7 - OBSERVAÇÕES */}
        <TabsContent value="observacoes" className="mt-4 space-y-4">
          <Card><CardContent className="p-4">
            <div className="flex gap-2 mb-4">
              <Textarea value={newObs} onChange={e => setNewObs(e.target.value)} placeholder="Nova observação..." rows={2} className="flex-1" />
              <Button className="self-end" onClick={() => { if (newObs.trim()) { toast.success("Observação adicionada!"); setNewObs(""); } }}>Salvar</Button>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Usuário</TableHead></TableRow></TableHeader>
              <TableBody>
                {sel.observacoes.map((o, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{o.data}</TableCell>
                    <TableCell className="text-sm">{o.descricao}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{o.usuario}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* TAB 8 - FORNECEDORES */}
        <TabsContent value="fornecedores" className="mt-4">
          <Card><CardContent className="p-0">
            <ScrollArea className="w-full">
              <Table>
                <TableHeader><TableRow><TableHead>Protocolo</TableHead><TableHead>Fornecedor</TableHead><TableHead>Produto</TableHead><TableHead>Serviço</TableHead><TableHead>Motivo</TableHead><TableHead>Situação</TableHead><TableHead>Dt Abertura</TableHead><TableHead>Dt Fechamento</TableHead></TableRow></TableHeader>
                <TableBody>
                  {sel.fornecedores.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">Nenhum acionamento.</TableCell></TableRow>
                  ) : sel.fornecedores.map((f, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{f.protocolo}</TableCell>
                      <TableCell className="text-sm">{f.fornecedor}</TableCell>
                      <TableCell className="text-sm">{f.produto}</TableCell>
                      <TableCell className="text-sm">{f.servico}</TableCell>
                      <TableCell className="text-sm">{f.motivo}</TableCell>
                      <TableCell><Badge variant="outline" className={f.situacao === "Concluído" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"}>{f.situacao}</Badge></TableCell>
                      <TableCell className="text-xs">{new Date(f.dataAbertura).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-xs">{f.dataFechamento ? new Date(f.dataFechamento).toLocaleDateString("pt-BR") : "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent></Card>
        </TabsContent>

        {/* TAB 9 - CONTRATOS */}
        <TabsContent value="contratos" className="mt-4">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Contrato</TableHead><TableHead>Termo</TableHead><TableHead>Status</TableHead><TableHead>IP</TableHead><TableHead>Data/Hora Envio</TableHead><TableHead>Arquivo</TableHead></TableRow></TableHeader>
              <TableBody>
                {sel.contratos.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{c.contrato}</TableCell>
                    <TableCell className="text-sm">{c.termo}</TableCell>
                    <TableCell><Badge variant="outline" className={c.status === "Assinado" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : c.status === "Pendente" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-red-100 text-red-700 border-red-200"}>{c.status}</Badge></TableCell>
                    <TableCell className="text-xs font-mono">{c.ip || "-"}</TableCell>
                    <TableCell className="text-xs">{c.dataHoraEnvio || "-"}</TableCell>
                    <TableCell>{c.arquivo ? <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"><Download className="h-3 w-3" />{c.arquivo}</Button> : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

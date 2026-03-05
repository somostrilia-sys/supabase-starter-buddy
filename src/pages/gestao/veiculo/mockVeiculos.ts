export interface MockVeiculo {
  id: string;
  placa: string;
  chassi: string;
  renavam: string;
  marca: string;
  modelo: string;
  ano: number;
  anoModelo: number;
  cor: string;
  combustivel: string;
  cambio: string;
  motor: string;
  tipo: "Automóvel" | "Moto" | "Caminhão" | "Van/Utilitário";
  categoria: "Passeio" | "Trabalho" | "Frota" | "Especial";
  cota: string;
  valorFipe: number;
  km: number;
  cidadeCirculacao: string;
  estadoCirculacao: string;
  status: "Ativo" | "Cancelado" | "Em Vistoria" | "Suspenso";
  associadoId: string;
  associadoNome: string;
  associadoCpf: string;
  cooperativa: string;
  regional: string;
  dataInclusao: string;
  agregados: MockAgregado[];
  vistorias: MockVistoria[];
  alteracoes: MockAlteracao[];
  fotos: string[];
}

export interface MockAgregado {
  id: string;
  nome: string;
  cpf: string;
  cnh: string;
  parentesco: string;
  telefone: string;
}

export interface MockVistoria {
  id: string;
  codigo: string;
  data: string;
  tipo: "Admissão" | "Periódica" | "Transferência";
  resultado: "Aprovada" | "Reprovada" | "Pendente";
  inspetor: string;
  checklist: Record<string, boolean>;
  observacoes: string;
  fotos: string[];
}

export interface MockAlteracao {
  data: string;
  campo: string;
  de: string;
  para: string;
  usuario: string;
}

const marcasModelos = [
  { marca: "Chevrolet", modelo: "Onix Plus 1.0 Turbo", motor: "1.0 Turbo" },
  { marca: "Chevrolet", modelo: "Tracker Premier 1.2T", motor: "1.2 Turbo" },
  { marca: "Chevrolet", modelo: "S10 High Country 2.8", motor: "2.8 Diesel" },
  { marca: "Hyundai", modelo: "HB20 1.6 Comfort", motor: "1.6 Flex" },
  { marca: "Hyundai", modelo: "Creta Ultimate 2.0", motor: "2.0 Flex" },
  { marca: "Honda", modelo: "Civic EXL 2.0", motor: "2.0 Flex" },
  { marca: "Honda", modelo: "HR-V Touring 1.5T", motor: "1.5 Turbo" },
  { marca: "Toyota", modelo: "Corolla XEi 2.0", motor: "2.0 Flex" },
  { marca: "Toyota", modelo: "Hilux SRV 2.8", motor: "2.8 Diesel" },
  { marca: "Volkswagen", modelo: "T-Cross Comfortline", motor: "1.0 TSI" },
  { marca: "Volkswagen", modelo: "Polo TSI 1.0", motor: "1.0 TSI" },
  { marca: "Volkswagen", modelo: "Gol 1.0 MPI", motor: "1.0 MPI" },
  { marca: "Fiat", modelo: "Argo Drive 1.3", motor: "1.3 Flex" },
  { marca: "Fiat", modelo: "Strada Freedom 1.3", motor: "1.3 Flex" },
  { marca: "Fiat", modelo: "Mobi Like 1.0", motor: "1.0 Flex" },
  { marca: "Jeep", modelo: "Compass Limited 1.3T", motor: "1.3 Turbo" },
  { marca: "Jeep", modelo: "Renegade Sport 1.3T", motor: "1.3 Turbo" },
  { marca: "Nissan", modelo: "Kicks Advance 1.6", motor: "1.6 Flex" },
  { marca: "Renault", modelo: "Kwid Intense 1.0", motor: "1.0 SCe" },
  { marca: "Renault", modelo: "Duster Iconic 1.6", motor: "1.6 SCe" },
  { marca: "Ford", modelo: "Ranger Limited 3.0", motor: "3.0 V6 Diesel" },
  { marca: "Peugeot", modelo: "208 Griffe 1.0T", motor: "1.0 Turbo" },
  { marca: "Citroën", modelo: "C4 Cactus Feel", motor: "1.6 Flex" },
  { marca: "Honda", modelo: "CG 160 Titan", motor: "160cc" },
  { marca: "Yamaha", modelo: "Factor 150 UBS", motor: "150cc" },
  { marca: "Mercedes-Benz", modelo: "Accelo 1016", motor: "4.8 Diesel" },
  { marca: "Fiat", modelo: "Fiorino Endurance", motor: "1.4 Flex" },
  { marca: "Chevrolet", modelo: "Spin Premier 1.8", motor: "1.8 Eco" },
  { marca: "Volkswagen", modelo: "Saveiro Robust 1.6", motor: "1.6 MSI" },
  { marca: "Hyundai", modelo: "Tucson GLS 1.6T", motor: "1.6 Turbo" },
  { marca: "Toyota", modelo: "SW4 SRX 2.8", motor: "2.8 Diesel" },
  { marca: "Chevrolet", modelo: "Montana LTZ 1.2T", motor: "1.2 Turbo" },
  { marca: "Fiat", modelo: "Toro Ultra 2.0", motor: "2.0 Diesel" },
  { marca: "Volkswagen", modelo: "Amarok V6 3.0", motor: "3.0 V6 Diesel" },
  { marca: "Jeep", modelo: "Commander Overland", motor: "2.0 Diesel" },
];

const cores = ["Branco", "Prata", "Preto", "Cinza", "Vermelho", "Azul", "Bege", "Marrom"];
const combustiveis = ["Flex", "Gasolina", "Diesel", "Etanol", "Elétrico"];
const cambios = ["Automático", "Manual", "CVT", "Automatizado"];
const cidades = [
  { c: "São Paulo", e: "SP" }, { c: "Campinas", e: "SP" }, { c: "Ribeirão Preto", e: "SP" },
  { c: "Rio de Janeiro", e: "RJ" }, { c: "Niterói", e: "RJ" }, { c: "Belo Horizonte", e: "MG" },
  { c: "Uberlândia", e: "MG" }, { c: "Curitiba", e: "PR" }, { c: "Goiânia", e: "GO" },
  { c: "Brasília", e: "DF" },
];
const cooperativas = ["Cooperativa São Paulo", "Cooperativa Rio", "Cooperativa Minas", "Cooperativa Sul", "Cooperativa Centro-Oeste"];
const regionais = ["Regional Capital", "Regional Interior", "Regional Litoral", "Regional Metropolitana"];
const nomes = [
  "Carlos Alberto Silva", "Maria Aparecida Santos", "José Roberto Oliveira", "Ana Paula Ferreira",
  "Francisco das Chagas Lima", "Francisca Helena Costa", "Antônio Carlos Pereira", "Adriana Souza Rodrigues",
  "Paulo Henrique Almeida", "Juliana Cristina Nascimento", "Marcos Vinícius Araújo", "Patricia de Lourdes Gomes",
  "Pedro Henrique Ribeiro", "Fernanda Beatriz Martins", "Lucas Gabriel Barbosa", "Camila Rodrigues Carvalho",
  "Rafael Augusto Rocha", "Vanessa Silva Correia", "Diego Fernando Cardoso", "Tatiana Mendes Nunes",
  "Thiago Oliveira Castro", "Bruna Alves Moreira", "Gustavo Henrique Dias", "Daniela Freitas Teixeira",
  "Leandro Souza Vieira", "Renata Costa Monteiro", "Anderson Pereira Lopes", "Simone Barros Pinto",
  "Rodrigo Almeida Campos", "Aline Martins Rezende",
  "Felipe Santos Cruz", "Mariana Lima Duarte", "Bruno Costa Neto", "Isabela Ferreira Melo", "Caio Ribeiro Prado",
];

function cpf(i: number) {
  const base = String(11122233300 + i * 11111111).slice(0, 11);
  return `${base.slice(0,3)}.${base.slice(3,6)}.${base.slice(6,9)}-${base.slice(9,11)}`;
}

const placaLetras = "ABCDEFGHJKLMNPQRSTUVWXYZ";
function placaMercosul(i: number) {
  const l1 = placaLetras[i % 24];
  const l2 = placaLetras[(i * 3) % 24];
  const l3 = placaLetras[(i * 7) % 24];
  const d1 = i % 10;
  const l4 = placaLetras[(i * 11) % 24];
  const d2 = (i * 3) % 10;
  const d3 = (i * 7) % 10;
  return `${l1}${l2}${l3}${d1}${l4}${d2}${d3}`;
}

const checklistItems = [
  "Carroceria", "Pintura", "Vidros", "Pneus", "Motor", "Câmbio",
  "Suspensão", "Freios", "Faróis", "Lanternas", "Para-choques", "Interior",
];

export const mockVeiculos: MockVeiculo[] = Array.from({ length: 35 }, (_, i) => {
  const mm = marcasModelos[i % marcasModelos.length];
  const loc = cidades[i % cidades.length];
  const tipos: MockVeiculo["tipo"][] = ["Automóvel", "Automóvel", "Automóvel", "Moto", "Caminhão", "Van/Utilitário"];
  const tipo = i === 23 || i === 24 ? "Moto" : i === 25 ? "Caminhão" : i === 26 ? "Van/Utilitário" : "Automóvel";
  const cats: MockVeiculo["categoria"][] = ["Passeio", "Trabalho", "Frota", "Especial"];
  const statuses: MockVeiculo["status"][] = ["Ativo", "Ativo", "Ativo", "Ativo", "Em Vistoria", "Cancelado", "Suspenso", "Ativo"];
  const ano = 2018 + (i % 7);

  return {
    id: `veic-${i + 1}`,
    placa: placaMercosul(i),
    chassi: `9BR${String(53 + i * 12345).toString().padStart(14, "0")}`,
    renavam: `${String(10000000000 + i * 987654321).slice(0, 11)}`,
    marca: mm.marca,
    modelo: mm.modelo,
    ano,
    anoModelo: ano + (i % 2),
    cor: cores[i % cores.length],
    combustivel: combustiveis[i % combustiveis.length],
    cambio: cambios[i % cambios.length],
    motor: mm.motor,
    tipo,
    categoria: cats[i % cats.length],
    cota: `Cota ${["A", "B", "C", "D"][i % 4]}`,
    valorFipe: 40000 + i * 3500 + (i % 5) * 8000,
    km: 10000 + i * 5000,
    cidadeCirculacao: loc.c,
    estadoCirculacao: loc.e,
    status: statuses[i % statuses.length],
    associadoId: `assoc-${(i % 30) + 1}`,
    associadoNome: nomes[i % nomes.length],
    associadoCpf: cpf(i % 30),
    cooperativa: cooperativas[i % cooperativas.length],
    regional: regionais[i % regionais.length],
    dataInclusao: `${2021 + (i % 4)}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
    agregados: i % 3 === 0 ? [
      { id: `ag-${i}-1`, nome: `${nomes[i % nomes.length].split(" ")[0]} Jr.`, cpf: cpf(i + 100), cnh: `${String(20000000000 + i * 111111111).slice(0, 11)}`, parentesco: "Filho(a)", telefone: `(11) 9${String(7000 + i).slice(0, 4)}-${String(2000 + i).slice(0, 4)}` },
    ] : i % 4 === 0 ? [
      { id: `ag-${i}-1`, nome: `Maria de ${nomes[i % nomes.length].split(" ").pop()}`, cpf: cpf(i + 200), cnh: `${String(30000000000 + i * 111111111).slice(0, 11)}`, parentesco: "Cônjuge", telefone: `(11) 9${String(8000 + i).slice(0, 4)}-${String(3000 + i).slice(0, 4)}` },
      { id: `ag-${i}-2`, nome: `Pedro ${nomes[i % nomes.length].split(" ").pop()}`, cpf: cpf(i + 300), cnh: "", parentesco: "Irmão(ã)", telefone: `(11) 9${String(6000 + i).slice(0, 4)}-${String(4000 + i).slice(0, 4)}` },
    ] : [],
    vistorias: [
      {
        id: `vist-${i}-1`,
        codigo: `VIST-${String(1000 + i).padStart(5, "0")}`,
        data: `${2024 + (i % 2)}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
        tipo: "Admissão",
        resultado: i % 5 === 4 ? "Reprovada" : i % 7 === 0 ? "Pendente" : "Aprovada",
        inspetor: ["João Ferreira", "André Costa", "Luciana Almeida", "Roberto Dias"][i % 4],
        checklist: Object.fromEntries(checklistItems.map((item, j) => [item, i % 5 === 4 ? j % 3 !== 0 : true])),
        observacoes: i % 5 === 4 ? "Avarias na carroceria lateral esquerda. Necessário reparo antes de nova vistoria." : "Veículo em bom estado geral.",
        fotos: [],
      },
      ...(i % 3 === 0 ? [{
        id: `vist-${i}-2`,
        codigo: `VIST-${String(2000 + i).padStart(5, "0")}`,
        data: `2025-${String((i % 6) + 1).padStart(2, "0")}-15`,
        tipo: "Periódica" as const,
        resultado: "Aprovada" as const,
        inspetor: ["João Ferreira", "André Costa", "Luciana Almeida", "Roberto Dias"][(i + 1) % 4],
        checklist: Object.fromEntries(checklistItems.map(item => [item, true])),
        observacoes: "Veículo dentro dos padrões.",
        fotos: [],
      }] : []),
    ],
    alteracoes: [
      { data: "2025-01-20 10:30", campo: "Cor", de: "Prata", para: cores[i % cores.length], usuario: "admin@gia.com" },
      { data: "2024-10-05 15:45", campo: "KM", de: String(i * 3000), para: String(10000 + i * 5000), usuario: "operador@gia.com" },
    ],
    fotos: [],
  };
});

export const fipeMock: Record<string, { marca: string; modelo: string; ano: number; valor: number }[]> = {
  Chevrolet: [
    { marca: "Chevrolet", modelo: "Onix Plus 1.0 Turbo", ano: 2024, valor: 92500 },
    { marca: "Chevrolet", modelo: "Onix Plus 1.0 Turbo", ano: 2023, valor: 84000 },
    { marca: "Chevrolet", modelo: "Tracker Premier 1.2T", ano: 2024, valor: 145000 },
    { marca: "Chevrolet", modelo: "Montana LTZ 1.2T", ano: 2024, valor: 128000 },
  ],
  Hyundai: [
    { marca: "Hyundai", modelo: "HB20 1.6 Comfort", ano: 2024, valor: 88000 },
    { marca: "Hyundai", modelo: "Creta Ultimate 2.0", ano: 2024, valor: 162000 },
  ],
  Honda: [
    { marca: "Honda", modelo: "Civic EXL 2.0", ano: 2024, valor: 165000 },
    { marca: "Honda", modelo: "HR-V Touring 1.5T", ano: 2024, valor: 178000 },
  ],
  Toyota: [
    { marca: "Toyota", modelo: "Corolla XEi 2.0", ano: 2024, valor: 158000 },
    { marca: "Toyota", modelo: "Hilux SRV 2.8", ano: 2024, valor: 265000 },
  ],
  Volkswagen: [
    { marca: "Volkswagen", modelo: "T-Cross Comfortline", ano: 2024, valor: 138000 },
    { marca: "Volkswagen", modelo: "Polo TSI 1.0", ano: 2024, valor: 95000 },
  ],
  Fiat: [
    { marca: "Fiat", modelo: "Argo Drive 1.3", ano: 2024, valor: 82000 },
    { marca: "Fiat", modelo: "Strada Freedom 1.3", ano: 2024, valor: 98000 },
  ],
  Jeep: [
    { marca: "Jeep", modelo: "Compass Limited 1.3T", ano: 2024, valor: 185000 },
    { marca: "Jeep", modelo: "Renegade Sport 1.3T", ano: 2024, valor: 125000 },
  ],
};

export const checklistLabels = checklistItems;

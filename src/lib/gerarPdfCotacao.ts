import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface DadosCotacao {
  numeroCotacao: string;
  data: string;
  validade: number;
  cliente: { nome: string; veiculo: string; placa: string; codFipe: string; valorFipe: number; cidade: string; estado: string };
  plano: { nome: string; mensal: number; adesao: number; participacao: string; rastreador: string };
  coberturas: { nome: string; inclusa: boolean; tipo: string }[];
  consultor: { nome: string; telefone: string; email: string };
}

export function gerarPdfCotacao(dados: DadosCotacao) {
  const doc = new jsPDF();
  const azul = "#1A3A5C";
  const w = doc.internal.pageSize.getWidth();

  // === PÁGINA 1: CAPA ===
  doc.setFillColor(26, 58, 92);
  doc.rect(0, 0, w, 60, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("OBJETIVO", w / 2, 30, { align: "center" });
  doc.setFontSize(12);
  doc.text("AUTO & TRUCK", w / 2, 40, { align: "center" });
  doc.setFontSize(16);
  doc.text("Sempre prontos para lhe proteger!", w / 2, 52, { align: "center" });

  doc.setTextColor(26, 58, 92);
  doc.setFontSize(14);
  doc.text("Proteção completa com agilidade", w / 2, 80, { align: "center" });
  doc.text("e sem burocracia", w / 2, 90, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  const beneficios = [
    "Assistência 24h em todo território nacional",
    "Mais de 30 unidades em todo o país",
    "Recuperações de veículos e reparos",
    "Indenizações rápidas e justas",
    "Licenciado SUSEP",
  ];
  beneficios.forEach((b, i) => {
    doc.text(`• ${b}`, 30, 115 + i * 10);
  });

  // === PÁGINA 2: COTAÇÃO ===
  doc.addPage();

  // Header
  doc.setFillColor(26, 58, 92);
  doc.rect(0, 0, w, 15, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("OBJETIVO AUTO BENEFÍCIOS", 14, 10);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`COTAÇÃO: ${dados.numeroCotacao}`, w - 14, 30, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Data: ${dados.data}`, w - 14, 36, { align: "right" });
  doc.text(`Validade: ${dados.validade} dias`, w - 14, 42, { align: "right" });

  // Dados cliente
  doc.setFontSize(11);
  doc.text(`Olá ${dados.cliente.nome}`, 14, 55);
  doc.setFontSize(9);
  doc.setTextColor(26, 58, 92);
  doc.text(`Esta é uma cotação para o seu veículo:`, 14, 62);
  doc.setFont("helvetica", "bold");
  doc.text(`${dados.cliente.veiculo}`, 14, 68);
  doc.setFont("helvetica", "normal");
  doc.text(`Placa: ${dados.cliente.placa}  |  Cód. FIPE: ${dados.cliente.codFipe}`, 14, 74);
  doc.setTextColor(220, 50, 50);
  doc.text(`Valor protegido: R$ ${dados.cliente.valorFipe.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 14, 80);
  doc.setTextColor(0, 0, 0);
  doc.text(`Cidade e estado: ${dados.cliente.cidade}/${dados.cliente.estado}`, 14, 86);

  // Plano
  doc.setFillColor(26, 58, 92);
  doc.rect(14, 95, w - 28, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`PLANO ${dados.plano.nome.toUpperCase()}`, 18, 101);

  // Valores
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const valoresData = [
    ["Mensalidade:", `R$ ${dados.plano.mensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
    ["Adesão:", `R$ ${dados.plano.adesao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
    ["Cota de participação:", dados.plano.participacao],
    ["Rastreador:", dados.plano.rastreador],
  ];

  autoTable(doc, {
    startY: 108,
    head: [],
    body: valoresData,
    theme: "plain",
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
  });

  // Coberturas
  const yAfterValores = (doc as any).lastAutoTable.finalY + 5;

  doc.setFillColor(26, 58, 92);
  doc.rect(14, yAfterValores, w - 28, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Coberturas", 18, yAfterValores + 6);

  const coberturas = dados.coberturas.filter(c => c.tipo === "cobertura");
  const assistencias = dados.coberturas.filter(c => c.tipo === "assistencia");

  const cobData = coberturas.map(c => [c.nome, c.inclusa ? "✓" : "✗"]);

  autoTable(doc, {
    startY: yAfterValores + 12,
    head: [],
    body: cobData,
    theme: "striped",
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: { 1: { halign: "center", cellWidth: 20, textColor: [34, 197, 94] } },
  });

  // Assistências
  const yAfterCob = (doc as any).lastAutoTable.finalY + 5;

  doc.setFillColor(26, 58, 92);
  doc.rect(14, yAfterCob, w - 28, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.text("Assistências", 18, yAfterCob + 6);

  const assData = assistencias.map(c => [c.nome]);

  autoTable(doc, {
    startY: yAfterCob + 12,
    head: [],
    body: assData,
    theme: "striped",
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 2 },
  });

  // Consultor
  const yAfterAss = (doc as any).lastAutoTable.finalY + 8;

  doc.setFillColor(26, 58, 92);
  doc.rect(14, yAfterAss, w - 28, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.text("CONSULTOR", 18, yAfterAss + 6);

  autoTable(doc, {
    startY: yAfterAss + 12,
    head: [],
    body: [
      [`Nome: ${dados.consultor.nome}`, `Telefone: ${dados.consultor.telefone}`],
      [`Email: ${dados.consultor.email}`, ""],
    ],
    theme: "plain",
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 2 },
  });

  // Download
  doc.save(`Cotacao-${dados.numeroCotacao}.pdf`);
}

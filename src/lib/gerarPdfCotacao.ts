import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import pagina1Img from "@/assets/cotacao/pagina1.jpg";
import pagina2Img from "@/assets/cotacao/pagina2.jpg";
import pagina4Img from "@/assets/cotacao/pagina4.jpg";
import logoImg from "@/assets/cotacao/logo-objetivo.png";

interface DadosCotacao {
  numeroCotacao: string;
  data: string;
  validade: number;
  cliente: { nome: string; veiculo: string; placa: string; codFipe: string; valorFipe: number; cidade: string; estado: string };
  plano: {
    nome: string;
    mensal: number;
    mensalOriginal?: number;
    adesao: number;
    adesaoOriginal?: number;
    participacao: string;
    rastreador: string;
    instalacao?: number;
  };
  coberturas: { nome: string; inclusa: boolean; tipo: string; detalhe?: string }[];
  consultor: { nome: string; telefone: string; email: string };
}

async function loadImage(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => resolve("");
    img.src = src;
  });
}

function fmtBRL(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

export async function gerarPdfCotacao(dados: DadosCotacao) {
  const doc = new jsPDF("p", "mm", "a4");
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const m = 14;
  const tableW = w - 2 * m;
  const azul: [number, number, number] = [26, 58, 92];
  const cinzaClaro: [number, number, number] = [230, 233, 237];
  const cinzaLinha: [number, number, number] = [200, 200, 200];

  // Load logo
  const logoData = await loadImage(logoImg);

  // === PÁGINA 1: CAPA (imagem) ===
  const img1 = await loadImage(pagina1Img);
  if (img1) doc.addImage(img1, "JPEG", 0, 0, w, h);

  // === PÁGINA 2: DEPOIMENTOS (imagem) ===
  doc.addPage();
  const img2 = await loadImage(pagina2Img);
  if (img2) doc.addImage(img2, "JPEG", 0, 0, w, h);

  // === PÁGINA 3: COTAÇÃO (dinâmica com autoTable) ===
  doc.addPage();

  // Logo top-left
  if (logoData) {
    doc.addImage(logoData, "PNG", m, 6, 35, 23);
  }

  // Cotação top-right
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text(`COTAÇÃO: ${dados.numeroCotacao}`, w - m, 14, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Data: ${dados.data}`, w - m, 20, { align: "right" });
  doc.text(`Validade: ${dados.validade} dias`, w - m, 25, { align: "right" });

  // Linha separadora
  let y = 33;
  doc.setDrawColor(...cinzaLinha);
  doc.setLineWidth(0.3);
  doc.line(m, y, w - m, y);
  y += 7;

  // Saudação e dados do veículo
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Olá ", m, y);
  doc.setFont("helvetica", "bold");
  doc.text(dados.cliente.nome, m + doc.getTextWidth("Olá "), y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Esta é uma cotação para o seu veículo:", m, y);

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(` ${dados.cliente.veiculo}`, m, y);

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Placa: ", m, y);
  doc.setFont("helvetica", "bold");
  doc.text(dados.cliente.placa, m + doc.getTextWidth("Placa: "), y);

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.text("Cód. Fipe:  ", m, y);
  doc.setFont("helvetica", "bold");
  doc.text(dados.cliente.codFipe, m + doc.getTextWidth("Cód. Fipe:  "), y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text("Valor protegido:   ", m, y);
  doc.setFont("helvetica", "bold");
  doc.text(fmtBRL(dados.cliente.valorFipe), m + doc.getTextWidth("Valor protegido:   "), y);

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.text("Cidade e estado de circulação:   ", m, y);
  doc.setFont("helvetica", "bold");
  doc.text(`${dados.cliente.cidade}/${dados.cliente.estado}`, m + doc.getTextWidth("Cidade e estado de circulação:   "), y);

  // === PLANO header (autoTable) ===
  y += 8;

  const coberturas = dados.coberturas.filter(c => c.tipo === "cobertura");
  const assistencias = dados.coberturas.filter(c => c.tipo === "assistencia");

  const cobItems = coberturas.length > 0
    ? coberturas.map(c => c.nome)
    : ["Roubo", "Furto", "Colisão", "Incêndio", "Perda Total", "Vidros Completos (60%)", "Danos a terceiros (R$ 150.000)", "Danos da natureza", "Carro Reserva 15 dias"];

  const assItems = assistencias.length > 0
    ? assistencias.map(c => ({ nome: c.nome, detalhe: c.detalhe || "" }))
    : [
      { nome: "Assistência 24H", detalhe: "1000km" },
      { nome: "Auxílio combustível", detalhe: "" },
      { nome: "Recarga de bateria", detalhe: "" },
      { nome: "Hospedagem", detalhe: "" },
      { nome: "Retorno ao domicílio", detalhe: "" },
      { nome: "Chaveiro", detalhe: "" },
      { nome: "Reboque", detalhe: "" },
      { nome: "Troca de pneus", detalhe: "" },
    ];

  // Build table body
  const tableBody: any[][] = [];

  // Coberturas sub-header
  tableBody.push([{ content: "Coberturas", colSpan: 2, styles: { fillColor: cinzaClaro, fontStyle: "bold" as const, fontSize: 8.5 } }]);
  cobItems.forEach(item => {
    tableBody.push([{ content: item, colSpan: 2 }]);
  });

  // Assistências sub-header
  tableBody.push([{ content: "Assistências", colSpan: 2, styles: { fillColor: cinzaClaro, fontStyle: "bold" as const, fontSize: 8.5 } }]);
  assItems.forEach(item => {
    tableBody.push([item.nome, { content: item.detalhe, styles: { halign: "right" as const } }]);
  });

  autoTable(doc, {
    startY: y,
    head: [[{ content: `PLANO ${dados.plano.nome.toUpperCase()}`, colSpan: 2, styles: { fillColor: azul, textColor: [255, 255, 255], fontStyle: "bold" as const, fontSize: 9.5 } }]],
    body: tableBody,
    theme: "grid",
    margin: { left: m, right: m },
    styles: { fontSize: 8.5, cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 }, lineColor: cinzaLinha, lineWidth: 0.2, textColor: [30, 30, 30] },
    headStyles: { fillColor: azul },
    tableLineColor: cinzaLinha,
    tableLineWidth: 0.2,
  });

  // === COTAÇÃO DO VEÍCULO ===
  y = (doc as any).lastAutoTable.finalY + 4;

  // Mensalidade with strikethrough
  const mensalText = dados.plano.mensalOriginal && dados.plano.mensalOriginal > dados.plano.mensal
    ? `~~${fmtBRL(dados.plano.mensalOriginal)}~~ ${fmtBRL(dados.plano.mensal)}`
    : fmtBRL(dados.plano.mensal);

  const adesaoText = dados.plano.adesaoOriginal && dados.plano.adesaoOriginal > dados.plano.adesao
    ? `~~${fmtBRL(dados.plano.adesaoOriginal)}~~ ${fmtBRL(dados.plano.adesao)}`
    : fmtBRL(dados.plano.adesao);

  // We'll draw mensalidade/adesao manually after the table for strikethrough support
  autoTable(doc, {
    startY: y,
    head: [[{ content: "COTAÇÃO DO VEÍCULO", colSpan: 2, styles: { fillColor: azul, textColor: [255, 255, 255], fontStyle: "bold" as const, fontSize: 9.5 } }]],
    body: [
      ["Mensalidade:", { content: "", styles: { halign: "right" as const } }],
      ["Adesão:", { content: "", styles: { halign: "right" as const } }],
      ["Desconto pontualidade (15%):", { content: `${fmtBRL(Math.round(dados.plano.mensal * 0.85))}/mês se pagar em dia`, styles: { halign: "right" as const, textColor: [22, 163, 74] as any } }],
      ["Rastreador obrigatório:", { content: dados.plano.rastreador || "Não", styles: { halign: "right" as const } }],
      ...(dados.plano.instalacao && dados.plano.instalacao > 0 ? [["Instalação rastreador:", { content: fmtBRL(dados.plano.instalacao), styles: { halign: "right" as const, fontStyle: "bold" as const } }]] : []),
    ],
    theme: "grid",
    margin: { left: m, right: m },
    styles: { fontSize: 8.5, cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 }, lineColor: cinzaLinha, lineWidth: 0.2, textColor: [30, 30, 30] },
    columnStyles: { 0: { cellWidth: tableW * 0.55 } },
  });

  // Draw prices with strikethrough overlay
  const cotTable = (doc as any).lastAutoTable;
  const rowsMensalidade = cotTable.body[0];
  const rowsAdesao = cotTable.body[1];

  // Helper to draw price with optional strikethrough
  function drawPrice(rowCells: any, original: number | undefined, final: number) {
    const cell = rowCells.cells[1];
    const cellX = cell.x;
    const cellY = cell.y;
    const cellW = cell.width;
    const cellH = cell.height;
    const textY = cellY + cellH / 2 + 1;
    const rightX = cellX + cellW - 3;

    doc.setFontSize(8.5);
    if (original && original > final) {
      // Strikethrough original
      const origStr = fmtBRL(original);
      const finalStr = fmtBRL(final);
      const finalW = doc.getTextWidth(finalStr);
      const origW = doc.getTextWidth(origStr);

      // Final price (bold, right-aligned)
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(finalStr, rightX, textY, { align: "right" });

      // Original price (strikethrough, gray)
      const origX = rightX - finalW - 4;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text(origStr, origX, textY, { align: "right" });
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.3);
      doc.line(origX - origW, textY - 1.2, origX, textY - 1.2);
    } else {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(fmtBRL(final), rightX, textY, { align: "right" });
    }
  }

  drawPrice(rowsMensalidade, dados.plano.mensalOriginal, dados.plano.mensal);
  drawPrice(rowsAdesao, dados.plano.adesaoOriginal, dados.plano.adesao);

  // === CONSULTOR ===
  y = cotTable.finalY + 4;

  autoTable(doc, {
    startY: y,
    head: [[{ content: "CONSULTOR", colSpan: 2, styles: { fillColor: azul, textColor: [255, 255, 255], fontStyle: "bold" as const, fontSize: 9.5 } }]],
    body: [
      [
        { content: `Nome: ${dados.consultor.nome}`, styles: { fontStyle: "bold" as const } },
        { content: `Telefone: ${dados.consultor.telefone}`, styles: { fontStyle: "bold" as const } },
      ],
      [{ content: `Email: ${dados.consultor.email}`, colSpan: 2, styles: { fontStyle: "bold" as const } }],
    ],
    theme: "grid",
    margin: { left: m, right: m },
    styles: { fontSize: 8, cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 }, lineColor: cinzaLinha, lineWidth: 0.2, textColor: [30, 30, 30] },
  });

  // === PÁGINA 4: APP (imagem) ===
  doc.addPage();
  const img4 = await loadImage(pagina4Img);
  if (img4) doc.addImage(img4, "JPEG", 0, 0, w, h);

  // Download
  doc.save(`Cotacao-${dados.numeroCotacao}.pdf`);
}

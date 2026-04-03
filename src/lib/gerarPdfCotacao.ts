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
  cliente: { nome: string; telefone?: string; email?: string; veiculo: string; placa: string; codFipe: string; valorFipe: number; cidade: string; estado: string };
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
  const verde: [number, number, number] = [22, 163, 74];

  const logoData = await loadImage(logoImg);

  // === PÁGINA 1: CAPA (arte) ===
  const img1 = await loadImage(pagina1Img);
  if (img1) doc.addImage(img1, "JPEG", 0, 0, w, h);

  // === PÁGINA 2: DEPOIMENTOS (arte) ===
  doc.addPage();
  const img2 = await loadImage(pagina2Img);
  if (img2) doc.addImage(img2, "JPEG", 0, 0, w, h);

  // === PÁGINA 3: COTAÇÃO DINÂMICA ===
  doc.addPage();

  // Logo + cabeçalho
  if (logoData) doc.addImage(logoData, "PNG", m, 6, 35, 23);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...azul);
  doc.setFontSize(14);
  doc.text("PROPOSTA DE PROTEÇÃO VEICULAR", w / 2, 16, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Cotação nº ${dados.numeroCotacao} | ${dados.data} | Válida por ${dados.validade} dias`, w / 2, 22, { align: "center" });

  let y = 32;

  // ══════════ DADOS DO ASSOCIADO + DADOS DO VEÍCULO (lado a lado) ══════════
  const halfW = tableW / 2 - 2;

  // Associado
  autoTable(doc, {
    startY: y,
    head: [[{ content: "DADOS DO ASSOCIADO", styles: { fillColor: azul, textColor: [255,255,255], fontStyle: "bold" as const, fontSize: 9 } }]],
    body: [
      [{ content: `NOME\n${dados.cliente.nome}`, styles: { fontStyle: "bold" as const } }],
      [{ content: `TELEFONE\n${dados.cliente.telefone || "—"}` }],
      [{ content: `EMAIL\n${dados.cliente.email || "—"}` }],
      [{ content: `CIDADE\n${dados.cliente.cidade}/${dados.cliente.estado}` }],
    ],
    theme: "grid",
    margin: { left: m, right: w / 2 + 2 },
    styles: { fontSize: 7.5, cellPadding: 2, lineColor: cinzaLinha, lineWidth: 0.2, textColor: [30,30,30] },
  });

  // Veículo
  autoTable(doc, {
    startY: y,
    head: [[{ content: "DADOS DO VEÍCULO", styles: { fillColor: azul, textColor: [255,255,255], fontStyle: "bold" as const, fontSize: 9 } }]],
    body: [
      [{ content: `PLACA\n${dados.cliente.placa}`, styles: { fontStyle: "bold" as const } }],
      [{ content: `FIPE\n${fmtBRL(dados.cliente.valorFipe)} - [${dados.cliente.codFipe}]` }],
      [{ content: `MODELO\n${dados.cliente.veiculo}` }],
      [{ content: `TIPO\nVeículo ${dados.plano.nome.includes("Pesado") ? "Pesado" : "Leves"}` }],
    ],
    theme: "grid",
    margin: { left: w / 2 + 2, right: m },
    styles: { fontSize: 7.5, cellPadding: 2, lineColor: cinzaLinha, lineWidth: 0.2, textColor: [30,30,30] },
  });

  y = Math.max((doc as any).lastAutoTable.finalY, (doc as any).previousAutoTable?.finalY || 0) + 5;
  // Corrigir: pegar o maior finalY das duas tabelas
  const tables = (doc as any).autoTableState?.tables || [];
  if (tables.length >= 2) {
    y = Math.max(tables[tables.length - 1].finalY, tables[tables.length - 2].finalY) + 5;
  }

  // ══════════ BENEFÍCIOS CONTRATADOS (grid 2 colunas) ══════════
  const coberturas = dados.coberturas.filter(c => c.inclusa);

  // Coberturas detalhadas com descrições completas
  const beneficiosCompletos: string[] = coberturas.length > 0
    ? coberturas.map(c => {
        const detalheMap: Record<string, string> = {
          "Roubo": "ROUBO/FURTO - COM INDENIZAÇÃO EM 30 DIAS CORRIDOS",
          "Furto": "",
          "Colisão": "COLISÃO/INCÊNDIO PÓS COLISÃO - COM ENTREGA DAS NOTAS FISCAIS",
          "Incêndio": "",
          "Perda Total": "PERDA TOTAL - COM INDENIZAÇÃO EM 30 DIAS CORRIDOS",
          "Vidros Completos (60%)": "VIDRO - FARÓIS, LANTERNAS, PARABRISA, LATERAIS E VIGIA",
          "Danos a terceiros (R$ 150.000)": "TERCEIRO 150 MIL PATRIMONIAIS OU 150 MIL DANOS MATERIAIS",
          "Danos da natureza": "DANOS DA NATUREZA (ENCHENTE, GRANIZO, QUEDA DE ÁRVORE)",
          "Carro Reserva 15 dias": "CARRO RESERVA 15 DIAS",
          "Carro Reserva 7 dias": "CARRO RESERVA 7 DIAS",
          "Carro Reserva 30 dias": "CARRO RESERVA 30 DIAS",
          "Assistência 24H 1000km": "ASSISTÊNCIA 24 HORAS (1000KM DE GUINCHO)",
          "Auxílio combustível": "AUXÍLIO COMBUSTÍVEL / PANE SECA",
          "Recarga de bateria": "RECARGA DE BATERIA",
          "Hospedagem": "HOSPEDAGEM EM CASO DE SINISTRO",
          "Retorno ao domicílio": "RETORNO AO DOMICÍLIO",
          "Chaveiro": "CHAVEIRO 24 HORAS",
          "Reboque": "GUINCHO ILIMITADO EM CASO DE PT",
          "Troca de pneus": "SUBSTITUIÇÃO DE PNEUS",
        };
        return detalheMap[c.nome] || c.nome.toUpperCase();
      }).filter(b => b.length > 0)
    : [
        "COLISÃO/INCÊNDIO PÓS COLISÃO - COM ENTREGA DAS NOTAS FISCAIS",
        "PERDA TOTAL - COM INDENIZAÇÃO EM 30 DIAS CORRIDOS",
        "ROUBO/FURTO - COM INDENIZAÇÃO EM 30 DIAS CORRIDOS",
        "TERCEIRO 150 MIL PATRIMONIAIS",
        "VIDRO - FARÓIS E LANTERNAS",
        "PARABRISA",
        "VIDRO - VIDROS LATERAIS E VIDRO VIGIA",
        "VIDRO - RETROVISOR (CAPA, ESPELHO)",
        "ASSISTÊNCIA 24 HORAS (1000KM DE GUINCHO)",
        "GUINCHO ILIMITADO EM CASO DE PT",
        "CHAVEIRO",
        "RECARGA DE BATERIA",
        "PANE SECA",
        "SUBSTITUIÇÃO DE PNEUS",
        "CLUBE DE DESCONTO",
      ];

  // Montar grid 2 colunas para benefícios
  const benefRows: any[][] = [];
  for (let i = 0; i < beneficiosCompletos.length; i += 2) {
    benefRows.push([
      beneficiosCompletos[i] || "",
      beneficiosCompletos[i + 1] || "",
    ]);
  }

  autoTable(doc, {
    startY: y,
    head: [[{ content: "BENEFÍCIOS CONTRATADOS", colSpan: 2, styles: { fillColor: azul, textColor: [255,255,255], fontStyle: "bold" as const, fontSize: 10 } }]],
    body: benefRows,
    theme: "grid",
    margin: { left: m, right: m },
    styles: { fontSize: 7.5, cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 }, lineColor: cinzaLinha, lineWidth: 0.2, textColor: [30,30,30] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: { 0: { cellWidth: tableW / 2 }, 1: { cellWidth: tableW / 2 } },
  });

  y = (doc as any).lastAutoTable.finalY + 5;

  // ══════════ VALORES DA COTAÇÃO ══════════
  const mensalFinal = dados.plano.mensal;
  const mensalOriginal = dados.plano.mensalOriginal;
  const adesaoFinal = dados.plano.adesao;
  const pontualidade = Math.round(mensalFinal * 0.85);
  const instalacao = dados.plano.instalacao || 0;

  autoTable(doc, {
    startY: y,
    head: [[{ content: `PLANO ${dados.plano.nome.toUpperCase()}`, colSpan: 2, styles: { fillColor: azul, textColor: [255,255,255], fontStyle: "bold" as const, fontSize: 10 } }]],
    body: [
      ["Mensalidade:", { content: "", styles: { halign: "right" as const } }],
      ["Adesão:", { content: fmtBRL(adesaoFinal), styles: { halign: "right" as const, fontStyle: "bold" as const } }],
      ["Desconto pontualidade (15%):", { content: `${fmtBRL(pontualidade)}/mês se pagar em dia`, styles: { halign: "right" as const, textColor: verde as any } }],
      ["Participação:", { content: dados.plano.participacao, styles: { halign: "right" as const } }],
      ["Rastreador:", { content: "Obrigatório", styles: { halign: "right" as const } }],
      ...(instalacao > 0 ? [["Instalação rastreador:", { content: fmtBRL(instalacao), styles: { halign: "right" as const, fontStyle: "bold" as const } }]] : []),
    ],
    theme: "grid",
    margin: { left: m, right: m },
    styles: { fontSize: 8.5, cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 }, lineColor: cinzaLinha, lineWidth: 0.2, textColor: [30,30,30] },
    columnStyles: { 0: { cellWidth: tableW * 0.55 } },
  });

  // Desenhar preço da mensalidade com strikethrough se tiver desconto
  const cotTable = (doc as any).lastAutoTable;
  const rowsMensalidade = cotTable.body[0];
  const cell = rowsMensalidade.cells[1];
  const textY = cell.y + cell.height / 2 + 1;
  const rightX = cell.x + cell.width - 3;
  doc.setFontSize(8.5);
  if (mensalOriginal && mensalOriginal > mensalFinal) {
    const origStr = fmtBRL(mensalOriginal);
    const finalStr = fmtBRL(mensalFinal);
    const finalW = doc.getTextWidth(finalStr);
    const origW = doc.getTextWidth(origStr);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(finalStr, rightX, textY, { align: "right" });
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
    doc.text(fmtBRL(mensalFinal), rightX, textY, { align: "right" });
  }

  // ══════════ RODAPÉ: CONSULTOR + MENSALIDADE DESTAQUE ══════════
  y = cotTable.finalY + 6;

  // Consultor à esquerda
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...azul);
  doc.text("DADOS DO CONSULTOR", m, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(7.5);
  doc.text(dados.consultor.nome, m, y); y += 3.5;
  if (dados.consultor.telefone) { doc.text(dados.consultor.telefone, m, y); y += 3.5; }
  if (dados.consultor.email) { doc.text(dados.consultor.email, m, y); y += 3.5; }

  // Caixa de mensalidade no canto direito
  const boxW = 60;
  const boxH = 22;
  const boxX = w - m - boxW;
  const boxY = cotTable.finalY + 4;
  doc.setFillColor(...azul);
  doc.roundedRect(boxX, boxY, boxW, boxH, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text("MENSALIDADE", boxX + boxW / 2, boxY + 7, { align: "center" });
  doc.setFontSize(16);
  doc.text(fmtBRL(mensalFinal), boxX + boxW / 2, boxY + 16, { align: "center" });

  // Nota de rodapé
  y = Math.max(y, boxY + boxH) + 6;
  doc.setFontSize(6.5);
  doc.setTextColor(130, 130, 130);
  doc.setFont("helvetica", "normal");
  doc.text(`Valor de entrada já inclui valor de vistoria, taxa de cadastro e consultas cadastrais.`, m, y);
  y += 3;
  doc.text(`Proposta nº ${dados.numeroCotacao} válida até ${(() => { const d = new Date(); d.setDate(d.getDate() + dados.validade); return d.toLocaleDateString("pt-BR"); })()}.`, m, y);

  // === PÁGINA 4: APP (arte) ===
  doc.addPage();
  const img4 = await loadImage(pagina4Img);
  if (img4) doc.addImage(img4, "JPEG", 0, 0, w, h);

  doc.save(`Cotacao-${dados.numeroCotacao}.pdf`);
}

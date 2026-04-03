import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface DadosLaudo {
  dataImpressao: string;
  contratante: string;
  configuracao: string;
  cadastro?: string;
  solicitante: string;
  vistoriador: string;
  proponente: { nome: string; cpf: string; telefone: string; email: string };
  veiculo: {
    marcaModelo: string; anoModelo: string; placa: string; chassi: string;
    renavam: string; gnv: string; quilometragem: string; chassiRemarcado: string;
  };
  observacoes: string;
  assinadoPor?: string;
  acessorios: string[];
  parecer: string;
  avaliador: string;
  dataAnalise: string;
  fotos: { titulo: string; url: string; lat: string; lng: string; data: string }[];
  corPrimaria?: string;
  logoUrl?: string;
}

const AZUL_HEADER: [number, number, number] = [33, 150, 243]; // #2196F3
const FOTOS_PER_PAGE = 3;

function sectionHeader(doc: jsPDF, titulo: string, y: number): number {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...AZUL_HEADER);
  doc.rect(14, y, w - 28, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(titulo, w / 2, y + 5.5, { align: "center" });
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  return y + 10;
}

function labelValue(label: string, value: string): any[] {
  return [
    { content: label, styles: { fontStyle: "bold" as const, cellWidth: 45 } },
    value,
  ];
}

function addFooter(doc: jsPDF, dataImpressao: string) {
  const totalPages = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(6);
    doc.setTextColor(130, 130, 130);
    doc.setFont("helvetica", "normal");
    doc.text(`Impresso por GIA em ${dataImpressao}. Todos os Direitos Reservados.`, 14, 288);
    doc.text(`Página ${i} de ${totalPages}`, w - 14, 288, { align: "right" });
  }
}

async function loadImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function gerarLaudoVistoria(dados: DadosLaudo) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();

  // ===================== PAGE 1 TOP: HEADER =====================
  // Logo top-left
  if (dados.logoUrl) {
    try {
      const logoData = await loadImage(dados.logoUrl);
      if (logoData) {
        doc.addImage(logoData, "PNG", 14, 8, 40, 15);
      }
    } catch { /* fallback text below */ }
  }
  if (!dados.logoUrl) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bolditalic");
    doc.setTextColor(33, 150, 243);
    doc.text("OBJETIVO", 14, 14);
    doc.setFontSize(6);
    doc.text("AUTO BENEFÍCIOS", 14, 18);
  }

  // Title center
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("LAUDO DE VISTORIA", w / 2, 16, { align: "center" });

  // Date top-right
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Data de Impressão", w - 14, 10, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(dados.dataImpressao, w - 14, 16, { align: "right" });

  // ===================== DADOS DA VISTORIA =====================
  let startY = sectionHeader(doc, "DADOS DA VISTORIA", 24);

  autoTable(doc, {
    startY,
    head: [],
    theme: "plain",
    margin: { left: 14, right: 14 },
    styles: { fontSize: 7.5, cellPadding: 1.8 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55 },
      1: { cellWidth: (w - 28 - 55) },
    },
    body: [
      ["CONTRATANTE", dados.contratante],
      ["CONFIGURAÇÃO / ROTEIRO", dados.configuracao],
      ["CADASTRO", dados.cadastro || ""],
      ["SOLICITANTE / RESPONSÁVEL", dados.solicitante],
      ["VISTORIADOR", dados.vistoriador],
    ],
  });

  // ===================== DADOS DO PROPONENTE =====================
  let y = (doc as any).lastAutoTable.finalY + 3;
  startY = sectionHeader(doc, "DADOS DO PROPONENTE", y);

  autoTable(doc, {
    startY,
    head: [],
    theme: "plain",
    margin: { left: 14, right: 14 },
    styles: { fontSize: 7.5, cellPadding: 1.8 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 30 },
      1: { cellWidth: (w - 28) / 2 - 30 },
      2: { fontStyle: "bold", cellWidth: 30 },
      3: {},
    },
    body: [
      ["NOME", dados.proponente.nome, "CPF/CNPJ", dados.proponente.cpf],
      ["TELEFONE", dados.proponente.telefone, "E-MAIL", dados.proponente.email],
    ],
  });

  // ===================== DADOS DO VEICULO =====================
  y = (doc as any).lastAutoTable.finalY + 3;
  startY = sectionHeader(doc, "DADOS DO VEÍCULO", y);

  autoTable(doc, {
    startY,
    head: [],
    theme: "plain",
    margin: { left: 14, right: 14 },
    styles: { fontSize: 7.5, cellPadding: 1.8 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 40 },
      1: { cellWidth: (w - 28) / 2 - 40 },
      2: { fontStyle: "bold", cellWidth: 40 },
      3: {},
    },
    body: [
      ["MARCA / MODELO", dados.veiculo.marcaModelo, "ANO MODELO", dados.veiculo.anoModelo],
      ["PLACA", dados.veiculo.placa, "CHASSI", dados.veiculo.chassi],
      ["RENAVAM", dados.veiculo.renavam, "POSSUI GNV?", dados.veiculo.gnv],
      ["CHASSI REMARCADO?", dados.veiculo.chassiRemarcado, "QUILOMETRAGEM", dados.veiculo.quilometragem],
    ],
  });

  // ===================== OBSERVACOES DO VISTORIADOR =====================
  y = (doc as any).lastAutoTable.finalY + 3;
  startY = sectionHeader(doc, "OBSERVAÇÕES DO VISTORIADOR", y);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  const obsText = dados.observacoes || "Sem observações";
  const obsLines = doc.splitTextToSize(obsText, w - 28);
  doc.text(obsLines, 14, startY + 2);
  y = startY + 2 + obsLines.length * 3.5 + 3;

  if (dados.assinadoPor) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(`Assinado por: ${dados.assinadoPor}`, 14, y);
    y += 5;
  }

  // ===================== ACESSORIOS =====================
  y += 2;
  startY = sectionHeader(doc, "ACESSÓRIOS", y);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  const accText = dados.acessorios.join(", ");
  const accLines = doc.splitTextToSize(accText, w - 28);
  doc.text(accLines, 14, startY + 2);
  y = startY + 2 + accLines.length * 3.5 + 3;

  // ===================== ANALISE DA VISTORIA =====================
  y += 2;
  startY = sectionHeader(doc, "ANÁLISE DA VISTORIA", y);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Avaliado por: ${dados.avaliador} em ${dados.dataAnalise}, parecer: (${dados.parecer})`,
    14,
    startY + 3,
  );

  // ===================== FOTOS =====================
  if (dados.fotos && dados.fotos.length > 0) {
    y = startY + 10;

    // Check if we need a new page for photos header
    if (y > 250) {
      doc.addPage();
      y = 15;
    }

    sectionHeader(doc, "FOTOS", y);
    let fotoY = y + 12;
    let fotoCount = 0;

    // Preload all images
    const imageDataArray: (string | null)[] = [];
    for (const foto of dados.fotos) {
      if (foto.url) {
        const imgData = await loadImage(foto.url);
        imageDataArray.push(imgData);
      } else {
        imageDataArray.push(null);
      }
    }

    for (let i = 0; i < dados.fotos.length; i++) {
      const foto = dados.fotos[i];

      if (fotoCount > 0 && fotoCount % FOTOS_PER_PAGE === 0) {
        doc.addPage();
        fotoY = 20;
      }

      const imgW = 60;
      const imgH = 45;

      // Try to render actual image
      const imgData = imageDataArray[i];
      if (imgData) {
        try {
          doc.addImage(imgData, "JPEG", 14, fotoY, imgW, imgH);
        } catch {
          // Fallback: draw placeholder com erro claro
          doc.setDrawColor(220, 80, 80);
          doc.setFillColor(255, 240, 240);
          doc.rect(14, fotoY, imgW, imgH, "FD");
          doc.setFontSize(7);
          doc.setTextColor(180, 50, 50);
          doc.text("[Erro ao carregar foto]", 14 + imgW / 2, fotoY + imgH / 2 - 3, { align: "center" });
          doc.setFontSize(6);
          doc.text(`Tipo: ${foto.titulo}`, 14 + imgW / 2, fotoY + imgH / 2 + 3, { align: "center" });
        }
      } else {
        // Placeholder com erro explícito — sem registro na tabela vistoria_fotos
        doc.setDrawColor(220, 80, 80);
        doc.setFillColor(255, 240, 240);
        doc.rect(14, fotoY, imgW, imgH, "FD");
        doc.setFontSize(7);
        doc.setTextColor(180, 50, 50);
        doc.text("[Foto não encontrada]", 14 + imgW / 2, fotoY + imgH / 2 - 3, { align: "center" });
        doc.setFontSize(6);
        doc.text(`Verifique upload: ${foto.titulo}`, 14 + imgW / 2, fotoY + imgH / 2 + 3, { align: "center" });
      }

      // Photo info on the right
      const infoX = 14 + imgW + 8;

      doc.setTextColor(33, 150, 243);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(foto.titulo, infoX, fotoY + 8);

      doc.setTextColor(80, 80, 80);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");

      let infoY = fotoY + 16;
      if (foto.lat) {
        doc.setFont("helvetica", "bold");
        doc.text("Latitude: ", infoX, infoY);
        doc.setFont("helvetica", "normal");
        doc.text(foto.lat, infoX + 20, infoY);
        infoY += 6;
      }
      if (foto.lng) {
        doc.setFont("helvetica", "bold");
        doc.text("Longitude: ", infoX, infoY);
        doc.setFont("helvetica", "normal");
        doc.text(foto.lng, infoX + 22, infoY);
        infoY += 6;
      }
      if (foto.data) {
        doc.setFont("helvetica", "bold");
        doc.text("Data Criação da Foto: ", infoX, infoY);
        doc.setFont("helvetica", "normal");
        doc.text(foto.data, infoX + 38, infoY);
      }

      // Separator line
      doc.setDrawColor(220, 220, 220);
      doc.line(14, fotoY + imgH + 4, w - 14, fotoY + imgH + 4);

      fotoY += imgH + 10;
      fotoCount++;
    }
  }

  // ===================== FOOTER ALL PAGES =====================
  addFooter(doc, dados.dataImpressao);

  // Save
  doc.save(`Laudo-Vistoria-${dados.veiculo.placa || "sem-placa"}.pdf`);
}

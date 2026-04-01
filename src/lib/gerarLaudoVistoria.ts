import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface DadosLaudo {
  dataImpressao: string;
  contratante: string;
  configuracao: string;
  solicitante: string;
  vistoriador: string;
  proponente: { nome: string; cpf: string; telefone: string; email: string };
  veiculo: { marcaModelo: string; anoModelo: string; placa: string; chassi: string; renavam: string; gnv: string; quilometragem: string; chassiRemarcado: string };
  observacoes: string;
  acessorios: string[];
  parecer: string;
  avaliador: string;
  dataAnalise: string;
  fotos: { titulo: string; url: string; lat: string; lng: string; data: string }[];
  corPrimaria?: string;
}

export function gerarLaudoVistoria(dados: DadosLaudo) {
  const doc = new jsPDF();
  const cor = dados.corPrimaria || "#1A3A5C";
  const corRGB = hexToRgb(cor);
  const w = doc.internal.pageSize.getWidth();

  // === PÁGINA 1 ===
  // Header
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("LAUDO DE VISTORIA", w / 2, 20, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text(`Data de Impressão: ${dados.dataImpressao}`, w - 14, 15, { align: "right" });

  // Dados da Vistoria
  secaoHeader(doc, "DADOS DA VISTORIA", 30, cor, corRGB);
  autoTable(doc, {
    startY: 35, head: [], theme: "plain", margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 1.5 },
    body: [
      [{ content: "CONTRATANTE", styles: { fontStyle: "bold" } }, dados.contratante, { content: "CONFIGURAÇÃO/ROTEIRO", styles: { fontStyle: "bold" } }, dados.configuracao],
      [{ content: "SOLICITANTE/RESPONSÁVEL", styles: { fontStyle: "bold" } }, dados.solicitante, "", ""],
      [{ content: "VISTORIADOR", styles: { fontStyle: "bold" } }, dados.vistoriador, "", ""],
    ],
  });

  // Dados do Proponente
  let y = (doc as any).lastAutoTable.finalY + 3;
  secaoHeader(doc, "DADOS DO PROPONENTE", y, cor, corRGB);
  autoTable(doc, {
    startY: y + 5, head: [], theme: "plain", margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 1.5 },
    body: [
      [{ content: "NOME", styles: { fontStyle: "bold" } }, dados.proponente.nome, { content: "CPF/CNPJ", styles: { fontStyle: "bold" } }, dados.proponente.cpf],
      [{ content: "TELEFONE", styles: { fontStyle: "bold" } }, dados.proponente.telefone, { content: "E-MAIL", styles: { fontStyle: "bold" } }, dados.proponente.email],
    ],
  });

  // Dados do Veículo
  y = (doc as any).lastAutoTable.finalY + 3;
  secaoHeader(doc, "DADOS DO VEÍCULO", y, cor, corRGB);
  autoTable(doc, {
    startY: y + 5, head: [], theme: "plain", margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 1.5 },
    body: [
      [{ content: "MARCA / MODELO", styles: { fontStyle: "bold" } }, dados.veiculo.marcaModelo, { content: "ANO MODELO", styles: { fontStyle: "bold" } }, dados.veiculo.anoModelo],
      [{ content: "PLACA", styles: { fontStyle: "bold" } }, dados.veiculo.placa, { content: "RENAVAM", styles: { fontStyle: "bold" } }, dados.veiculo.renavam],
      [{ content: "CHASSI", styles: { fontStyle: "bold" } }, dados.veiculo.chassi, "", ""],
      [{ content: "POSSUI GNV?", styles: { fontStyle: "bold" } }, dados.veiculo.gnv, { content: "QUILOMETRAGEM", styles: { fontStyle: "bold" } }, dados.veiculo.quilometragem],
      [{ content: "CHASSI REMARCADO?", styles: { fontStyle: "bold" } }, dados.veiculo.chassiRemarcado, "", ""],
    ],
  });

  // Observações
  y = (doc as any).lastAutoTable.finalY + 3;
  secaoHeader(doc, "OBSERVAÇÕES DO VISTORIADOR", y, cor, corRGB);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(dados.observacoes || "Sem observações", 14, y + 10);

  // Acessórios
  y = y + 18;
  secaoHeader(doc, "ACESSÓRIOS", y, cor, corRGB);
  doc.setFontSize(7);
  const accText = dados.acessorios.join(", ");
  const accLines = doc.splitTextToSize(accText, w - 28);
  doc.text(accLines, 14, y + 10);

  // Análise
  y = y + 10 + accLines.length * 4;
  secaoHeader(doc, "ANÁLISE DA VISTORIA", y, cor, corRGB);
  doc.setFontSize(8);
  doc.text(`Avaliado por: ${dados.avaliador} em ${dados.dataAnalise}, parecer: (${dados.parecer})`, 14, y + 8);

  // === PÁGINAS DE FOTOS ===
  if (dados.fotos.length > 0) {
    secaoHeader(doc, "FOTOS", y + 15, cor, corRGB);

    let fotoY = y + 25;
    const fotosPerPage = 3;
    let fotoCount = 0;

    for (const foto of dados.fotos) {
      if (fotoCount > 0 && fotoCount % fotosPerPage === 0) {
        doc.addPage();
        fotoY = 20;
      }

      // Placeholder da foto (retângulo cinza com nome)
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(245, 245, 245);
      doc.rect(14, fotoY, 60, 45, "FD");
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text("[Foto]", 44, fotoY + 25, { align: "center" });

      // Info da foto
      doc.setTextColor(0, 120, 215);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(foto.titulo, 80, fotoY + 10);

      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      if (foto.lat) doc.text(`Latitude: ${foto.lat}`, 80, fotoY + 18);
      if (foto.lng) doc.text(`Longitude: ${foto.lng}`, 80, fotoY + 24);
      if (foto.data) doc.text(`Data Criação da Foto: ${foto.data}`, 80, fotoY + 30);

      // Linha separadora
      doc.setDrawColor(200, 200, 200);
      doc.line(14, fotoY + 50, w - 14, fotoY + 50);

      fotoY += 58;
      fotoCount++;
    }
  }

  // Footer em cada página
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Gerado pelo GIA em ${dados.dataImpressao}. Todos os Direitos Reservados.`, 14, 290);
    doc.text(`Página ${i} de ${totalPages}`, w - 14, 290, { align: "right" });
  }

  doc.save(`Laudo-Vistoria-${dados.veiculo.placa || "sem-placa"}.pdf`);
}

function secaoHeader(doc: jsPDF, titulo: string, y: number, _cor: string, corRGB: number[]) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(corRGB[0], corRGB[1], corRGB[2]);
  doc.rect(14, y, w - 28, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(titulo, w / 2, y + 5, { align: "center" });
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
}

function hexToRgb(hex: string): number[] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

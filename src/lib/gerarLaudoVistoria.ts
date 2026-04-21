import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logoImg from "@/assets/cotacao/logo-objetivo.png";

export interface DadosLaudo {
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

function cell(label: string, value: string): string {
  const v = value?.trim() ? `<span>${value}</span>` : `<span class="empty">&mdash;</span>`;
  return `<div class="data-cell"><label>${label}</label>${v}</div>`;
}

function buildPage1(d: DadosLaudo, hash: string): string {
  const parecerStyle = d.parecer === "Aprovado"
    ? "background:linear-gradient(135deg,#27ae60,#2ecc71);color:#fff"
    : d.parecer === "Reprovado"
    ? "background:linear-gradient(135deg,#c0392b,#e74c3c);color:#fff"
    : "background:linear-gradient(135deg,#f39c12,#e67e22);color:#fff";

  return `
  <div class="page">
    <div class="top-bar"></div>
    <div class="page-inner">
      <div class="header">
        <img src="${logoImg}" alt="Objetivo Auto Benefícios">
        <div class="header-center">
          <h1>Laudo de Vistoria</h1>
          <div class="subtitle">Inspeção Veicular Completa</div>
        </div>
        <div class="header-right">
          <div class="meta-label">Data de Impressão</div>
          <div class="meta-value">${d.dataImpressao.split(",")[0] || d.dataImpressao}</div>
          <div class="meta-label" style="margin-top:4px">Hora</div>
          <div class="meta-value">${d.dataImpressao.split(",")[1]?.trim() || ""}</div>
        </div>
      </div>

      <div class="section-title">Dados da Vistoria</div>
      <div class="data-grid cols-2">
        ${cell("Contratante", d.contratante)}
        ${cell("Configuração / Roteiro", d.configuracao)}
      </div>
      <div class="data-grid cols-2">
        ${cell("Solicitante / Responsável", d.solicitante)}
        ${cell("Vistoriador(a)", d.vistoriador)}
      </div>

      <div class="section-title">Dados do Proponente</div>
      <div class="data-grid cols-2">
        ${cell("Nome Completo", d.proponente.nome)}
        ${cell("CPF/CNPJ", d.proponente.cpf)}
      </div>
      <div class="data-grid cols-2">
        ${cell("Telefone", d.proponente.telefone)}
        ${cell("E-mail", d.proponente.email)}
      </div>

      <div class="section-title">Dados do Veículo</div>
      <div class="data-grid cols-2">
        ${cell("Marca / Modelo", d.veiculo.marcaModelo)}
        ${cell("Ano Modelo", d.veiculo.anoModelo)}
      </div>
      <div class="data-grid cols-3">
        ${cell("Placa", d.veiculo.placa)}
        ${cell("Chassi", d.veiculo.chassi)}
        ${cell("Renavam", d.veiculo.renavam)}
      </div>
      <div class="data-grid cols-3">
        ${cell("Possui GNV?", d.veiculo.gnv)}
        ${cell("Chassi Remarcado?", d.veiculo.chassiRemarcado)}
        ${cell("Quilometragem", d.veiculo.quilometragem)}
      </div>

      <div class="section-title">Observações do Vistoriador</div>
      <div class="info-box">${d.observacoes || "Sem observações"}</div>

      <div class="section-title">Acessórios Identificados</div>
      <div class="accessories">
        ${d.acessorios.map(a => `<span class="acc-tag">${a}</span>`).join("")}
      </div>

      <div class="section-title">Análise da Vistoria</div>
      <div class="analysis-box">
        <span class="status" style="${parecerStyle}">${d.parecer}</span>
        <span class="details">Avaliado por: <strong>${d.avaliador}</strong> em ${d.dataAnalise}</span>
      </div>

      <div class="footer">
        <div class="qr">Autenticação GIA: ${hash}</div>
        <div>Página 1 de ${Math.ceil(d.fotos.length / 6) + 2}</div>
      </div>
    </div>
    <div class="watermark">VISTORIA</div>
  </div>`;
}

function buildPhotoPage(fotos: DadosLaudo["fotos"], pageNum: number, totalPages: number, d: DadosLaudo, hash: string, sectionTitle: string): string {
  return `
  <div class="page page-break">
    <div class="top-bar"></div>
    <div class="page-inner">
      <div class="header">
        <img src="${logoImg}" alt="Objetivo Auto Benefícios">
        <div class="header-center">
          <h1>Registro Fotográfico</h1>
          <div class="subtitle">Vistoria Veicular &mdash; Placa ${d.veiculo.placa}</div>
        </div>
        <div class="header-right">
          <div class="meta-label">Vistoriador(a)</div>
          <div class="meta-value">${d.vistoriador}</div>
        </div>
      </div>

      <div class="section-title">${sectionTitle}</div>
      <div class="photo-grid">
        ${fotos.map(f => `
        <div class="photo-card">
          ${f.url
            ? `<div style="height:130px;overflow:hidden;background:#f0f0f0"><img src="${f.url}" style="width:100%;height:130px;object-fit:cover" crossorigin="anonymous" onerror="this.parentElement.innerHTML='<div style=\\'height:130px;display:flex;align-items:center;justify-content:center;background:#fdf2f2;color:#c0392b;font-size:9px\\'>Foto indisponível</div>'"/></div>`
            : `<div class="photo-placeholder"><div class="icon">&#128247;</div><div class="msg">Aguardando upload</div></div>`
          }
          <div class="photo-label">${f.titulo}</div>
          ${f.data ? `<div class="photo-desc">${f.data}${f.lat ? ` | GPS: ${f.lat}, ${f.lng}` : ""}</div>` : ""}
        </div>`).join("")}
      </div>

      <div class="footer">
        <div class="qr">Autenticação GIA: ${hash}</div>
        <div>Página ${pageNum} de ${totalPages}</div>
      </div>
    </div>
    <div class="watermark">VISTORIA</div>
  </div>`;
}

function buildAuthPage(d: DadosLaudo, hash: string, totalPages: number): string {
  const parecerColor = d.parecer === "Aprovado" ? "color:#27ae60" : d.parecer === "Reprovado" ? "color:#c0392b" : "color:#e67e22";
  return `
  <div class="page page-break">
    <div class="top-bar"></div>
    <div class="page-inner">
      <div class="header">
        <img src="${logoImg}" alt="Objetivo Auto Benefícios">
        <div class="header-center"><h1>Laudo de Vistoria</h1><div class="subtitle">Identificação e Autenticação</div></div>
        <div class="header-right"><div class="meta-label">Placa</div><div class="meta-value">${d.veiculo.placa}</div></div>
      </div>

      <div class="section-title" style="margin-top:24px;background:linear-gradient(135deg,#0d2137,#1b3a5c);">Autenticação do Documento</div>

      <div class="auth-container">
        <div class="auth-badge">Documento Digital Verificável</div>
        <div class="auth-card">
          <div class="doc-id">Código de Autenticação</div>
          <div class="doc-code">${hash}</div>
          <div class="qr-placeholder"><span>QR Code<br>GIA</span></div>
          <hr class="auth-divider">
          <div class="auth-row"><span class="lbl">Documento</span><span class="val">Laudo de Vistoria Veicular</span></div>
          <div class="auth-row"><span class="lbl">Placa</span><span class="val">${d.veiculo.placa}</span></div>
          <div class="auth-row"><span class="lbl">Modelo</span><span class="val">${d.veiculo.marcaModelo}</span></div>
          <div class="auth-row"><span class="lbl">Proponente</span><span class="val">${d.proponente.nome}</span></div>
          <div class="auth-row"><span class="lbl">Vistoriador(a)</span><span class="val">${d.vistoriador}</span></div>
          <div class="auth-row"><span class="lbl">Contratante</span><span class="val">${d.contratante}</span></div>
          <div class="auth-row"><span class="lbl">Data da Vistoria</span><span class="val">${d.dataAnalise}</span></div>
          <div class="auth-row"><span class="lbl">Status</span><span class="val" style="${parecerColor}">${d.parecer}</span></div>
          <hr class="auth-divider">
          <div class="auth-stamp">
            <div class="stamp-text">Objetivo Auto Benefícios</div>
            <div class="stamp-sub">Documento gerado eletronicamente pelo Sistema GIA</div>
          </div>
        </div>
        <div class="auth-legal">Este documento foi gerado eletronicamente pelo sistema GIA (Gestão Inteligente de Associados) e possui validade digital conforme assinatura eletrônica GIA. A autenticidade pode ser verificada através do código QR acima ou pelo código de autenticação <strong>${hash}</strong>.</div>
      </div>

      <div class="footer">
        <div class="qr">Impresso por GIA em ${d.dataImpressao}. Todos os Direitos Reservados.</div>
        <div>Página ${totalPages} de ${totalPages}</div>
      </div>
    </div>
    <div class="watermark">VISTORIA</div>
  </div>`;
}

const CSS = `
@page{size:A4;margin:12mm 15mm}*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:11px;color:#1a1a1a;line-height:1.5;background:#fff}
.page{width:210mm;min-height:297mm;background:#fff;padding:0;position:relative;overflow:hidden;page-break-after:always}
.page-break{page-break-before:always}
.top-bar{height:6px;background:linear-gradient(90deg,#0d2137 0%,#1b3a5c 30%,#2980b9 70%,#1b3a5c 100%)}
.page::before{content:'';position:absolute;left:0;top:6px;bottom:0;width:5px;background:linear-gradient(180deg,#1b3a5c,#2980b9,#1b3a5c)}
.page::after{content:'';position:absolute;right:0;top:6px;bottom:0;width:5px;background:linear-gradient(180deg,#1b3a5c,#2980b9,#1b3a5c)}
.page-inner{padding:16mm 22mm 14mm 22mm}
.header{display:flex;align-items:center;gap:16px;margin-bottom:18px;padding-bottom:14px;border-bottom:2.5px solid #1b3a5c;position:relative}
.header::after{content:'';position:absolute;bottom:-5px;left:0;width:80px;height:2.5px;background:#2980b9;border-radius:2px}
.header img{height:80px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.15))}
.header-center{flex:1;text-align:center}.header-center h1{font-size:26px;font-weight:800;color:#1b3a5c;letter-spacing:2px;text-transform:uppercase}
.header-center .subtitle{font-size:11px;color:#2980b9;font-weight:600;letter-spacing:1px;margin-top:2px}
.header-right{text-align:right}.header-right .meta-label{font-size:8px;color:#999;text-transform:uppercase;letter-spacing:1px}
.header-right .meta-value{font-size:12px;font-weight:700;color:#1b3a5c}
.section-title{background:linear-gradient(135deg,#1b3a5c,#234b73);color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;padding:7px 16px;margin:16px 0 10px;border-radius:4px;box-shadow:0 2px 6px rgba(27,58,92,.25);position:relative}
.section-title::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:#2980b9;border-radius:4px 0 0 4px}
.data-grid{display:grid;gap:0;border:1px solid #d0d5dd;border-radius:6px;overflow:hidden;margin-bottom:6px}
.data-grid.cols-2{grid-template-columns:1fr 1fr}.data-grid.cols-3{grid-template-columns:1fr 1fr 1fr}
.data-cell{padding:6px 12px;border-bottom:1px solid #eef0f2;border-right:1px solid #eef0f2;background:#fff}
.data-cell label{font-size:8.5px;text-transform:uppercase;color:#2980b9;letter-spacing:.8px;display:block;margin-bottom:1px;font-weight:600}
.data-cell span{font-weight:700;color:#1a1a1a;font-size:11px}.data-cell span.empty{color:#ccc;font-weight:400}
.info-box{background:#f8f9fa;border:1px solid #d0d5dd;border-left:4px solid #2980b9;border-radius:6px;padding:10px 16px;margin-bottom:8px;font-size:11px;color:#555}
.accessories{display:flex;flex-wrap:wrap;gap:8px;padding:10px 0}
.acc-tag{background:linear-gradient(135deg,#e8eef5,#dce5f0);color:#1b3a5c;font-size:10.5px;font-weight:700;padding:5px 14px;border-radius:16px;border:1px solid #c5d3e3}
.analysis-box{border:1px solid #d0d5dd;border-radius:6px;padding:12px 16px;margin-bottom:8px;display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,#fffcf0,#fff8e1);border-left:4px solid #f39c12}
.analysis-box .status{display:inline-block;font-size:10px;font-weight:800;padding:4px 14px;border-radius:12px;text-transform:uppercase;letter-spacing:.5px}
.analysis-box .details{font-size:10.5px;color:#666}
.photo-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:10px}
.photo-card{border:1px solid #d0d5dd;border-radius:8px;overflow:hidden;text-align:center}
.photo-placeholder{background:linear-gradient(135deg,#fdf2f2,#fce8e8);height:130px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px}
.photo-placeholder .icon{font-size:28px;opacity:.3}.photo-placeholder .msg{color:#c0392b;font-size:9px;font-weight:500}
.photo-card .photo-label{background:linear-gradient(135deg,#1b3a5c,#234b73);padding:7px 8px;font-size:10.5px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.8px}
.photo-card .photo-desc{background:#f0f4f8;padding:4px 8px;font-size:9px;color:#666;border-top:1px solid #e0e7ef}
.auth-container{max-width:480px;margin:40px auto 0;text-align:center}
.auth-badge{display:inline-block;background:linear-gradient(135deg,#1b3a5c,#2980b9);color:#fff;font-size:11px;font-weight:700;padding:6px 20px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;margin-bottom:16px}
.auth-card{border:2px solid #1b3a5c;border-radius:10px;padding:24px;background:linear-gradient(180deg,#f7f9fc,#fff);box-shadow:0 4px 16px rgba(27,58,92,.1)}
.auth-card .doc-id{font-size:10px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
.auth-card .doc-code{font-size:22px;font-weight:900;color:#1b3a5c;letter-spacing:3px;margin-bottom:16px}
.auth-divider{border:none;border-top:1px dashed #d0d5dd;margin:14px 0}
.auth-row{display:flex;justify-content:space-between;padding:5px 0;font-size:10.5px}
.auth-row .lbl{color:#888;font-weight:500}.auth-row .val{color:#1a1a1a;font-weight:700}
.auth-stamp{margin-top:20px;padding:14px;border:3px double #1b3a5c;border-radius:8px}
.auth-stamp .stamp-text{font-size:14px;font-weight:900;color:#1b3a5c;text-transform:uppercase;letter-spacing:3px}
.auth-stamp .stamp-sub{font-size:9px;color:#2980b9;margin-top:4px;letter-spacing:.5px}
.qr-placeholder{width:100px;height:100px;margin:16px auto;border:2px solid #1b3a5c;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#f7f9fc}
.qr-placeholder span{font-size:9px;color:#999;text-align:center;line-height:1.3}
.auth-legal{margin-top:20px;font-size:9px;color:#888;text-align:justify;line-height:1.5;padding:10px;background:#fafafa;border-radius:6px;border:1px solid #eee}
.footer{display:flex;justify-content:space-between;align-items:center;border-top:2px solid #eef0f2;padding-top:10px;margin-top:18px;font-size:9px;color:#aaa}
.footer .qr{font-weight:600;color:#2980b9}
.watermark{position:absolute;bottom:30mm;right:15mm;font-size:72px;font-weight:900;color:rgba(27,58,92,.03);transform:rotate(-25deg);letter-spacing:8px;pointer-events:none;user-select:none}
`;

async function renderPageToCanvas(html: string): Promise<HTMLCanvasElement> {
  const container = document.createElement("div");
  container.innerHTML = `<style>${CSS}</style>${html}`;
  container.style.cssText = "position:fixed;left:-9999px;top:0;width:794px;";
  document.body.appendChild(container);

  if (document.fonts?.ready) {
    await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]);
  }

  // Pre-load images
  const imgs = container.querySelectorAll("img");
  await Promise.all(Array.from(imgs).map(img =>
    new Promise(resolve => {
      if (img.complete) return resolve(null);
      img.onload = () => resolve(null);
      img.onerror = () => resolve(null);
    })
  ));

  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    width: 794,
    windowWidth: 794,
  });

  document.body.removeChild(container);
  return canvas;
}

export async function gerarLaudoVistoria(dados: DadosLaudo) {
  const hash = `GIA-${Date.now().toString(36).toUpperCase()}`;

  // Categorize photos by section
  const externas = ["frente", "traseira", "lateral_esquerda", "lateral_direita", "lateral esquerda", "lateral direita"];
  const vidros = ["para_brisa", "para brisa", "parabrisa"];
  const interior = ["interior_painel", "interior painel", "painel", "banco_dianteiro", "banco dianteiro", "banco_traseiro", "banco traseiro"];
  const mecanica = ["motor_capo", "motor capo", "motor", "porta_malas", "porta malas", "rodas_pneus", "rodas pneus", "rodas"];
  const ident = ["chave", "chassi", "quilometragem"];

  const categorize = (titulo: string) => {
    const t = titulo.toLowerCase().replace(/_/g, " ");
    if (externas.some(e => t.includes(e))) return "externas";
    if (vidros.some(v => t.includes(v))) return "vidros";
    if (interior.some(i => t.includes(i))) return "interior";
    if (mecanica.some(m => t.includes(m))) return "mecanica";
    if (ident.some(i => t.includes(i))) return "identificacao";
    return "externas";
  };

  // Split into chunks of 6 for photo pages
  const fotosChunks: { fotos: typeof dados.fotos; title: string }[] = [];
  const grouped: Record<string, typeof dados.fotos> = {};
  for (const f of dados.fotos) {
    const cat = categorize(f.titulo);
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(f);
  }

  const sectionNames: Record<string, string> = {
    externas: "Fotos Externas do Veículo",
    vidros: "Vidros e Para-brisa",
    interior: "Interior do Veículo",
    mecanica: "Mecânica e Complementos",
    identificacao: "Identificação do Veículo",
  };

  for (const [cat, fotos] of Object.entries(grouped)) {
    for (let i = 0; i < fotos.length; i += 6) {
      fotosChunks.push({ fotos: fotos.slice(i, i + 6), title: sectionNames[cat] || "Fotos" });
    }
  }

  if (fotosChunks.length === 0) {
    fotosChunks.push({ fotos: dados.fotos.slice(0, 6), title: "Registro Fotográfico" });
  }

  const totalPages = 1 + fotosChunks.length + 1; // page1 + photo pages + auth page
  const pages: string[] = [buildPage1(dados, hash)];

  for (let i = 0; i < fotosChunks.length; i++) {
    pages.push(buildPhotoPage(fotosChunks[i].fotos, i + 2, totalPages, dados, hash, fotosChunks[i].title));
  }

  pages.push(buildAuthPage(dados, hash, totalPages));

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) doc.addPage();
    // Yield ao main thread para não travar UI em laudos grandes
    await new Promise(resolve => setTimeout(resolve, 0));
    const canvas = await renderPageToCanvas(pages[i]);
    const imgData = canvas.toDataURL("image/jpeg", 0.85);
    doc.addImage(imgData, "JPEG", 0, 0, 210, 297);
  }

  doc.save(`Laudo-Vistoria-${dados.veiculo.placa}.pdf`);
}

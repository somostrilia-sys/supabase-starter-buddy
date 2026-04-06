import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import pagina1Img from "@/assets/cotacao/pagina1.jpg";
import pagina2Img from "@/assets/cotacao/pagina2.jpg";
import pagina4Img from "@/assets/cotacao/pagina4.jpg";

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
  opcionais?: { nome: string; categoria: string; valor_mensal: number }[];
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

function fmtBRLParts(v: number): { currency: string; integer: string; decimals: string } {
  const parts = v.toLocaleString("pt-BR", { minimumFractionDigits: 2 }).split(",");
  return { currency: "R$", integer: parts[0], decimals: `,${parts[1]}` };
}

// Map de emojis/ícones e categorias para benefícios
const beneficiosMeta: Record<string, { emoji: string; cat: string; ico: string; desc?: string }> = {
  "Colisão": { emoji: "💥", cat: "cat-colisao", ico: "ico-red", desc: "Com entrega das notas fiscais" },
  "Incêndio": { emoji: "🔥", cat: "cat-colisao", ico: "ico-red", desc: "Pós colisão" },
  "Perda Total": { emoji: "⚠️", cat: "cat-colisao", ico: "ico-blue", desc: "Indenização em 30 dias corridos" },
  "Roubo": { emoji: "🔒", cat: "cat-roubo", ico: "ico-purple", desc: "Indenização em 30 dias corridos" },
  "Furto": { emoji: "🔒", cat: "cat-roubo", ico: "ico-purple", desc: "Indenização em 30 dias corridos" },
  "Danos a Terceiros": { emoji: "👥", cat: "cat-terceiro", ico: "ico-green", desc: "Patrimoniais ou Danos Materiais" },
  "Terceiros": { emoji: "👥", cat: "cat-terceiro", ico: "ico-green", desc: "Patrimoniais ou Danos Materiais" },
  "Vidros": { emoji: "🪟", cat: "cat-vidro", ico: "ico-cyan", desc: "Faróis, lanternas, parabrisa, laterais e vigia" },
  "Retrovisor": { emoji: "🪞", cat: "cat-vidro", ico: "ico-cyan", desc: "Capa e espelho" },
  "Danos da natureza": { emoji: "🌧️", cat: "cat-extra", ico: "ico-blue", desc: "Enchente, granizo, queda de árvore" },
  "Carro Reserva": { emoji: "🚙", cat: "cat-assist", ico: "ico-green" },
  "Assistência 24H": { emoji: "🚗", cat: "cat-assist", ico: "ico-yellow", desc: "Guincho pane e colisão" },
  "Guincho": { emoji: "♾️", cat: "cat-assist", ico: "ico-yellow", desc: "Ilimitado em caso de PT" },
  "Reboque": { emoji: "♾️", cat: "cat-assist", ico: "ico-yellow", desc: "Ilimitado em caso de PT" },
  "Chaveiro": { emoji: "🔑", cat: "cat-extra", ico: "ico-orange" },
  "Recarga de bateria": { emoji: "🔋", cat: "cat-extra", ico: "ico-orange" },
  "Auxílio combustível": { emoji: "⛽", cat: "cat-extra", ico: "ico-orange" },
  "Troca de pneus": { emoji: "🛞", cat: "cat-extra", ico: "ico-orange" },
  "Hospedagem": { emoji: "🏨", cat: "cat-extra", ico: "ico-orange", desc: "Em caso de sinistro" },
  "Retorno ao domicílio": { emoji: "🏠", cat: "cat-extra", ico: "ico-orange" },
  "Clube": { emoji: "⭐", cat: "cat-clube", ico: "ico-sky", desc: "Descontos exclusivos em parceiros" },
};

function getBenefMeta(nome: string) {
  for (const [key, meta] of Object.entries(beneficiosMeta)) {
    if (nome.toLowerCase().includes(key.toLowerCase())) return meta;
  }
  return { emoji: "✅", cat: "cat-extra", ico: "ico-blue" };
}

function buildPage3HTML(dados: DadosCotacao): string {
  const totalOpc = (dados.opcionais || []).reduce((s, o) => s + o.valor_mensal, 0);
  const mensalFinal = dados.plano.mensal;
  const mensalOriginal = dados.plano.mensalOriginal;
  const pontualidade = Math.round(mensalFinal * 0.85);
  const validadeDate = (() => { const d = new Date(); d.setDate(d.getDate() + dados.validade); return d.toLocaleDateString("pt-BR"); })();
  const price = fmtBRLParts(mensalFinal);

  // Build benefícios HTML
  const coberturas = dados.coberturas.filter(c => c.inclusa);
  const defaultBeneficios = [
    "Colisão / Incêndio Pós Colisão", "Perda Total", "Roubo / Furto",
    "Danos a Terceiros R$ 150 mil", "Vidros Completos", "Retrovisor",
    "Assistência 24 Horas", "Guincho Ilimitado", "Chaveiro 24 Horas",
    "Recarga de Bateria", "Pane Seca", "Substituição de Pneus", "Clube de Desconto — Clube PRO",
  ];
  const beneficiosNomes = coberturas.length > 0
    ? coberturas.map(c => c.nome).filter(n => n.length > 0)
    : defaultBeneficios;

  const beneficiosHTML = beneficiosNomes.map(nome => {
    const meta = getBenefMeta(nome);
    const isClube = nome.toLowerCase().includes("clube");
    return `<div class="benefit-item ${isClube ? "benefit-full " : ""}${meta.cat}">
      <div class="benefit-icon ${meta.ico}">${meta.emoji}</div>
      <div class="benefit-text-wrap">
        <div class="benefit-name">${nome}</div>
        ${meta.desc ? `<div class="benefit-desc">${meta.desc}</div>` : ""}
      </div>
    </div>`;
  }).join("\n");

  // Opcionais HTML
  let opcionaisHTML = "";
  if (dados.opcionais && dados.opcionais.length > 0) {
    const opcItems = dados.opcionais.map(o =>
      `<div class="benefit-item cat-extra">
        <div class="benefit-icon ico-sky">➕</div>
        <div class="benefit-text-wrap">
          <div class="benefit-name">${o.nome}</div>
          <div class="benefit-desc">${fmtBRL(o.valor_mensal)}/mês</div>
        </div>
      </div>`
    ).join("\n");
    opcionaisHTML = `
    <div class="benefits-section" style="margin-top:16px;">
      <div class="benefits-section-inner" style="background:linear-gradient(135deg,#1a4a2e 0%,#1e5a36 100%);">
        <div class="benefits-title">
          <div class="line" style="background:linear-gradient(90deg,rgba(46,204,113,0.4),transparent);"></div>
          <h3 style="color:#2ecc71;">✦ Opcionais Contratados ✦</h3>
          <div class="line line-r" style="background:linear-gradient(270deg,rgba(46,204,113,0.4),transparent);"></div>
        </div>
        <div class="benefits-grid">${opcItems}</div>
        <div style="text-align:right;margin-top:8px;padding-right:14px;">
          <span style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:13px;color:#2ecc71;">Total opcionais: ${fmtBRL(totalOpc)}/mês</span>
        </div>
      </div>
    </div>`;
  }

  // Preço com/sem desconto
  let priceHTML = "";
  if (mensalOriginal && mensalOriginal > mensalFinal) {
    priceHTML = `
      <div style="font-size:14px;color:#7aaed4;text-decoration:line-through;margin-bottom:2px;">${fmtBRL(mensalOriginal)}</div>
      <div class="price"><span class="currency">${price.currency}</span> ${price.integer}${price.decimals}</div>`;
  } else {
    priceHTML = `<div class="price"><span class="currency">${price.currency}</span> ${price.integer}${price.decimals}</div>`;
  }

  return `<div style="width:794px;font-family:'Inter','Helvetica','Arial',sans-serif;background:#fff;color:#1a1a1a;padding:0;position:relative;overflow:hidden;">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap');
    .proposta-header{background:linear-gradient(135deg,#132f52 0%,#0a1e3a 100%);padding:28px 40px 22px;display:flex;align-items:center;gap:18px;border-bottom:3px solid;border-image:linear-gradient(90deg,#5bb8f5,#2a7fc9,transparent) 1;position:relative;z-index:1}
    .mini-shield{width:52px;height:52px;background:rgba(91,184,245,0.08);border-radius:12px;display:flex;align-items:center;justify-content:center;border:1.5px solid rgba(91,184,245,0.25);flex-shrink:0}
    .mini-shield svg{width:32px;height:32px}
    .header-info h1{font-family:'Montserrat',sans-serif;font-weight:800;font-size:20px;color:#fff;letter-spacing:0.5px}
    .cotacao-meta{display:flex;gap:18px;margin-top:5px}
    .cotacao-meta span{font-size:11.5px;color:#7aaed4;font-weight:500}
    .cotacao-meta span strong{color:#5bb8f5}
    .proposta-body{padding:22px 40px 18px;position:relative;z-index:1}
    .data-section{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:22px}
    .data-card{background:#0d2b5e;border:none;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(13,43,94,0.3)}
    .data-card-header{background:linear-gradient(135deg,#1a5090,#1e5a9e);padding:9px 16px;display:flex;align-items:center;gap:8px}
    .data-card-header svg{width:16px;height:16px;fill:#fff;flex-shrink:0}
    .data-card-header h3{font-family:'Montserrat',sans-serif;font-weight:700;font-size:10.5px;color:#fff;letter-spacing:2px;text-transform:uppercase}
    .data-card-body{padding:10px 16px}
    .data-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.08)}
    .data-row:last-child{border-bottom:none}
    .data-label{font-size:9.5px;color:#5a94c4;text-transform:uppercase;font-weight:600;letter-spacing:0.8px}
    .data-value{font-size:12.5px;color:#e0ecf5;font-weight:500;text-align:right}
    .benefits-section{margin-bottom:20px}
    .benefits-section-inner{background:linear-gradient(135deg,#0d2b5e 0%,#14376e 100%);border-radius:16px;padding:20px 22px;box-shadow:0 4px 25px rgba(13,43,94,0.35)}
    .benefits-title{display:flex;align-items:center;gap:12px;margin-bottom:14px}
    .benefits-title .line{flex:1;height:1px;background:linear-gradient(90deg,rgba(255,255,255,0.3),transparent)}
    .benefits-title .line-r{background:linear-gradient(270deg,rgba(255,255,255,0.3),transparent)}
    .benefits-title h3{font-family:'Montserrat',sans-serif;font-weight:800;font-size:13px;color:#fff;letter-spacing:3px;text-transform:uppercase;white-space:nowrap}
    .benefits-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
    .benefit-item{display:flex;align-items:center;gap:11px;padding:11px 14px;background:rgba(255,255,255,0.07);border-radius:11px;border:1px solid rgba(255,255,255,0.1);position:relative;overflow:hidden}
    .benefit-item::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;border-radius:3px 0 0 3px}
    .benefit-item.cat-colisao::before{background:linear-gradient(180deg,#ef4444,#dc2626)}
    .benefit-item.cat-roubo::before{background:linear-gradient(180deg,#8b5cf6,#7c3aed)}
    .benefit-item.cat-terceiro::before{background:linear-gradient(180deg,#10b981,#059669)}
    .benefit-item.cat-vidro::before{background:linear-gradient(180deg,#06b6d4,#0891b2)}
    .benefit-item.cat-assist::before{background:linear-gradient(180deg,#f59e0b,#d97706)}
    .benefit-item.cat-extra::before{background:linear-gradient(180deg,#f97316,#ea580c)}
    .benefit-item.cat-clube::before{background:linear-gradient(180deg,#5bb8f5,#2a7fc9)}
    .benefit-icon{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
    .ico-red{background:rgba(239,68,68,0.15)}.ico-blue{background:rgba(59,130,246,0.15)}.ico-purple{background:rgba(139,92,246,0.15)}.ico-green{background:rgba(16,185,129,0.15)}.ico-cyan{background:rgba(6,182,212,0.15)}.ico-yellow{background:rgba(245,158,11,0.15)}.ico-orange{background:rgba(249,115,22,0.15)}.ico-sky{background:rgba(91,184,245,0.15)}
    .benefit-name{font-size:11.5px;color:#f0f6fb;font-weight:700;line-height:1.3;letter-spacing:0.2px}
    .benefit-desc{font-size:9.5px;color:#6a9fd4;font-weight:500;margin-top:1px}
    .benefit-full{grid-column:1 / -1}
    .pricing-section{background:linear-gradient(135deg,#0d2b5e 0%,#14376e 100%);border:none;border-radius:16px;padding:20px 25px;display:grid;grid-template-columns:1fr auto;gap:20px;align-items:center;position:relative;overflow:hidden;box-shadow:0 4px 25px rgba(13,43,94,0.35)}
    .pricing-section::before{content:'';position:absolute;top:-60%;right:-15%;width:280px;height:280px;background:radial-gradient(circle,rgba(91,184,245,0.08),transparent 70%);border-radius:50%}
    .pricing-left{position:relative;z-index:1}
    .pricing-left .consultor{font-size:9.5px;color:#5a94c4;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;margin-bottom:3px}
    .pricing-left .consultor-name{font-size:14px;color:#e0ecf5;font-weight:600;margin-bottom:12px}
    .pricing-left .fees{display:flex;flex-wrap:wrap;gap:6px}
    .fee-tag{background:rgba(91,184,245,0.08);border:1px solid rgba(91,184,245,0.18);border-radius:20px;padding:5px 12px;font-size:10px;color:#7aaed4;font-weight:500}
    .fee-tag strong{color:#5bb8f5}
    .pricing-right{text-align:center;position:relative;z-index:1;padding:15px 25px;background:rgba(91,184,245,0.04);border-radius:14px;border:1px solid rgba(91,184,245,0.12)}
    .pricing-right .label{font-family:'Montserrat',sans-serif;font-weight:700;font-size:10px;color:#5bb8f5;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:2px}
    .pricing-right .price{font-family:'Montserrat',sans-serif;font-weight:900;font-size:44px;color:#fff;line-height:1;margin-bottom:6px;text-shadow:0 0 30px rgba(91,184,245,0.2)}
    .pricing-right .price .currency{font-size:20px;vertical-align:super;margin-right:2px;font-weight:700}
    .pricing-right .discount{background:linear-gradient(135deg,#059669,#10b981);border-radius:20px;padding:5px 16px;font-size:10px;font-weight:700;color:#fff;display:inline-block;box-shadow:0 2px 10px rgba(16,185,129,0.3)}
    .proposta-footer{padding:12px 40px;border-top:1px solid #e0e8f0;display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1}
    .proposta-footer p{font-size:9.5px;color:#6b7b8d}
    .proposta-footer .validity{background:#0d2b5e;border:none;border-radius:20px;padding:5px 16px;font-size:10.5px;color:#fff;font-weight:600}
  </style>

  <!-- HEADER -->
  <div class="proposta-header">
    <div class="mini-shield">
      <svg viewBox="0 0 80 90" fill="none">
        <path d="M40 5 L72 20 L72 50 Q72 75 40 88 Q8 75 8 50 L8 20 Z" fill="rgba(91,184,245,0.2)" stroke="#5bb8f5" stroke-width="2.5"/>
        <rect x="28" y="35" width="24" height="16" rx="3" fill="none" stroke="#fff" stroke-width="2"/>
        <circle cx="40" cy="43" r="3" fill="#5bb8f5"/>
      </svg>
    </div>
    <div class="header-info">
      <h1>PROPOSTA DE PROTE&Ccedil;&Atilde;O VEICULAR</h1>
      <div class="cotacao-meta">
        <span>Cota&ccedil;&atilde;o n&ordm; <strong>${dados.numeroCotacao}</strong></span>
        <span>Data: <strong>${dados.data}</strong></span>
        <span>Validade: <strong>${dados.validade} dias</strong></span>
      </div>
    </div>
  </div>

  <!-- BODY -->
  <div class="proposta-body">
    <!-- DATA CARDS -->
    <div class="data-section">
      <div class="data-card">
        <div class="data-card-header">
          <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          <h3>Dados do Associado</h3>
        </div>
        <div class="data-card-body">
          <div class="data-row"><span class="data-label">Nome</span><span class="data-value">${dados.cliente.nome}</span></div>
          <div class="data-row"><span class="data-label">Telefone</span><span class="data-value">${dados.cliente.telefone || "—"}</span></div>
          <div class="data-row"><span class="data-label">Email</span><span class="data-value">${dados.cliente.email || "—"}</span></div>
          <div class="data-row"><span class="data-label">Cidade</span><span class="data-value">${dados.cliente.cidade}/${dados.cliente.estado}</span></div>
        </div>
      </div>
      <div class="data-card">
        <div class="data-card-header">
          <svg viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
          <h3>Dados do Ve&iacute;culo</h3>
        </div>
        <div class="data-card-body">
          <div class="data-row"><span class="data-label">Placa</span><span class="data-value">${dados.cliente.placa}</span></div>
          <div class="data-row"><span class="data-label">FIPE</span><span class="data-value">${fmtBRL(dados.cliente.valorFipe)} [${dados.cliente.codFipe}]</span></div>
          <div class="data-row"><span class="data-label">Modelo</span><span class="data-value">${dados.cliente.veiculo}</span></div>
          <div class="data-row"><span class="data-label">Plano</span><span class="data-value" style="color:#5bb8f5;font-weight:700;">${dados.plano.nome}</span></div>
        </div>
      </div>
    </div>

    <!-- BENEFÍCIOS -->
    <div class="benefits-section">
      <div class="benefits-section-inner">
        <div class="benefits-title">
          <div class="line"></div>
          <h3>&#10022; Benef&iacute;cios Contratados &#10022;</h3>
          <div class="line line-r"></div>
        </div>
        <div class="benefits-grid">
          ${beneficiosHTML}
        </div>
      </div>
    </div>

    <!-- OPCIONAIS -->
    ${opcionaisHTML}

    <!-- PRICING -->
    <div class="pricing-section">
      <div class="pricing-left">
        <div class="consultor">Dados do Consultor</div>
        <div class="consultor-name">${dados.consultor.nome}</div>
        <div class="fees">
          <div class="fee-tag">Ades&atilde;o: <strong>${fmtBRL(dados.plano.adesao)}</strong></div>
          <div class="fee-tag">Rastreador: <strong>${fmtBRL(dados.plano.instalacao || 100)}</strong></div>
          <div class="fee-tag">Participa&ccedil;&atilde;o: <strong>${dados.plano.participacao}</strong></div>
        </div>
      </div>
      <div class="pricing-right">
        <div class="label">Mensalidade</div>
        ${priceHTML}
        <div class="discount">15% OFF pagando em dia &rarr; ${fmtBRL(pontualidade)}/m&ecirc;s</div>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="proposta-footer">
    <p>Valor de entrada j&aacute; inclui vistoria, taxa de cadastro e consultas cadastrais. Proposta n&ordm; ${dados.numeroCotacao}.</p>
    <div class="validity">V&aacute;lida at&eacute; ${validadeDate}</div>
  </div>
</div>`;
}

export async function gerarPdfCotacao(dados: DadosCotacao) {
  const doc = new jsPDF("p", "mm", "a4");
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // ═══ PÁGINA 1: CAPA (arte) ═══
  const img1 = await loadImage(pagina1Img);
  if (img1) doc.addImage(img1, "JPEG", 0, 0, w, h);

  // ═══ PÁGINA 2: DEPOIMENTOS (arte) ═══
  doc.addPage();
  const img2 = await loadImage(pagina2Img);
  if (img2) doc.addImage(img2, "JPEG", 0, 0, w, h);

  // ═══ PÁGINA 3: PROPOSTA PREMIUM (HTML → Canvas → PDF) ═══
  doc.addPage();

  const htmlStr = buildPage3HTML(dados);

  // Criar container temporário offscreen
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.background = "#ffffff";
  container.innerHTML = htmlStr;
  document.body.appendChild(container);

  try {
    // Aguardar fontes carregarem
    if (document.fonts?.ready) {
      await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2000))]);
    }

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: 794,
      windowWidth: 794,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    // A4 = 210x297mm. Escalar para largura total, ajustar altura proporcionalmente
    const imgRatio = canvas.height / canvas.width;
    const pdfW = w;
    const pdfH = pdfW * imgRatio;

    if (pdfH <= h) {
      // Cabe numa página
      doc.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);
    } else {
      // Precisa escalar para caber
      const scale = h / pdfH;
      const scaledW = pdfW * scale;
      const offsetX = (w - scaledW) / 2;
      doc.addImage(imgData, "JPEG", offsetX, 0, scaledW, h);
    }
  } finally {
    document.body.removeChild(container);
  }

  // ═══ PÁGINA 4: APP (arte) ═══
  doc.addPage();
  const img4 = await loadImage(pagina4Img);
  if (img4) doc.addImage(img4, "JPEG", 0, 0, w, h);

  doc.save(`Cotacao-${dados.numeroCotacao}.pdf`);
}

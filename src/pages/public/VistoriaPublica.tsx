import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Camera, CheckCircle, MapPin, Clock, AlertTriangle, Upload, X } from "lucide-react";

// Imagens de referência
import imgFrente from "@/assets/vistoria/frente.jpg";
import imgTraseira from "@/assets/vistoria/traseira.jpg";
import imgLateralEsq from "@/assets/vistoria/lateral-esquerda.jpg";
import imgLateralDir from "@/assets/vistoria/lateral-direita.jpg";
import imgInterior from "@/assets/vistoria/interior-painel.jpg";
import imgBancoDiant from "@/assets/vistoria/banco-dianteiro.jpg";
import imgBancoTras from "@/assets/vistoria/banco-traseiro.jpg";
import imgTeto from "@/assets/vistoria/teto.jpg";
import imgMotor from "@/assets/vistoria/motor-capo.jpg";
import imgPortaMalas from "@/assets/vistoria/porta-malas.jpg";
import imgRodas from "@/assets/vistoria/rodas-pneus.jpg";
import imgChave from "@/assets/vistoria/chave.jpg";
import imgChassi from "@/assets/vistoria/chassi.jpg";
import imgQuilometragem from "@/assets/vistoria/quilometragem.jpg";

const CATEGORIAS = [
  { id: "frente", label: "Frente", img: imgFrente },
  { id: "traseira", label: "Traseira", img: imgTraseira },
  { id: "lateral_esquerda", label: "Lateral Esquerda", img: imgLateralEsq },
  { id: "lateral_direita", label: "Lateral Direita", img: imgLateralDir },
  { id: "interior_painel", label: "Interior / Painel", img: imgInterior },
  { id: "banco_dianteiro", label: "Banco Dianteiro", img: imgBancoDiant },
  { id: "banco_traseiro", label: "Banco Traseiro", img: imgBancoTras },
  { id: "teto", label: "Teto", img: imgTeto },
  { id: "motor_capo", label: "Motor / Capô", img: imgMotor },
  { id: "porta_malas", label: "Porta-malas", img: imgPortaMalas },
  { id: "rodas_pneus", label: "Rodas e Pneus", img: imgRodas },
  { id: "chave", label: "Chave do Veículo", img: imgChave },
  { id: "chassi", label: "Chassi", img: imgChassi, obs: "Se não encontrar no motor, pode ser do vidro" },
  { id: "quilometragem", label: "Quilometragem", img: imgQuilometragem },
];

interface FotoCapturada {
  id: string;
  blob: Blob;
  previewUrl: string;
  timestamp: string;
  lat: number;
  lng: number;
}

export default function VistoriaPublica() {
  const { token } = useParams<{ token: string }>();
  const [vistoria, setVistoria] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoErro, setGeoErro] = useState<string | null>(null);
  const [agora, setAgora] = useState(new Date());
  const [fotos, setFotos] = useState<Map<string, FotoCapturada>>(new Map());
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch vistoria
  useEffect(() => {
    if (!token) return;
    supabase.from("vistorias" as any).select("*").eq("token_publico", token).maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) setErro("Vistoria não encontrada ou link inválido.");
        else setVistoria(data);
        setLoading(false);
      });
  }, [token]);

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) { setGeoErro("Geolocalização não suportada."); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setGeoErro(err.code === 1 ? "Permissão de localização negada. Ative nas configurações." : "Não foi possível obter localização."),
      { enableHighAccuracy: true, timeout: 15000 }
    );
    // Keep updating
    const wid = navigator.geolocation.watchPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(wid);
  }, []);

  // Clock
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Handle file input (camera or gallery)
  const handleFile = (catId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !coords) return;

    // Draw timestamp on image
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);

        // Burn timestamp + coords
        const ts = new Date().toLocaleString("pt-BR");
        const info = `${ts} | ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
        const barH = Math.max(30, img.height * 0.04);
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, img.height - barH, img.width, barH);
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${Math.max(14, barH * 0.5)}px sans-serif`;
        ctx.fillText(info, 10, img.height - barH * 0.3);

        canvas.toBlob((blob) => {
          if (!blob) return;
          const previewUrl = URL.createObjectURL(blob);
          setFotos(prev => new Map(prev).set(catId, {
            id: catId, blob, previewUrl,
            timestamp: new Date().toISOString(),
            lat: coords.lat, lng: coords.lng,
          }));
        }, "image/jpeg", 0.85);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Upload all
  const enviarFotos = async () => {
    if (!vistoria || fotos.size === 0) return;
    setEnviando(true);
    try {
      for (const [catId, foto] of fotos) {
        const ts = foto.timestamp.replace(/[:.]/g, "-");
        const path = `${vistoria.id}/${catId}_${ts}.jpg`;
        await supabase.storage.from("vistoria-fotos").upload(path, foto.blob, { contentType: "image/jpeg", upsert: true });
      }
      await supabase.from("vistorias" as any).update({
        status: "em_aprovacao",
        fotos_enviadas: Array.from(fotos.entries()).map(([catId, f]) => ({
          categoria: catId, timestamp: f.timestamp, lat: f.lat, lng: f.lng,
        })),
      } as any).eq("id", vistoria.id);
      setConcluido(true);
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar fotos. Tente novamente.");
    }
    setEnviando(false);
  };

  const removeFoto = (catId: string) => {
    setFotos(prev => { const n = new Map(prev); n.delete(catId); return n; });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A3A5C]">
      <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (erro || !vistoria) return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A3A5C] px-4">
      <div className="bg-white rounded-xl p-8 text-center max-w-md">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold mb-2">Vistoria não encontrada</h2>
        <p className="text-sm text-gray-600">{erro || "Verifique o link e tente novamente."}</p>
      </div>
    </div>
  );

  if (concluido) return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A3A5C] px-4">
      <div className="bg-white rounded-xl p-8 text-center max-w-md">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-[#1A3A5C] mb-2">Fotos enviadas com sucesso!</h2>
        <p className="text-sm text-gray-600">Sua vistoria será analisada em breve. Você receberá uma notificação com o resultado.</p>
      </div>
    </div>
  );

  const fotosTiradas = fotos.size;
  const totalFotos = CATEGORIAS.length;
  const progresso = Math.round((fotosTiradas / totalFotos) * 100);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#1A3A5C] text-white px-4 py-3 sticky top-0 z-50">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sm font-bold">Vistoria Veicular</h1>
              <p className="text-[10px] text-white/70">{vistoria.placa} — {vistoria.modelo}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-[10px] text-white/70">
                <Clock className="w-3 h-3" />
                {agora.toLocaleTimeString("pt-BR")}
              </div>
              {coords ? (
                <div className="flex items-center gap-1 text-[10px] text-green-400">
                  <MapPin className="w-3 h-3" />GPS OK
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[10px] text-red-400">
                  <MapPin className="w-3 h-3" />{geoErro ? "GPS negado" : "Aguardando..."}
                </div>
              )}
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-2 bg-white/20 rounded-full h-2">
            <div className="bg-green-400 h-2 rounded-full transition-all" style={{ width: `${progresso}%` }} />
          </div>
          <p className="text-[10px] text-white/70 mt-1">{fotosTiradas}/{totalFotos} fotos tiradas</p>
        </div>
      </header>

      {/* GPS warning */}
      {!coords && geoErro && (
        <div className="bg-red-500 text-white text-center text-xs py-2 px-4">
          <AlertTriangle className="w-3 h-3 inline mr-1" />{geoErro}
        </div>
      )}

      {/* Grid de fotos */}
      <div className="max-w-lg mx-auto px-3 py-4">
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIAS.map(cat => {
            const foto = fotos.get(cat.id);
            return (
              <div key={cat.id} className="relative">
                {foto ? (
                  // Foto tirada — mostra miniatura
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden border-2 border-green-500">
                    <img src={foto.previewUrl} alt={cat.label} className="w-full h-full object-cover" />
                    <div className="absolute top-1 right-1">
                      <button onClick={() => removeFoto(cat.id)} className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="absolute top-1 left-1">
                      <CheckCircle className="w-5 h-5 text-green-500 drop-shadow" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-green-600/90 text-white text-[10px] font-semibold text-center py-1">
                      {cat.label}
                    </div>
                  </div>
                ) : (
                  // Não tirada — mostra referência + botão
                  <label className={`block relative aspect-[4/3] rounded-lg overflow-hidden border-2 border-dashed cursor-pointer transition-all ${
                    coords ? "border-[#1A3A5C] hover:border-blue-400" : "border-gray-300 opacity-50 cursor-not-allowed"
                  }`}>
                    <img src={cat.img} alt={cat.label} className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                      <Camera className="w-8 h-8 text-white mb-1" />
                      <span className="text-white text-[10px] font-semibold">Tirar foto</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-[#1A3A5C]/90 text-white text-[10px] font-semibold text-center py-1">
                      {cat.label}
                    </div>
                    {cat.obs && (
                      <div className="absolute bottom-6 left-0 right-0 text-[8px] text-white/80 text-center px-1">{cat.obs}</div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleFile(cat.id, e)}
                      disabled={!coords}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>

        {/* Botão enviar */}
        <div className="mt-6 space-y-3">
          <button
            onClick={enviarFotos}
            disabled={fotosTiradas === 0 || enviando || !coords}
            className={`w-full py-4 rounded-xl font-bold text-white text-base transition-all ${
              fotosTiradas >= totalFotos
                ? "bg-green-500 hover:bg-green-600 shadow-lg"
                : fotosTiradas > 0
                ? "bg-[#1A3A5C] hover:bg-[#15304D]"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {enviando ? "Enviando..." : fotosTiradas >= totalFotos ? `Enviar ${fotosTiradas} fotos` : fotosTiradas > 0 ? `Enviar ${fotosTiradas}/${totalFotos} fotos` : "Tire as fotos para enviar"}
          </button>
          {fotosTiradas > 0 && fotosTiradas < totalFotos && (
            <p className="text-xs text-center text-gray-500">Faltam {totalFotos - fotosTiradas} fotos. Você pode enviar parcial.</p>
          )}
        </div>
      </div>

      {/* Canvas oculto para processar imagens */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

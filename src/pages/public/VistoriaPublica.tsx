import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Camera,
  CheckCircle,
  MapPin,
  Clock,
  AlertTriangle,
  Upload,
  X,
} from "lucide-react";

const CATEGORIAS = [
  "Frente",
  "Traseira",
  "Lateral Esquerda",
  "Lateral Direita",
  "Interior/Painel",
  "Banco Dianteiro",
  "Banco Traseiro",
  "Teto",
  "Motor/Capô",
  "Porta-malas",
  "Rodas e Pneus",
  "Chave do Veículo",
  "Chassi",
  "Quilometragem",
] as const;

type Categoria = (typeof CATEGORIAS)[number];

interface FotoCapturada {
  categoria: Categoria;
  blob: Blob;
  previewUrl: string;
  timestamp: string;
  lat: number;
  lng: number;
  uploaded: boolean;
}

export default function VistoriaPublica() {
  const { token } = useParams<{ token: string }>();

  // Vistoria data
  const [vistoria, setVistoria] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Geo
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoErro, setGeoErro] = useState<string | null>(null);

  // Clock
  const [agora, setAgora] = useState(new Date());

  // Photos
  const [fotos, setFotos] = useState<Map<Categoria, FotoCapturada>>(new Map());
  const [categoriaAtiva, setCategoriaAtiva] = useState<Categoria | null>(null);
  const [uploading, setUploading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);

  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [usandoCamera, setUsandoCamera] = useState(false);
  const [cameraErro, setCameraErro] = useState(false);

  // ── Fetch vistoria ──────────────────────────────────
  useEffect(() => {
    if (!token) return;
    supabase
      .from("vistorias" as any)
      .select("*")
      .eq("token_publico", token)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setErro("Vistoria não encontrada ou link inválido.");
        } else {
          setVistoria(data);
        }
        setLoading(false);
      });
  }, [token]);

  // ── Geolocation ─────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoErro("Geolocalização não suportada neste navegador.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        setGeoErro(
          err.code === 1
            ? "Permissão de localização negada. Ative nas configurações do navegador."
            : "Não foi possível obter localização. Tente novamente."
        );
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  // ── Clock tick ──────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Camera helpers ──────────────────────────────────
  const abrirCamera = useCallback(async (cat: Categoria) => {
    setCategoriaAtiva(cat);
    setCameraErro(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setUsandoCamera(true);
      // Wait for the video ref to be available after render
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      setCameraErro(true);
      // Fallback: trigger file input
      fileInputRef.current?.click();
    }
  }, []);

  const fecharCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setUsandoCamera(false);
    setCategoriaAtiva(null);
    setCameraErro(false);
  }, []);

  const capturarFoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !categoriaAtiva || !coords) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);

    // Burn timestamp + coords into image
    const ts = new Date().toLocaleString("pt-BR");
    const infoText = `${ts} | ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(infoText, 10, canvas.height - 14);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const previewUrl = URL.createObjectURL(blob);
        const foto: FotoCapturada = {
          categoria: categoriaAtiva,
          blob,
          previewUrl,
          timestamp: new Date().toISOString(),
          lat: coords.lat,
          lng: coords.lng,
          uploaded: false,
        };
        setFotos((prev) => new Map(prev).set(categoriaAtiva, foto));
        fecharCamera();
      },
      "image/jpeg",
      0.85
    );
  }, [categoriaAtiva, coords, fecharCamera]);

  // File input fallback
  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !categoriaAtiva || !coords) return;
      const previewUrl = URL.createObjectURL(file);
      const foto: FotoCapturada = {
        categoria: categoriaAtiva,
        blob: file,
        previewUrl,
        timestamp: new Date().toISOString(),
        lat: coords.lat,
        lng: coords.lng,
        uploaded: false,
      };
      setFotos((prev) => new Map(prev).set(categoriaAtiva, foto));
      setCategoriaAtiva(null);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [categoriaAtiva, coords]
  );

  // ── Upload all photos ───────────────────────────────
  const enviarFotos = useCallback(async () => {
    if (!vistoria || fotos.size < CATEGORIAS.length) return;
    setEnviando(true);

    try {
      const vistoriaId = vistoria.id;
      const uploads: Promise<void>[] = [];

      fotos.forEach((foto, cat) => {
        if (foto.uploaded) return;
        const safeCat = cat
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9]/g, "_")
          .toLowerCase();
        const ts = foto.timestamp.replace(/[:.]/g, "-");
        const path = `${vistoriaId}/${safeCat}_${ts}.jpg`;

        uploads.push(
          supabase.storage
            .from("vistoria-fotos")
            .upload(path, foto.blob, {
              contentType: "image/jpeg",
              upsert: true,
            })
            .then(({ error }) => {
              if (error) throw error;
              foto.uploaded = true;
            })
        );
      });

      await Promise.all(uploads);

      // Update vistoria record
      const fotosMeta = Array.from(fotos.values()).map((f) => ({
        categoria: f.categoria,
        timestamp: f.timestamp,
        lat: f.lat,
        lng: f.lng,
      }));

      await supabase
        .from("vistorias" as any)
        .update({
          fotos_metadata: fotosMeta,
          status_fotos: "enviadas",
          data_envio_fotos: new Date().toISOString(),
          latitude: coords?.lat,
          longitude: coords?.lng,
        } as any)
        .eq("id", vistoriaId);

      setConcluido(true);
    } catch (err: any) {
      alert("Erro ao enviar fotos: " + (err?.message || "tente novamente"));
    } finally {
      setEnviando(false);
    }
  }, [vistoria, fotos, coords]);

  // ── Render helpers ──────────────────────────────────
  const fotosCount = fotos.size;
  const progressPct = (fotosCount / CATEGORIAS.length) * 100;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1A3A5C]" />
      </div>
    );
  }

  if (erro || !vistoria) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-orange-500 mb-4" />
            <h2 className="text-lg font-semibold mb-2">Link Inválido</h2>
            <p className="text-gray-600 text-sm">{erro || "Vistoria não encontrada."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (concluido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Fotos Enviadas!</h2>
            <p className="text-gray-600">
              Todas as {CATEGORIAS.length} fotos da vistoria foram enviadas com sucesso.
            </p>
            <p className="text-sm text-gray-400 mt-4">Você pode fechar esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-[#1A3A5C] text-white px-4 py-5">
        <h1 className="text-lg font-bold">Vistoria Veicular</h1>
        <div className="flex items-center gap-3 mt-2 text-sm opacity-90">
          {vistoria.placa && (
            <span className="bg-white/20 px-2 py-0.5 rounded font-mono font-bold">
              {vistoria.placa}
            </span>
          )}
          {vistoria.modelo && <span>{vistoria.modelo}</span>}
        </div>
      </div>

      {/* Geolocation & Time Bar */}
      <div className="bg-white border-b px-4 py-3 text-xs space-y-1">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-gray-400" />
          <span className="font-mono">
            {agora.toLocaleDateString("pt-BR")} {agora.toLocaleTimeString("pt-BR")}
          </span>
        </div>
        {coords ? (
          <div className="flex items-center gap-2 text-green-700">
            <MapPin className="h-3.5 w-3.5" />
            <span className="font-mono">
              {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
            </span>
          </div>
        ) : geoErro ? (
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{geoErro}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-400">
            <MapPin className="h-3.5 w-3.5 animate-pulse" />
            <span>Obtendo localização...</span>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="px-4 py-3 bg-white border-b">
        <div className="flex items-center justify-between mb-1.5 text-sm">
          <span className="font-medium">Progresso</span>
          <span className="text-gray-500">
            {fotosCount}/{CATEGORIAS.length} fotos
          </span>
        </div>
        <Progress value={progressPct} className="h-2" />
      </div>

      {/* Categories Checklist */}
      <div className="px-4 py-3">
        <div className="grid gap-2">
          {CATEGORIAS.map((cat) => {
            const foto = fotos.get(cat);
            const done = !!foto;
            return (
              <button
                key={cat}
                disabled={!coords}
                onClick={() => abrirCamera(cat)}
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                  done
                    ? "bg-green-50 border-green-200"
                    : "bg-white border-gray-200 hover:border-[#1A3A5C] hover:shadow-sm"
                } ${!coords ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {done ? (
                  <img
                    src={foto.previewUrl}
                    alt={cat}
                    className="h-12 w-12 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Camera className="h-5 w-5 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium block">{cat}</span>
                  {cat === "Chassi" && (
                    <span className="text-xs text-gray-400">
                      Obs: se não encontrar no motor, pode ser do vidro
                    </span>
                  )}
                </div>
                {done ? (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700 flex-shrink-0"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" /> OK
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-400 flex-shrink-0">
                    Pendente
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Camera Overlay */}
      {categoriaAtiva && usandoCamera && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="bg-[#1A3A5C] text-white px-4 py-3 flex items-center justify-between">
            <span className="font-medium text-sm">{categoriaAtiva}</span>
            <button onClick={fecharCamera} className="p-1">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Timestamp overlay on video */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-3 py-2 font-mono">
              {new Date().toLocaleString("pt-BR")} | {coords?.lat.toFixed(6)},{" "}
              {coords?.lng.toFixed(6)}
            </div>
          </div>
          <div className="bg-black py-6 flex justify-center">
            <button
              onClick={capturarFoto}
              className="h-16 w-16 rounded-full border-4 border-white bg-white/20 active:bg-white/40 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden file input fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Submit Button - Fixed bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-40">
        {fotosCount < CATEGORIAS.length ? (
          <Button disabled className="w-full" size="lg">
            <Camera className="h-4 w-4 mr-2" />
            {fotosCount === 0
              ? `Tire as ${CATEGORIAS.length} fotos para enviar`
              : `Faltam ${CATEGORIAS.length - fotosCount} foto(s)`}
          </Button>
        ) : (
          <Button
            onClick={enviarFotos}
            disabled={enviando}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {enviando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Enviar {CATEGORIAS.length} Fotos
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

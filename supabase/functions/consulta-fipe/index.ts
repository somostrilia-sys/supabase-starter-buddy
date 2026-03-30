import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const body = await req.json().catch(() => ({}));
    const { marca, modelo, ano } = body;

    // Busca marcas da FIPE via BrasilAPI
    const brandsRes = await fetch(
      "https://brasilapi.com.br/api/fipe/marcas/v1/carros"
    );
    const brands = await brandsRes.json();

    // Se forneceu marca, busca modelos
    let modelos: any[] = [];
    if (marca) {
      const marcaCode = brands.find(
        (b: any) =>
          b.nome?.toLowerCase().includes(marca.toLowerCase()) ||
          b.codigo === marca
      )?.codigo;
      if (marcaCode) {
        const modelosRes = await fetch(
          `https://brasilapi.com.br/api/fipe/veiculos/v1/carros/${marcaCode}`
        );
        const modelosData = await modelosRes.json();
        modelos = Array.isArray(modelosData) ? modelosData.slice(0, 50) : [];
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        marcas: brands.slice(0, 50),
        modelos,
      }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...cors, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

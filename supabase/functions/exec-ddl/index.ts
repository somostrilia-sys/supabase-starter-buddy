import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    // Use pg to connect directly
    const { Pool } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
    
    const pool = new Pool(Deno.env.get("SUPABASE_DB_URL") || {
      hostname: Deno.env.get("DB_HOST") || "localhost",
      port: Number(Deno.env.get("DB_PORT") || 5432),
      database: "postgres",
      user: "postgres",
      password: Deno.env.get("POSTGRES_PASSWORD") || "",
    }, 1);

    const client = await pool.connect();
    
    await client.queryArray(`
      CREATE TABLE IF NOT EXISTS public.negociacoes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        codigo TEXT,
        lead_nome TEXT NOT NULL,
        cpf_cnpj TEXT,
        telefone TEXT,
        email TEXT,
        veiculo_modelo TEXT,
        veiculo_placa TEXT,
        plano TEXT,
        valor_plano DECIMAL(10,2),
        stage TEXT DEFAULT 'novo_lead',
        consultor_id UUID,
        consultor TEXT,
        cooperativa TEXT,
        regional TEXT,
        gerente TEXT,
        origem TEXT DEFAULT 'Manual',
        observacoes TEXT,
        enviado_sga BOOLEAN DEFAULT FALSE,
        company_id UUID,
        visualizacoes_proposta INTEGER DEFAULT 0,
        status_icons JSONB DEFAULT '{"aceita":false,"pendente":true,"aprovada":false,"sga":false,"rastreador":false,"inadimplencia":false}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.queryArray(`ALTER TABLE public.negociacoes ENABLE ROW LEVEL SECURITY`);
    
    await client.queryArray(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'negociacoes' AND policyname = 'allow_authenticated') THEN
          CREATE POLICY allow_authenticated ON public.negociacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
        END IF;
      END $$
    `);

    client.release();
    await pool.end();

    return new Response(JSON.stringify({ success: true, message: "Table negociacoes created" }), {
      headers: { ...cors, "Content-Type": "application/json" }
    });
  } catch(e: any) {
    return new Response(JSON.stringify({ error: e.message, stack: e.stack }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }
});

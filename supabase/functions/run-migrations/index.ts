import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { Pool } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");

    const pool = new Pool(Deno.env.get("SUPABASE_DB_URL") || {
      hostname: "db.ecaduzwautlpzpvjognr.supabase.co",
      port: 5432,
      database: "postgres",
      user: "postgres",
      password: Deno.env.get("POSTGRES_PASSWORD") || "",
    }, 1);

    const client = await pool.connect();
    const results = [];

    const sqls = [
      // eventos_gia
      `CREATE TABLE IF NOT EXISTS public.eventos_gia (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        codigo TEXT,
        associado_id UUID,
        tipo TEXT NOT NULL,
        descricao TEXT,
        placa TEXT,
        arquivos JSONB DEFAULT '[]',
        origem TEXT DEFAULT 'manual',
        status TEXT DEFAULT 'aberto',
        company_id UUID,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      `ALTER TABLE public.eventos_gia ENABLE ROW LEVEL SECURITY`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='eventos_gia' AND policyname='allow_all') THEN CREATE POLICY allow_all ON public.eventos_gia FOR ALL USING (true); END IF; END $$`,

      // prestadores
      `CREATE TABLE IF NOT EXISTS public.prestadores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome TEXT NOT NULL,
        tipo TEXT,
        telefone TEXT,
        cidade TEXT,
        estado TEXT,
        ativo BOOLEAN DEFAULT TRUE,
        company_id UUID,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      `ALTER TABLE public.prestadores ENABLE ROW LEVEL SECURITY`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prestadores' AND policyname='allow_all') THEN CREATE POLICY allow_all ON public.prestadores FOR ALL USING (true); END IF; END $$`,

      // ensure associados has UNIQUE on codigo_sga
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='associados_codigo_sga_key') THEN ALTER TABLE public.associados ADD CONSTRAINT associados_codigo_sga_key UNIQUE (codigo_sga); END IF; EXCEPTION WHEN others THEN NULL; END $$`,
    ];

    for (const sql of sqls) {
      try {
        await client.queryArray(sql);
        results.push({ sql: sql.trim().slice(0, 50), ok: true });
      } catch (e: any) {
        results.push({ sql: sql.trim().slice(0, 50), ok: false, error: e.message });
      }
    }

    client.release();
    await pool.end();

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...cors, "Content-Type": "application/json" }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }
});

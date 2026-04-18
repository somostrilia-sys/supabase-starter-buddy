// Cliente Supabase do Hub Central WhatsApp (CollectPro Supabase)
// Usado APENAS pra operações WhatsApp; o cliente principal do GIA fica em integrations/supabase/client
import { createClient } from "@supabase/supabase-js";

const HUB_URL = "https://ptmttmqprbullvgulyhb.supabase.co";
const HUB_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0bXR0bXFwcmJ1bGx2Z3VseWhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMTMyMzksImV4cCI6MjA4ODU4OTIzOX0.D_wwsIH1zNow7gTwOCVSBalWgt629ZPdKZWl4jL9SNk";

export const supabaseHub = createClient(HUB_URL, HUB_ANON_KEY, {
  auth: {
    persistSession: false,     // não usa auth do Hub (apenas leitura via RLS anon)
    autoRefreshToken: false,
  },
  realtime: { params: { eventsPerSecond: 5 } },
});

export const HUB_FN_URL = `${HUB_URL}/functions/v1`;
export const HUB_ANON = HUB_ANON_KEY;

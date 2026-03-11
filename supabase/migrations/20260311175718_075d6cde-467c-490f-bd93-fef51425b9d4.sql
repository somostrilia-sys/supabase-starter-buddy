
-- Create storage bucket for vehicle documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-documents', 'vehicle-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create vehicle_documents table
CREATE TABLE IF NOT EXISTS public.vehicle_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.veiculos(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Outro',
  nome_arquivo TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  tamanho_bytes BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can read vehicle_documents"
  ON public.vehicle_documents FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage vehicle_documents"
  ON public.vehicle_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Storage RLS: allow authenticated users to upload/read/delete
CREATE POLICY "Auth users can upload vehicle docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vehicle-documents');

CREATE POLICY "Auth users can read vehicle docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'vehicle-documents');

CREATE POLICY "Auth users can delete vehicle docs"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vehicle-documents');

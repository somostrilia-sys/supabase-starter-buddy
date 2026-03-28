-- Fix profiles schema para bater com o código
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Sync user_id com id (são a mesma coisa nesse modelo)
UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;
UPDATE public.profiles SET full_name = nome WHERE full_name IS NULL;

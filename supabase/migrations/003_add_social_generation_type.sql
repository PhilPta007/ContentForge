-- Add 'social' to the generations type constraint
ALTER TABLE public.generations
DROP CONSTRAINT IF EXISTS generations_type_check;

ALTER TABLE public.generations
ADD CONSTRAINT generations_type_check
CHECK (type IN ('mp3', 'video', 'description', 'thumbnail', 'social'));

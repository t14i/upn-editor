-- Add note column to flows table
ALTER TABLE public.flows
ADD COLUMN note TEXT;

-- Grant permissions
GRANT ALL ON TABLE public.flows TO postgres;
GRANT ALL ON TABLE public.flows TO anon;
GRANT ALL ON TABLE public.flows TO authenticated;
GRANT ALL ON TABLE public.flows TO service_role;

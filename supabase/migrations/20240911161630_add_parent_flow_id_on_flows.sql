-- Add parent_flow_id column to flows table
ALTER TABLE public.flows
ADD COLUMN parent_flow_id UUID;

-- Add foreign key constraint
ALTER TABLE public.flows
ADD CONSTRAINT fk_parent_flow
FOREIGN KEY (parent_flow_id)
REFERENCES public.flows(id)
ON DELETE SET NULL;

-- Add index on parent_flow_id for better query performance
CREATE INDEX idx_parent_flow_id ON public.flows(parent_flow_id);

-- Grant permissions
GRANT ALL ON TABLE public.flows TO postgres;
GRANT ALL ON TABLE public.flows TO anon;
GRANT ALL ON TABLE public.flows TO authenticated;
GRANT ALL ON TABLE public.flows TO service_role;

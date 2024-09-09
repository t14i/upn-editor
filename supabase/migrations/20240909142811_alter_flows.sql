-- This script was generated by the Schema Diff utility in pgAdmin 4
-- For the circular dependencies, the order in which Schema Diff writes the objects is not very sophisticated
-- and may require manual changes to the script to ensure changes are applied in the correct order.
-- Please report an issue for any failure with the reproduction steps.

-- Enable uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Alter the id column to use UUID
ALTER TABLE public.flows
    ALTER COLUMN id DROP DEFAULT,
    ALTER COLUMN id SET DATA TYPE uuid USING (uuid_generate_v4()),
    ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Add the name column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flows' AND column_name = 'name') THEN
        ALTER TABLE public.flows ADD COLUMN name text NOT NULL DEFAULT '';
    END IF;
END $$;

-- Update existing rows to set a default name if the column was just added
UPDATE public.flows SET name = 'Untitled Flow ' || id::text WHERE name = '';

-- Add a NOT NULL constraint to the name column
ALTER TABLE public.flows ALTER COLUMN name SET NOT NULL;

-- Ensure the primary key is set on the id column
ALTER TABLE public.flows DROP CONSTRAINT IF EXISTS flows_pkey;
ALTER TABLE public.flows ADD CONSTRAINT flows_pkey PRIMARY KEY (id);

-- Set the owner of the table
ALTER TABLE public.flows OWNER TO postgres;

-- Grant necessary permissions
GRANT ALL ON TABLE public.flows TO anon;
GRANT ALL ON TABLE public.flows TO authenticated;
GRANT ALL ON TABLE public.flows TO service_role;
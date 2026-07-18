-- Fix: Allow authenticated users to read symbols
CREATE POLICY "Symbols are readable by everyone"
ON symbols FOR SELECT
USING (true);

GRANT SELECT ON TABLE symbols TO authenticated;
GRANT SELECT ON TABLE symbols TO anon;
GRANT ALL ON TABLE symbols TO service_role;

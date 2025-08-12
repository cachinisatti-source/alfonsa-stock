-- Agregar columna branch a las tablas existentes
ALTER TABLE stock_controls ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'betbeder';
ALTER TABLE stock_controls ALTER COLUMN branch SET NOT NULL;

-- Crear índice para mejorar rendimiento por sucursal
CREATE INDEX IF NOT EXISTS idx_stock_controls_branch ON stock_controls(branch);
CREATE INDEX IF NOT EXISTS idx_stock_controls_branch_created_at ON stock_controls(branch, created_at DESC);

-- Actualizar políticas de seguridad para incluir filtro por sucursal
DROP POLICY IF EXISTS "Allow all operations" ON stock_controls;
DROP POLICY IF EXISTS "Allow all operations" ON stock_items;

-- Crear nuevas políticas que permiten acceso a todos pero con mejor organización
CREATE POLICY "Allow all operations by branch" ON stock_controls FOR ALL USING (true);
CREATE POLICY "Allow all operations on items" ON stock_items FOR ALL USING (true);

-- Insertar datos de prueba para cada sucursal
INSERT INTO stock_controls (name, created_by, branch) VALUES 
('Control de Prueba - Betbeder', 'Sistema', 'betbeder'),
('Control de Prueba - Iseas', 'Sistema', 'iseas'),
('Control de Prueba - Llerena', 'Sistema', 'llerena')
ON CONFLICT DO NOTHING;

-- Comentario informativo
COMMENT ON COLUMN stock_controls.branch IS 'Sucursal: betbeder, iseas, o llerena';

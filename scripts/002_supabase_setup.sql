-- Crear tabla para controles de stock
CREATE TABLE stock_controls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para items de stock
CREATE TABLE stock_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    control_id UUID REFERENCES stock_controls(id) ON DELETE CASCADE,
    codigo TEXT NOT NULL,
    denominacion TEXT NOT NULL,
    stock_sistema INTEGER DEFAULT 0,
    user1_value INTEGER,
    user2_value INTEGER,
    corregido INTEGER,
    resultado INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_stock_items_control_id ON stock_items(control_id);
CREATE INDEX idx_stock_controls_created_at ON stock_controls(created_at DESC);

-- Habilitar Row Level Security
ALTER TABLE stock_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad (permitir acceso a todos)
CREATE POLICY "Allow all operations" ON stock_controls FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON stock_items FOR ALL USING (true);

-- Insertar datos de prueba (opcional)
INSERT INTO stock_controls (name, created_by) VALUES 
('Control de Prueba', 'Sistema');

INSERT INTO stock_items (control_id, codigo, denominacion, stock_sistema) 
SELECT id, '001', 'Producto de Prueba', 10 
FROM stock_controls 
WHERE name = 'Control de Prueba';

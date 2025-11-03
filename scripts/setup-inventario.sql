-- Tabla de inventario para South Sensor Cams
-- Ejecuta este SQL en tu panel de Supabase (SQL Editor)

CREATE TABLE IF NOT EXISTS inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('camara', 'accesorio', 'equipo', 'otro')),
  cantidad INTEGER NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  precio_compra DECIMAL(10, 2) CHECK (precio_compra >= 0),
  estado TEXT NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible', 'rentado', 'mantenimiento', 'vendido')),
  descripcion TEXT,
  numero_serie TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_inventario_categoria ON inventario(categoria);
CREATE INDEX IF NOT EXISTS idx_inventario_estado ON inventario(estado);
CREATE INDEX IF NOT EXISTS idx_inventario_created_at ON inventario(created_at DESC);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventario_updated_at BEFORE UPDATE ON inventario
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios autenticados pueden ver todos los items
CREATE POLICY "Usuarios autenticados pueden leer inventario"
ON inventario FOR SELECT
TO authenticated
USING (true);

-- Policy: Los usuarios autenticados pueden insertar items
CREATE POLICY "Usuarios autenticados pueden insertar inventario"
ON inventario FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Los usuarios autenticados pueden actualizar items
CREATE POLICY "Usuarios autenticados pueden actualizar inventario"
ON inventario FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Los usuarios autenticados pueden eliminar items
CREATE POLICY "Usuarios autenticados pueden eliminar inventario"
ON inventario FOR DELETE
TO authenticated
USING (true);

-- Datos de ejemplo (opcional)
INSERT INTO inventario (nombre, categoria, cantidad, precio_compra, estado, descripcion, numero_serie) VALUES
  ('Canon EOS R5', 'camara', 2, 3500.00, 'disponible', 'Cámara mirrorless full-frame 45MP', 'CN123456789'),
  ('Sony A7 III', 'camara', 1, 2000.00, 'rentado', 'Cámara mirrorless full-frame 24MP', 'SN987654321'),
  ('Trípode Manfrotto', 'accesorio', 5, 150.00, 'disponible', 'Trípode de carbono profesional', NULL),
  ('Batería extra Canon', 'accesorio', 8, 50.00, 'disponible', 'Batería LP-E6NH original', NULL),
  ('Estuche pelican', 'equipo', 3, 200.00, 'disponible', 'Estuche resistente para transporte', NULL);

-- ==============================================================================
-- HeatShield AI — Production Supabase PostgreSQL Schema Migration
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'pedestrian'
    CHECK (role IN ('pedestrian', 'planner', 'enterprise', 'judge')),
  preferred_temp_unit TEXT NOT NULL DEFAULT 'celsius'
    CHECK (preferred_temp_unit IN ('celsius', 'fahrenheit')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Saved Locations Table
CREATE TABLE IF NOT EXISTS public.saved_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  location_name TEXT NOT NULL,
  address TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  alert_threshold_celsius NUMERIC(4,2),
  is_alert_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_saved_locations_user_id ON public.saved_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_locations_coords ON public.saved_locations(latitude, longitude);

-- 3. Simulation Logs Table
CREATE TABLE IF NOT EXISTS public.simulation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  scenario_name TEXT NOT NULL,
  location_name TEXT NOT NULL,
  bounding_box JSONB NOT NULL,
  baseline_temp_celsius NUMERIC(4,2) NOT NULL,
  baseline_heat_risk_score INTEGER NOT NULL CHECK (baseline_heat_risk_score BETWEEN 0 AND 100),
  
  canopy_coverage_pct NUMERIC(4,2) NOT NULL DEFAULT 0.00,
  cool_pavement_albedo NUMERIC(3,2) NOT NULL DEFAULT 0.15,
  solar_canopy_coverage_pct NUMERIC(4,2) NOT NULL DEFAULT 0.00,
  shade_structure_pct NUMERIC(4,2) NOT NULL DEFAULT 0.00,
  
  simulated_temp_reduction NUMERIC(4,2) NOT NULL,
  simulated_heat_risk_score INTEGER NOT NULL CHECK (simulated_heat_risk_score BETWEEN 0 AND 100),
  estimated_cooling_radius_meters INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_simulation_logs_user_id ON public.simulation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_simulation_logs_created_at ON public.simulation_logs(created_at DESC);

-- 4. Cached Heat Cells Table
CREATE TABLE IF NOT EXISTS public.cached_heat_cells (
  cell_id TEXT PRIMARY KEY,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  surface_temp_celsius NUMERIC(4,2) NOT NULL,
  ambient_temp_celsius NUMERIC(4,2) NOT NULL,
  heat_risk_score INTEGER NOT NULL CHECK (heat_risk_score BETWEEN 0 AND 100),
  source TEXT NOT NULL DEFAULT 'fortyguard_api',
  data_timestamp TIMESTAMPTZ NOT NULL,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_cached_heat_cells_coords ON public.cached_heat_cells(latitude, longitude);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cached_heat_cells ENABLE ROW LEVEL SECURITY;

-- Setup RLS Policies
DROP POLICY IF EXISTS "Public Read Access for Heat Cache" ON public.cached_heat_cells;
CREATE POLICY "Public Read Access for Heat Cache"
  ON public.cached_heat_cells FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public Read Access for Simulations" ON public.simulation_logs;
CREATE POLICY "Public Read Access for Simulations"
  ON public.simulation_logs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users Manage Own Profiles" ON public.profiles;
CREATE POLICY "Users Manage Own Profiles"
  ON public.profiles FOR ALL
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users Manage Own Saved Locations" ON public.saved_locations;
CREATE POLICY "Users Manage Own Saved Locations"
  ON public.saved_locations FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users Insert Own Simulations" ON public.simulation_logs;
CREATE POLICY "Users Insert Own Simulations"
  ON public.simulation_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

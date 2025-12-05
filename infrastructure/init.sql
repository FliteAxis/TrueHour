-- TrueHour PostgreSQL Schema
-- This schema is automatically applied when the database container starts for the first time

-- Aircraft (imported from ForeFlight + manual additions)
CREATE TABLE aircraft (
    id SERIAL PRIMARY KEY,
    tail_number TEXT UNIQUE NOT NULL,
    type_code TEXT,
    year INTEGER,
    make TEXT,
    model TEXT,
    gear_type TEXT,
    engine_type TEXT,
    aircraft_class TEXT,
    is_complex BOOLEAN DEFAULT false,
    is_taa BOOLEAN DEFAULT false,
    is_high_performance BOOLEAN DEFAULT false,
    is_simulator BOOLEAN DEFAULT false,
    category TEXT,  -- 'owned', 'club', 'rental'
    hourly_rate_wet DECIMAL(10,2),
    hourly_rate_dry DECIMAL(10,2),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flights (imported from ForeFlight)
CREATE TABLE flights (
    id SERIAL PRIMARY KEY,
    aircraft_id INTEGER REFERENCES aircraft(id),
    date DATE NOT NULL,
    departure_airport TEXT,
    arrival_airport TEXT,
    route TEXT,

    -- Times
    time_out TIME,
    time_off TIME,
    time_on TIME,
    time_in TIME,

    -- Hours (decimal)
    total_time DECIMAL(5,2),
    pic_time DECIMAL(5,2),
    sic_time DECIMAL(5,2),
    night_time DECIMAL(5,2),
    solo_time DECIMAL(5,2),
    cross_country_time DECIMAL(5,2),
    actual_instrument_time DECIMAL(5,2),
    simulated_instrument_time DECIMAL(5,2),  -- Hood time in REAL aircraft
    simulated_flight_time DECIMAL(5,2),      -- Time in SIMULATOR DEVICE
    dual_given_time DECIMAL(5,2),
    dual_received_time DECIMAL(5,2),
    ground_training_time DECIMAL(5,2),
    complex_time DECIMAL(5,2),
    high_performance_time DECIMAL(5,2),

    -- Hobbs/Tach
    hobbs_start DECIMAL(8,2),
    hobbs_end DECIMAL(8,2),
    tach_start DECIMAL(8,2),
    tach_end DECIMAL(8,2),

    -- Landings
    day_takeoffs INTEGER DEFAULT 0,
    day_landings_full_stop INTEGER DEFAULT 0,
    night_takeoffs INTEGER DEFAULT 0,
    night_landings_full_stop INTEGER DEFAULT 0,
    all_landings INTEGER DEFAULT 0,

    -- Approaches
    holds INTEGER DEFAULT 0,
    approaches JSONB,  -- Array of approach objects

    -- People and notes
    instructor_name TEXT,
    instructor_comments TEXT,
    pilot_comments TEXT,

    -- Flags
    is_flight_review BOOLEAN DEFAULT false,
    is_ipc BOOLEAN DEFAULT false,
    is_checkride BOOLEAN DEFAULT false,
    is_simulator_session BOOLEAN DEFAULT false,

    -- Costs (TrueHour-specific)
    fuel_gallons DECIMAL(6,2),
    fuel_cost DECIMAL(10,2),
    landing_fees DECIMAL(10,2),
    instructor_cost DECIMAL(10,2),
    rental_cost DECIMAL(10,2),
    other_costs DECIMAL(10,2),

    -- Import tracking
    import_hash TEXT,  -- For deduplication

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses (subscriptions, insurance, etc.)
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    aircraft_id INTEGER REFERENCES aircraft(id),
    category TEXT NOT NULL,
    subcategory TEXT,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_interval TEXT,  -- 'monthly', 'quarterly', 'annual'
    recurrence_end_date DATE,
    vendor TEXT,
    is_tax_deductible BOOLEAN DEFAULT false,
    tax_category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budgets
CREATE TABLE budgets (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    budget_type TEXT NOT NULL,  -- 'monthly', 'annual', 'goal'
    amount DECIMAL(10,2) NOT NULL,
    start_date DATE,
    end_date DATE,
    categories JSONB,  -- Array of expense categories
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget entries (manual Ally Bank replacement)
CREATE TABLE budget_entries (
    id SERIAL PRIMARY KEY,
    budget_id INTEGER REFERENCES budgets(id) ON DELETE CASCADE,
    month DATE NOT NULL,  -- First of month: '2025-01-01'
    allocated_amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(budget_id, month)
);

-- Reminders
CREATE TABLE reminders (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    due_date DATE NOT NULL,
    advance_notice_days INTEGER DEFAULT 30,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_interval TEXT,
    last_notified_at TIMESTAMPTZ,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat history (for Claude context)
CREATE TABLE chat_history (
    id SERIAL PRIMARY KEY,
    role TEXT NOT NULL,  -- 'user', 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings (Phase 3: auto-save preferences, default aircraft, timezone)
CREATE TABLE user_settings (
    id SERIAL PRIMARY KEY,
    auto_save_enabled BOOLEAN DEFAULT true,
    auto_save_interval INTEGER DEFAULT 3000,  -- milliseconds
    default_aircraft_id INTEGER REFERENCES aircraft(id) ON DELETE SET NULL,
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    budget_state JSONB,  -- Phase 3: certification goal, current hours, training settings
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions (Phase 3: session tracking and last saved timestamp)
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    last_saved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_flights_date ON flights(date DESC);
CREATE INDEX idx_flights_aircraft ON flights(aircraft_id);
CREATE INDEX idx_expenses_date ON expenses(date DESC);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_reminders_due ON reminders(due_date) WHERE is_completed = false;
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);

-- Comments for documentation
COMMENT ON TABLE aircraft IS 'User aircraft list - can include owned, club, and rental aircraft';
COMMENT ON TABLE flights IS 'Flight log entries imported from ForeFlight or entered manually';
COMMENT ON TABLE expenses IS 'Aviation-related expenses including subscriptions, insurance, maintenance, etc.';
COMMENT ON TABLE budgets IS 'Budget definitions for tracking aviation spending';
COMMENT ON TABLE budget_entries IS 'Monthly budget allocations - replaces Ally Bank envelope system';
COMMENT ON TABLE reminders IS 'Reminders for medicals, flight reviews, currency, etc.';
COMMENT ON TABLE chat_history IS 'Chat conversation history with Claude AI for context persistence';
COMMENT ON TABLE user_settings IS 'User preferences including auto-save settings and default aircraft';
COMMENT ON TABLE user_sessions IS 'Session tracking for auto-save and data persistence';

COMMENT ON COLUMN flights.simulated_instrument_time IS 'Hood/foggles time in REAL aircraft';
COMMENT ON COLUMN flights.simulated_flight_time IS 'Time in simulator device (AATD/BATD) - NOT flight time';
COMMENT ON COLUMN aircraft.is_simulator IS 'TRUE if this is a simulator device, not an actual aircraft';

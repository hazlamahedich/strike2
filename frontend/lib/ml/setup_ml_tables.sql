-- ML Models Table
CREATE TABLE IF NOT EXISTS public.ml_models (
    id UUID PRIMARY KEY,
    version VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metrics JSONB DEFAULT '{}'::jsonb,
    feature_importance JSONB DEFAULT '[]'::jsonb
);

-- ML Predictions Table
CREATE TABLE IF NOT EXISTS public.ml_predictions (
    prediction_id UUID PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    conversion_probability DOUBLE PRECISION NOT NULL,
    expected_conversion_time INTEGER,
    score_factors JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    confidence DOUBLE PRECISION,
    model_id UUID REFERENCES public.ml_models(id),
    model_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ML Training Jobs Table
CREATE TABLE IF NOT EXISTS public.ml_training_jobs (
    job_id UUID PRIMARY KEY,
    status VARCHAR(20) NOT NULL,
    progress INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error TEXT,
    model_id UUID REFERENCES public.ml_models(id)
);

-- ML Lead Features Table
CREATE TABLE IF NOT EXISTS public.ml_lead_features (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    features JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(lead_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ml_predictions_lead_id ON public.ml_predictions(lead_id);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_model_id ON public.ml_predictions(model_id);
CREATE INDEX IF NOT EXISTS idx_ml_training_jobs_model_id ON public.ml_training_jobs(model_id);
CREATE INDEX IF NOT EXISTS idx_ml_lead_features_lead_id ON public.ml_lead_features(lead_id);

-- Enable Row Level Security
ALTER TABLE public.ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_training_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_lead_features ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- ML Models: Only admins can create/delete, everyone can view
CREATE POLICY "Admins can manage ML models" ON public.ml_models
    USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'))
    WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY "Everyone can view ML models" ON public.ml_models
    FOR SELECT USING (true);

-- ML Predictions: Users can see predictions for leads they have access to
CREATE POLICY "Users can view predictions for their leads" ON public.ml_predictions
    FOR SELECT USING (
        lead_id IN (
            SELECT id FROM public.leads
            WHERE (
                -- Admin can see all leads
                auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
                -- Manager can see leads in their team
                OR (auth.uid() IN (SELECT id FROM public.users WHERE role = 'manager') 
                    AND EXISTS (
                        SELECT 1 FROM public.leads l
                        JOIN public.users u ON l.owner_id = u.id
                        WHERE l.id = lead_id AND u.team_id = (SELECT team_id FROM public.users WHERE id = auth.uid())
                    )
                )
                -- Users can see their own leads
                OR owner_id = auth.uid()
            )
        )
    );

-- ML Training Jobs: Only admins can create/manage, everyone can view
CREATE POLICY "Admins can manage training jobs" ON public.ml_training_jobs
    USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'))
    WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY "Everyone can view training jobs" ON public.ml_training_jobs
    FOR SELECT USING (true);

-- ML Lead Features: Users can see features for leads they have access to
CREATE POLICY "Users can view features for their leads" ON public.ml_lead_features
    FOR SELECT USING (
        lead_id IN (
            SELECT id FROM public.leads
            WHERE (
                -- Admin can see all leads
                auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
                -- Manager can see leads in their team
                OR (auth.uid() IN (SELECT id FROM public.users WHERE role = 'manager') 
                    AND EXISTS (
                        SELECT 1 FROM public.leads l
                        JOIN public.users u ON l.owner_id = u.id
                        WHERE l.id = lead_id AND u.team_id = (SELECT team_id FROM public.users WHERE id = auth.uid())
                    )
                )
                -- Users can see their own leads
                OR owner_id = auth.uid()
            )
        )
    );

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update the updated_at column
CREATE TRIGGER update_ml_models_updated_at
BEFORE UPDATE ON public.ml_models
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ml_lead_features_updated_at
BEFORE UPDATE ON public.ml_lead_features
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
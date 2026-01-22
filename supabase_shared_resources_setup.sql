-- ==========================================================
-- 📁 SHARED RESOURCES TABLE SETUP
-- Run this in Supabase SQL Editor
-- ==========================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================================
-- 1. CREATE TABLE
-- ==========================================================

CREATE TABLE IF NOT EXISTS shared_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Basic Info
    title TEXT NOT NULL,
    description TEXT,
    
    -- File details
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT,
    file_type TEXT,
    mime_type TEXT,
    
    -- Categorization
    resource_type TEXT NOT NULL CHECK (resource_type IN 
        ('guide', 'checklist', 'schedule', 'template', 'ebook', 'infographic', 'worksheet', 'other')),
    category TEXT NOT NULL,
    subcategory TEXT,
    age_group TEXT CHECK (age_group IN ('newborn', '0-3months', '3-6months', '6-12months', '1-2years', 'all')) DEFAULT 'all',
    tags JSONB DEFAULT '[]'::jsonb,
    
    -- Engagement
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    rating_average NUMERIC(3,2),
    rating_count INTEGER DEFAULT 0,
    
    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES profiles(id),
    verified_at TIMESTAMPTZ,
    
    -- Access control
    is_public BOOLEAN DEFAULT TRUE,
    is_premium BOOLEAN DEFAULT FALSE,
    
    -- Moderation
    is_flagged BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- 2. CREATE INDEXES
-- ==========================================================

CREATE INDEX IF NOT EXISTS idx_resources_uploader ON shared_resources(uploader_id);
CREATE INDEX IF NOT EXISTS idx_resources_type_category ON shared_resources(resource_type, category);
CREATE INDEX IF NOT EXISTS idx_resources_downloads ON shared_resources(download_count DESC);
CREATE INDEX IF NOT EXISTS idx_resources_rating ON shared_resources(rating_average DESC) WHERE rating_count > 0;
CREATE INDEX IF NOT EXISTS idx_resources_verified ON shared_resources(is_verified) WHERE is_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_resources_active_public ON shared_resources(is_active, is_public) WHERE is_active = TRUE AND is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON shared_resources(created_at DESC);

-- ==========================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================================

ALTER TABLE shared_resources ENABLE ROW LEVEL SECURITY;

-- ==========================================================
-- 4. CREATE RLS POLICIES
-- ==========================================================

-- Policy: Anyone can view public, active resources
CREATE POLICY "Anyone can view public active resources" ON shared_resources
    FOR SELECT 
    USING (is_public = TRUE AND is_active = TRUE);

-- Policy: Authenticated users can create resources
CREATE POLICY "Authenticated users can create resources" ON shared_resources
    FOR INSERT 
    WITH CHECK (auth.uid() = uploader_id);

-- Policy: Users can update their own resources
CREATE POLICY "Users can update own resources" ON shared_resources
    FOR UPDATE 
    USING (auth.uid() = uploader_id)
    WITH CHECK (auth.uid() = uploader_id);

-- Policy: Users can delete (soft delete) their own resources
CREATE POLICY "Users can delete own resources" ON shared_resources
    FOR UPDATE 
    USING (auth.uid() = uploader_id)
    WITH CHECK (auth.uid() = uploader_id);

-- Policy: Users can view their own resources (even if not public)
CREATE POLICY "Users can view own resources" ON shared_resources
    FOR SELECT 
    USING (auth.uid() = uploader_id);

-- ==========================================================
-- 5. CREATE TRIGGER FOR updated_at
-- ==========================================================

-- Create function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for shared_resources
DROP TRIGGER IF EXISTS update_shared_resources_updated_at ON shared_resources;
CREATE TRIGGER update_shared_resources_updated_at 
    BEFORE UPDATE ON shared_resources
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================
-- 6. CREATE STORAGE BUCKET (Optional - for file uploads)
-- ==========================================================

-- Note: Storage buckets are created via Supabase Dashboard or API
-- This is a reference for the bucket name to use: 'shared-resources'
-- 
-- To create via SQL (if you have storage admin access):
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--     'shared-resources',
--     'shared-resources',
--     true,
--     10485760, -- 10MB in bytes
--     ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'text/plain']
-- );

-- ==========================================================
-- 7. STORAGE POLICIES (if using Supabase Storage)
-- ==========================================================

-- Policy: Anyone can view files in shared-resources bucket
-- CREATE POLICY "Anyone can view shared resources" ON storage.objects
--     FOR SELECT 
--     USING (bucket_id = 'shared-resources');

-- Policy: Authenticated users can upload files
-- CREATE POLICY "Authenticated users can upload resources" ON storage.objects
--     FOR INSERT 
--     WITH CHECK (bucket_id = 'shared-resources' AND auth.role() = 'authenticated');

-- Policy: Users can update their own uploaded files
-- CREATE POLICY "Users can update own resources" ON storage.objects
--     FOR UPDATE 
--     USING (bucket_id = 'shared-resources' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Users can delete their own uploaded files
-- CREATE POLICY "Users can delete own resources" ON storage.objects
--     FOR DELETE 
--     USING (bucket_id = 'shared-resources' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ==========================================================
-- VERIFICATION QUERIES (Optional - to test)
-- ==========================================================

-- Check if table exists
-- SELECT EXISTS (
--     SELECT FROM information_schema.tables 
--     WHERE table_schema = 'public' 
--     AND table_name = 'shared_resources'
-- );

-- Check indexes
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'shared_resources';

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'shared_resources';

-- ==========================================================
-- DONE! ✅
-- ==========================================================
-- 
-- Next steps:
-- 1. Create the storage bucket 'shared-resources' via Supabase Dashboard
--    (Settings > Storage > New Bucket)
-- 2. Set bucket to public
-- 3. Configure CORS if needed
-- 4. Test the API endpoints
-- ==========================================================



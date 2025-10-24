-- ==========================================================
-- 🌸 MamtaAI Database Schema (Supabase) - PRODUCTION READY
-- Highly Scalable • Future-Proof • Multi-Parent Support
-- ==========================================================

-- 🔌 Enable Postgres Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Fuzzy text search
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- Query performance monitoring
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- Additional encryption functions

-- ==========================================================
-- 1️⃣ USER PROFILES (Extended from auth.users)
-- ==========================================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'parent' CHECK (role IN ('parent', 'expert', 'admin')),
    is_verified BOOLEAN DEFAULT FALSE,
    verification_data JSONB,  -- For expert verification documents
    timezone TEXT DEFAULT 'UTC',
    language_preference TEXT DEFAULT 'en',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    last_active_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,  -- Extensible for future fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role) WHERE role != 'parent';
CREATE INDEX idx_profiles_verified ON profiles(is_verified) WHERE is_verified = TRUE;
CREATE INDEX idx_profiles_last_active ON profiles(last_active_at DESC);

-- ==========================================================
-- 2️⃣ BABY PROFILES (Core Entity)
-- ==========================================================

CREATE TABLE babies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    birth_date DATE NOT NULL,
    birth_weight_kg NUMERIC(5,2),
    birth_height_cm NUMERIC(5,2),
    blood_type TEXT,
    avatar_url TEXT,
    medical_notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,  -- For soft deletion
    metadata JSONB DEFAULT '{}'::jsonb,  -- Future extensibility
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_babies_birth_date ON babies(birth_date);
CREATE INDEX idx_babies_active ON babies(is_active) WHERE is_active = TRUE;

-- ==========================================================
-- 3️⃣ BABY ↔ PARENT RELATIONSHIPS (Multi-Parent Support)
-- ==========================================================

CREATE TABLE baby_parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    relationship TEXT DEFAULT 'parent' CHECK (relationship IN 
        ('mother', 'father', 'guardian', 'caregiver', 'grandparent', 'other')),
    is_primary BOOLEAN DEFAULT FALSE,
    access_level TEXT DEFAULT 'full' CHECK (access_level IN ('full', 'read_only', 'limited')),
    can_edit_profile BOOLEAN DEFAULT TRUE,
    can_record_audio BOOLEAN DEFAULT TRUE,
    can_view_history BOOLEAN DEFAULT TRUE,
    invited_by UUID REFERENCES profiles(id),
    invitation_status TEXT DEFAULT 'accepted' CHECK (invitation_status IN 
        ('pending', 'accepted', 'declined', 'revoked')),
    invited_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (baby_id, parent_id)
);

CREATE INDEX idx_baby_parents_baby ON baby_parents(baby_id);
CREATE INDEX idx_baby_parents_parent ON baby_parents(parent_id);
CREATE INDEX idx_baby_parents_primary ON baby_parents(baby_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_baby_parents_invitation ON baby_parents(invitation_status) WHERE invitation_status = 'pending';

-- ==========================================================
-- 4️⃣ MEDICAL HISTORY & HEALTH RECORDS
-- ==========================================================

CREATE TABLE baby_medical_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
    condition_type TEXT NOT NULL CHECK (condition_type IN 
        ('allergy', 'chronic_condition', 'past_illness', 'surgery', 'medication', 'vaccination', 'other')),
    condition_name TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
    diagnosis_date DATE,
    resolved_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    prescribed_by TEXT,  -- Doctor's name
    notes TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,  -- Links to medical documents
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_medical_baby ON baby_medical_conditions(baby_id);
CREATE INDEX idx_medical_active ON baby_medical_conditions(baby_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_medical_type ON baby_medical_conditions(condition_type);

-- ==========================================================
-- 5️⃣ DAILY ACTIVITY TRACKING
-- ==========================================================

CREATE TABLE baby_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
    recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN 
        ('feeding', 'sleep', 'diaper_change', 'play', 'bath', 'medicine', 'milestone', 'other')),
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (ended_at - started_at)) / 60
    ) STORED,
    
    -- Feeding specific fields
    feeding_type TEXT CHECK (feeding_type IN ('breast_left', 'breast_right', 'breast_both', 'bottle', 'solid')),
    amount_ml NUMERIC(6,2),
    food_type TEXT,
    
    -- Sleep specific fields
    sleep_quality TEXT CHECK (sleep_quality IN ('deep', 'light', 'restless', 'interrupted')),
    wake_count INTEGER,
    
    -- Diaper specific fields
    diaper_type TEXT CHECK (diaper_type IN ('wet', 'dirty', 'both', 'dry')),
    
    -- Medicine specific fields
    medicine_name TEXT,
    dosage TEXT,
    
    -- Milestone specific fields
    milestone_category TEXT CHECK (milestone_category IN 
        ('motor', 'cognitive', 'social', 'language', 'other')),
    milestone_description TEXT,
    
    notes TEXT,
    location TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    attachments JSONB DEFAULT '[]'::jsonb,  -- Photos/videos
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_baby_time ON baby_activities(baby_id, started_at DESC);
CREATE INDEX idx_activities_type ON baby_activities(activity_type, started_at DESC);
CREATE INDEX idx_activities_recorded_by ON baby_activities(recorded_by);

-- ==========================================================
-- 6️⃣ AUDIO RECORDINGS (Core AI Feature)
-- ==========================================================

CREATE TABLE recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
    recorded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- File information
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    file_format TEXT CHECK (file_format IN ('wav', 'mp3', 'aac', 'm4a', 'ogg')),
    duration_seconds NUMERIC(8,2) NOT NULL,
    sample_rate INTEGER,
    bit_rate INTEGER,
    
    -- Recording metadata
    source TEXT NOT NULL CHECK (source IN ('live', 'uploaded')),
    device_type TEXT,  -- iOS, Android, Web
    noise_reduced BOOLEAN DEFAULT FALSE,
    quality_score NUMERIC(3,2),  -- 0-1 audio quality assessment
    
    -- Context information
    recorded_at TIMESTAMPTZ NOT NULL,
    baby_age_months INTEGER,  -- Calculated at recording time
    location TEXT,
    environment_noise_level TEXT CHECK (environment_noise_level IN ('quiet', 'moderate', 'noisy')),
    
    -- Processing status
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN 
        ('pending', 'processing', 'completed', 'failed', 'archived')),
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    processing_error TEXT,
    
    -- Flags
    is_training_data BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    
    tags JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recordings_baby_recorded ON recordings(baby_id, recorded_at DESC);
CREATE INDEX idx_recordings_status ON recordings(processing_status);
CREATE INDEX idx_recordings_training ON recordings(is_training_data) WHERE is_training_data = TRUE;
CREATE INDEX idx_recordings_recorded_by ON recordings(recorded_by);

-- ==========================================================
-- 7️⃣ EXTRACTED FEATURES (ML Pipeline)
-- ==========================================================

CREATE TABLE extracted_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
    
    -- Audio features
    mfcc_coefficients JSONB,  -- Mel-frequency cepstral coefficients
    spectrogram_url TEXT,
    mel_spectrogram_url TEXT,
    chromagram_url TEXT,
    
    -- Statistical features
    pitch_hz_mean NUMERIC(8,2),
    pitch_hz_std NUMERIC(8,2),
    pitch_hz_min NUMERIC(8,2),
    pitch_hz_max NUMERIC(8,2),
    
    intensity_db_mean NUMERIC(6,2),
    intensity_db_std NUMERIC(6,2),
    
    zero_crossing_rate NUMERIC(6,4),
    spectral_centroid NUMERIC(8,2),
    spectral_rolloff NUMERIC(8,2),
    spectral_bandwidth NUMERIC(8,2),
    
    -- Temporal features
    duration_ms INTEGER,
    pause_count INTEGER,
    cry_burst_count INTEGER,
    
    -- Frequency domain
    dominant_frequency_hz NUMERIC(8,2),
    frequency_range JSONB,  -- {min, max, bands[]}
    
    -- Energy features
    energy_total NUMERIC(10,4),
    energy_distribution JSONB,
    
    -- Advanced features
    formants JSONB,  -- Speech formants if applicable
    harmonics JSONB,
    
    extraction_method TEXT,
    extraction_version TEXT,
    extraction_time_ms INTEGER,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_features_recording ON extracted_features(recording_id);
CREATE INDEX idx_features_pitch ON extracted_features(pitch_hz_mean);

-- ==========================================================
-- 8️⃣ CRY PREDICTIONS (AI Classification Results)
-- ==========================================================

CREATE TABLE cry_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
    
    -- Primary prediction
    predicted_cry_type TEXT NOT NULL CHECK (predicted_cry_type IN 
        ('hunger', 'sleepy', 'pain', 'discomfort', 'colic', 'teething', 
         'scared', 'attention', 'overstimulated', 'cold', 'hot', 'unknown')),
    confidence_score NUMERIC(5,4) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Alternative predictions
    secondary_predictions JSONB DEFAULT '[]'::jsonb,  -- [{type, confidence}]
    all_class_probabilities JSONB,  -- Full probability distribution
    
    -- Urgency assessment
    urgency_level TEXT NOT NULL CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
    urgency_score NUMERIC(5,4),
    requires_immediate_attention BOOLEAN DEFAULT FALSE,
    
    -- Suggestions
    suggested_actions JSONB DEFAULT '[]'::jsonb,
    medical_red_flags JSONB DEFAULT '[]'::jsonb,
    
    -- Model information
    model_name TEXT NOT NULL,
    model_version TEXT NOT NULL,
    model_confidence_threshold NUMERIC(5,4),
    
    -- Processing metrics
    inference_time_ms INTEGER,
    preprocessing_time_ms INTEGER,
    total_processing_time_ms INTEGER,
    
    -- Contextual factors
    baby_age_months INTEGER,
    time_since_last_feeding_minutes INTEGER,
    time_since_last_sleep_minutes INTEGER,
    
    -- Validation
    is_validated BOOLEAN DEFAULT FALSE,
    validated_by UUID REFERENCES profiles(id),
    validated_at TIMESTAMPTZ,
    validation_result TEXT CHECK (validation_result IN ('correct', 'incorrect', 'partially_correct')),
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_predictions_recording ON cry_predictions(recording_id);
CREATE INDEX idx_predictions_type ON cry_predictions(predicted_cry_type);
CREATE INDEX idx_predictions_confidence ON cry_predictions(confidence_score DESC);
CREATE INDEX idx_predictions_urgency ON cry_predictions(urgency_level) WHERE urgency_level IN ('high', 'critical');
CREATE INDEX idx_predictions_validation ON cry_predictions(is_validated);

-- ==========================================================
-- 9️⃣ USER FEEDBACK & CONTINUOUS LEARNING
-- ==========================================================

CREATE TABLE prediction_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id UUID NOT NULL REFERENCES cry_predictions(id) ON DELETE CASCADE,
    recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Feedback details
    is_correct BOOLEAN NOT NULL,
    actual_cry_type TEXT CHECK (actual_cry_type IN 
        ('hunger', 'sleepy', 'pain', 'discomfort', 'colic', 'teething', 
         'scared', 'attention', 'overstimulated', 'cold', 'hot', 'unknown', 'custom')),
    custom_label TEXT,
    
    -- Rating
    prediction_quality_rating INTEGER CHECK (prediction_quality_rating BETWEEN 1 AND 5),
    suggestion_helpfulness_rating INTEGER CHECK (suggestion_helpfulness_rating BETWEEN 1 AND 5),
    
    -- User comments
    comments TEXT,
    what_actually_helped TEXT,
    
    -- Feedback context
    feedback_delay_minutes INTEGER,  -- Time between prediction and feedback
    parent_confidence_level TEXT CHECK (parent_confidence_level IN ('low', 'medium', 'high')),
    
    -- For model retraining
    use_for_training BOOLEAN DEFAULT TRUE,
    training_weight NUMERIC(3,2) DEFAULT 1.0,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_prediction ON prediction_feedback(prediction_id);
CREATE INDEX idx_feedback_user ON prediction_feedback(user_id);
CREATE INDEX idx_feedback_training ON prediction_feedback(use_for_training) WHERE use_for_training = TRUE;
CREATE INDEX idx_feedback_correct ON prediction_feedback(is_correct);

-- Custom cry labels created by users
CREATE TABLE custom_cry_labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    baby_id UUID REFERENCES babies(id) ON DELETE CASCADE,
    label_name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color_hex TEXT,
    usage_count INTEGER DEFAULT 0,
    is_shared BOOLEAN DEFAULT FALSE,  -- Share with community
    upvote_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_custom_labels_user ON custom_cry_labels(user_id);
CREATE INDEX idx_custom_labels_baby ON custom_cry_labels(baby_id);
CREATE INDEX idx_custom_labels_shared ON custom_cry_labels(is_shared) WHERE is_shared = TRUE;

-- ==========================================================
-- 🔟 OXIMETER & VITAL SIGNS (IoT Integration)
-- ==========================================================

CREATE TABLE oximeter_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
    
    -- Vital signs
    spo2_percentage NUMERIC(5,2) CHECK (spo2_percentage BETWEEN 0 AND 100),
    pulse_rate_bpm INTEGER CHECK (pulse_rate_bpm BETWEEN 0 AND 300),
    perfusion_index NUMERIC(5,2),
    
    -- Status assessment
    status TEXT NOT NULL CHECK (status IN ('normal', 'borderline', 'low', 'critical')),
    is_alarm BOOLEAN DEFAULT FALSE,
    alarm_reason TEXT,
    
    -- Device information
    device_id TEXT NOT NULL,
    device_model TEXT,
    device_firmware_version TEXT,
    battery_level INTEGER,
    signal_quality TEXT CHECK (signal_quality IN ('excellent', 'good', 'fair', 'poor')),
    
    -- Measurement context
    baby_state TEXT CHECK (baby_state IN ('sleeping', 'awake', 'crying', 'feeding', 'playing')),
    sensor_placement TEXT CHECK (sensor_placement IN ('finger', 'toe', 'foot', 'other')),
    
    -- Timestamps
    measured_at TIMESTAMPTZ NOT NULL,
    
    -- Recording correlation
    related_recording_id UUID REFERENCES recordings(id),
    time_relative_to_cry_seconds INTEGER,  -- Negative = before cry, positive = after
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_oximeter_baby_measured ON oximeter_readings(baby_id, measured_at DESC);
CREATE INDEX idx_oximeter_status ON oximeter_readings(baby_id, status) WHERE status != 'normal';
CREATE INDEX idx_oximeter_device ON oximeter_readings(device_id);
CREATE INDEX idx_oximeter_alarm ON oximeter_readings(is_alarm) WHERE is_alarm = TRUE;
CREATE INDEX idx_oximeter_recording ON oximeter_readings(related_recording_id) WHERE related_recording_id IS NOT NULL;

-- Oximeter device management
CREATE TABLE oximeter_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT UNIQUE NOT NULL,
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    device_name TEXT,
    model TEXT,
    manufacturer TEXT,
    serial_number TEXT,
    firmware_version TEXT,
    last_sync_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    calibration_date DATE,
    battery_replacement_date DATE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_devices_owner ON oximeter_devices(owner_id);
CREATE INDEX idx_devices_active ON oximeter_devices(is_active) WHERE is_active = TRUE;

-- ==========================================================
-- 1️⃣1️⃣ COMMUNITY - BLOG POSTS
-- ==========================================================

CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Content
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image_url TEXT,
    
    -- Categorization
    category TEXT NOT NULL,
    subcategory TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    age_group TEXT CHECK (age_group IN ('newborn', '0-3months', '3-6months', '6-12months', '1-2years', 'all')),
    
    -- Author info
    is_expert_content BOOLEAN DEFAULT FALSE,
    author_credentials TEXT,
    
    -- Engagement
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,
    
    -- SEO
    meta_description TEXT,
    meta_keywords JSONB DEFAULT '[]'::jsonb,
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'deleted')),
    published_at TIMESTAMPTZ,
    featured_until TIMESTAMPTZ,
    is_pinned BOOLEAN DEFAULT FALSE,
    
    -- Moderation
    is_moderated BOOLEAN DEFAULT FALSE,
    moderated_by UUID REFERENCES profiles(id),
    moderation_notes TEXT,
    
    -- Reading stats
    average_read_time_minutes INTEGER,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_author ON blog_posts(author_id);
CREATE INDEX idx_posts_published ON blog_posts(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_posts_category ON blog_posts(category, published_at DESC);
CREATE INDEX idx_posts_featured ON blog_posts(featured_until DESC) WHERE featured_until > NOW();
CREATE INDEX idx_posts_expert ON blog_posts(is_expert_content) WHERE is_expert_content = TRUE;
CREATE INDEX idx_posts_slug ON blog_posts(slug);

-- Blog comments
CREATE TABLE blog_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    parent_comment_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE,
    
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    
    -- Moderation
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_count INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON blog_comments(post_id, created_at DESC);
CREATE INDEX idx_comments_author ON blog_comments(author_id);
CREATE INDEX idx_comments_parent ON blog_comments(parent_comment_id);

-- ==========================================================
-- 1️⃣2️⃣ COMMUNITY - DISCUSSION FORUMS
-- ==========================================================

CREATE TABLE forum_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    color_hex TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    thread_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_forum_categories_order ON forum_categories(display_order, name);

CREATE TABLE forum_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    
    -- Status
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    is_solved BOOLEAN DEFAULT FALSE,
    solved_at TIMESTAMPTZ,
    accepted_answer_id UUID,
    
    -- Engagement
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    
    -- Activity tracking
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    last_reply_by UUID REFERENCES profiles(id),
    last_reply_at TIMESTAMPTZ,
    
    -- Moderation
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_count INTEGER DEFAULT 0,
    
    tags JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_threads_category_activity ON forum_threads(category_id, last_activity_at DESC);
CREATE INDEX idx_threads_author ON forum_threads(author_id);
CREATE INDEX idx_threads_pinned ON forum_threads(is_pinned, last_activity_at DESC) WHERE is_pinned = TRUE;
CREATE INDEX idx_threads_solved ON forum_threads(is_solved);

CREATE TABLE forum_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    parent_reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
    
    content TEXT NOT NULL,
    
    -- Solution marking
    is_accepted_answer BOOLEAN DEFAULT FALSE,
    accepted_at TIMESTAMPTZ,
    accepted_by UUID REFERENCES profiles(id),
    
    -- Engagement
    like_count INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    
    -- Moderation
    is_flagged BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_replies_thread ON forum_replies(thread_id, created_at);
CREATE INDEX idx_replies_author ON forum_replies(author_id);
CREATE INDEX idx_replies_accepted ON forum_replies(is_accepted_answer) WHERE is_accepted_answer = TRUE;

-- ==========================================================
-- 1️⃣3️⃣ COMMUNITY - RESOURCE LIBRARY
-- ==========================================================

CREATE TABLE shared_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    
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
    age_group TEXT CHECK (age_group IN ('newborn', '0-3months', '3-6months', '6-12months', '1-2years', 'all')),
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

CREATE INDEX idx_resources_uploader ON shared_resources(uploader_id);
CREATE INDEX idx_resources_type_category ON shared_resources(resource_type, category);
CREATE INDEX idx_resources_downloads ON shared_resources(download_count DESC);
CREATE INDEX idx_resources_rating ON shared_resources(rating_average DESC) WHERE rating_count > 0;
CREATE INDEX idx_resources_verified ON shared_resources(is_verified) WHERE is_verified = TRUE;

-- ==========================================================
-- 1️⃣4️⃣ PRODUCT REVIEWS (Trustpilot Integration)
-- ==========================================================

CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    parent_category_id UUID REFERENCES product_categories(id),
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category_id UUID REFERENCES product_categories(id),
    brand TEXT,
    description TEXT,
    image_url TEXT,
    
    -- External references
    trustpilot_id TEXT UNIQUE,
    trustpilot_url TEXT,
    amazon_asin TEXT,
    
    -- Aggregated ratings
    avg_rating NUMERIC(3,2),
    total_reviews INTEGER DEFAULT 0,
    
    -- Trustpilot sync
    last_synced_at TIMESTAMPTZ,
    sync_frequency_hours INTEGER DEFAULT 24,
    
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_rating ON products(avg_rating DESC);
CREATE INDEX idx_products_trustpilot ON products(trustpilot_id);

CREATE TABLE product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Review content
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title TEXT,
    review_text TEXT,
    
    -- Review details
    verified_purchase BOOLEAN DEFAULT FALSE,
    purchase_date DATE,
    usage_duration_months INTEGER,
    
    -- Trustpilot
    trustpilot_review_id TEXT UNIQUE,
    is_from_trustpilot BOOLEAN DEFAULT FALSE,
    trustpilot_synced_at TIMESTAMPTZ,
    
    -- Helpfulness
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    
    -- ==========================================================
-- 🌸 MamtaAI Database Schema (Supabase) - PRODUCTION READY
-- Highly Scalable • Future-Proof • Multi-Parent Support
-- ==========================================================

-- 🔌 Enable Postgres Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- Moderation
    is_flagged BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_product ON product_reviews(product_id, created_at DESC);
CREATE INDEX idx_reviews_user ON product_reviews(user_id);
CREATE INDEX idx_reviews_rating ON product_reviews(rating);
CREATE INDEX idx_reviews_trustpilot ON product_reviews(trustpilot_review_id);

-- ==========================================================
-- 1️⃣5️⃣ ANALYTICS & DASHBOARD AGGREGATIONS
-- ==========================================================

CREATE TABLE daily_cry_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
    stat_date DATE NOT NULL,
    
    -- Cry type distribution
    hunger_count INTEGER DEFAULT 0,
    sleepy_count INTEGER DEFAULT 0,
    pain_count INTEGER DEFAULT 0,
    discomfort_count INTEGER DEFAULT 0,
    colic_count INTEGER DEFAULT 0,
    other_count INTEGER DEFAULT 0,
    
    total_recordings INTEGER DEFAULT 0,
    total_cry_duration_minutes INTEGER DEFAULT 0,
    
    -- Quality metrics
    avg_confidence_score NUMERIC(5,4),
    avg_processing_time_ms INTEGER,
    
    -- Time distribution
    cry_time_distribution JSONB,  -- Hourly breakdown
    peak_cry_hour INTEGER,
    
    -- Patterns
    most_common_cry_type TEXT,
    urgency_distribution JSONB,
    
    -- Context
    feeding_count INTEGER DEFAULT 0,
    sleep_duration_minutes INTEGER DEFAULT 0,
    diaper_changes INTEGER DEFAULT 0,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (baby_id, stat_date)
);

CREATE INDEX idx_daily_stats_baby_date ON daily_cry_stats(baby_id, stat_date DESC);

CREATE TABLE weekly_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    
    -- Aggregated stats
    total_recordings INTEGER DEFAULT 0,
    total_cry_duration_minutes INTEGER DEFAULT 0,
    avg_daily_cries NUMERIC(5,2),
    
    -- Trend analysis
    cry_trend TEXT CHECK (cry_trend IN ('increasing', 'stable', 'decreasing')),
    dominant_cry_type TEXT,
    unusual_patterns JSONB DEFAULT '[]'::jsonb,
    
    -- Health indicators
    sleep_quality_trend TEXT,
    feeding_pattern_changes JSONB,
    growth_milestones JSONB DEFAULT '[]'::jsonb,
    
    -- AI insights
    ai_generated_insights JSONB DEFAULT '[]'::jsonb,
    suggested_actions JSONB DEFAULT '[]'::jsonb,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (baby_id, week_start_date)
);

CREATE INDEX idx_weekly_insights_baby ON weekly_insights(baby_id, week_start_date DESC);

CREATE TABLE health_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
    
    suggestion_type TEXT NOT NULL CHECK (suggestion_type IN 
        ('feeding', 'sleep', 'medical', 'development', 'general')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    suggested_actions JSONB DEFAULT '[]'::jsonb,
    
    -- AI/Rule based
    generated_by TEXT DEFAULT 'ai' CHECK (generated_by IN ('ai', 'rule_based', 'expert')),
    confidence_score NUMERIC(5,4),
    
    -- Tracking
    is_read BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    
    -- User feedback
    was_helpful BOOLEAN,
    user_feedback TEXT,
    
    -- Expiry
    valid_until TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_suggestions_baby ON health_suggestions(baby_id, created_at DESC);
CREATE INDEX idx_suggestions_priority ON health_suggestions(priority, is_read) WHERE is_read = FALSE;

-- ==========================================================
-- 1️⃣6️⃣ SUBSCRIPTION PLANS & PRICING
-- ==========================================================

CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    
    -- Pricing
    price_usd NUMERIC(10,2) NOT NULL,
    original_price_usd NUMERIC(10,2),  -- For showing discounts
    currency TEXT DEFAULT 'USD',
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly', 'lifetime')),
    trial_days INTEGER DEFAULT 0,
    
    -- Features
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    limitations JSONB DEFAULT '{}'::jsonb,  -- e.g., {"max_babies": 2, "max_recordings_per_day": 50}
    
    -- Display
    is_popular BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    badge_text TEXT,  -- e.g., "Best Value"
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_visible BOOLEAN DEFAULT TRUE,
    available_from TIMESTAMPTZ,
    available_until TIMESTAMPTZ,
    
    -- Stripe/Payment integration
    stripe_price_id TEXT,
    stripe_product_id TEXT,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plans_active ON subscription_plans(display_order) WHERE is_active = TRUE AND is_visible = TRUE;
CREATE INDEX idx_plans_billing ON subscription_plans(billing_cycle);

CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    
    -- Subscription details
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN 
        ('trial', 'active', 'paused', 'cancelled', 'expired', 'payment_failed')),
    
    -- Dates
    trial_start_date TIMESTAMPTZ,
    trial_end_date TIMESTAMPTZ,
    start_date TIMESTAMPTZ NOT NULL,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancelled_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    -- Billing
    auto_renew BOOLEAN DEFAULT TRUE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    cancellation_reason TEXT,
    cancellation_feedback TEXT,
    
    -- Payment gateway
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    payment_method_id TEXT,
    
    -- Discount/Coupon
    coupon_code TEXT,
    discount_percentage NUMERIC(5,2),
    discount_amount NUMERIC(10,2),
    
    -- Usage tracking
    usage_stats JSONB DEFAULT '{}'::jsonb,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_subscriptions_expiring ON user_subscriptions(current_period_end) 
    WHERE status = 'active' AND current_period_end < NOW() + INTERVAL '7 days';
CREATE INDEX idx_subscriptions_stripe ON user_subscriptions(stripe_subscription_id);

CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id),
    
    -- Transaction details
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    transaction_type TEXT NOT NULL CHECK (transaction_type IN 
        ('subscription', 'one_time', 'refund', 'chargeback')),
    
    -- Payment method
    payment_method TEXT CHECK (payment_method IN 
        ('card', 'paypal', 'stripe', 'apple_pay', 'google_pay', 'bank_transfer')),
    payment_gateway TEXT NOT NULL,
    
    -- Gateway details
    gateway_transaction_id TEXT UNIQUE NOT NULL,
    gateway_customer_id TEXT,
    gateway_payment_method_id TEXT,
    
    -- Status
    status TEXT NOT NULL CHECK (status IN 
        ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
    failure_reason TEXT,
    failure_code TEXT,
    
    -- Timestamps
    initiated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Invoice
    invoice_url TEXT,
    receipt_url TEXT,
    
    -- Reconciliation
    is_reconciled BOOLEAN DEFAULT FALSE,
    reconciled_at TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON payment_transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_subscription ON payment_transactions(subscription_id);
CREATE INDEX idx_transactions_status ON payment_transactions(status);
CREATE INDEX idx_transactions_gateway ON payment_transactions(gateway_transaction_id);

-- Coupon/Discount codes
CREATE TABLE discount_coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    
    -- Discount details
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value NUMERIC(10,2) NOT NULL,
    max_discount_amount NUMERIC(10,2),
    
    -- Validity
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    
    -- Usage limits
    max_uses INTEGER,
    max_uses_per_user INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    
    -- Restrictions
    applicable_plans JSONB DEFAULT '[]'::jsonb,  -- Plan IDs
    minimum_purchase_amount NUMERIC(10,2),
    first_time_users_only BOOLEAN DEFAULT FALSE,
    
    is_active BOOLEAN DEFAULT TRUE,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON discount_coupons(code) WHERE is_active = TRUE;
CREATE INDEX idx_coupons_valid ON discount_coupons(valid_from, valid_until) WHERE is_active = TRUE;

-- ==========================================================
-- 1️⃣7️⃣ NOTIFICATIONS SYSTEM
-- ==========================================================

CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    
    -- Multi-channel content
    title_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    email_subject_template TEXT,
    email_body_template TEXT,
    sms_template TEXT,
    
    -- Settings
    default_channels JSONB DEFAULT '["push"]'::jsonb,  -- push, email, sms
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    is_active BOOLEAN DEFAULT TRUE,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Content
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    image_url TEXT,
    
    -- Categorization
    notification_type TEXT NOT NULL CHECK (notification_type IN 
        ('cry_alert', 'oximeter_alert', 'health_suggestion', 'milestone', 
         'community', 'subscription', 'system', 'promotional')),
    category TEXT,
    
    -- Priority
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    urgency_level TEXT,
    
    -- Delivery channels
    channels_sent JSONB DEFAULT '[]'::jsonb,  -- Which channels were used
    push_sent BOOLEAN DEFAULT FALSE,
    email_sent BOOLEAN DEFAULT FALSE,
    sms_sent BOOLEAN DEFAULT FALSE,
    
    -- Action
    action_url TEXT,
    action_type TEXT,
    action_data JSONB,
    
    -- Related entities
    related_baby_id UUID REFERENCES babies(id),
    related_recording_id UUID REFERENCES recordings(id),
    related_prediction_id UUID REFERENCES cry_predictions(id),
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    is_clicked BOOLEAN DEFAULT FALSE,
    clicked_at TIMESTAMPTZ,
    
    -- Scheduling
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    
    -- Expiry
    expires_at TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read, created_at DESC) 
    WHERE is_read = FALSE;
CREATE INDEX idx_notifications_type ON notifications(notification_type, created_at DESC);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for) 
    WHERE scheduled_for IS NOT NULL AND sent_at IS NULL;

CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Global settings
    all_notifications_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    
    -- Category preferences
    cry_alerts_enabled BOOLEAN DEFAULT TRUE,
    cry_alerts_channels JSONB DEFAULT '["push"]'::jsonb,
    
    oximeter_alerts_enabled BOOLEAN DEFAULT TRUE,
    oximeter_alerts_channels JSONB DEFAULT '["push", "sms"]'::jsonb,
    
    health_suggestions_enabled BOOLEAN DEFAULT TRUE,
    health_suggestions_channels JSONB DEFAULT '["push", "email"]'::jsonb,
    
    community_notifications_enabled BOOLEAN DEFAULT TRUE,
    community_notifications_channels JSONB DEFAULT '["push"]'::jsonb,
    
    subscription_notifications_enabled BOOLEAN DEFAULT TRUE,
    subscription_notifications_channels JSONB DEFAULT '["email"]'::jsonb,
    
    promotional_enabled BOOLEAN DEFAULT TRUE,
    promotional_channels JSONB DEFAULT '["email"]'::jsonb,
    
    -- Quiet hours
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    quiet_hours_timezone TEXT DEFAULT 'UTC',
    
    -- Urgency overrides
    allow_urgent_during_quiet_hours BOOLEAN DEFAULT TRUE,
    
    -- Custom sounds/vibrations
    custom_alert_tones JSONB DEFAULT '{}'::jsonb,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ==========================================================
-- 1️⃣8️⃣ AI MODEL MANAGEMENT
-- ==========================================================

CREATE TABLE ml_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    model_type TEXT NOT NULL CHECK (model_type IN 
        ('cry_classification', 'urgency_detection', 'anomaly_detection', 'recommendation')),
    
    -- Model details
    architecture TEXT,  -- CNN, RNN, Transformer, etc.
    framework TEXT,  -- TensorFlow, PyTorch, etc.
    model_file_url TEXT,
    model_size_mb NUMERIC(10,2),
    
    -- Performance metrics
    accuracy NUMERIC(5,4),
    precision NUMERIC(5,4),
    recall NUMERIC(5,4),
    f1_score NUMERIC(5,4),
    
    -- Training details
    training_dataset_size INTEGER,
    training_duration_hours NUMERIC(8,2),
    hyperparameters JSONB,
    
    -- Deployment
    status TEXT DEFAULT 'training' CHECK (status IN 
        ('training', 'testing', 'staging', 'production', 'deprecated', 'archived')),
    deployed_at TIMESTAMPTZ,
    deprecated_at TIMESTAMPTZ,
    
    -- Usage stats
    total_predictions INTEGER DEFAULT 0,
    avg_inference_time_ms NUMERIC(8,2),
    
    -- Versioning
    previous_version_id UUID REFERENCES ml_models(id),
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, version)
);

CREATE INDEX idx_models_status ON ml_models(status, created_at DESC);
CREATE INDEX idx_models_type ON ml_models(model_type, status);

CREATE TABLE model_training_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID REFERENCES ml_models(id),
    
    batch_number INTEGER,
    training_data_count INTEGER NOT NULL,
    validation_data_count INTEGER,
    test_data_count INTEGER,
    
    -- Training metrics per epoch
    training_metrics JSONB,  -- [{epoch, loss, accuracy}, ...]
    
    -- Results
    final_accuracy NUMERIC(5,4),
    final_loss NUMERIC(8,6),
    
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_training_batches_model ON model_training_batches(model_id, created_at DESC);

-- ==========================================================
-- 1️⃣9️⃣ SYSTEM LOGS & AUDIT TRAIL
-- ==========================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Action details
    action TEXT NOT NULL,  -- 'create', 'update', 'delete', 'login', etc.
    entity_type TEXT NOT NULL,  -- 'baby', 'recording', 'subscription', etc.
    entity_id UUID,
    
    -- Changes
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    
    -- Result
    status TEXT CHECK (status IN ('success', 'failure', 'partial')),
    error_message TEXT,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);

CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    
    -- Context
    endpoint TEXT,
    http_method TEXT,
    request_body JSONB,
    
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Resolution
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_errors_unresolved ON error_logs(is_resolved, severity, created_at DESC) 
    WHERE is_resolved = FALSE;
CREATE INDEX idx_errors_user ON error_logs(user_id, created_at DESC);

-- ==========================================================
-- 2️⃣0️⃣ ANALYTICS EVENTS (For Product Analytics)
-- ==========================================================

CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id UUID,
    
    event_name TEXT NOT NULL,
    event_category TEXT,
    
    -- Event properties
    properties JSONB DEFAULT '{}'::jsonb,
    
    -- Device/Platform
    platform TEXT,  -- iOS, Android, Web
    device_type TEXT,
    os_version TEXT,
    app_version TEXT,
    
    -- Location
    country TEXT,
    city TEXT,
    
    -- Timing
    event_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_user ON analytics_events(user_id, event_timestamp DESC);
CREATE INDEX idx_analytics_event ON analytics_events(event_name, event_timestamp DESC);
CREATE INDEX idx_analytics_session ON analytics_events(session_id, event_timestamp);

-- ==========================================================
-- 📊 MATERIALIZED VIEWS FOR PERFORMANCE
-- ==========================================================

-- Fast dashboard queries
CREATE MATERIALIZED VIEW mv_baby_summary AS
SELECT 
    b.id AS baby_id,
    b.name,
    b.birth_date,
    EXTRACT(YEAR FROM AGE(b.birth_date)) * 12 + EXTRACT(MONTH FROM AGE(b.birth_date)) AS age_months,
    COUNT(DISTINCT bp.parent_id) AS parent_count,
    COUNT(DISTINCT r.id) AS total_recordings,
    COUNT(DISTINCT CASE WHEN r.created_at >= NOW() - INTERVAL '7 days' THEN r.id END) AS recordings_last_7_days,
    MAX(r.recorded_at) AS last_recording_at
FROM babies b
LEFT JOIN baby_parents bp ON b.id = bp.baby_id
LEFT JOIN recordings r ON b.id = r.baby_id
WHERE b.is_active = TRUE
GROUP BY b.id, b.name, b.birth_date;

CREATE UNIQUE INDEX ON mv_baby_summary (baby_id);

-- Refresh strategy: Every 15 minutes
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_baby_summary;

-- ==========================================================
-- 🔒 ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================

-- Enable RLS on all user-facing tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE babies ENABLE ROW LEVEL SECURITY;
ALTER TABLE baby_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE baby_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cry_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE oximeter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only view/update their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Babies: Access through baby_parents relationship
CREATE POLICY "Users can view babies they have access to" ON babies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM baby_parents 
            WHERE baby_parents.baby_id = babies.id 
            AND baby_parents.parent_id = auth.uid()
            AND baby_parents.invitation_status = 'accepted'
        )
    );

CREATE POLICY "Primary parents can update babies" ON babies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM baby_parents 
            WHERE baby_parents.baby_id = babies.id 
            AND baby_parents.parent_id = auth.uid()
            AND baby_parents.is_primary = TRUE
            AND baby_parents.can_edit_profile = TRUE
        )
    );

CREATE POLICY "Users can create babies" ON babies
    FOR INSERT WITH CHECK (true);  -- Post-insert trigger adds baby_parents entry

-- Recordings: Access through baby relationship
CREATE POLICY "Users can view own baby recordings" ON recordings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM baby_parents 
            WHERE baby_parents.baby_id = recordings.baby_id 
            AND baby_parents.parent_id = auth.uid()
            AND baby_parents.can_view_history = TRUE
        )
    );

CREATE POLICY "Users can create recordings for their babies" ON recordings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM baby_parents 
            WHERE baby_parents.baby_id = recordings.baby_id 
            AND baby_parents.parent_id = auth.uid()
            AND baby_parents.can_record_audio = TRUE
        )
    );

-- Community content: Public read, authenticated write
CREATE POLICY "Anyone can view published blog posts" ON blog_posts
    FOR SELECT USING (status = 'published');

CREATE POLICY "Authenticated users can create blog posts" ON blog_posts
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own posts" ON blog_posts
    FOR UPDATE USING (auth.uid() = author_id);

-- Notifications: Users can only see their own
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Subscriptions: Users can only see their own
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- ==========================================================
-- 🎯 FUNCTIONS & TRIGGERS
-- ==========================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_babies_updated_at 
    BEFORE UPDATE ON babies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_baby_parents_updated_at 
    BEFORE UPDATE ON baby_parents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create baby_parents entry when baby is created
CREATE OR REPLACE FUNCTION create_baby_parent_relationship()
RETURNS TRIGGER AS $
BEGIN
    INSERT INTO baby_parents (baby_id, parent_id, relationship, is_primary, invitation_status)
    VALUES (NEW.id, auth.uid(), 'parent', TRUE, 'accepted');
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER on_baby_created 
    AFTER INSERT ON babies
    FOR EACH ROW EXECUTE FUNCTION create_baby_parent_relationship();

-- Update forum thread activity
CREATE OR REPLACE FUNCTION update_thread_activity()
RETURNS TRIGGER AS $
BEGIN
    UPDATE forum_threads 
    SET 
        reply_count = reply_count + 1,
        last_activity_at = NOW(),
        last_reply_by = NEW.author_id,
        last_reply_at = NOW()
    WHERE id = NEW.thread_id;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER on_forum_reply_insert 
    AFTER INSERT ON forum_replies
    FOR EACH ROW EXECUTE FUNCTION update_thread_activity();

-- Increment recording processing status
CREATE OR REPLACE FUNCTION update_recording_processing_status()
RETURNS TRIGGER AS $
BEGIN
    IF NEW.processing_status = 'processing' AND OLD.processing_status = 'pending' THEN
        NEW.processing_started_at = NOW();
    ELSIF NEW.processing_status = 'completed' AND OLD.processing_status = 'processing' THEN
        NEW.processing_completed_at = NOW();
    END IF;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER on_recording_status_change 
    BEFORE UPDATE OF processing_status ON recordings
    FOR EACH ROW EXECUTE FUNCTION update_recording_processing_status();


Create these storage buckets:

1. audio-recordings (Private)
   - Max file size: 10MB
   - Allowed types: audio/wav, audio/mp3, audio/aac, audio/m4a
   - RLS: Users can only access recordings for their babies

2. spectrograms (Private)
   - Max file size: 5MB
   - Allowed types: image/png, image/jpeg
   
3. profile-avatars (Public)
   - Max file size: 2MB
   - Allowed types: image/jpeg, image/png, image/webp
   
4. baby-photos (Private)
   - Max file size: 5MB
   - Allowed types: image/jpeg, image/png, image/webp
   
5. community-resources (Public)
   - Max file size: 50MB
   - Allowed types: application/pdf, application/msword, image
   
6. blog-media (Public)
   - Max file size: 10MB
   - Allowed types: image
   
7. medical-documents (Private - Encrypted)
   - Max file size: 20MB
   - Allowed types: application/pdf, image


-- ==========================================================
-- 🚀 INDEXES FOR PERFORMANCE (Additional)
-- ==========================================================

-- Full-text search on blog posts
CREATE INDEX idx_blog_posts_search ON blog_posts 
    USING gin(to_tsvector('english', title || ' ' || content));

-- Forum search
CREATE INDEX idx_forum_threads_search ON forum_threads 
    USING gin(to_tsvector('english', title || ' ' || content));

-- Composite indexes for common queries
CREATE INDEX idx_recordings_baby_status_date ON recordings(baby_id, processing_status, recorded_at DESC);
CREATE INDEX idx_predictions_baby_type_date ON cry_predictions(recording_id) 
    INCLUDE (predicted_cry_type, confidence_score, created_at); UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Fuzzy text search
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- Query performance monitoring
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- Additional encryption functions

-- ==========================================================
-- 1️⃣ USER PROFILES (Extended from auth.users)
-- ==========================================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'parent' CHECK (role IN ('parent', 'expert', 'admin')),
    is_verified BOOLEAN DEFAULT FALSE,
    verification_data JSONB,  -- For expert verification documents
    timezone TEXT DEFAULT 'UTC',
    language_preference TEXT DEFAULT 'en',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    last_active_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,  -- Extensible for future fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role) WHERE role != 'parent';
CREATE INDEX idx_profiles_verified ON profiles(is_verified) WHERE is_verified = TRUE;
CREATE INDEX idx_profiles_last_active ON profiles(last_active_at DESC);

-- ==========================================================
-- 2️⃣ BABY PROFILES (Core Entity)
-- ==========================================================

CREATE TABLE babies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    birth_date DATE NOT NULL,
    birth_weight_kg NUMERIC(5,2),
    birth_height_cm NUMERIC(5,2),
    blood_type TEXT,
    avatar_url TEXT,
    medical_notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,  -- For soft deletion
    metadata JSONB DEFAULT '{}'::jsonb,  -- Future extensibility
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_babies_birth_date ON babies(birth_date);
CREATE INDEX idx_babies_active ON babies(is_active) WHERE is_active = TRUE;

-- ==========================================================
-- 3️⃣ BABY ↔ PARENT RELATIONSHIPS (Multi-Parent Support)
-- ==========================================================

CREATE TABLE baby_parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    relationship TEXT DEFAULT 'parent' CHECK (relationship IN 
        ('mother', 'father', 'guardian', 'caregiver', 'grandparent', 'other')),
    is_primary BOOLEAN DEFAULT FALSE,
    access_level TEXT DEFAULT 'full' CHECK (access_level IN ('full', 'read_only', 'limited')),
    can_edit_profile BOOLEAN DEFAULT TRUE,
    can_record_audio BOOLEAN DEFAULT TRUE,
    can_view_history BOOLEAN DEFAULT TRUE,
    invited_by UUID REFERENCES profiles(id),
    invitation_status TEXT DEFAULT 'accepted' CHECK (invitation_status IN 
        ('pending', 'accepted', 'declined', 'revoked')),
    invited_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (baby_id, parent_id)
);

CREATE INDEX idx_baby_parents_baby ON baby_parents(baby_id);
CREATE INDEX idx_baby_parents_parent ON baby_parents(parent_id);
CREATE INDEX idx_baby_parents_primary ON baby_parents(baby_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_baby_parents_invitation ON baby_parents(invitation_status) WHERE invitation_status = 'pending';

-- ==========================================================
-- 4️⃣ MEDICAL HISTORY & HEALTH RECORDS
-- ==========================================================

CREATE TABLE baby_medical_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
    condition_type TEXT NOT NULL CHECK (condition_type IN 
        ('allergy', 'chronic_condition', 'past_illness', 'surgery', 'medication', 'vaccination', 'other')),
    condition_name TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
    diagnosis_date DATE,
    resolved_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    prescribed_by TEXT,  -- Doctor's name
    notes TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,  -- Links to medical documents
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_medical_baby ON baby_medical_conditions(baby_id);
CREATE INDEX idx_medical_active ON baby_medical_conditions(baby_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_medical_type ON baby_medical_conditions(condition_type);

-- ==========================================================
-- 5️⃣ DAILY ACTIVITY TRACKING
-- ==========================================================

CREATE TABLE baby_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
    recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN 
        ('feeding', 'sleep', 'diaper_change', 'play', 'bath', 'medicine', 'milestone', 'other')),
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (ended_at - started_at)) / 60
    ) STORED,
    
    -- Feeding specific fields
    feeding_type TEXT CHECK (feeding_type IN ('breast_left', 'breast_right', 'breast_both', 'bottle', 'solid')),
    amount_ml NUMERIC(6,2),
    food_type TEXT,
    
    -- Sleep specific fields
    sleep_quality TEXT CHECK (sleep_quality IN ('deep', 'light', 'restless', 'interrupted')),
    wake_count INTEGER,
    
    -- Diaper specific fields
    diaper_type TEXT CHECK (diaper_type IN ('wet', 'dirty', 'both', 'dry')),
    
    -- Medicine specific fields
    medicine_name TEXT,
    dosage TEXT,
    
    -- Milestone specific fields
    milestone_category TEXT CHECK (milestone_category IN 
        ('motor', 'cognitive', 'social', 'language', 'other')),
    milestone_description TEXT,
    
    notes TEXT,
    location TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    attachments JSONB DEFAULT '[]'::jsonb,  -- Photos/videos
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_baby_time ON baby_activities(baby_id, started_at DESC);
CREATE INDEX idx_activities_type ON baby_activities(activity_type, started_at DESC);
CREATE INDEX idx_activities_recorded_by ON baby_activities(recorded_by);

-- ==========================================================
-- 6️⃣ AUDIO RECORDINGS (Core AI Feature)
-- ==========================================================

CREATE TABLE recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
    recorded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- File information
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    file_format TEXT CHECK (file_format IN ('wav', 'mp3', 'aac', 'm4a', 'ogg')),
    duration_seconds NUMERIC(8,2) NOT NULL,
    sample_rate INTEGER,
    bit_rate INTEGER,
    
    -- Recording metadata
    source TEXT NOT NULL CHECK (source IN ('live', 'uploaded')),
    device_type TEXT,  -- iOS, Android, Web
    noise_reduced BOOLEAN DEFAULT FALSE,
    quality_score NUMERIC(3,2),  -- 0-1 audio quality assessment
    
    -- Context information
    recorded_at TIMESTAMPTZ NOT NULL,
    baby_age_months INTEGER,  -- Calculated at recording time
    location TEXT,
    environment_noise_level TEXT CHECK (environment_noise_level IN ('quiet', 'moderate', 'noisy')),
    
    -- Processing status
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN 
        ('pending', 'processing', 'completed', 'failed', 'archived')),
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    processing_error TEXT,
    
    -- Flags
    is_training_data BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    
    tags JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recordings_baby_recorded ON recordings(baby_id, recorded_at DESC);
CREATE INDEX idx_recordings_status ON recordings(processing_status);
CREATE INDEX idx_recordings_training ON recordings(is_training_data) WHERE is_training_data = TRUE;
CREATE INDEX idx_recordings_recorded_by ON recordings(recorded_by);

-- ==========================================================
-- 7️⃣ EXTRACTED FEATURES (ML Pipeline)
-- ==========================================================

CREATE TABLE extracted_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
    
    -- Audio features
    mfcc_coefficients JSONB,  -- Mel-frequency cepstral coefficients
    spectrogram_url TEXT,
    mel_spectrogram_url TEXT,
    chromagram_url TEXT,
    
    -- Statistical features
    pitch_hz_mean NUMERIC(8,2),
    pitch_hz_std NUMERIC(8,2),
    pitch_hz_min NUMERIC(8,2),
    pitch_hz_max NUMERIC(8,2),
    
    intensity_db_mean NUMERIC(6,2),
    intensity_db_std NUMERIC(6,2),
    
    zero_crossing_rate NUMERIC(6,4),
    spectral_centroid NUMERIC(8,2),
    spectral_rolloff NUMERIC(8,2),
    spectral_bandwidth NUMERIC(8,2),
    
    -- Temporal features
    duration_ms INTEGER,
    pause_count INTEGER,
    cry_burst_count INTEGER,
    
    -- Frequency domain
    dominant_frequency_hz NUMERIC(8,2),
    frequency_range JSONB,  -- {min, max, bands[]}
    
    -- Energy features
    energy_total NUMERIC(10,4),
    energy_distribution JSONB,
    
    -- Advanced features
    formants JSONB,  -- Speech formants if applicable
    harmonics JSONB,
    
    extraction_method TEXT,
    extraction_version TEXT,
    extraction_time_ms INTEGER,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_features_recording ON extracted_features(recording_id);
CREATE INDEX idx_features_pitch ON extracted_features(pitch_hz_mean);

-- ==========================================================
-- 8️⃣ CRY PREDICTIONS (AI Classification Results)
-- ==========================================================

CREATE TABLE cry_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
    
    -- Primary prediction
    predicted_cry_type TEXT NOT NULL CHECK (predicted_cry_type IN 
        ('hunger', 'sleepy', 'pain', 'discomfort', 'colic', 'teething', 
         'scared', 'attention', 'overstimulated', 'cold', 'hot', 'unknown')),
    confidence_score NUMERIC(5,4) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Alternative predictions
    secondary_predictions JSONB DEFAULT '[]'::jsonb,  -- [{type, confidence}]
    all_class_probabilities JSONB,  -- Full probability distribution
    
    -- Urgency assessment
    urgency_level TEXT NOT NULL CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
    urgency_score NUMERIC(5,4),
    requires_immediate_attention BOOLEAN DEFAULT FALSE,
    
    -- Suggestions
    suggested_actions JSONB DEFAULT '[]'::jsonb,
    medical_red_flags JSONB DEFAULT '[]'::jsonb,
    
    -- Model information
    model_name TEXT NOT NULL,
    model_version TEXT NOT NULL,
    model_confidence_threshold NUMERIC(5,4),
    
    -- Processing metrics
    inference_time_ms INTEGER,
    preprocessing_time_ms INTEGER,
    total_processing_time_ms INTEGER,
    
    -- Contextual factors
    baby_age_months INTEGER,
    time_since_last_feeding_minutes INTEGER,
    time_since_last_sleep_minutes INTEGER,
    
    -- Validation
    is_validated BOOLEAN DEFAULT FALSE,
    validated_by UUID REFERENCES profiles(id),
    validated_at TIMESTAMPTZ,
    validation_result TEXT CHECK (validation_result IN ('correct', 'incorrect', 'partially_correct')),
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_predictions_recording ON cry_predictions(recording_id);
CREATE INDEX idx_predictions_type ON cry_predictions(predicted_cry_type);
CREATE INDEX idx_predictions_confidence ON cry_predictions(confidence_score DESC);
CREATE INDEX idx_predictions_urgency ON cry_predictions(urgency_level) WHERE urgency_level IN ('high', 'critical');
CREATE INDEX idx_predictions_validation ON cry_predictions(is_validated);

-- ==========================================================
-- 9️⃣ USER FEEDBACK & CONTINUOUS LEARNING
-- ==========================================================

CREATE TABLE prediction_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id UUID NOT NULL REFERENCES cry_predictions(id) ON DELETE CASCADE,
    recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Feedback details
    is_correct BOOLEAN NOT NULL,
    actual_cry_type TEXT CHECK (actual_cry_type IN 
        ('hunger', 'sleepy', 'pain', 'discomfort', 'colic', 'teething', 
         'scared', 'attention', 'overstimulated', 'cold', 'hot', 'unknown', 'custom')),
    custom_label TEXT,
    
    -- Rating
    prediction_quality_rating INTEGER CHECK (prediction_quality_rating BETWEEN 1 AND 5),
    suggestion_helpfulness_rating INTEGER CHECK (suggestion_helpfulness_rating BETWEEN 1 AND 5),
    
    -- User comments
    comments TEXT,
    what_actually_helped TEXT,
    
    -- Feedback context
    feedback_delay_minutes INTEGER,  -- Time between prediction and feedback
    parent_confidence_level TEXT CHECK (parent_confidence_level IN ('low', 'medium', 'high')),
    
    -- For model retraining
    use_for_training BOOLEAN DEFAULT TRUE,
    training_weight NUMERIC(3,2) DEFAULT 1.0,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_prediction ON prediction_feedback(prediction_id);
CREATE INDEX idx_feedback_user ON prediction_feedback(user_id);
CREATE INDEX idx_feedback_training ON prediction_feedback(use_for_training) WHERE use_for_training = TRUE;
CREATE INDEX idx_feedback_correct ON prediction_feedback(is_correct);

-- Custom cry labels created by users
CREATE TABLE custom_cry_labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    baby_id UUID REFERENCES babies(id) ON DELETE CASCADE,
    label_name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color_hex TEXT,
    usage_count INTEGER DEFAULT 0,
    is_shared BOOLEAN DEFAULT FALSE,  -- Share with community
    upvote_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_custom_labels_user ON custom_cry_labels(user_id);
CREATE INDEX idx_custom_labels_baby ON custom_cry_labels(baby_id);
CREATE INDEX idx_custom_labels_shared ON custom_cry_labels(is_shared) WHERE is_shared = TRUE;

-- ==========================================================
-- 🔟 OXIMETER & VITAL SIGNS (IoT Integration)
-- ==========================================================

CREATE TABLE oximeter_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
    
    -- Vital signs
    spo2_percentage NUMERIC(5,2) CHECK (spo2_percentage BETWEEN 0 AND 100),
    pulse_rate_bpm INTEGER CHECK (pulse_rate_bpm BETWEEN 0 AND 300),
    perfusion_index NUMERIC(5,2),
    
    -- Status assessment
    status TEXT NOT NULL CHECK (status IN ('normal', 'borderline', 'low', 'critical')),
    is_alarm BOOLEAN DEFAULT FALSE,
    alarm_reason TEXT,
    
    -- Device information
    device_id TEXT NOT NULL,
    device_model TEXT,
    device_firmware_version TEXT,
    battery_level INTEGER,
    signal_quality TEXT CHECK (signal_quality IN ('excellent', 'good', 'fair', 'poor')),
    
    -- Measurement context
    baby_state TEXT CHECK (baby_state IN ('sleeping', 'awake', 'crying', 'feeding', 'playing')),
    sensor_placement TEXT CHECK (sensor_placement IN ('finger', 'toe', 'foot', 'other')),
    
    -- Timestamps
    measured_at TIMESTAMPTZ NOT NULL,
    
    -- Recording correlation
    related_recording_id UUID REFERENCES recordings(id),
    time_relative_to_cry_seconds INTEGER,  -- Negative = before cry, positive = after
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_oximeter_baby_measured ON oximeter_readings(baby_id, measured_at DESC);
CREATE INDEX idx_oximeter_status ON oximeter_readings(baby_id, status) WHERE status != 'normal';
CREATE INDEX idx_oximeter_device ON oximeter_readings(device_id);
CREATE INDEX idx_oximeter_alarm ON oximeter_readings(is_alarm) WHERE is_alarm = TRUE;
CREATE INDEX idx_oximeter_recording ON oximeter_readings(related_recording_id) WHERE related_recording_id IS NOT NULL;

-- Oximeter device management
CREATE TABLE oximeter_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT UNIQUE NOT NULL,
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    device_name TEXT,
    model TEXT,
    manufacturer TEXT,
    serial_number TEXT,
    firmware_version TEXT,
    last_sync_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    calibration_date DATE,
    battery_replacement_date DATE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_devices_owner ON oximeter_devices(owner_id);
CREATE INDEX idx_devices_active ON oximeter_devices(is_active) WHERE is_active = TRUE;


CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Content
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image_url TEXT,
    
    -- Categorization
    category TEXT NOT NULL,
    subcategory TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    age_group TEXT CHECK (age_group IN ('newborn', '0-3months', '3-6months', '6-12months', '1-2years', 'all')),
    
    -- Author info
    is_expert_content BOOLEAN DEFAULT FALSE,
    author_credentials TEXT,
    
    -- Engagement
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,
    
    -- SEO
    meta_description TEXT,
    meta_keywords JSONB DEFAULT '[]'::jsonb,
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'deleted')),
    published_at TIMESTAMPTZ,
    featured_until TIMESTAMPTZ,
    is_pinned BOOLEAN DEFAULT FALSE,
    
    -- Moderation
    is_moderated BOOLEAN DEFAULT FALSE,
    moderated_by UUID REFERENCES profiles(id),
    moderation_notes TEXT,
    
    -- Reading stats
    average_read_time_minutes INTEGER,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_author ON blog_posts(author_id);
CREATE INDEX idx_posts_published ON blog_posts(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_posts_category ON blog_posts(category, published_at DESC);
CREATE INDEX idx_posts_featured ON blog_posts(featured_until DESC) WHERE featured_until > NOW();
CREATE INDEX idx_posts_expert ON blog_posts(is_expert_content) WHERE is_expert_content = TRUE;
CREATE INDEX idx_posts_slug ON blog_posts(slug);

-- Blog comments
CREATE TABLE blog_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    parent_comment_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE,
    
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    
    -- Moderation
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_count INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON blog_comments(post_id, created_at DESC);
CREATE INDEX idx_comments_author ON blog_comments(author_id);
CREATE INDEX idx_comments_parent ON blog_comments(parent_comment_id);


CREATE TABLE forum_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    color_hex TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    thread_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_forum_categories_order ON forum_categories(display_order, name);

CREATE TABLE forum_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    
    -- Status
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    is_solved BOOLEAN DEFAULT FALSE,
    solved_at TIMESTAMPTZ,
    accepted_answer_id UUID,
    
    -- Engagement
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    
    -- Activity tracking
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    last_reply_by UUID REFERENCES profiles(id),
    last_reply_at TIMESTAMPTZ,
    
    -- Moderation
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_count INTEGER DEFAULT 0,
    
    tags JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_threads_category_activity ON forum_threads(category_id, last_activity_at DESC);
CREATE INDEX idx_threads_author ON forum_threads(author_id);
CREATE INDEX idx_threads_pinned ON forum_threads(is_pinned, last_activity_at DESC) WHERE is_pinned = TRUE;
CREATE INDEX idx_threads_solved ON forum_threads(is_solved);

CREATE TABLE forum_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    parent_reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
    
    content TEXT NOT NULL,
    
    -- Solution marking
    is_accepted_answer BOOLEAN DEFAULT FALSE,
    accepted_at TIMESTAMPTZ,
    accepted_by UUID REFERENCES profiles(id),
    
    -- Engagement
    like_count INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    
    -- Moderation
    is_flagged BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_replies_thread ON forum_replies(thread_id, created_at);
CREATE INDEX idx_replies_author ON forum_replies(author_id);
CREATE INDEX idx_replies_accepted ON forum_replies(is_accepted_answer) WHERE is_accepted_answer = TRUE;

CREATE TABLE shared_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    
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
    age_group TEXT CHECK (age_group IN ('newborn', '0-3months', '3-6months', '6-12months', '1-2years', 'all')),
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

CREATE INDEX idx_resources_uploader ON shared_resources(uploader_id);
CREATE INDEX idx_resources_type_category ON shared_resources(resource_type, category);
CREATE INDEX idx_resources_downloads ON shared_resources(download_count DESC);
CREATE INDEX idx_resources_rating ON shared_resources(rating_average DESC) WHERE rating_count > 0;
CREATE INDEX idx_resources_verified ON shared_resources(is_verified) WHERE is_verified = TRUE;


CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    parent_category_id UUID REFERENCES product_categories(id),
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category_id UUID REFERENCES product_categories(id),
    brand TEXT,
    description TEXT,
    image_url TEXT,
    
    -- External references
    trustpilot_id TEXT UNIQUE,
    trustpilot_url TEXT,
    amazon_asin TEXT,
    
    -- Aggregated ratings
    avg_rating NUMERIC(3,2),
    total_reviews INTEGER DEFAULT 0,
    
    -- Trustpilot sync
    last_synced_at TIMESTAMPTZ,
    sync_frequency_hours INTEGER DEFAULT 24,
    
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_rating ON products(avg_rating DESC);
CREATE INDEX idx_products_trustpilot ON products(trustpilot_id);

CREATE TABLE product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Review content
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title TEXT,
    review_text TEXT,
    
    -- Review details
    verified_purchase BOOLEAN DEFAULT FALSE,
    purchase_date DATE,
    usage_duration_months INTEGER,
    
    -- Trustpilot
    trustpilot_review_id TEXT UNIQUE,
    is_from_trustpilot BOOLEAN DEFAULT FALSE,
    trustpilot_synced_at TIMESTAMPTZ,
    
    -- Helpfulness
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    

-- 🔌 Enable Postgres Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- Moderation
    is_flagged BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_product ON product_reviews(product_id, created_at DESC);
CREATE INDEX idx_reviews_user ON product_reviews(user_id);
CREATE INDEX idx_reviews_rating ON product_reviews(rating);
CREATE INDEX idx_reviews_trustpilot ON product_reviews(trustpilot_review_id);

-- ==========================================================
-- 1️⃣5️⃣ ANALYTICS & DASHBOARD AGGREGATIONS
-- ==========================================================

CREATE TABLE daily_cry_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
    stat_date DATE NOT NULL,
    
    -- Cry type distribution
    hunger_count INTEGER DEFAULT 0,
    sleepy_count INTEGER DEFAULT 0,
    pain_count INTEGER DEFAULT 0,
    discomfort_count INTEGER DEFAULT 0,
    colic_count INTEGER DEFAULT 0,
    other_count INTEGER DEFAULT 0,
    
    total_recordings INTEGER DEFAULT 0,
    total_cry_duration_minutes INTEGER DEFAULT 0,
    
    -- Quality metrics
    avg_confidence_score NUMERIC(5,4),
    avg_processing_time_ms INTEGER,
    
    -- Time distribution
    cry_time_distribution JSONB,  -- Hourly breakdown
    peak_cry_hour INTEGER,
    
    -- Patterns
    most_common_cry_type TEXT,
    urgency_distribution JSONB,
    
    -- Context
    feeding_count INTEGER DEFAULT 0,
    sleep_duration_minutes INTEGER DEFAULT 0,
    diaper_changes INTEGER DEFAULT 0,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (baby_id, stat_date)
);

CREATE INDEX idx_daily_stats_baby_date ON daily_cry_stats(baby_id, stat_date DESC);

CREATE TABLE weekly_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    
    -- Aggregated stats
    total_recordings INTEGER DEFAULT 0,
    total_cry_duration_minutes INTEGER DEFAULT 0,
    avg_daily_cries NUMERIC(5,2),
    
    -- Trend analysis
    cry_trend TEXT CHECK (cry_trend IN ('increasing', 'stable', 'decreasing')),
    dominant_cry_type TEXT,
    unusual_patterns JSONB DEFAULT '[]'::jsonb,
    
    -- Health indicators
    sleep_quality_trend TEXT,
    feeding_pattern_changes JSONB,
    growth_milestones JSONB DEFAULT '[]'::jsonb,
    
    -- AI insights
    ai_generated_insights JSONB DEFAULT '[]'::jsonb,
    suggested_actions JSONB DEFAULT '[]'::jsonb,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (baby_id, week_start_date)
);

CREATE INDEX idx_weekly_insights_baby ON weekly_insights(baby_id, week_start_date DESC);

CREATE TABLE health_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
    
    suggestion_type TEXT NOT NULL CHECK (suggestion_type IN 
        ('feeding', 'sleep', 'medical', 'development', 'general')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    suggested_actions JSONB DEFAULT '[]'::jsonb,
    
    -- AI/Rule based
    generated_by TEXT DEFAULT 'ai' CHECK (generated_by IN ('ai', 'rule_based', 'expert')),
    confidence_score NUMERIC(5,4),
    
    -- Tracking
    is_read BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    
    -- User feedback
    was_helpful BOOLEAN,
    user_feedback TEXT,
    
    -- Expiry
    valid_until TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_suggestions_baby ON health_suggestions(baby_id, created_at DESC);
CREATE INDEX idx_suggestions_priority ON health_suggestions(priority, is_read) WHERE is_read = FALSE;

-- ==========================================================
-- 1️⃣6️⃣ SUBSCRIPTION PLANS & PRICING
-- ==========================================================

CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    
    -- Pricing
    price_usd NUMERIC(10,2) NOT NULL,
    original_price_usd NUMERIC(10,2),  -- For showing discounts
    currency TEXT DEFAULT 'USD',
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly', 'lifetime')),
    trial_days INTEGER DEFAULT 0,
    
    -- Features
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    limitations JSONB DEFAULT '{}'::jsonb,  -- e.g., {"max_babies": 2, "max_recordings_per_day": 50}
    
    -- Display
    is_popular BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    badge_text TEXT,  -- e.g., "Best Value"
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_visible BOOLEAN DEFAULT TRUE,
    available_from TIMESTAMPTZ,
    available_until TIMESTAMPTZ,
    
    -- Stripe/Payment integration
    stripe_price_id TEXT,
    stripe_product_id TEXT,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plans_active ON subscription_plans(display_order) WHERE is_active = TRUE AND is_visible = TRUE;
CREATE INDEX idx_plans_billing ON subscription_plans(billing_cycle);

CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    
    -- Subscription details
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN 
        ('trial', 'active', 'paused', 'cancelled', 'expired', 'payment_failed')),
    
    -- Dates
    trial_start_date TIMESTAMPTZ,
    trial_end_date TIMESTAMPTZ,
    start_date TIMESTAMPTZ NOT NULL,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancelled_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    -- Billing
    auto_renew BOOLEAN DEFAULT TRUE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    cancellation_reason TEXT,
    cancellation_feedback TEXT,
    
    -- Payment gateway
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    payment_method_id TEXT,
    
    -- Discount/Coupon
    coupon_code TEXT,
    discount_percentage NUMERIC(5,2),
    discount_amount NUMERIC(10,2),
    
    -- Usage tracking
    usage_stats JSONB DEFAULT '{}'::jsonb,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_subscriptions_expiring ON user_subscriptions(current_period_end) 
    WHERE status = 'active' AND current_period_end < NOW() + INTERVAL '7 days';
CREATE INDEX idx_subscriptions_stripe ON user_subscriptions(stripe_subscription_id);

CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id),
    
    -- Transaction details
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    transaction_type TEXT NOT NULL CHECK (transaction_type IN 
        ('subscription', 'one_time', 'refund', 'chargeback')),
    
    -- Payment method
    payment_method TEXT CHECK (payment_method IN 
        ('card', 'paypal', 'stripe', 'apple_pay', 'google_pay', 'bank_transfer')),
    payment_gateway TEXT NOT NULL,
    
    -- Gateway details
    gateway_transaction_id TEXT UNIQUE NOT NULL,
    gateway_customer_id TEXT,
    gateway_payment_method_id TEXT,
    
    -- Status
    status TEXT NOT NULL CHECK (status IN 
        ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
    failure_reason TEXT,
    failure_code TEXT,
    
    -- Timestamps
    initiated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Invoice
    invoice_url TEXT,
    receipt_url TEXT,
    
    -- Reconciliation
    is_reconciled BOOLEAN DEFAULT FALSE,
    reconciled_at TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON payment_transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_subscription ON payment_transactions(subscription_id);
CREATE INDEX idx_transactions_status ON payment_transactions(status);
CREATE INDEX idx_transactions_gateway ON payment_transactions(gateway_transaction_id);

-- Coupon/Discount codes
CREATE TABLE discount_coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    
    -- Discount details
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value NUMERIC(10,2) NOT NULL,
    max_discount_amount NUMERIC(10,2),
    
    -- Validity
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    
    -- Usage limits
    max_uses INTEGER,
    max_uses_per_user INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    
    -- Restrictions
    applicable_plans JSONB DEFAULT '[]'::jsonb,  -- Plan IDs
    minimum_purchase_amount NUMERIC(10,2),
    first_time_users_only BOOLEAN DEFAULT FALSE,
    
    is_active BOOLEAN DEFAULT TRUE,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON discount_coupons(code) WHERE is_active = TRUE;
CREATE INDEX idx_coupons_valid ON discount_coupons(valid_from, valid_until) WHERE is_active = TRUE;

-- ==========================================================
-- 1️⃣7️⃣ NOTIFICATIONS SYSTEM
-- ==========================================================

CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    
    -- Multi-channel content
    title_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    email_subject_template TEXT,
    email_body_template TEXT,
    sms_template TEXT,
    
    -- Settings
    default_channels JSONB DEFAULT '["push"]'::jsonb,  -- push, email, sms
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    is_active BOOLEAN DEFAULT TRUE,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Content
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    image_url TEXT,
    
    -- Categorization
    notification_type TEXT NOT NULL CHECK (notification_type IN 
        ('cry_alert', 'oximeter_alert', 'health_suggestion', 'milestone', 
         'community', 'subscription', 'system', 'promotional')),
    category TEXT,
    
    -- Priority
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    urgency_level TEXT,
    
    -- Delivery channels
    channels_sent JSONB DEFAULT '[]'::jsonb,  -- Which channels were used
    push_sent BOOLEAN DEFAULT FALSE,
    email_sent BOOLEAN DEFAULT FALSE,
    sms_sent BOOLEAN DEFAULT FALSE,
    
    -- Action
    action_url TEXT,
    action_type TEXT,
    action_data JSONB,
    
    -- Related entities
    related_baby_id UUID REFERENCES babies(id),
    related_recording_id UUID REFERENCES recordings(id),
    related_prediction_id UUID REFERENCES cry_predictions(id),
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    is_clicked BOOLEAN DEFAULT FALSE,
    clicked_at TIMESTAMPTZ,
    
    -- Scheduling
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    
    -- Expiry
    expires_at TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read, created_at DESC) 
    WHERE is_read = FALSE;
CREATE INDEX idx_notifications_type ON notifications(notification_type, created_at DESC);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for) 
    WHERE scheduled_for IS NOT NULL AND sent_at IS NULL;

CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Global settings
    all_notifications_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    
    -- Category preferences
    cry_alerts_enabled BOOLEAN DEFAULT TRUE,
    cry_alerts_channels JSONB DEFAULT '["push"]'::jsonb,
    
    oximeter_alerts_enabled BOOLEAN DEFAULT TRUE,
    oximeter_alerts_channels JSONB DEFAULT '["push", "sms"]'::jsonb,
    
    health_suggestions_enabled BOOLEAN DEFAULT TRUE,
    health_suggestions_channels JSONB DEFAULT '["push", "email"]'::jsonb,
    
    community_notifications_enabled BOOLEAN DEFAULT TRUE,
    community_notifications_channels JSONB DEFAULT '["push"]'::jsonb,
    
    subscription_notifications_enabled BOOLEAN DEFAULT TRUE,
    subscription_notifications_channels JSONB DEFAULT '["email"]'::jsonb,
    
    promotional_enabled BOOLEAN DEFAULT TRUE,
    promotional_channels JSONB DEFAULT '["email"]'::jsonb,
    
    -- Quiet hours
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    quiet_hours_timezone TEXT DEFAULT 'UTC',
    
    -- Urgency overrides
    allow_urgent_during_quiet_hours BOOLEAN DEFAULT TRUE,
    
    -- Custom sounds/vibrations
    custom_alert_tones JSONB DEFAULT '{}'::jsonb,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ==========================================================
-- 1️⃣8️⃣ AI MODEL MANAGEMENT
-- ==========================================================

CREATE TABLE ml_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    model_type TEXT NOT NULL CHECK (model_type IN 
        ('cry_classification', 'urgency_detection', 'anomaly_detection', 'recommendation')),
    
    -- Model details
    architecture TEXT,  -- CNN, RNN, Transformer, etc.
    framework TEXT,  -- TensorFlow, PyTorch, etc.
    model_file_url TEXT,
    model_size_mb NUMERIC(10,2),
    
    -- Performance metrics
    accuracy NUMERIC(5,4),
    precision NUMERIC(5,4),
    recall NUMERIC(5,4),
    f1_score NUMERIC(5,4),
    
    -- Training details
    training_dataset_size INTEGER,
    training_duration_hours NUMERIC(8,2),
    hyperparameters JSONB,
    
    -- Deployment
    status TEXT DEFAULT 'training' CHECK (status IN 
        ('training', 'testing', 'staging', 'production', 'deprecated', 'archived')),
    deployed_at TIMESTAMPTZ,
    deprecated_at TIMESTAMPTZ,
    
    -- Usage stats
    total_predictions INTEGER DEFAULT 0,
    avg_inference_time_ms NUMERIC(8,2),
    
    -- Versioning
    previous_version_id UUID REFERENCES ml_models(id),
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, version)
);

CREATE INDEX idx_models_status ON ml_models(status, created_at DESC);
CREATE INDEX idx_models_type ON ml_models(model_type, status);

CREATE TABLE model_training_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID REFERENCES ml_models(id),
    
    batch_number INTEGER,
    training_data_count INTEGER NOT NULL,
    validation_data_count INTEGER,
    test_data_count INTEGER,
    
    -- Training metrics per epoch
    training_metrics JSONB,  -- [{epoch, loss, accuracy}, ...]
    
    -- Results
    final_accuracy NUMERIC(5,4),
    final_loss NUMERIC(8,6),
    
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_training_batches_model ON model_training_batches(model_id, created_at DESC);

-- ==========================================================
-- 1️⃣9️⃣ SYSTEM LOGS & AUDIT TRAIL
-- ==========================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Action details
    action TEXT NOT NULL,  -- 'create', 'update', 'delete', 'login', etc.
    entity_type TEXT NOT NULL,  -- 'baby', 'recording', 'subscription', etc.
    entity_id UUID,
    
    -- Changes
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    
    -- Result
    status TEXT CHECK (status IN ('success', 'failure', 'partial')),
    error_message TEXT,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);

CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    
    -- Context
    endpoint TEXT,
    http_method TEXT,
    request_body JSONB,
    
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Resolution
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_errors_unresolved ON error_logs(is_resolved, severity, created_at DESC) 
    WHERE is_resolved = FALSE;
CREATE INDEX idx_errors_user ON error_logs(user_id, created_at DESC);

-- ==========================================================
-- 2️⃣0️⃣ ANALYTICS EVENTS (For Product Analytics)
-- ==========================================================

CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id UUID,
    
    event_name TEXT NOT NULL,
    event_category TEXT,
    
    -- Event properties
    properties JSONB DEFAULT '{}'::jsonb,
    
    -- Device/Platform
    platform TEXT,  -- iOS, Android, Web
    device_type TEXT,
    os_version TEXT,
    app_version TEXT,
    
    -- Location
    country TEXT,
    city TEXT,
    
    -- Timing
    event_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_user ON analytics_events(user_id, event_timestamp DESC);
CREATE INDEX idx_analytics_event ON analytics_events(event_name, event_timestamp DESC);
CREATE INDEX idx_analytics_session ON analytics_events(session_id, event_timestamp);

-- ==========================================================
-- 📊 MATERIALIZED VIEWS FOR PERFORMANCE
-- ==========================================================

-- Fast dashboard queries
CREATE MATERIALIZED VIEW mv_baby_summary AS
SELECT 
    b.id AS baby_id,
    b.name,
    b.birth_date,
    EXTRACT(YEAR FROM AGE(b.birth_date)) * 12 + EXTRACT(MONTH FROM AGE(b.birth_date)) AS age_months,
    COUNT(DISTINCT bp.parent_id) AS parent_count,
    COUNT(DISTINCT r.id) AS total_recordings,
    COUNT(DISTINCT CASE WHEN r.created_at >= NOW() - INTERVAL '7 days' THEN r.id END) AS recordings_last_7_days,
    MAX(r.recorded_at) AS last_recording_at
FROM babies b
LEFT JOIN baby_parents bp ON b.id = bp.baby_id
LEFT JOIN recordings r ON b.id = r.baby_id
WHERE b.is_active = TRUE
GROUP BY b.id, b.name, b.birth_date;

CREATE UNIQUE INDEX ON mv_baby_summary (baby_id);

-- Refresh strategy: Every 15 minutes
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_baby_summary;

-- ==========================================================
-- 🔒 ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================

-- Enable RLS on all user-facing tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE babies ENABLE ROW LEVEL SECURITY;
ALTER TABLE baby_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE baby_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cry_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE oximeter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only view/update their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Babies: Access through baby_parents relationship
CREATE POLICY "Users can view babies they have access to" ON babies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM baby_parents 
            WHERE baby_parents.baby_id = babies.id 
            AND baby_parents.parent_id = auth.uid()
            AND baby_parents.invitation_status = 'accepted'
        )
    );

CREATE POLICY "Primary parents can update babies" ON babies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM baby_parents 
            WHERE baby_parents.baby_id = babies.id 
            AND baby_parents.parent_id = auth.uid()
            AND baby_parents.is_primary = TRUE
            AND baby_parents.can_edit_profile = TRUE
        )
    );

CREATE POLICY "Users can create babies" ON babies
    FOR INSERT WITH CHECK (true);  -- Post-insert trigger adds baby_parents entry

-- Recordings: Access through baby relationship
CREATE POLICY "Users can view own baby recordings" ON recordings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM baby_parents 
            WHERE baby_parents.baby_id = recordings.baby_id 
            AND baby_parents.parent_id = auth.uid()
            AND baby_parents.can_view_history = TRUE
        )
    );

CREATE POLICY "Users can create recordings for their babies" ON recordings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM baby_parents 
            WHERE baby_parents.baby_id = recordings.baby_id 
            AND baby_parents.parent_id = auth.uid()
            AND baby_parents.can_record_audio = TRUE
        )
    );

-- Community content: Public read, authenticated write
CREATE POLICY "Anyone can view published blog posts" ON blog_posts
    FOR SELECT USING (status = 'published');

CREATE POLICY "Authenticated users can create blog posts" ON blog_posts
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own posts" ON blog_posts
    FOR UPDATE USING (auth.uid() = author_id);

-- Notifications: Users can only see their own
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Subscriptions: Users can only see their own
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- ==========================================================
-- 🎯 FUNCTIONS & TRIGGERS
-- ==========================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_babies_updated_at 
    BEFORE UPDATE ON babies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_baby_parents_updated_at 
    BEFORE UPDATE ON baby_parents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create baby_parents entry when baby is created
CREATE OR REPLACE FUNCTION create_baby_parent_relationship()
RETURNS TRIGGER AS $
BEGIN
    INSERT INTO baby_parents (baby_id, parent_id, relationship, is_primary, invitation_status)
    VALUES (NEW.id, auth.uid(), 'parent', TRUE, 'accepted');
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER on_baby_created 
    AFTER INSERT ON babies
    FOR EACH ROW EXECUTE FUNCTION create_baby_parent_relationship();

-- Update forum thread activity
CREATE OR REPLACE FUNCTION update_thread_activity()
RETURNS TRIGGER AS $
BEGIN
    UPDATE forum_threads 
    SET 
        reply_count = reply_count + 1,
        last_activity_at = NOW(),
        last_reply_by = NEW.author_id,
        last_reply_at = NOW()
    WHERE id = NEW.thread_id;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER on_forum_reply_insert 
    AFTER INSERT ON forum_replies
    FOR EACH ROW EXECUTE FUNCTION update_thread_activity();

-- Increment recording processing status
CREATE OR REPLACE FUNCTION update_recording_processing_status()
RETURNS TRIGGER AS $
BEGIN
    IF NEW.processing_status = 'processing' AND OLD.processing_status = 'pending' THEN
        NEW.processing_started_at = NOW();
    ELSIF NEW.processing_status = 'completed' AND OLD.processing_status = 'processing' THEN
        NEW.processing_completed_at = NOW();
    END IF;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER on_recording_status_change 
    BEFORE UPDATE OF processing_status ON recordings
    FOR EACH ROW EXECUTE FUNCTION update_recording_processing_status();

-- ==========================================================
-- 📦 STORAGE BUCKETS (Configure in Supabase Dashboard)
Create these storage buckets:

1. audio-recordings (Private)
   - Max file size: 10MB
   - Allowed types: audio/wav, audio/mp3, audio/aac, audio/m4a
   - RLS: Users can only access recordings for their babies

2. spectrograms (Private)
   - Max file size: 5MB
   - Allowed types: image/png, image/jpeg
   
3. profile-avatars (Public)
   - Max file size: 2MB
   - Allowed types: image/jpeg, image/png, image/webp
   
4. baby-photos (Private)
   - Max file size: 5MB
   - Allowed types: image/jpeg, image/png, image/webp
   
5. community-resources (Public)
   - Max file size: 50MB
   - Allowed types: application/pdf, application/msword, image
   
6. blog-media (Public)
   - Max file size: 10MB
   - Allowed types: image, video/mp4
   
7. medical-documents (Private - Encrypted)
   - Max file size: 20MB
   - Allowed types: application/pdf, image



-- Full-text search on blog posts
CREATE INDEX idx_blog_posts_search ON blog_posts 
    USING gin(to_tsvector('english', title || ' ' || content));

-- Forum search
CREATE INDEX idx_forum_threads_search ON forum_threads 
    USING gin(to_tsvector('english', title || ' ' || content));

-- Composite indexes for common queries
CREATE INDEX idx_recordings_baby_status_date ON recordings(baby_id, processing_status, recorded_at DESC);
CREATE INDEX idx_predictions_baby_type_date ON cry_predictions(recording_id) 
    INCLUDE (predicted_cry_type, confidence_score, created_at);

-- ==========================================================
-- 📈 PERFORMANCE OPTIMIZATION VIEWS
-- ==========================================================

-- Quick baby dashboard view
CREATE VIEW vw_baby_dashboard AS
SELECT 
    b.id AS baby_id,
    b.name AS baby_name,
    b.birth_date,
    EXTRACT(YEAR FROM AGE(b.birth_date)) * 12 + 
        EXTRACT(MONTH FROM AGE(b.birth_date)) AS age_months,
    
    -- Today's stats
    COUNT(DISTINCT CASE 
        WHEN r.recorded_at >= CURRENT_DATE 
        THEN r.id 
    END) AS today_recordings,
    
    -- Last 7 days
    COUNT(DISTINCT CASE 
        WHEN r.recorded_at >= CURRENT_DATE - INTERVAL '7 days' 
        THEN r.id 
    END) AS week_recordings,
    
    -- Most recent cry
    MAX(r.recorded_at) AS last_cry_at,
    
    -- Most common cry type this week
    (
        SELECT cp.predicted_cry_type 
        FROM cry_predictions cp
        JOIN recordings r2 ON r2.id = cp.recording_id
        WHERE r2.baby_id = b.id 
            AND r2.recorded_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY cp.predicted_cry_type
        ORDER BY COUNT(*) DESC
        LIMIT 1
    ) AS most_common_cry_type_week,
    
    -- Active subscription
    (
        SELECT CASE 
            WHEN COUNT(*) > 0 THEN TRUE 
            ELSE FALSE 
        END
        FROM user_subscriptions us
        JOIN baby_parents bp2 ON bp2.parent_id = us.user_id
        WHERE bp2.baby_id = b.id 
            AND us.status = 'active'
        LIMIT 1
    ) AS has_active_subscription
    
FROM babies b
LEFT JOIN baby_parents bp ON b.id = bp.baby_id
LEFT JOIN recordings r ON b.id = r.baby_id
WHERE b.is_active = TRUE
GROUP BY b.id, b.name, b.birth_date;

-- User activity summary
CREATE VIEW vw_user_activity_summary AS
SELECT 
    p.id AS user_id,
    p.full_name,
    p.role,
    
    -- Baby count
    COUNT(DISTINCT bp.baby_id) AS babies_count,
    
    -- Recording activity
    COUNT(DISTINCT r.id) AS total_recordings,
    COUNT(DISTINCT CASE 
        WHEN r.recorded_at >= NOW() - INTERVAL '30 days' 
        THEN r.id 
    END) AS recordings_last_30_days,
    
    -- Community engagement
    COUNT(DISTINCT bp2.id) AS blog_posts_count,
    COUNT(DISTINCT ft.id) AS forum_threads_count,
    COUNT(DISTINCT fr.id) AS forum_replies_count,
    
    -- Subscription status
    (
        SELECT us.status 
        FROM user_subscriptions us 
        WHERE us.user_id = p.id 
        ORDER BY us.created_at DESC 
        LIMIT 1
    ) AS subscription_status,
    
    -- Last activity
    GREATEST(
        p.last_active_at,
        MAX(r.recorded_at),
        MAX(bp2.created_at),
        MAX(ft.created_at)
    ) AS last_activity_at
    
FROM profiles p
LEFT JOIN baby_parents bp ON p.id = bp.parent_id
LEFT JOIN recordings r ON p.id = r.recorded_by
LEFT JOIN blog_posts bp2 ON p.id = bp2.author_id
LEFT JOIN forum_threads ft ON p.id = ft.author_id
LEFT JOIN forum_replies fr ON p.id = fr.author_id
GROUP BY p.id, p.full_name, p.role, p.last_active_at;

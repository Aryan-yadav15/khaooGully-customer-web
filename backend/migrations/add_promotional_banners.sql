-- ============================================
-- Promotional Banners System Migration
-- ============================================
-- This migration adds support for promotional banners and restaurant promotions
-- allowing restaurants to be featured in special sections on the homepage

-- ============================================
-- 1. Create promotional_banners table
-- ============================================
CREATE TABLE IF NOT EXISTS promotional_banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Display Information
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    
    -- Banner Type & Classification
    banner_type TEXT NOT NULL,
    category TEXT,
    
    -- Display Configuration
    display_order INTEGER DEFAULT 0,
    style_config JSONB DEFAULT '{}',
    banner_image TEXT,
    icon_url TEXT,
    
    -- Visibility & Targeting
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    campus_id UUID REFERENCES campuses(id),
    
    -- Display Rules
    max_restaurants INTEGER,
    display_layout TEXT DEFAULT 'horizontal_scroll',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES customers(id)
);

-- ============================================
-- 2. Create restaurant_promotions junction table
-- ============================================
CREATE TABLE IF NOT EXISTS restaurant_promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    banner_id UUID NOT NULL REFERENCES promotional_banners(id) ON DELETE CASCADE,
    
    -- Display Control
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    -- Time-based Control
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    
    -- Promotion Details
    promo_text TEXT,
    discount_badge TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID REFERENCES customers(id),
    
    UNIQUE(restaurant_id, banner_id)
);

-- ============================================
-- 3. Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_promotional_banners_active 
    ON promotional_banners(is_active, display_order);

CREATE INDEX IF NOT EXISTS idx_promotional_banners_campus 
    ON promotional_banners(campus_id);

CREATE INDEX IF NOT EXISTS idx_promotional_banners_dates 
    ON promotional_banners(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_promotional_banners_type 
    ON promotional_banners(banner_type);

CREATE INDEX IF NOT EXISTS idx_restaurant_promotions_restaurant 
    ON restaurant_promotions(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_restaurant_promotions_banner 
    ON restaurant_promotions(banner_id);

CREATE INDEX IF NOT EXISTS idx_restaurant_promotions_active 
    ON restaurant_promotions(is_active, display_order);

CREATE INDEX IF NOT EXISTS idx_restaurant_promotions_dates 
    ON restaurant_promotions(start_date, end_date);

-- ============================================
-- 4. Create view: active_promotional_banners
-- ============================================
CREATE OR REPLACE VIEW active_promotional_banners AS
SELECT 
    pb.*,
    COUNT(DISTINCT rp.restaurant_id) as restaurant_count,
    c.name as campus_name
FROM promotional_banners pb
LEFT JOIN restaurant_promotions rp ON pb.id = rp.banner_id 
    AND rp.is_active = true
    AND (rp.start_date IS NULL OR rp.start_date <= NOW())
    AND (rp.end_date IS NULL OR rp.end_date >= NOW())
LEFT JOIN campuses c ON pb.campus_id = c.id
WHERE pb.is_active = true
    AND (pb.start_date IS NULL OR pb.start_date <= NOW())
    AND (pb.end_date IS NULL OR pb.end_date >= NOW())
GROUP BY pb.id, c.name
ORDER BY pb.display_order;

-- ============================================
-- 5. Create view: promoted_restaurants_detail
-- ============================================
CREATE OR REPLACE VIEW promoted_restaurants_detail AS
SELECT 
    rp.id as promotion_id,
    rp.banner_id,
    pb.title as banner_title,
    pb.subtitle as banner_subtitle,
    pb.banner_type,
    pb.style_config,
    pb.display_order as banner_order,
    rp.display_order as restaurant_order,
    rp.promo_text,
    rp.discount_badge,
    r.id as restaurant_id,
    r.name as restaurant_name,
    r.image as restaurant_image,
    r.rating,
    r.cuisine,
    r.cost_for_two,
    r.delivery_time,
    r.is_active as restaurant_active
FROM restaurant_promotions rp
JOIN promotional_banners pb ON rp.banner_id = pb.id
JOIN restaurants r ON rp.restaurant_id = r.id
WHERE rp.is_active = true
    AND pb.is_active = true
    AND r.is_active = true
    AND (rp.start_date IS NULL OR rp.start_date <= NOW())
    AND (rp.end_date IS NULL OR rp.end_date >= NOW())
    AND (pb.start_date IS NULL OR pb.start_date <= NOW())
    AND (pb.end_date IS NULL OR pb.end_date >= NOW())
ORDER BY pb.display_order, rp.display_order;

-- ============================================
-- 6. Enable Row Level Security
-- ============================================
ALTER TABLE promotional_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_promotions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. Create RLS Policies
-- ============================================

-- Public can view active promotional banners
DROP POLICY IF EXISTS "Public can view active promotional banners" ON promotional_banners;
CREATE POLICY "Public can view active promotional banners"
    ON promotional_banners FOR SELECT
    USING (is_active = true);

-- Admins can manage promotional banners
DROP POLICY IF EXISTS "Admins can manage promotional banners" ON promotional_banners;
CREATE POLICY "Admins can manage promotional banners"
    ON promotional_banners FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM customers
            WHERE customers.id = auth.uid()
            AND customers.is_admin = true
        )
    );

-- Public can view active restaurant promotions
DROP POLICY IF EXISTS "Public can view active restaurant promotions" ON restaurant_promotions;
CREATE POLICY "Public can view active restaurant promotions"
    ON restaurant_promotions FOR SELECT
    USING (is_active = true);

-- Admins can manage restaurant promotions
DROP POLICY IF EXISTS "Admins can manage restaurant promotions" ON restaurant_promotions;
CREATE POLICY "Admins can manage restaurant promotions"
    ON restaurant_promotions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM customers
            WHERE customers.id = auth.uid()
            AND customers.is_admin = true
        )
    );

-- ============================================
-- 8. Create sample promotional banners
-- ============================================

-- Sample Banner 1: Powered by KhaaoGully
INSERT INTO promotional_banners (
    title,
    subtitle,
    description,
    banner_type,
    category,
    display_order,
    style_config,
    is_active,
    display_layout,
    max_restaurants
) VALUES (
    '⚡ Powered by KhaaoGully',
    'Premium Partners',
    'Top-rated restaurants verified by KhaaoGully',
    'powered',
    'partnership',
    0,
    '{"backgroundColor": "#84CC16", "textColor": "#FFFFFF", "accentColor": "#FFF", "gradient": {"from": "#84CC16", "to": "#65A30D"}, "glowEffect": true, "badgeStyle": "rounded"}',
    true,
    'horizontal_scroll',
    10
) ON CONFLICT DO NOTHING;

-- Sample Banner 2: KhaaoGully Approved
INSERT INTO promotional_banners (
    title,
    subtitle,
    description,
    banner_type,
    category,
    display_order,
    style_config,
    is_active,
    display_layout,
    max_restaurants
) VALUES (
    '✓ KhaaoGully Approved',
    'Quality Guaranteed',
    'Restaurants meeting our highest standards',
    'approved',
    'quality_badge',
    1,
    '{"backgroundColor": "#3B82F6", "textColor": "#FFFFFF", "accentColor": "#DBEAFE", "gradient": {"from": "#3B82F6", "to": "#2563EB"}, "badgeStyle": "rounded"}',
    true,
    'horizontal_scroll',
    10
) ON CONFLICT DO NOTHING;

-- ============================================
-- Migration complete!
-- ============================================

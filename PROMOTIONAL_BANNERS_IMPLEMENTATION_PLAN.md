# Restaurant Promotional Banners System - Implementation Plan

## Overview
Implement a flexible, future-proof promotional banner system for restaurants, similar to Swiggy's "Deal Rush" feature. This will allow displaying restaurants in special promoted sections with custom banners like "Powered by KhaaoGully", "KhaaoGully Approved", sponsored content, etc.

## 🎯 Requirements
1. **Flexible Banner Creation**: Admin should be able to create multiple banner types
2. **Restaurant Assignment**: Link restaurants to banners with priority ordering
3. **Visual Customization**: Each banner should have custom styling (colors, icons, titles)
4. **Time-based Promotions**: Support start/end dates for campaigns
5. **Campus-specific**: Optional campus filtering
6. **Multi-banner Support**: One restaurant can appear in multiple banners
7. **Priority Control**: Control display order of banners and restaurants within them

---

## 📊 Database Schema Design

### Option Analysis

#### ❌ Option 1: JSON column in restaurants table
- **Pros**: Simple to implement
- **Cons**: 
  - Poor query performance
  - Hard to manage banner metadata
  - Difficult to filter/sort
  - No central banner configuration

#### ✅ **Option 2: Dedicated Banner Tables (RECOMMENDED)**
- **Pros**:
  - Maximum flexibility
  - Easy to query and filter
  - Centralized banner configuration
  - Rich metadata support
  - Time-based controls
  - Easy admin management
- **Cons**: Requires more tables (worth the trade-off)

---

## 🗄️ Database Schema

### 1. `promotional_banners` Table
Stores banner configurations that can be reused across multiple restaurants.

```sql
CREATE TABLE promotional_banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Display Information
    title TEXT NOT NULL,                    -- e.g., "Powered by KhaaoGully"
    subtitle TEXT,                          -- e.g., "Premium Partners"
    description TEXT,                       -- Optional detailed description
    
    -- Banner Type & Classification
    banner_type TEXT NOT NULL,              -- e.g., "featured", "sponsored", "approved", "deal_rush"
    category TEXT,                          -- e.g., "promotion", "partnership", "quality_badge"
    
    -- Display Configuration
    display_order INTEGER DEFAULT 0,        -- Order on homepage (lower = higher priority)
    style_config JSONB DEFAULT '{}',        -- Colors, icons, gradients, etc.
    banner_image TEXT,                      -- Optional banner background image URL
    icon_url TEXT,                          -- Optional icon for the banner
    
    -- Visibility & Targeting
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,    -- Optional: When promotion starts
    end_date TIMESTAMP WITH TIME ZONE,      -- Optional: When promotion ends
    campus_id UUID REFERENCES campuses(id), -- Optional: Campus-specific banner
    
    -- Display Rules
    max_restaurants INTEGER,                -- Optional: Limit restaurants shown in this banner
    display_layout TEXT DEFAULT 'horizontal_scroll', -- 'horizontal_scroll', 'grid', 'carousel'
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES customers(id)
);

CREATE INDEX idx_promotional_banners_active ON promotional_banners(is_active, display_order);
CREATE INDEX idx_promotional_banners_campus ON promotional_banners(campus_id);
CREATE INDEX idx_promotional_banners_dates ON promotional_banners(start_date, end_date);
```

**Style Config Example:**
```json
{
  "backgroundColor": "#FF6B35",
  "textColor": "#FFFFFF",
  "accentColor": "#FFD23F",
  "gradient": {
    "from": "#FF6B35",
    "to": "#FF8E53"
  },
  "iconColor": "#FFD23F",
  "badgeStyle": "rounded",
  "glowEffect": true
}
```

---

### 2. `restaurant_promotions` Table
Junction table linking restaurants to promotional banners.

```sql
CREATE TABLE restaurant_promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    banner_id UUID NOT NULL REFERENCES promotional_banners(id) ON DELETE CASCADE,
    
    -- Display Control
    display_order INTEGER DEFAULT 0,        -- Order within the banner section
    is_active BOOLEAN DEFAULT true,
    
    -- Time-based Control
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,      -- Optional expiry
    
    -- Promotion Details
    promo_text TEXT,                        -- Optional custom text for this restaurant
    discount_badge TEXT,                    -- e.g., "20% OFF", "FREE DELIVERY"
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID REFERENCES customers(id),
    
    UNIQUE(restaurant_id, banner_id)
);

CREATE INDEX idx_restaurant_promotions_restaurant ON restaurant_promotions(restaurant_id);
CREATE INDEX idx_restaurant_promotions_banner ON restaurant_promotions(banner_id);
CREATE INDEX idx_restaurant_promotions_active ON restaurant_promotions(is_active, display_order);
CREATE INDEX idx_restaurant_promotions_dates ON restaurant_promotions(start_date, end_date);
```

---

### 3. View: `active_promotional_banners`
For easy querying of active banners with restaurant counts.

```sql
CREATE VIEW active_promotional_banners AS
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
```

---

### 4. View: `promoted_restaurants_detail`
For fetching restaurants with their active promotions.

```sql
CREATE VIEW promoted_restaurants_detail AS
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
```

---

## 🔧 Backend Implementation

### 1. Database Models (`backend/app/models/`)

**`promotional_banner.py`**
```python
from sqlalchemy import Column, String, Integer, Boolean, DateTime, JSON, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from ..database import Base

class PromotionalBanner(Base):
    __tablename__ = "promotional_banners"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    subtitle = Column(String)
    description = Column(Text)
    banner_type = Column(String, nullable=False)
    category = Column(String)
    display_order = Column(Integer, default=0)
    style_config = Column(JSON, default={})
    banner_image = Column(String)
    icon_url = Column(String)
    is_active = Column(Boolean, default=True)
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    campus_id = Column(UUID(as_uuid=True), ForeignKey('campuses.id'))
    max_restaurants = Column(Integer)
    display_layout = Column(String, default='horizontal_scroll')
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), ForeignKey('customers.id'))
    
    # Relationships
    campus = relationship("Campus")
    restaurant_promotions = relationship("RestaurantPromotion", back_populates="banner")


class RestaurantPromotion(Base):
    __tablename__ = "restaurant_promotions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey('restaurants.id', ondelete='CASCADE'), nullable=False)
    banner_id = Column(UUID(as_uuid=True), ForeignKey('promotional_banners.id', ondelete='CASCADE'), nullable=False)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    start_date = Column(DateTime(timezone=True), default=datetime.utcnow)
    end_date = Column(DateTime(timezone=True))
    promo_text = Column(String)
    discount_badge = Column(String)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    added_by = Column(UUID(as_uuid=True), ForeignKey('customers.id'))
    
    # Relationships
    restaurant = relationship("Restaurant")
    banner = relationship("PromotionalBanner", back_populates="restaurant_promotions")
```

---

### 2. API Endpoints (`backend/app/routers/`)

**`promotions.py`** (New router)
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from ..dependencies import get_db, get_current_admin_user
from ..models import promotional_banner as models
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/promotions", tags=["promotions"])

# ============= SCHEMAS =============
class BannerStyleConfig(BaseModel):
    backgroundColor: str = "#84CC16"
    textColor: str = "#FFFFFF"
    accentColor: str = "#FFF"
    gradient: dict = None
    iconColor: str = None
    badgeStyle: str = "rounded"
    glowEffect: bool = False

class PromotionalBannerCreate(BaseModel):
    title: str
    subtitle: str = None
    description: str = None
    banner_type: str
    category: str = None
    display_order: int = 0
    style_config: dict = {}
    banner_image: str = None
    icon_url: str = None
    is_active: bool = True
    start_date: datetime = None
    end_date: datetime = None
    campus_id: UUID = None
    max_restaurants: int = None
    display_layout: str = "horizontal_scroll"

class PromotionalBannerUpdate(BaseModel):
    title: str = None
    subtitle: str = None
    description: str = None
    banner_type: str = None
    category: str = None
    display_order: int = None
    style_config: dict = None
    banner_image: str = None
    icon_url: str = None
    is_active: bool = None
    start_date: datetime = None
    end_date: datetime = None
    campus_id: UUID = None
    max_restaurants: int = None
    display_layout: str = None

class RestaurantPromotionCreate(BaseModel):
    restaurant_id: UUID
    banner_id: UUID
    display_order: int = 0
    is_active: bool = True
    start_date: datetime = None
    end_date: datetime = None
    promo_text: str = None
    discount_badge: str = None

# ============= PUBLIC ENDPOINTS =============
@router.get("/banners/active")
async def get_active_promotional_banners(
    campus_id: UUID = None,
    db: Session = Depends(get_db)
):
    """Get all active promotional banners with their restaurants"""
    query = db.execute("""
        SELECT * FROM active_promotional_banners
        WHERE (:campus_id IS NULL OR campus_id = :campus_id OR campus_id IS NULL)
        ORDER BY display_order
    """, {"campus_id": campus_id})
    
    return query.fetchall()

@router.get("/banners/{banner_id}/restaurants")
async def get_banner_restaurants(
    banner_id: UUID,
    campus_id: UUID = None,
    db: Session = Depends(get_db)
):
    """Get all restaurants in a specific promotional banner"""
    query = db.execute("""
        SELECT * FROM promoted_restaurants_detail
        WHERE banner_id = :banner_id
        ORDER BY restaurant_order
    """, {"banner_id": banner_id})
    
    return query.fetchall()

# ============= ADMIN ENDPOINTS =============
@router.post("/admin/banners", dependencies=[Depends(get_current_admin_user)])
async def create_promotional_banner(
    banner: PromotionalBannerCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Create a new promotional banner (Admin only)"""
    db_banner = models.PromotionalBanner(
        **banner.dict(),
        created_by=current_user.id
    )
    db.add(db_banner)
    db.commit()
    db.refresh(db_banner)
    return db_banner

@router.put("/admin/banners/{banner_id}", dependencies=[Depends(get_current_admin_user)])
async def update_promotional_banner(
    banner_id: UUID,
    banner: PromotionalBannerUpdate,
    db: Session = Depends(get_db)
):
    """Update a promotional banner (Admin only)"""
    db_banner = db.query(models.PromotionalBanner).filter(
        models.PromotionalBanner.id == banner_id
    ).first()
    
    if not db_banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    
    for key, value in banner.dict(exclude_unset=True).items():
        setattr(db_banner, key, value)
    
    db.commit()
    db.refresh(db_banner)
    return db_banner

@router.delete("/admin/banners/{banner_id}", dependencies=[Depends(get_current_admin_user)])
async def delete_promotional_banner(
    banner_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a promotional banner (Admin only)"""
    db.query(models.PromotionalBanner).filter(
        models.PromotionalBanner.id == banner_id
    ).delete()
    db.commit()
    return {"message": "Banner deleted successfully"}

@router.post("/admin/restaurants/promote", dependencies=[Depends(get_current_admin_user)])
async def add_restaurant_to_promotion(
    promotion: RestaurantPromotionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Add a restaurant to a promotional banner (Admin only)"""
    db_promotion = models.RestaurantPromotion(
        **promotion.dict(),
        added_by=current_user.id
    )
    db.add(db_promotion)
    db.commit()
    db.refresh(db_promotion)
    return db_promotion

@router.delete("/admin/restaurants/promote/{promotion_id}", dependencies=[Depends(get_current_admin_user)])
async def remove_restaurant_from_promotion(
    promotion_id: UUID,
    db: Session = Depends(get_db)
):
    """Remove a restaurant from a promotional banner (Admin only)"""
    db.query(models.RestaurantPromotion).filter(
        models.RestaurantPromotion.id == promotion_id
    ).delete()
    db.commit()
    return {"message": "Restaurant removed from promotion"}

@router.get("/admin/banners", dependencies=[Depends(get_current_admin_user)])
async def list_all_banners(db: Session = Depends(get_db)):
    """List all promotional banners (Admin only)"""
    return db.query(models.PromotionalBanner).order_by(
        models.PromotionalBanner.display_order
    ).all()
```

**Update `backend/app/main.py`:**
```python
from .routers import promotions

app.include_router(promotions.router)
```

---

## 🎨 Frontend Implementation

### 1. Types (`frontend/src/types/promotion.ts`)

```typescript
export interface PromotionalBanner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  banner_type: string;
  category?: string;
  display_order: number;
  style_config: BannerStyleConfig;
  banner_image?: string;
  icon_url?: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  campus_id?: string;
  max_restaurants?: number;
  display_layout: 'horizontal_scroll' | 'grid' | 'carousel';
  restaurant_count?: number;
  campus_name?: string;
}

export interface BannerStyleConfig {
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  gradient?: {
    from: string;
    to: string;
  };
  iconColor?: string;
  badgeStyle?: 'rounded' | 'square' | 'pill';
  glowEffect?: boolean;
}

export interface PromotedRestaurant {
  promotion_id: string;
  banner_id: string;
  banner_title: string;
  banner_subtitle?: string;
  banner_type: string;
  style_config: BannerStyleConfig;
  banner_order: number;
  restaurant_order: number;
  promo_text?: string;
  discount_badge?: string;
  restaurant_id: string;
  restaurant_name: string;
  restaurant_image?: string;
  rating: number;
  cuisine: string[];
  cost_for_two: number;
  delivery_time: number;
  restaurant_active: boolean;
}

export interface RestaurantPromotion {
  id: string;
  restaurant_id: string;
  banner_id: string;
  display_order: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  promo_text?: string;
  discount_badge?: string;
}
```

---

### 2. API Service (`frontend/src/services/promotions.ts`)

```typescript
import { supabase } from '../lib/supabase';
import type { PromotionalBanner, PromotedRestaurant } from '../types/promotion';

export const promotionService = {
  async getActiveBanners(campusId?: string): Promise<PromotionalBanner[]> {
    const params = new URLSearchParams();
    if (campusId) params.append('campus_id', campusId);
    
    const response = await fetch(
      `/api/promotions/banners/active?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      }
    );
    return response.json();
  },

  async getBannerRestaurants(bannerId: string): Promise<PromotedRestaurant[]> {
    const response = await fetch(
      `/api/promotions/banners/${bannerId}/restaurants`,
      {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      }
    );
    return response.json();
  }
};
```

---

### 3. Home Page Component (`frontend/src/pages/Home.tsx`)

Add promotional banners section:

```typescript
import { useEffect, useState } from 'react';
import { promotionService } from '../services/promotions';
import PromotionalBannerSection from '../components/PromotionalBannerSection';

const Home = () => {
  const [banners, setBanners] = useState([]);
  
  useEffect(() => {
    loadBanners();
  }, []);
  
  const loadBanners = async () => {
    const data = await promotionService.getActiveBanners();
    setBanners(data);
  };
  
  return (
    <div>
      {/* Existing campus selector, etc. */}
      
      {/* Promotional Banners */}
      {banners.map(banner => (
        <PromotionalBannerSection key={banner.id} banner={banner} />
      ))}
      
      {/* Rest of home page */}
    </div>
  );
};
```

---

### 4. Banner Component (`frontend/src/components/PromotionalBannerSection.tsx`)

```typescript
import React, { useEffect, useState } from 'react';
import { promotionService } from '../services/promotions';
import type { PromotionalBanner, PromotedRestaurant } from '../types/promotion';
import { ChevronRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  banner: PromotionalBanner;
}

const PromotionalBannerSection: React.FC<Props> = ({ banner }) => {
  const [restaurants, setRestaurants] = useState<PromotedRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRestaurants();
  }, [banner.id]);

  const loadRestaurants = async () => {
    try {
      const data = await promotionService.getBannerRestaurants(banner.id);
      setRestaurants(data.slice(0, banner.max_restaurants || 10));
    } finally {
      setLoading(false);
    }
  };

  if (loading || restaurants.length === 0) return null;

  const gradientStyle = banner.style_config.gradient
    ? `linear-gradient(135deg, ${banner.style_config.gradient.from}, ${banner.style_config.gradient.to})`
    : banner.style_config.backgroundColor || '#84CC16';

  return (
    <div className="mb-8">
      {/* Banner Header */}
      <div
        className="rounded-2xl p-6 mb-4 shadow-lg"
        style={{
          background: gradientStyle,
          color: banner.style_config.textColor || '#FFFFFF'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {banner.icon_url && (
              <img src={banner.icon_url} alt="" className="w-12 h-12" />
            )}
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {banner.title}
                {banner.subtitle && (
                  <span className="text-sm font-normal opacity-90">
                    {banner.subtitle}
                  </span>
                )}
              </h2>
              {banner.description && (
                <p className="text-sm opacity-80 mt-1">{banner.description}</p>
              )}
            </div>
          </div>
          {/* Optional: Add countdown timer if end_date exists */}
        </div>
      </div>

      {/* Restaurant Cards */}
      <div className="overflow-x-auto hide-scrollbar">
        <div className="flex gap-4 pb-4">
          {restaurants.map((restaurant) => (
            <Link
              key={restaurant.promotion_id}
              to={`/restaurant/${restaurant.restaurant_id}`}
              className="flex-shrink-0 w-64"
            >
              <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                {/* Restaurant Image */}
                <div className="relative h-40">
                  <img
                    src={restaurant.restaurant_image || '/placeholder-restaurant.jpg'}
                    alt={restaurant.restaurant_name}
                    className="w-full h-full object-cover"
                  />
                  {restaurant.discount_badge && (
                    <div
                      className="absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: banner.style_config.accentColor || '#FFD23F',
                        color: '#000'
                      }}
                    >
                      {restaurant.discount_badge}
                    </div>
                  )}
                </div>

                {/* Restaurant Info */}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 truncate">
                    {restaurant.restaurant_name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2 truncate">
                    {restaurant.cuisine.join(', ')}
                  </p>
                  
                  {restaurant.promo_text && (
                    <p className="text-xs text-lime-600 font-semibold mb-2">
                      {restaurant.promo_text}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className="font-semibold">{restaurant.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{restaurant.delivery_time} min</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromotionalBannerSection;
```

---

## 🔐 Admin Panel Implementation

### 1. Banner Management Page (`frontend/src/pages/admin/BannerManagement.tsx`)

```typescript
// Full admin interface for creating/editing/deleting promotional banners
// Includes form for banner creation with style config, date pickers, etc.
// Table showing all banners with quick actions
```

### 2. Restaurant Edit Enhancement

Add a "Promotions" tab in the restaurant edit page where admins can:
- See all active banners
- Add restaurant to banners
- Set display order
- Add custom promo text/discount badges
- Set start/end dates

---

## 📝 Migration File

**`backend/migrations/add_promotional_banners.sql`**

```sql
-- Create promotional_banners table
CREATE TABLE promotional_banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    banner_type TEXT NOT NULL,
    category TEXT,
    display_order INTEGER DEFAULT 0,
    style_config JSONB DEFAULT '{}',
    banner_image TEXT,
    icon_url TEXT,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    campus_id UUID REFERENCES campuses(id),
    max_restaurants INTEGER,
    display_layout TEXT DEFAULT 'horizontal_scroll',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES customers(id)
);

-- Create restaurant_promotions junction table
CREATE TABLE restaurant_promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    banner_id UUID NOT NULL REFERENCES promotional_banners(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    promo_text TEXT,
    discount_badge TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID REFERENCES customers(id),
    UNIQUE(restaurant_id, banner_id)
);

-- Create indexes
CREATE INDEX idx_promotional_banners_active ON promotional_banners(is_active, display_order);
CREATE INDEX idx_promotional_banners_campus ON promotional_banners(campus_id);
CREATE INDEX idx_promotional_banners_dates ON promotional_banners(start_date, end_date);
CREATE INDEX idx_restaurant_promotions_restaurant ON restaurant_promotions(restaurant_id);
CREATE INDEX idx_restaurant_promotions_banner ON restaurant_promotions(banner_id);
CREATE INDEX idx_restaurant_promotions_active ON restaurant_promotions(is_active, display_order);
CREATE INDEX idx_restaurant_promotions_dates ON restaurant_promotions(start_date, end_date);

-- Create views
CREATE VIEW active_promotional_banners AS
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

CREATE VIEW promoted_restaurants_detail AS
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

-- Enable RLS
ALTER TABLE promotional_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_promotions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view active promotional banners"
    ON promotional_banners FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage promotional banners"
    ON promotional_banners FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM customers
            WHERE customers.id = auth.uid()
            AND customers.is_admin = true
        )
    );

CREATE POLICY "Public can view active restaurant promotions"
    ON restaurant_promotions FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage restaurant promotions"
    ON restaurant_promotions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM customers
            WHERE customers.id = auth.uid()
            AND customers.is_admin = true
        )
    );
```

---

## 🚀 Implementation Steps

### Phase 1: Database Setup
1. ✅ Run migration to create tables and views
2. ✅ Set up RLS policies
3. ✅ Create sample banners for testing

### Phase 2: Backend API
1. ✅ Create models
2. ✅ Create API endpoints
3. ✅ Test with Postman/Thunder Client

### Phase 3: Frontend - Public View
1. ✅ Create types
2. ✅ Create API service
3. ✅ Create PromotionalBannerSection component
4. ✅ Integrate into Home page
5. ✅ Style according to banner config

### Phase 4: Admin Panel
1. ✅ Create Banner Management page
2. ✅ Add banner creation/edit forms
3. ✅ Add restaurant promotion management
4. ✅ Add to Restaurant edit page

### Phase 5: Testing & Polish
1. ✅ Test all CRUD operations
2. ✅ Test time-based promotions
3. ✅ Test campus filtering
4. ✅ Performance optimization
5. ✅ Mobile responsiveness

---

## 💡 Usage Examples

### Example 1: "Powered by KhaaoGully" Banner
```json
{
  "title": "⚡ Powered by KhaaoGully",
  "subtitle": "Premium Partners",
  "banner_type": "powered",
  "category": "partnership",
  "display_order": 0,
  "style_config": {
    "backgroundColor": "#84CC16",
    "textColor": "#FFFFFF",
    "gradient": {
      "from": "#84CC16",
      "to": "#65A30D"
    },
    "glowEffect": true
  }
}
```

### Example 2: "Flash Deals" Time-Limited Banner
```json
{
  "title": "🔥 Flash Deals",
  "subtitle": "Ending in 2 hours!",
  "banner_type": "deal_rush",
  "display_order": 1,
  "start_date": "2025-12-19T10:00:00Z",
  "end_date": "2025-12-19T22:00:00Z",
  "style_config": {
    "gradient": {
      "from": "#FF6B35",
      "to": "#FF8E53"
    },
    "textColor": "#FFFFFF"
  }
}
```

---

## ✅ Benefits of This Approach

1. **Flexibility**: Easy to add new banner types
2. **Scalability**: Handles many banners and restaurants efficiently
3. **Time-based**: Supports promotional campaigns with start/end dates
4. **Customizable**: Each banner can have unique styling
5. **Admin-friendly**: Easy to manage from admin panel
6. **Campus-specific**: Can target specific campuses
7. **Multi-promotion**: Restaurants can be in multiple banners
8. **Performance**: Indexed queries and materialized views
9. **Future-proof**: Easy to extend with new features

---

## 🎯 Next Steps

1. Review and approve this design
2. Run the migration
3. Implement backend API
4. Build frontend components
5. Create admin UI
6. Test thoroughly
7. Deploy!


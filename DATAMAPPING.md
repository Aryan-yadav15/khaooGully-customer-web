User: now ther eis a major flo change that is supppose to happen here so current flow is that we somein selct a campus and than browse restraunt makes perfect sene but not good for user experiance , coz if they comin a foood delivery site they should see restraunt on landing page not radom locaiton so what i was planning is list all the restraunt we ahve and also shouw all the promotio banners regardless of hotspot they serve and now when they try and click a restraunt we ask them to sign in and as soona s they sign in and  they are from @kiit.ac.in or @kims.ac.in than we ask them to seta default campus or hotspot now once that is done w ejust redirect them to 
http://localhost:5173/campus/a70ec766-b921-4ccf-b469-6504c1e01ad6/restaurants

everytim they comin and only when they wish to switch the hotspot they can go in to a capus selct url wher they cahge the hotspot as thy wish so do  oyu get it 

i wat to display my promotion banner and all restraunt to a non logged in user but once log in we ask them to set defauilt and than we alwasys have the default campus and then show them that url only http://localhost:5173/campus/a70ec766-b921-4ccf-b469-6504c1e01ad6/restaurants

but it is qute a difficult taks of how would you map data so understand if you have any iissue please ask  them as you are a profession system design enginners give you input no code jsut talk

GitHub Copilot: I understand the concept you're proposing. Let me summarize and then ask some clarifying questions as a system design engineer:

## My Understanding of the New Flow

**Landing Page (Non-Logged In):**
- Show ALL promotional banners (campus-agnostic)
- Show ALL restaurants (not filtered by any campus)
- User can browse freely

**On Restaurant Click (Non-Logged In):**
- Prompt sign-in
- After sign-in with @kiit.ac.in or @kims.ac.in email → Ask to set default campus/hotspot
- Redirect to `/campus/{default_campus_id}/restaurants`

**Returning Logged-In Users:**
- Always land on their default campus view
- Can manually switch campus via a settings/selector page

---

## Questions I Need Answered

### 1. **Restaurant-Campus Relationship**
- Does one restaurant serve **multiple campuses/hotspots**, or is each restaurant tied to **one specific campus**?
- When showing "all restaurants" on landing page, are we de-duplicating (showing each restaurant once) or showing them per-hotspot they serve?

### 2. **What Happens After Click?**
- When a non-logged-in user clicks a restaurant card, do we:
  - (A) Show a sign-in modal/popup immediately?
  - (B) Take them to the restaurant detail page but block "Add to Cart"?
  - (C) Redirect to a sign-in page entirely?

### 3. **Non-KIIT/KIMS Users**
- What happens if someone signs in with a different email domain (not @kiit.ac.in or @kims.ac.in)?
- Do they get blocked, or shown a message, or allowed in some limited way?

### 4. **Promotional Banners Data**
- Currently banners have restaurants assigned. Are those assignments campus-specific?
- Should the banner show **all its assigned restaurants** regardless of which campus they're for?

### 5. **Default Campus Storage**
- Where do we store the user's default campus?
  - (A) In the `customers` table in the database?
  - (B) Just in localStorage on frontend?
  - (C) Both?

### 6. **Cart Behavior**
- Cart is likely campus-specific. If user switches campus, does cart clear?
- On the new landing page (before login), should users even be able to add to cart, or is that blocked?



## 📊 Data Relationship Summary

### **Core Entities & Their Relationships**

```
┌─────────────┐     1:N      ┌─────────────┐     N:M      ┌─────────────┐
│  CAMPUSES   │◄────────────│ ORDER_POOLS │◄────────────│ RESTAURANTS │
│  (Hotspot)  │              │   (Pool)    │              │             │
└─────────────┘              └─────────────┘              └─────────────┘
                                   │                            │
                             junction table:                    │
                         pool_restaurants                       │
                                   │                            │
                                   ▼                            │
                        ┌─────────────────┐                     │
                        │ pool_restaurants│                     │
                        │  - pool_id      │                     │
                        │  - restaurant_id│                     │
                        │  - is_active    │                     │
                        └─────────────────┘                     │
                                                                │
                                                          ┌─────▼─────┐
                                                          │  DISHES   │
                                                          └───────────┘
```

### **Key Understanding:**

1. **Campus (Hotspot)**
   - A delivery destination (e.g., "KIIT Campus 1", "KIMS Main Gate")
   - Has `id`, `name`, `code`, `hotspot_location` (exact delivery spot), `latitude`, `longitude`

2. **Pool (Order Pool)**
   - A **time-bound delivery batch** to a **specific campus**
   - `order_pools` has `campus_id` → **One pool belongs to ONE campus**
   - Has collection window (`collection_start`, `collection_end`) and delivery time
   - Multiple restaurants can be part of one pool

3. **Restaurant**
   - Just exists in `restaurants` table with menu, location, etc.
   - **NOT directly tied to any campus**
   - Gets associated via **pools**

4. **Pool ↔ Restaurant Mapping**
   - `pool_restaurants` junction table links pools to restaurants
   - A **restaurant can be in MULTIPLE pools** (serving different campuses)
   - A **pool can have MULTIPLE restaurants**
   
5. **The Flow (Current):**
   ```
   User selects Campus → 
   System finds active Pools for that Campus → 
   System finds Restaurants in those Pools (via pool_restaurants) → 
   User sees only restaurants that can deliver to their campus
   ```

6. **Promotional Banners**
   - `promotional_banners` - the banner sections (e.g., "⚡ Powered by KhaaoGully")
   - `restaurant_promotions` - junction table linking banners to restaurants
   - Banners can optionally have `campus_id` to restrict to a campus, or NULL for global
   - Currently **NOT tied to pools**, just directly to restaurants

---

## 🔑 Critical Insight

**A Restaurant doesn't inherently "serve" a campus.**

Instead:
- A **Pool** serves a **Campus**
- **Restaurants** are added to **Pools**
- Therefore: Restaurant → Pool → Campus

**So when you want to show "all restaurants":**
- You can't just list restaurants independently
- You need to show: "This restaurant is available via Pool X to Campus Y"
- OR just show all restaurants as a discovery page (without delivery context)

---


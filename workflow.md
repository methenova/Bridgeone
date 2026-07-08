# BridgeOne & Popin Live Shopping Workflow

This document maps out the end-to-end user workflows, signaling mechanisms, and WebRTC integration of the BridgeOne Live Shopping platform.

## 1. User Authentication & Routing Flow

```
                        Register (Select Account Type)
                                    │
                                    ▼
                         Login (Supabase Auth)
                                    │
                  ┌─────────────────┴──────────────────┐
                  ▼                                    ▼
          Seller Dashboard                    Customer Marketplace
      (Restricted to 'seller')             (Restricted to 'customer')
```

---

## 2. Seller Onboarding & Live Broadcast Flow

```
                      Seller Login
                           │
                           ▼
                   Create / Edit Shop
                           │
                           ▼
                    Upload Shop Logo
                           │
                           ▼
                   Create Categories
                           │
                           ▼
                     Add Products
                           │
                           ▼
                  Upload Product Images
                           │
                           ▼
                       Set Price
                           │
                           ▼
                   Publish Products
                           │
                           ▼
                 ──────────────────────
                      LIVE SELLING
                 ──────────────────────
                           │
                           ▼
                    Click "Go Live"
                           │
                           ▼
               Request Camera/Mic Permissions
                           │
                           ▼
                  Create MediaStream
                           │
                           ▼
                Create RTCPeerConnection
                           │
                           ▼
                  Generate SDP Offer
                           │
                           ▼
                 Save Offer → Supabase
                           │
                           ▼
             Wait for Viewer Connections
                           │
                           ▼
                 Receive SDP Answers
                           │
                           ▼
               Exchange ICE Candidates
                           │
                           ▼
                  WebRTC Connected
                           │
                           ▼
                  LIVE VIDEO STARTS
                           │
                           ▼
                 Talk About Products
                           │
                           ▼
                    Pin Product Card
                           │
                           ▼
                 Broadcast Product Pin
                           │
                           ▼
                 Receive Chat Comments
                           │
                           ▼
                    Receive Hearts
                           │
                           ▼
                Answer Speaking Viewers
                           │
                           ▼
                   Continue Streaming
                           │
                           ▼
                     End Live Room
                           │
                           ▼
                  Clean Up Video Room
                           │
                           ▼
                   Save Live Session
                           │
                           ▼
                       Analytics
```

---

## 3. Customer Shopping & Streaming Flow

```
                      Landing Page
                           │
                           ▼
                   Browse Marketplace
                           │
                           ▼
                       Open Shop
                           │
                           ▼
                    Click Watch Live
                           │
                           ▼
                      Read Offer
                           │
                           ▼
                Create RTCPeerConnection
                           │
                           ▼
                   Create SDP Answer
                           │
                           ▼
                      Send Answer
                           │
                           ▼
                 Exchange ICE Candidates
                           │
                           ▼
                  Receive Seller Video
                           │
                           ▼
                  Watch Live Stream
                           │
                           ▼
                     Send Comment
                           │
                           ▼
                      Send Heart
                           │
                           ▼
                 Pinned Product Appears
                           │
                           ▼
                    Click Buy Now
                           │
                           ▼
                     Add To Cart
                           │
                           ▼
                      Checkout Page
                           │
                           ▼
                        Payment
                           │
                           ▼
                     Order Success
```

---

## 4. Supabase Realtime Signaling Flow

```
Seller (Host)  ─── Offer ───►  video_rooms      ◄─── Answer ───  Viewer (Customer)
Seller (Host)  ◄── Candidates ──► video_candidates ◄── Candidates ──► Viewer (Customer)

Realtime Broadcast Channel
       │
       ├──────────────► Chat Messages (Real-time Comment Overlay)
       │
       ├──────────────► Reaction Hearts (Floating Heart Animations)
       │
       ├──────────────► Product Pinning (Synchronized Showcase card)
       │
       └──────────────► Join Requests / Approvals (Request to Speak)
```

---

## 5. Feature Flows (Product, Chat, Reactions)

### Product Pinning Flow
```
Seller clicks product ──► Broadcasts Pin ──► Viewers see floating product card ──► Buy Now ──► Checkout
```

### Chat Feed Flow
```
Viewer Comment ──► Broadcast Channel ──► Appends to Seller and All Viewers Chat Lists
```

### Heart Reaction Flow
```
Viewer clicks Heart ──► Broadcasts Reaction ──► Triggers Floating animation on all tabs
```

---

## 6. Admin Control Center Flow

```
                      Admin Login
                           │
                           ▼
                    Dashboard Panel
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
     Users               Shops              Products
  (Moderate role)     (Approve/Edit)     (Manage catalog)
       │                   │                   │
       ▼                   ▼                   ▼
  Categories            Orders              Settings
 (Curate list)     (Track status)       (Global configs)
```

---

## 7. Technology Stack Architecture

```
                       React + Vite
                            │
                            ▼
                      React Router
                            │
                            ▼
                      Zustand Store
                            │
                            ▼
                   React Query Cache
                            │
                            ▼
              ┌─────────────────────────────┐
              │         Supabase            │
              ├─────────────────────────────┤
              │ - Authentication            │
              │ - PostgreSQL Database       │
              │ - Storage (Logos/Thumbnails)│
              │ - Realtime Broadcast        │
              └─────────────────────────────┘
                            │
                            ▼
                         WebRTC
                            │
                            ▼
               Seller Camera ───► Customer Video
                            │
                            ▼
                Live Shopping Experience
```

---

## 8. Widget Live Call Consultation Flow (Backend Mapping)

This section maps out how the serverless Supabase implementation mirrors standard client-server backend routing flows for widget consultation calls.

```
Standard Backend Flow                   Supabase WebRTC Implementation
──────────────────────                   ──────────────────────────────
Customer Call Start                     Insert row → call_logs (status: 'missed')
       │                                                 │
       ▼                                                 ▼
POST /create-session                     Insert row → video_rooms (status: 'live')
       │                                                 │
       ▼                                                 ▼
Authentication                           Supabase Auth + Database RLS policies
       │                                                 │
       ▼                                                 ▼
Find Available Agent                     Query is_online → shops table
       │                                                 │
       ▼                                                 ▼
Generate Room ID                         Custom room_code dynamically built
       │                                                 │
       ▼                                                 ▼
Socket Event                             Supabase Realtime Database Channel
       │                                                 │
       ▼                                                 ▼
Notify Agent                             LivePage.jsx postgres_changes listener
       │                                                 │
       ▼                                                 ▼
Agent Accepts                            Update room offer with answer SDP
       │                                                 │
       ▼                                                 ▼
Join Video Room                          Exchange ICE candidates via DB triggers
```

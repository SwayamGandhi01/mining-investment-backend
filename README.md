# Investment Platform Backend & Admin Panel

A scalable enterprise backend built with **Next.js 15 App Router**, **TypeScript**, **MongoDB Atlas (Mongoose)**, **Cloudinary**, and **JWT Cookie Authentication**.

Includes a full admin management panel with real-time CRUD operations, dark mode, responsive tables, and forms. Designed to seamlessly connect to a separate Next.js frontend or mobile app.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router, Route Handlers)
- **Language:** TypeScript
- **Database:** MongoDB Atlas + Mongoose (Singleton Pattern with global cache)
- **Media:** Cloudinary SDK
- **Authentication:** JWT (jsonwebtoken & jose for Edge Middleware), HTTP-Only Cookies, bcryptjs
- **Validation:** Zod
- **Forms:** React Hook Form + @hookform/resolvers
- **UI:** Tailwind CSS v4, Lucide React, Sonner Toasts

---

## Project Structure

```
src/
├── app/
│   ├── admin/                 # Admin Panel Pages
│   │   ├── login/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── events/
│   │   │   ├── speakers/
│   │   │   ├── sponsors/
│   │   │   ├── exhibitors/
│   │   │   ├── companies/
│   │   │   ├── blogs/
│   │   │   ├── gallery/
│   │   │   ├── registrations/
│   │   │   ├── users/
│   │   │   └── settings/
│   ├── api/                   # REST API Route Handlers
│   │   ├── auth/ (login, logout, me, seed)
│   │   ├── upload/
│   │   ├── events/
│   │   ├── speakers/
│   │   ├── sponsors/
│   │   ├── exhibitors/
│   │   ├── companies/
│   │   ├── blogs/
│   │   ├── gallery/
│   │   ├── registrations/
│   │   ├── users/
│   │   └── settings/
├── components/
│   ├── admin/                 # Header, Sidebar, Theme, Auth context
│   ├── forms/                 # Reusable Form Controls (TextField, RichText, Upload, etc.)
│   ├── tables/                # Reusable DataTable with pagination/search/sort
│   └── common/                # ConfirmDialog, Badge, StatusToggle, EmptyState
├── lib/                       # Utility Modules
│   ├── mongodb.ts             # Singleton Mongoose Connection
│   ├── cloudinary.ts          # Upload / Delete Helpers
│   ├── auth.ts                # Passwords & Session
│   ├── jwt.ts                 # Dual JWT (jsonwebtoken + jose)
│   ├── response.ts            # Standard API Envelopes
│   ├── pagination.ts          # Query Builders
│   ├── slug.ts                # Auto Unique Slugs
│   └── validators.ts          # Common Zod Schemas
├── models/                    # Mongoose Data Models (10 modules + Admin)
└── middleware.ts              # Route Guard & JWT Edge Validator
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and configure your credentials:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/investment-db?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Setup & Running Locally

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Seed Initial Superadmin:**
   Call the one-time seed API endpoint to create the initial admin account:
   ```bash
   curl -X POST http://localhost:3000/api/auth/seed \
     -H "Content-Type: application/json" \
     -d '{"name": "Admin", "email": "admin@example.com", "password": "Password123!"}'
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000/admin/login` in your browser.

4. **Production Build Verification:**
   ```bash
   npm run build
   ```

---

## API Standard Response Format

**Success:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

**Paginated Response:**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## Features & Modules

- **Events:** Manage dates, venues, agendas, cover image, gallery, SEO tags.
- **Speakers:** Keynotes, job titles, bio, social links, status.
- **Sponsors:** Tiers (Platinum, Gold, Silver, Bronze), brand logos, links.
- **Exhibitors:** Booth numbers, category, products, contact details.
- **Companies:** Corporate directory, industry, headquarters, social media.
- **Blogs:** Articles, rich text, categories, featured post toggles.
- **Gallery:** Multi-photo album uploads powered by Cloudinary.
- **Registrations:** Unique auto-generated registration codes (`REG-XXXXXX`), attendee ticket status.
- **Users:** Member accounts, active state toggles, profiles.
- **Settings:** Platform title, description, maintenance mode toggle, logo uploads.

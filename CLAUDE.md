# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SEO Rocket Website is a Next.js 14 application showcasing SEO tools and software. The project uses TypeScript, Tailwind CSS, and Supabase as the backend database. It features a dynamic content management system with real-time updates, tag-based filtering, and an admin interface for managing products and categories.

## Common Development Commands

```bash
# Development
npm run dev                    # Start development server at http://localhost:3000
npm run build                  # Build for production
npm run start                  # Start production server
npm run lint                   # Run ESLint

# Database migration
npm run migrate-to-supabase    # Run Supabase migration script
```

## Project Architecture

### Core Database Structure
The application uses Supabase with three main tables:
- `products`: Core product information (software_name, slug, description, url, published, featured, free, etc.)
- `tags`: Category tags with order management (name, slug, order_index)
- `product_tags`: Junction table for many-to-many relationships with ordering (product_id, tag_id, order_position)

### Key Architecture Components

**Data Layer** (`lib/supabase.ts`):
- Contains all database functions and TypeScript interfaces
- Handles both legacy array-based tags and new junction table structure
- Provides functions for CRUD operations, ordering, and complex queries
- Includes error handling and fallback mechanisms for missing Supabase configuration

**Data Transformation** (`data/software-loader.ts`):
- Converts Supabase data to frontend-friendly SoftwareItem format
- Handles both legacy and modern tag structures
- Provides filtering and sorting functions for different tag types (Featured, Free, All, custom tags)

**Frontend Structure**:
- `app/(public)/`: Public-facing pages including main homepage and product pages
- `app/admin/`: Admin interface for content management
- `app/api/`: API routes for data fetching
- `components/`: Reusable React components

### Tag System Architecture
The application supports two tag systems:
1. **Legacy**: Array-based tags stored directly in products.tags field
2. **Modern**: Junction table (product_tags) with proper ordering and relationships

The code automatically detects which system is available and falls back gracefully.

### System Tags vs Custom Tags
- **System Tags**: "Featured", "Free", "All" - managed via product boolean fields
- **Custom Tags**: User-defined categories managed through the tags table and junction relationships
- Each tag type has its own ordering system (featured_order, free_order, all_order for system tags, order_position for custom tags)

## Environment Configuration

Required environment variables in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

The application gracefully handles missing Supabase configuration by:
- Returning empty arrays from database functions
- Showing helpful error messages to users
- Logging configuration warnings to console

## Database Schema Requirements

**Products Table**:
```sql
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  software_name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  description TEXT,
  url VARCHAR,
  tags TEXT, -- Legacy field for backward compatibility
  published BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  free BOOLEAN DEFAULT false,
  icon_url VARCHAR,
  priority INTEGER DEFAULT 100,
  featured_order INTEGER DEFAULT 0,
  free_order INTEGER DEFAULT 0,
  all_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Tags Table**:
```sql
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  color VARCHAR,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Product Tags Junction Table**:
```sql
CREATE TABLE product_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  order_position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, tag_id)
);
```

## Key Development Patterns

### Database Queries
- All database functions include null checks for Supabase client
- Functions provide fallbacks for missing configuration
- Error handling logs issues but returns empty arrays rather than throwing

### Data Loading Pattern
```typescript
// Always try modern junction table approach first
try {
  const productsWithTags = await getProductsWithTagsByTag(tagName)
  // Process modern data structure
} catch (error) {
  // Fall back to legacy array-based approach
  const products = await getProductsByTag(tagName)
  // Process legacy data structure
}
```

### Ordering System
- System tags use dedicated order fields: `featured_order`, `free_order`, `all_order`
- Custom tags use `order_position` in the junction table
- Admin interface supports drag-and-drop reordering for all tag types

## File Upload & Image Management
The application includes a complete image management system:
- File upload to Supabase storage bucket `product-icons`
- Automatic image resizing to 200x200px
- Image cropping interface for non-square images
- Helper functions for resizing, cropping, and upload management

## Testing Supabase Connection
If Supabase is not configured, the application will:
- Log warnings to browser console
- Return empty data arrays
- Display user-friendly error messages
- Continue to function without crashing

This allows development to continue even without a Supabase setup, making the application more resilient during development and deployment.
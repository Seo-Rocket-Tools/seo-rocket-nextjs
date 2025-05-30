# SEO Rocket Website

A modern, dynamic website showcasing SEO tools and software built with Next.js, TypeScript, and Supabase.

## Features

- **Dynamic Content Management**: Powered by Supabase for real-time data updates
- **Modern UI**: Beautiful, responsive design with interactive 3D card effects
- **Tag-based Filtering**: Dynamic filtering system with horizontal scrolling
- **Admin Interface**: Manage products and tags with a user-friendly interface
- **Real-time Updates**: All data comes directly from Supabase database

## Technologies Used

- **Frontend**: Next.js 14, React 18, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Deployment**: Static hosting ready

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd seo-rocket-nextjs
npm install
```

### 2. Set Up Supabase (Required)

#### a) Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and create a new project
2. Wait for the project to be fully initialized

#### b) Create Database Tables

Run the following SQL commands in your Supabase SQL editor:

```sql
-- Create products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  software_name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  description TEXT,
  emoji VARCHAR,
  url VARCHAR,
  tags TEXT,
  published BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  free BOOLEAN DEFAULT false,
  image_url VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tags table
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_products_published ON products(published);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_products_free ON products(free);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_tags_slug ON tags(slug);
```

#### c) Configure Environment Variables (Required)

Create a `.env.local` file in your project root:

```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

To get these values:
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the "Project URL" for `NEXT_PUBLIC_SUPABASE_URL`
4. Copy the "anon public" key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Add Sample Data

Add some sample data to your Supabase tables either through:
- Supabase dashboard (Table Editor)
- Your admin interface
- Direct SQL inserts

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the website.

## Project Structure

```
seo-rocket-nextjs/
├── app/
│   ├── admin/
│   │   └── page.tsx          # Admin dashboard
│   ├── page.tsx              # Main homepage
│   └── layout.tsx            # Root layout
├── data/
│   └── software-loader.ts    # Supabase data loader
├── lib/
│   ├── useRealtime.ts        # Realtime functionality hooks
│   └── supabase.ts           # Supabase client and database functions
└── scripts/
    └── add-priority-column.sql # Database schema updates
```

## Data Flow

1. **Primary Source**: All data comes from Supabase database
2. **Admin Updates**: Changes made through the admin interface are saved to Supabase
3. **Real-time**: UI updates reflect database changes immediately
4. **Error Handling**: Clear error messages when Supabase is not configured

## Key Components

### Software Loader (`data/software-loader.ts`)

The Supabase-powered data loader provides:

- `loadSoftwareData()`: Main function to load all software data
- `getFeaturedSoftware()`: Get featured software items
- `getSoftwareByTag()`: Filter software by tag
- `getAvailableTags()`: Get all available tags

### Database Functions (`lib/supabase.ts`)

Core database operations:

- `getActiveProducts()`: Fetch all published products
- `getFeaturedProducts()`: Fetch featured products
- `getProductsByTag()`: Fetch products by tag
- `getAllTags()`: Fetch all tags

## Deployment

### Environment Variables Required

The application requires Supabase environment variables to function:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Static Hosting (Recommended)

1. Build the project: `npm run build`
2. Deploy to your hosting platform (Netlify, Vercel, etc.)
3. Set environment variables in your hosting platform dashboard
4. Ensure your Supabase database has data

### Traditional Hosting

1. Build: `npm run build`
2. Start: `npm start`
3. Ensure environment variables are set

## Database Schema Details

### Products Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `software_name` | VARCHAR | Display name of the software |
| `slug` | VARCHAR | Unique URL-friendly identifier |
| `description` | TEXT | Software description |
| `emoji` | VARCHAR | Icon emoji |
| `url` | VARCHAR | External URL |
| `tags` | TEXT | Comma-separated tags |
| `published` | BOOLEAN | Whether the product is active |
| `featured` | BOOLEAN | Whether to show in featured section |
| `free` | BOOLEAN | Whether the product is free |
| `image_url` | VARCHAR | Optional image URL |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

### Tags Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `slug` | VARCHAR | URL-friendly tag identifier |
| `name` | VARCHAR | Display name |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Error Handling

### Common Issues

If Supabase is not configured properly, the application will show clear error messages. Make sure to:

1. Follow the Supabase setup instructions above
2. Verify your environment variables are correctly set
3. Check that your Supabase project is active
4. Verify your Supabase database tables are created correctly
5. Ensure you have data in your Supabase tables

### If you get build errors:

1. Run `npm install` to ensure all dependencies are installed
2. Make sure you have Node.js 18+ installed
3. Check that your `.env.local` file is correctly configured
4. Verify your Supabase database tables are created correctly
5. Ensure you have data in your Supabase tables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues or questions:

1. Check the `SUPABASE_CONFIG.md` file for detailed setup instructions
2. Ensure your environment variables are correctly set
3. Check the browser console for any error messages
4. Verify your Supabase database tables are created correctly
5. Ensure you have data in your Supabase tables

## License

All Rights Reserved Copyright 2025 - Designed by SEO Rocket. 💗 
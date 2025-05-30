# Supabase Configuration

To use Supabase with this application, you need to set up the following environment variables in your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Example:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## How to get these values:

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the "Project URL" for `NEXT_PUBLIC_SUPABASE_URL`
4. Copy the "anon public" key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Database Schema

The application expects the following tables to exist in your Supabase database:

### products table
- `id` (uuid, primary key)
- `software_name` (varchar)
- `slug` (varchar, unique)
- `description` (text)
- `emoji` (varchar)
- `url` (varchar)
- `tags` (text)
- `published` (boolean)
- `featured` (boolean)
- `free` (boolean)
- `image_url` (varchar)
- `created_at` (timestamptz)

### tags table
- `id` (uuid, primary key)
- `slug` (varchar)
- `name` (varchar)
- `created_at` (timestamptz)

## Migration

To migrate your existing JSON data to Supabase:

1. Set up your Supabase environment variables
2. Run the application - it will continue to work with the JSON fallback
3. Use the admin interface to bulk import your existing data to Supabase
4. Once verified, the app will automatically use Supabase as the primary data source 
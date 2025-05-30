# Software Management Guide

This directory contains the data loading utilities for your SEO Rocket website powered by Supabase.

## 📁 Files Overview

- `software-loader.ts` - TypeScript utilities for loading and filtering data from Supabase
- `README.md` - This documentation file

## 🗄️ Data Management

All software data is now managed through **Supabase database tables**:

- **products** table - Contains all software information
- **tags** table - Contains available filter tags

## 🚀 Adding New Software

### Method 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to Table Editor > products
3. Click "Insert" and add a new row with:
   - `software_name`: Display name
   - `slug`: URL-friendly identifier 
   - `description`: Brief description
   - `emoji`: Icon emoji
   - `url`: Link to software
   - `tags`: Comma-separated tags
   - `published`: true for active software
   - `featured`: true to show on homepage
   - `free`: true if free, false if premium

### Method 2: Admin Interface

If your website has an admin interface, use that to add/edit software through the web interface.

### Method 3: Direct SQL

```sql
INSERT INTO products (
  software_name, slug, description, emoji, url, tags, 
  published, featured, free
) VALUES (
  'Your Software Name',
  'your-software-slug',
  'Brief description of what the software does.',
  '🎯',
  'https://yourwebsite.com',
  'Productivity, SEO',
  true,
  true,
  false
);
```

## 🏷️ Database Schema

### Products Table

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | UUID | Primary key (auto-generated) | - |
| `software_name` | VARCHAR | Display name | "SEO Automator" |
| `slug` | VARCHAR | Unique URL identifier | "seo-automator" |
| `description` | TEXT | Brief description | "Automate your SEO tasks..." |
| `emoji` | VARCHAR | Icon emoji | "🚀" |
| `url` | VARCHAR | External link | "https://example.com" |
| `tags` | TEXT | Comma-separated categories | "SEO, Productivity" |
| `published` | BOOLEAN | Whether active/visible | `true` |
| `featured` | BOOLEAN | Show on homepage | `true` |
| `free` | BOOLEAN | Pricing model | `false` (premium) |
| `image_url` | VARCHAR | Optional image | "" |
| `created_at` | TIMESTAMPTZ | Creation date | auto-generated |

### Tags Table

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | UUID | Primary key | - |
| `slug` | VARCHAR | URL-friendly identifier | "seo-tools" |
| `name` | VARCHAR | Display name | "SEO Tools" |
| `created_at` | TIMESTAMPTZ | Creation date | auto-generated |

## 🏷️ Managing Tags

### Adding New Tags

```sql
INSERT INTO tags (slug, name) VALUES ('new-category', 'New Category');
```

### Available System Tags

These are built into the application:
- `Featured` - Shows featured software
- `Free` - Shows free software 
- `All` - Shows all published software

## 🎯 Best Practices

### Writing Descriptions
- Keep descriptions clear and concise
- Focus on the main benefit or use case
- Use action words (automate, streamline, generate, etc.)
- Mention target audience when relevant

### Choosing Emojis
- Use relevant emojis that represent the software function
- Popular choices: 🚀 🎯 📊 ⚡ 🔗 📱 💬 📈 🛠️ 🎨

### Organizing Tags
- Use existing tags when possible
- Keep tag names concise and clear
- Consider creating specific tags for different software categories

## 📊 Software Lifecycle Management

### Publishing Software
1. Set `published: true` to make visible
2. Set `featured: true` for homepage visibility
3. Add relevant tags for discoverability

### Managing Visibility
- `published: false` - Hides from all public views
- `featured: false` - Removes from featured section
- Use tags to organize by category or target audience

## 🔧 Technical Details

### Data Loading
The `software-loader.ts` file provides functions for:
- `loadSoftwareData()` - Load all software and metadata
- `getActiveSoftware()` - Get only published software
- `getFeaturedSoftware()` - Get featured software
- `getSoftwareByTag()` - Filter by tag
- `getAvailableTags()` - Get all available filter tags

### Real-time Updates
Changes made in Supabase are reflected immediately on your website without requiring a rebuild or deployment.

## 🚨 Important Notes

- Ensure your Supabase environment variables are set correctly
- Test changes in your Supabase dashboard before going live
- Use consistent tag naming for better organization
- Keep URLs updated and working

## 📝 Example: Adding New Software

Adding "Email Automation Pro" via SQL:

```sql
INSERT INTO products (
  software_name, slug, description, emoji, url, tags, 
  published, featured, free
) VALUES (
  'Email Automation Pro',
  'email-automation-pro', 
  'Advanced email sequences and drip campaigns with A/B testing for marketing agencies.',
  '📧',
  'https://emailautomationpro.com',
  'Productivity, Email Marketing, Marketing',
  true,
  true,
  false
);
```

This creates a premium, featured software entry that will appear in the Productivity, Email Marketing, and Marketing filter categories. 
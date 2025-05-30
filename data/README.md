# Software Management Guide

This directory contains the dynamic software data for your SEO Rocket website. Here's how to manage your software releases efficiently.

## 📁 Files Overview

- `software.json` - Main data file containing all software information
- `software-loader.ts` - TypeScript utilities for loading and filtering data
- `add-software.js` - Command-line script for adding new software
- `README.md` - This documentation file

## 🚀 Adding New Software

### Method 1: Using the CLI Script (Recommended)

```bash
node data/add-software.js
```

This interactive script will prompt you for:
- Software name
- Icon (emoji)
- Description  
- Tags (comma-separated)
- Pricing tier
- URL (optional)

### Method 2: Manual JSON Editing

1. Open `data/software.json`
2. Add a new object to the `software` array:

```json
{
  "id": "unique-software-id",
  "name": "Software Name",
  "icon": "🎯",
  "description": "Brief description of what the software does.",
  "tags": ["Productivity", "SEO"],
  "status": "active",
  "releaseDate": "2025-01-27",
  "featured": true,
  "url": "#",
  "pricing": "premium"
}
```

3. Update the `metadata.totalSoftware` count
4. Update `metadata.lastUpdated` to today's date

## 🏷️ Software Properties

| Property | Type | Description | Options |
|----------|------|-------------|---------|
| `id` | string | Unique identifier (auto-generated from name) | - |
| `name` | string | Display name of the software | - |
| `icon` | string | Emoji icon for the card | Any emoji |
| `description` | string | Brief description (keep under 150 chars) | - |
| `tags` | array | Categories for filtering | See available tags below |
| `status` | string | Current status | `active`, `beta`, `coming-soon`, `deprecated` |
| `releaseDate` | string | Release date in YYYY-MM-DD format | - |
| `featured` | boolean | Whether to show on homepage | `true`, `false` |
| `url` | string | Link to the software (use "#" for placeholder) | - |
| `pricing` | string | Pricing model | `free`, `premium`, `freemium` |

## 🏷️ Available Tags

Current tags (automatically managed):
- `All` (special filter - shows all software)
- `SEO`
- `Productivity` 
- `Free`
- `Chrome Extension`
- `WordPress Plugin`

To add new tags:
1. Add them to software objects
2. They'll automatically appear in the tags array
3. Filter buttons will update automatically

## 🎯 Best Practices

### Writing Descriptions
- Keep under 150 characters
- Focus on the main benefit
- Use action words (automate, streamline, generate, etc.)
- Mention the target audience when relevant

### Choosing Icons
- Use relevant emojis that represent the software function
- Popular choices: 🚀 🎯 📊 ⚡ 🔗 📱 💬 📈 🛠️ 🎨

### Organizing Tags
- Use existing tags when possible
- Keep tag names concise and clear
- Consider your target audience's mental model

## 📊 Managing Software Lifecycle

### Launching New Software
1. Add with `status: "coming-soon"`
2. Update to `status: "beta"` during testing
3. Change to `status: "active"` for full release
4. Set `featured: true` for homepage visibility

### Retiring Software
1. Change `status: "deprecated"` 
2. Set `featured: false`
3. Keep in data for historical records

## 🔧 Advanced Usage

### Custom Filtering
The system supports complex filtering. You can:
- Filter by multiple criteria
- Show only featured software
- Filter by pricing model
- Sort by release date

### API Integration (Future)
The current system uses static JSON, but the loader can be easily modified to:
- Fetch from a headless CMS (Strapi, Contentful)
- Load from a database API
- Integrate with GitHub for automated deployments

## 🚨 Important Notes

- Always validate JSON after manual edits
- Keep the metadata updated for tracking
- Test the website after adding new software
- Use consistent formatting for dates (YYYY-MM-DD)

## 📝 Example: Adding a New Software

Let's say you're launching "Email Automation Pro":

```json
{
  "id": "email-automation-pro",
  "name": "Email Automation Pro", 
  "icon": "📧",
  "description": "Advanced email sequences and drip campaigns for marketing agencies with A/B testing.",
  "tags": ["Productivity", "Email Marketing"],
  "status": "active",
  "releaseDate": "2025-01-27",
  "featured": true,
  "url": "https://emailautomationpro.com",
  "pricing": "premium"
}
```

Don't forget to:
1. Add "Email Marketing" to the tags array if it's new
2. Update totalSoftware count
3. Update lastUpdated date 
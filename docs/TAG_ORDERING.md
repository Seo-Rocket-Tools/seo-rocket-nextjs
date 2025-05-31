# Tag-Based Product Ordering System

This document explains the new tag-based ordering system that allows administrators to customize the order of products within each tag.

## Overview

Previously, products had a global `priority` field that determined their display order across all contexts. With the new system, each product can have a different order position within different tags, providing much more flexible content management.

## Database Structure

### New Tables

#### `product_tags` Junction Table
```sql
CREATE TABLE product_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    order_position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, tag_id)
);
```

This table manages the relationship between products and tags, with each relationship having its own `order_position`.

### Migration

The system includes a migration script (`scripts/migrate-product-tags.sql`) that:

1. Preserves existing product data
2. Extracts tags from the old `products.tags` array field
3. Creates corresponding records in the `tags` table
4. Creates junction table records with proper ordering
5. Provides verification queries

**To run the migration:**
```sql
-- Execute the migration script in your Supabase SQL editor
\i scripts/migrate-product-tags.sql
```

## Row Level Security (RLS)

The `product_tags` table has RLS enabled with policies that:

- Allow public read access to product-tag relationships for published products
- Allow full CRUD access for authenticated admin users
- Prevent unauthorized modifications

## Admin Interface

### Tag Ordering Panel

Access the tag ordering interface from the admin dashboard:

1. Login to the admin dashboard
2. Click the "Tag Ordering" button in the header
3. Select a tag from the dropdown
4. Drag and drop products to reorder them within that tag
5. Add or remove products from tags using the interface

### Features

- **Drag & Drop Reordering**: Intuitive interface for changing product order
- **Real-time Updates**: Changes are saved immediately to the database
- **Visual Feedback**: Loading states and success indicators
- **Tag Management**: Add/remove products from tags
- **Responsive Design**: Works on desktop and mobile devices

## API Functions

### Core Functions

```typescript
// Get products for a tag with custom ordering
getProductsWithTagsByTag(tagName: string, includeUnpublished?: boolean): Promise<ProductWithTags[]>

// Add a product to a tag
addProductToTag(productId: string, tagId: string, orderPosition?: number): Promise<boolean>

// Remove a product from a tag
removeProductFromTag(productId: string, tagId: string): Promise<boolean>

// Update the order position of a product within a tag
updateProductTagOrder(productId: string, tagId: string, newOrderPosition: number): Promise<boolean>

// Reorder multiple products within a tag
reorderProductsInTag(tagId: string, productIdOrder: string[]): Promise<boolean>
```

### Data Loading

```typescript
// Load products ordered by tag-specific positions
loadSoftwareDataByTag(tagName: string, includeUnpublished?: boolean): Promise<SoftwareData>
```

## Frontend Integration

### Component Usage

The main ordering component is `TagOrdering` in `components/TagOrdering.tsx`:

```tsx
<TagOrdering isAdmin={isAuthenticated} />
```

### Data Flow

1. **Tag Selection**: Admin selects a tag to manage
2. **Data Loading**: System loads products for that tag with their order positions
3. **Reordering**: Admin drags and drops products to new positions
4. **Saving**: Changes are immediately persisted to the database
5. **Reflection**: Frontend updates to show the new order

## Backward Compatibility

The system maintains backward compatibility with the old array-based tag system:

- Old `products.tags` field is preserved during migration
- API functions fall back to array-based queries if junction table queries fail
- Existing products continue to work without modification

## Best Practices

### For Administrators

1. **Plan Your Tag Structure**: Consider how users will browse your products
2. **Use Descriptive Tag Names**: Make tags clear and intuitive
3. **Regular Ordering Review**: Periodically review and update product ordering
4. **Test User Experience**: Check how the ordering feels from a user perspective

### For Developers

1. **Use Junction Table Queries**: Prefer the new tag-based queries for better performance
2. **Handle Errors Gracefully**: Implement fallbacks for compatibility
3. **Monitor Performance**: Junction table queries are more complex
4. **Cache When Appropriate**: Consider caching for frequently accessed tag data

## Troubleshooting

### Common Issues

1. **Migration Errors**: Check that all foreign key constraints are satisfied
2. **Permission Errors**: Ensure RLS policies are correctly configured
3. **Order Conflicts**: The system automatically handles order position conflicts
4. **Performance**: Add database indexes if queries become slow

### Debugging

Enable debug logging to see data transformation:
```typescript
console.log('Converting product with tags:', product.software_name, product.product_tags)
```

## Future Enhancements

Potential improvements to consider:

1. **Bulk Operations**: Mass reordering tools
2. **Tag Categories**: Hierarchical tag organization
3. **Auto-ordering**: AI-assisted product ordering
4. **Analytics**: Usage-based ordering suggestions
5. **Templates**: Predefined ordering templates 
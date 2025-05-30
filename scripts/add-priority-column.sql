-- Add priority column to products table
-- Priority determines the display order (lower numbers = higher priority)

-- Step 1: Add the priority column with a default value
ALTER TABLE products 
ADD COLUMN priority INTEGER DEFAULT 100;

-- Step 2: Update existing products with priority values
-- You can customize these values based on your preferences
-- Lower numbers = higher priority (displayed first)

-- Set featured products to high priority (1-10)
UPDATE products 
SET priority = 1 
WHERE featured = true AND published = true;

-- Set remaining published products to medium priority (11-50)
UPDATE products 
SET priority = (
    CASE 
        WHEN free = true THEN 20  -- Free products get slightly higher priority
        ELSE 30                   -- Paid products get standard priority
    END
) 
WHERE featured = false AND published = true;

-- Set unpublished products to low priority (90+)
UPDATE products 
SET priority = 90 
WHERE published = false;

-- Optional: Set specific priorities for individual products
-- Replace 'your-product-slug' with actual product slugs

-- Example: Set highest priority for your most important product
-- UPDATE products SET priority = 1 WHERE slug = 'your-main-product';

-- Example: Set specific priorities for other important products
-- UPDATE products SET priority = 5 WHERE slug = 'important-product-1';
-- UPDATE products SET priority = 10 WHERE slug = 'important-product-2';

-- Step 3: Create an index on priority for better query performance
CREATE INDEX IF NOT EXISTS idx_products_priority_published 
ON products(priority, published);

-- Step 4: Verify the changes
SELECT 
    software_name,
    slug,
    priority,
    published,
    featured,
    free,
    created_at
FROM products 
ORDER BY priority ASC;

-- Expected result: Products should be ordered by priority (ascending only) 
-- Migration script to move existing product tags to the junction table
-- This script migrates data from the products.tags array to the product_tags junction table

-- First, let's see what data we have
SELECT 
    id as product_id,
    software_name,
    tags,
    array_length(tags, 1) as tag_count
FROM products 
WHERE tags IS NOT NULL 
  AND array_length(tags, 1) > 0
ORDER BY software_name;

-- Create a function to safely get or create tag IDs
CREATE OR REPLACE FUNCTION get_or_create_tag_id(tag_name text)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    tag_id uuid;
BEGIN
    -- Try to find existing tag
    SELECT id INTO tag_id
    FROM tags
    WHERE name = tag_name;
    
    -- If not found, create it
    IF tag_id IS NULL THEN
        INSERT INTO tags (name)
        VALUES (tag_name)
        RETURNING id INTO tag_id;
    END IF;
    
    RETURN tag_id;
END;
$$;

-- Migrate product tags to the junction table
DO $$
DECLARE
    product_record RECORD;
    tag_name text;
    tag_id uuid;
    position_counter integer;
BEGIN
    -- Loop through all products with tags
    FOR product_record IN 
        SELECT id, software_name, tags
        FROM products 
        WHERE tags IS NOT NULL 
          AND array_length(tags, 1) > 0
    LOOP
        position_counter := 0;
        
        -- Loop through each tag in the array
        FOREACH tag_name IN ARRAY product_record.tags
        LOOP
            -- Skip empty tags
            IF trim(tag_name) != '' THEN
                -- Get or create the tag
                tag_id := get_or_create_tag_id(trim(tag_name));
                
                -- Insert into product_tags junction table
                INSERT INTO product_tags (product_id, tag_id, order_position)
                VALUES (product_record.id, tag_id, position_counter)
                ON CONFLICT (product_id, tag_id) DO NOTHING; -- Skip if already exists
                
                position_counter := position_counter + 1;
                
                RAISE NOTICE 'Added tag "%" for product "%" at position %', 
                    trim(tag_name), product_record.software_name, position_counter - 1;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Verify the migration
SELECT 
    p.software_name,
    t.name as tag_name,
    pt.order_position,
    pt.created_at
FROM products p
JOIN product_tags pt ON p.id = pt.product_id
JOIN tags t ON pt.tag_id = t.id
ORDER BY p.software_name, pt.order_position;

-- Count comparison
SELECT 
    'Original tags' as source,
    COUNT(*) as total_tags
FROM (
    SELECT unnest(tags) as tag
    FROM products 
    WHERE tags IS NOT NULL 
      AND array_length(tags, 1) > 0
) original_tags
WHERE trim(tag) != ''

UNION ALL

SELECT 
    'Migrated tags' as source,
    COUNT(*) as total_tags
FROM product_tags;

-- Optional: After verifying the migration is successful, you can drop the old tags column
-- WARNING: Only run this after confirming the migration worked correctly
-- ALTER TABLE products DROP COLUMN tags;

-- Clean up the temporary function
DROP FUNCTION get_or_create_tag_id(text); 
-- Migration to update use_case constraint values
-- This updates the allowed values for the use_case column

-- Drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_use_case;

-- Add the new constraint with updated values
ALTER TABLE users ADD CONSTRAINT chk_use_case 
CHECK (use_case IS NULL OR use_case IN ('Personal Growth', 'Professional Growth', 'Own Business Growth'));

-- Note: If you have existing data with old values, you'll need to update them first:
-- UPDATE users SET use_case = 'Personal Growth' WHERE use_case = 'Personal';
-- UPDATE users SET use_case = 'Professional Growth' WHERE use_case = 'Professional';
-- UPDATE users SET use_case = 'Own Business Growth' WHERE use_case = 'Business';


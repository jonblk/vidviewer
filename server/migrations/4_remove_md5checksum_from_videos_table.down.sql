-- Drop the idx_md5_checksum index
DROP INDEX IF EXISTS idx_md5_checksum;
-- Remove the md5_checksum column
ALTER TABLE videos DROP COLUMN md5_checksum;
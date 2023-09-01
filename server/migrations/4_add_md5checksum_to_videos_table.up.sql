ALTER TABLE videos ADD COLUMN md5_checksum TEXT;
CREATE INDEX idx_md5_checksum ON videos (md5_checksum);


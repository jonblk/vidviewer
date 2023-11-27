CREATE TABLE videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT,
    file_id TEXT UNIQUE,
    file_format TEXT,
    title TEXT,
    duration TEXT,
    download_complete BOOLEAN,
    download_date DATE
);

CREATE INDEX idx_file_id ON videos(file_id);
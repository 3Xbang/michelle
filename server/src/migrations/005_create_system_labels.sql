CREATE TABLE IF NOT EXISTS system_labels (
    id SERIAL PRIMARY KEY,
    label_key VARCHAR(100) NOT NULL UNIQUE,
    label_cn TEXT NOT NULL,
    label_en TEXT NOT NULL,
    label_th TEXT,
    category VARCHAR(50)
);

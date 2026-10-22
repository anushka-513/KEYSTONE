-- ============================================
-- KEYSTONE - Seed users with BCrypt passwords
-- ============================================

-- Existing technician account
INSERT INTO app_user (name, email, role, password_hash)
VALUES (
    'Rahul Sharma',
    'rahul@keystone.com',
    'TECHNICIAN',
    '$2y$10$8RbW9BWqcyz..kzsqpS5l.1UMNU6aAgUTPAvVrJhsuLy6N9bZ3xKu'
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    password_hash = EXCLUDED.password_hash;

-- Dispatcher account
INSERT INTO app_user (name, email, role, password_hash)
VALUES (
    'Aarav Mehta',
    'dispatcher@keystone.com',
    'DISPATCHER',
    '$2y$10$wfM8YJXXsBFn/6zasT.MHuqt199WPZTOxNrliCDJ3iXjJmUvdoK3O'
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    password_hash = EXCLUDED.password_hash;

-- Manager / Admin account
INSERT INTO app_user (name, email, role, password_hash)
VALUES (
    'Priya Kapoor',
    'manager@keystone.com',
    'MANAGER',
    '$2y$10$gSE.LqVujm05ujvna2284.aKq7ViIUzTeUpxEkA83LPx7O/UNPucC'
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    password_hash = EXCLUDED.password_hash;

-- Customer account
INSERT INTO app_user (name, email, role, password_hash)
VALUES (
    'Neha Verma',
    'customer@keystone.com',
    'CUSTOMER',
    '$2y$10$bAxBVpj0HHHwx5qX00gI1ei1Snx84sOwcRyC.2ERKXPJp.QR4brcS'
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    password_hash = EXCLUDED.password_hash;
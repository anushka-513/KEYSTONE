-- ============================================
-- KEYSTONE - Initial Database Schema
-- ============================================

-- 1. CUSTOMER
CREATE TABLE customer (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL
);


-- 2. USER
CREATE TABLE app_user (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);


-- 3. SITE
CREATE TABLE site (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,

    CONSTRAINT fk_site_customer
        FOREIGN KEY (customer_id)
        REFERENCES customer(id)
);


-- 4. PART
CREATE TABLE part (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    unit_cost NUMERIC(12,2) NOT NULL,
    stock_qty INTEGER NOT NULL DEFAULT 0
);


-- 5. WORK ORDER
CREATE TABLE work_order (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    site_id BIGINT NOT NULL,
    assigned_to BIGINT,
    code VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    priority VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    sla_due_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT fk_work_order_customer
        FOREIGN KEY (customer_id)
        REFERENCES customer(id),

    CONSTRAINT fk_work_order_site
        FOREIGN KEY (site_id)
        REFERENCES site(id),

    CONSTRAINT fk_work_order_assigned_user
        FOREIGN KEY (assigned_to)
        REFERENCES app_user(id)
);


-- 6. WORK ORDER STATUS HISTORY
CREATE TABLE work_order_status_history (
    id BIGSERIAL PRIMARY KEY,
    work_order_id BIGINT NOT NULL,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    changed_by BIGINT NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_status_history_work_order
        FOREIGN KEY (work_order_id)
        REFERENCES work_order(id),

    CONSTRAINT fk_status_history_user
        FOREIGN KEY (changed_by)
        REFERENCES app_user(id)
);


-- 7. TIME LOG
CREATE TABLE time_log (
    id BIGSERIAL PRIMARY KEY,
    work_order_id BIGINT NOT NULL,
    technician_id BIGINT NOT NULL,
    minutes INTEGER NOT NULL,
    note TEXT,

    CONSTRAINT fk_time_log_work_order
        FOREIGN KEY (work_order_id)
        REFERENCES work_order(id),

    CONSTRAINT fk_time_log_technician
        FOREIGN KEY (technician_id)
        REFERENCES app_user(id)
);


-- 8. PART USAGE
CREATE TABLE part_usage (
    id BIGSERIAL PRIMARY KEY,
    work_order_id BIGINT NOT NULL,
    part_id BIGINT NOT NULL,
    qty_used INTEGER NOT NULL,

    CONSTRAINT fk_part_usage_work_order
        FOREIGN KEY (work_order_id)
        REFERENCES work_order(id),

    CONSTRAINT fk_part_usage_part
        FOREIGN KEY (part_id)
        REFERENCES part(id)
);
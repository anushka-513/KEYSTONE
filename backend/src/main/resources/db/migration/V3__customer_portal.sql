ALTER TABLE app_user
    ADD COLUMN customer_id BIGINT;

ALTER TABLE app_user
    ADD CONSTRAINT fk_app_user_customer
    FOREIGN KEY (customer_id) REFERENCES customer(id);

ALTER TABLE work_order
    ADD COLUMN description TEXT;

-- Automatically link a customer login when its email matches
-- the customer's contact email.
UPDATE app_user u
SET customer_id = c.id
FROM customer c
WHERE u.role = 'CUSTOMER'
  AND LOWER(u.email) = LOWER(c.contact_email);

-- Safe fallback only when the database contains exactly one customer.
UPDATE app_user
SET customer_id = (SELECT MIN(id) FROM customer)
WHERE role = 'CUSTOMER'
  AND customer_id IS NULL
  AND (SELECT COUNT(*) FROM customer) = 1;
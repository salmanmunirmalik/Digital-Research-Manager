-- Research Supplier Marketplace Migration
-- Creates comprehensive supplier marketplace system with products, reviews, orders

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    website VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    description TEXT,
    specialization TEXT[], -- Array of specializations like ['Biochemistry', 'Cell Biology']
    certifications TEXT[], -- Array of certifications
    rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0,
    established_year INTEGER,
    employee_count VARCHAR(50), -- e.g., '1-d0', '51-100', '201-500'
    revenue_range VARCHAR(50), -- e.g., '1M-10M', '10M-50M'
    languages_spoken TEXT[],
    shipping_regions TEXT[], -- Where they ship
    payment_methods TEXT[], -- Accepted payment methods
    lead_time_min INTEGER, -- Minimum lead time in days
    lead_time_max INTEGER, -- Maximum lead time in days
    moq_min DECIMAL(12,2), -- Minimum order quantity
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, pending_verification
    verification_status VARCHAR(20) DEFAULT 'unverified', -- verified, unverified, pending
    verification_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Product categories
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id),
    icon VARCHAR(50), -- Icon name for UI
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    category_id UUID REFERENCES product_categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    specifications JSONB, -- Flexible structure for product specs
    unit VARCHAR(50), -- e.g., 'pieces', 'kg', 'ml', 'liters'
    minimum_order_quantity INTEGER DEFAULT 1,
    stock_quantity INTEGER DEFAULT 0,
    price DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'USD',
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    lead_time_days INTEGER,
    images TEXT[], -- Array of image URLs
    documents TEXT[], -- Array of document URLs (certs, datasheets)
    features TEXT[], -- Key product features
    applications TEXT[], -- Applications use cases
    certifications TEXT[], -- Product certifications
    material_safety_data_sheet TEXT, -- MSDS URL
    coa_available BOOLEAN DEFAULT false, -- Certificate of Analysis
    custom_available BOOLEAN DEFAULT false, -- Custom formulations available
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, discontinued
    featured BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Product reviews
CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    review_text TEXT,
    verified_purchase BOOLEAN DEFAULT false,
    images TEXT[], -- Review images
    pros TEXT[], -- Array of pros
    cons TEXT[], -- Array of cons
    would_recommend BOOLEAN DEFAULT true,
    helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS supplier_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    order_status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, shipped, delivered, cancelled
    total_amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    shipping_address JSONB NOT NULL,
    billing_address JSONB,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, failed
    special_instructions TEXT,
    delivery_notes TEXT,
    tracking_number VARCHAR(255),
    estimated_delivery_date DATE,
    actual_delivery_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES supplier_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    specifications TEXT, -- Any custom specs for this order
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Wishlist
CREATE TABLE IF NOT EXISTS product_wishlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_suppliers_company_name ON suppliers(company_name);
CREATE INDEX IF NOT EXISTS idx_suppliers_country ON suppliers(country);
CREATE INDEX IF NOT EXISTS idx_suppliers_specialization ON suppliers USING GIN(specialization);
CREATE INDEX IF NOT EXISTS idx_suppliers_rating ON suppliers(rating);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_features ON products USING GIN(features);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_user ON supplier_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_supplier ON supplier_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_status ON supplier_orders(order_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_product_wishlist_user ON product_wishlist(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON product_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_orders_updated_at BEFORE UPDATE ON supplier_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample product categories
INSERT INTO product_categories (name, description, icon, sort_order) VALUES
('Laboratory Equipment', 'Laboratory instruments and apparatus', 'MicroscopeIcon', 1),
('Chemical Reagents', 'Chemical compounds and reagents', 'FlaskIcon', 2),
('Biological Materials', 'Cells, tissues, and biomolecules', 'DnaIcon', 3),
('Analytical Tools', 'Testing and analysis equipment', 'BarChartIcon', 4),
('Safety Equipment', 'Personal protective equipment', 'ShieldIcon', 5),
('Consumables', 'Disposable laboratory supplies', 'PackageIcon', 6);

-- Insert sample suppliers
INSERT INTO suppliers (company_name, contact_name, email, specialization, country, established_year, employee_count, verification_status) VALUES
('LabTech Solutions', 'Sarah Johnson', 'contact@labtechsolutions.com', ARRAY['Laboratory Equipment', 'Analytical Tools'], 'United States', 2015, '201-500', 'verified'),
('BioChem Supplies', 'Michael Chen', 'info@biochemsupplies.com', ARRAY['Chemical Reagents', 'Biological Materials'], 'Germany', 2010, '51-100', 'verified'),
('SafetyFirst Corp', 'Emily Rodriguez', 'sales@safetyfirst.com', ARRAY['Safety Equipment'], 'United Kingdom', 2008, '11-50', 'verified'),
('GlobalLab Materials', 'David Kim', 'orders@globallab.com', ARRAY['Consumables', 'Laboratory Equipment'], 'South Korea', 2012, '501-1000', 'verified');


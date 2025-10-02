import React, { useState, useEffect, useMemo } from 'react';
import {
  SearchIcon,
  FilterIcon,
  PackageIcon,
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  GlobeIcon,
  EyeIcon,
  HeartIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  TagIcon,
  CalendarIcon,
  UsersIcon,

  CurrencyDollarIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  TrendingUpIcon
} from '../components/icons';

interface Supplier {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  website: string;
  city: string;
  country: string;
  description: string;
  specialization: string[];
  certifications: string[];
  rating: number;
  review_count: number;
  established_year: number;
  employee_count: string;
  verification_status: string;
  languages_spoken: string[];
  shipping_regions: string[];
  payment_methods: string[];
  lead_time_min: number;
  lead_time_max: number;
  currency: string;
  created_at: string;
}

interface Product {
  id: string;
  supplier_id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  unit: string;
  minimum_order_quantity: number;
  stock_quantity: number;
  images: string[];
  features: string[];
  applications: string[];
  category_id: string;
  created_at: string;
}

interface ProductCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const SupplierMarketplacePage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('rating');
  const [viewMode, setViewMode] = useState<'suppliers' | 'products'>('suppliers');

  // Shopping cart functionality
  const [cart, setCart] = useState<Array<{product: Product, quantity: number}>>([]);
  const [showCart, setShowCart] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [showProductModal, setShowProductModal] = useState<Product | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration - replace with actual API calls
      const mockSuppliers: Supplier[] = [
        {
          id: '1',
          company_name: 'LabTech Solutions',
          contact_name: 'Alice Wonderland',
          email: 'alice@labtech.com',
          phone: '+1-555-123-4567',
          website: 'https://www.labtechsolutions.com',
          city: 'Boston',
          country: 'USA',
          description: 'Leading provider of laboratory equipment and consumables.',
          specialization: ['Lab Equipment', 'Reagents', 'Consumables'],
          certifications: ['ISO 9001', 'CE Certified'],
          rating: 4.8,
          review_count: 120,
          established_year: 2005,
          employee_count: '101-500',
          verification_status: 'Verified',
          languages_spoken: ['English', 'Spanish'],
          shipping_regions: ['North America', 'Europe'],
          payment_methods: ['Credit Card', 'Bank Transfer'],
          lead_time_min: 3,
          lead_time_max: 7,
          currency: 'USD',
          created_at: '2022-01-15T10:00:00Z',
        },
        {
          id: '2',
          company_name: 'BioGen Innovations',
          contact_name: 'Bob Thebuilder',
          email: 'bob@biogen.com',
          phone: '+44-20-7123-4567',
          website: 'https://www.biogeninnovations.co.uk',
          city: 'London',
          country: 'UK',
          description: 'Specializing in genomics and proteomics research tools.',
          specialization: ['Genomics', 'Proteomics', 'Bioinformatics'],
          certifications: ['ISO 13485'],
          rating: 4.5,
          review_count: 85,
          established_year: 2010,
          employee_count: '51-100',
          verification_status: 'Verified',
          languages_spoken: ['English'],
          shipping_regions: ['Europe'],
          payment_methods: ['Bank Transfer'],
          lead_time_min: 5,
          lead_time_max: 10,
          currency: 'GBP',
          created_at: '2022-02-20T11:30:00Z',
        },
        {
          id: '3',
          company_name: 'ChemSupply Global',
          contact_name: 'Charlie Chaplin',
          email: 'charlie@chemsupply.com',
          phone: '+49-30-9876-5432',
          website: 'https://www.chemsupplyglobal.de',
          city: 'Berlin',
          country: 'Germany',
          description: 'Global distributor of high-purity chemicals and solvents.',
          specialization: ['Chemicals', 'Solvents', 'Reagents'],
          certifications: ['REACH Compliant'],
          rating: 4.7,
          review_count: 150,
          established_year: 1998,
          employee_count: '501-1000',
          verification_status: 'Verified',
          languages_spoken: ['German', 'English'],
          shipping_regions: ['Global'],
          payment_methods: ['Credit Card', 'Bank Transfer', 'PayPal'],
          lead_time_min: 2,
          lead_time_max: 8,
          currency: 'EUR',
          created_at: '2022-03-01T09:15:00Z',
        },
        {
          id: '4',
          company_name: 'MediEquip Solutions',
          contact_name: 'Diana Prince',
          email: 'diana@mediequip.com',
          phone: '+81-3-1234-5678',
          website: 'https://www.mediequipsolutions.jp',
          city: 'Tokyo',
          country: 'Japan',
          description: 'Provider of advanced medical and diagnostic equipment.',
          specialization: ['Medical Devices', 'Diagnostics', 'Imaging'],
          certifications: ['FDA Approved', 'CE Certified'],
          rating: 4.9,
          review_count: 90,
          established_year: 2015,
          employee_count: '51-100',
          verification_status: 'Verified',
          languages_spoken: ['Japanese', 'English'],
          shipping_regions: ['Asia', 'North America'],
          payment_methods: ['Bank Transfer'],
          lead_time_min: 7,
          lead_time_max: 14,
          currency: 'JPY',
          created_at: '2022-04-10T14:00:00Z',
        },
        {
          id: '5',
          company_name: 'ResearchLab Supplies',
          contact_name: 'Eve Adams',
          email: 'eve@researchlab.com',
          phone: '+1-555-987-6543',
          website: 'https://www.researchlabsupplies.com',
          city: 'San Francisco',
          country: 'USA',
          description: 'One-stop shop for all general laboratory supplies.',
          specialization: ['General Lab Supplies', 'Glassware', 'Safety Equipment'],
          certifications: [],
          rating: 4.6,
          review_count: 200,
          established_year: 2000,
          employee_count: '101-500',
          verification_status: 'Verified',
          languages_spoken: ['English'],
          shipping_regions: ['North America'],
          payment_methods: ['Credit Card', 'PayPal'],
          lead_time_min: 1,
          lead_time_max: 5,
          currency: 'USD',
          created_at: '2022-05-01T08:00:00Z',
        },
      ];

      const mockCategories: ProductCategory[] = [
        { id: '1', name: 'Lab Equipment', description: 'General laboratory equipment', icon: 'beaker' },
        { id: '2', name: 'Reagents', description: 'Chemicals and biological reagents', icon: 'flask' },
        { id: '3', name: 'Consumables', description: 'Disposable lab plastics and glassware', icon: 'package' },
        { id: '4', name: 'Safety Equipment', description: 'Personal protective equipment', icon: 'shield' },
        { id: '5', name: 'Software', description: 'Bioinformatics and data analysis software', icon: 'code' },
      ];

      const mockProducts: Product[] = [
        {
          id: 'prod1', supplier_id: '1', name: 'Centrifuge 5424 R', description: 'Refrigerated microcentrifuge for molecular biology applications.',
          price: 5500.00, currency: 'USD', unit: 'unit', minimum_order_quantity: 1, stock_quantity: 15,
          images: ['https://via.placeholder.com/150/ADD8E6/000000?text=Centrifuge'], features: ['Max RCF: 21,130 x g', 'Max speed: 15,000 rpm', 'Temperature range: -10°C to 25°C'],
          applications: ['DNA/RNA purification', 'Protein isolation'], category_id: '1', created_at: '2023-01-01T10:00:00Z',
        },
        {
          id: 'prod2', supplier_id: '1', name: 'Vortex Mixer', description: 'Compact vortex mixer for tubes and plates.',
          price: 350.00, currency: 'USD', unit: 'unit', minimum_order_quantity: 1, stock_quantity: 50,
          images: ['https://via.placeholder.com/150/ADD8E6/000000?text=Vortex+Mixer'], features: ['Speed: 0-3000 rpm', 'Continuous or touch operation'],
          applications: ['Resuspension', 'Mixing'], category_id: '1', created_at: '2023-01-05T11:00:00Z',
        },
        {
          id: 'prod3', supplier_id: '2', name: 'PCR Master Mix (2x)', description: 'Ready-to-use solution for routine PCR applications.',
          price: 120.00, currency: 'USD', unit: 'kit', minimum_order_quantity: 5, stock_quantity: 100,
          images: ['https://via.placeholder.com/150/90EE90/000000?text=PCR+Master+Mix'], features: ['High fidelity', 'Reduced pipetting steps'],
          applications: ['Gene amplification', 'Genotyping'], category_id: '2', created_at: '2023-01-10T12:00:00Z',
        },
        {
          id: 'prod4', supplier_id: '3', name: 'Ethanol Absolute, 99.9%', description: 'High purity ethanol for laboratory use.',
          price: 80.00, currency: 'EUR', unit: 'liter', minimum_order_quantity: 10, stock_quantity: 200,
          images: ['https://via.placeholder.com/150/FFB6C1/000000?text=Ethanol'], features: ['ACS grade', 'Low water content'],
          applications: ['Solvent', 'Disinfectant'], category_id: '2', created_at: '2023-01-15T13:00:00Z',
        },
        {
          id: 'prod5', supplier_id: '5', name: 'Serological Pipettes 10ml', description: 'Sterile, individually wrapped serological pipettes.',
          price: 45.00, currency: 'USD', unit: 'pack', minimum_order_quantity: 1, stock_quantity: 300,
          images: ['https://via.placeholder.com/150/D3D3D3/000000?text=Pipettes'], features: ['Polystyrene', 'Graduated'],
          applications: ['Liquid handling'], category_id: '3', created_at: '2023-01-20T14:00:00Z',
        },
      ];

      setSuppliers(mockSuppliers);
      setProducts(mockProducts);
      setCategories(mockCategories);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      const matchesSearch = searchTerm === '' ||
        supplier.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.specialization.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesRating = supplier.rating >= ratingFilter;
      const matchesVerification = verificationFilter === 'all' || supplier.verification_status.toLowerCase() === verificationFilter;
      const matchesCountry = countryFilter === 'all' || supplier.country === countryFilter;

      return matchesSearch && matchesRating && matchesVerification && matchesCountry;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'reviews':
          return b.review_count - a.review_count;
        case 'established':
          return b.established_year - a.established_year;
        case 'name':
          return a.company_name.localeCompare(b.company_name);
        default:
          return 0;
      }
    });
  }, [suppliers, searchTerm, ratingFilter, verificationFilter, countryFilter, sortBy]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = searchTerm === '' ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.features.some(feature => feature.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];

      return matchesSearch && matchesCategory && matchesPrice;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'stock':
          return b.stock_quantity - a.stock_quantity;
        default:
          return 0;
      }
    });
  }, [products, searchTerm, selectedCategory, priceRange, sortBy]);

  // Shopping cart functions
  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item =>
      item.product.id === productId ? { ...item, quantity } : item
    ));
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <PackageIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Supplier Marketplace
                </h1>
                <p className="text-gray-600 mt-1">
                  Connect with verified suppliers and browse products
                </p>
              </div>
            </div>

            {/* Cart Button */}
            <button
              onClick={() => setShowCart(true)}
              className="relative bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <PackageIcon className="w-5 h-5" />
              <span>Cart</span>
              {getCartItemCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getCartItemCount()}
                </span>
              )}
            </button>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <BuildingOfficeIcon className="w-4 h-4" />
              <span>{suppliers.length} Suppliers</span>
            </div>
            <div className="flex items-center space-x-2">
              <PackageIcon className="w-4 h-4" />
              <span>{products.length} Products</span>
            </div>
            <div className="flex items-center space-x-2">
              <ShieldCheckIcon className="w-4 h-4" />
              <span>Verified Partners</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          {/* Search Bar */}
          <div className="relative mb-6">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search suppliers, products, or services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setViewMode('suppliers')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'suppliers' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Suppliers ({suppliers.length})
              </button>
              <button
                onClick={() => setViewMode('products')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'products' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Products ({products.length})
              </button>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500"
            >
              {viewMode === 'suppliers' ? (
                <>
                  <option value="rating">Highest Rated</option>
                  <option value="reviews">Most Reviews</option>
                  <option value="established">Most Established</option>
                  <option value="name">Name A-Z</option>
                </>
              ) : (
                <>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="name">Name A-Z</option>
                  <option value="stock">Stock Available</option>
                </>
              )}
            </select>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {viewMode === 'suppliers' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Rating</label>
                  <select
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>Any Rating</option>
                    <option value={3}>3+ Stars</option>
                    <option value={4}>4+ Stars</option>
                    <option value={4.5}>4.5+ Stars</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Verification</label>
                  <select
                    value={verificationFilter}
                    onChange={(e) => setVerificationFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All</option>
                    <option value="verified">Verified Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <select
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Countries</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                    <option value="Germany">Germany</option>
                    <option value="Japan">Japan</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                  <select
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={100}>Under $100</option>
                    <option value={500}>Under $500</option>
                    <option value={1000}>Under $1,000</option>
                    <option value={5000}>Under $5,000</option>
                    <option value={10000}>All Prices</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {viewMode === 'suppliers' ? filteredSuppliers.length : filteredProducts.length} {viewMode}
              {searchTerm && ` for "${searchTerm}"`}
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {viewMode === 'suppliers' ? (
            filteredSuppliers.map(supplier => (
              <div
                key={supplier.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {supplier.company_name}
                    </h3>
                    <p className="text-sm text-blue-600 font-medium mb-3">
                      {supplier.contact_name} • {supplier.city}, {supplier.country}
                    </p>
                  </div>
                  <button className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500 transition-colors">
                    <HeartIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Rating and Stats */}
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <StarIcon className="h-5 w-5 text-yellow-500 fill-current" />
                      <span className="font-medium text-gray-900">{supplier.rating}</span>
                      <span className="text-sm text-gray-500">({supplier.review_count} reviews)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      <span className="text-sm text-green-600 font-medium">{supplier.verification_status}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2">
                    {supplier.description}
                  </p>

                  {/* Specialization */}
                  <div className="flex flex-wrap gap-2">
                    {supplier.specialization.slice(0, 3).map((spec, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2">
                    <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center space-x-2">
                      <EyeIcon className="h-4 w-4" />
                      <span>View Profile</span>
                    </button>
                    <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 flex items-center justify-center space-x-2">
                      <ChatBubbleLeftRightIcon className="h-4 w-4" />
                      <span>Contact</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            filteredProducts.map(product => {
              const supplier = suppliers.find(s => s.id === product.supplier_id);
              const isInWishlist = wishlist.includes(product.id);

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200"
                >
                  {/* Product Image */}
                  <div className="relative aspect-w-1 aspect-h-1 bg-gradient-to-br from-blue-50 to-purple-50">
                    {product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center">
                        <PackageIcon className="h-12 w-12 text-blue-400" />
                      </div>
                    )}

                    {/* Wishlist Button */}
                    <button
                      onClick={() => toggleWishlist(product.id)}
                      className={`absolute top-3 right-3 p-2 rounded-full shadow-lg transition-all duration-200 ${
                        isInWishlist
                          ? 'bg-red-500 text-white'
                          : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-red-50 hover:text-red-500'
                      }`}
                    >
                      <HeartIcon className={`h-5 w-5 ${isInWishlist ? 'fill-current' : ''}`} />
                    </button>

                    {/* Stock Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.stock_quantity > 10
                          ? 'bg-green-100 text-green-800'
                          : product.stock_quantity > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                        {product.name}
                      </h3>

                      {/* Supplier Info */}
                      {supplier && (
                        <div className="flex items-center space-x-2 mb-3">
                          <BuildingOfficeIcon className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-blue-600 font-medium">{supplier.company_name}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {product.description}
                    </p>

                    {/* Price and Actions */}
                    <div className="space-y-4">
                      {/* Price */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-gray-900">
                            {product.currency} {product.price.toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-500 ml-2">
                            per {product.unit}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Min. Order</div>
                          <div className="font-medium text-gray-700">{product.minimum_order_quantity} {product.unit}</div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowProductModal(product)}
                          className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center space-x-2"
                        >
                          <EyeIcon className="h-4 w-4" />
                          <span>View Details</span>
                        </button>
                        <button
                          onClick={() => addToCart(product)}
                          disabled={product.stock_quantity === 0}
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
                        >
                          <PackageIcon className="h-4 w-4" />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Empty State */}
        {(viewMode === 'suppliers' ? filteredSuppliers.length === 0 : filteredProducts.length === 0) && (
          <div className="text-center py-12">
            <PackageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {viewMode} found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search criteria or filters
            </p>
          </div>
        )}
      </div>

      {/* Shopping Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Shopping Cart</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-96">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <PackageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                        <PackageIcon className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                        <p className="text-sm text-gray-600">{item.product.currency} {item.product.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          -
                        </button>
                        <span className="px-2 py-1 bg-white rounded">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {cart.length > 0 && (
              <div className="p-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-gray-900">Total:</span>
                  <span className="text-lg font-bold text-gray-900">${getCartTotal().toFixed(2)}</span>
                </div>
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Product Details</h2>
                <button
                  onClick={() => setShowProductModal(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-96">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {showProductModal.images.length > 0 ? (
                    <img
                      src={showProductModal.images[0]}
                      alt={showProductModal.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                      <PackageIcon className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{showProductModal.name}</h3>
                  <p className="text-gray-600 mb-4">{showProductModal.description}</p>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-3xl font-bold text-gray-900">
                        {showProductModal.currency} {showProductModal.price.toFixed(2)}
                      </span>
                      <span className="text-gray-500 ml-2">per {showProductModal.unit}</span>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <div>Minimum Order: {showProductModal.minimum_order_quantity} {showProductModal.unit}</div>
                      <div>Stock: {showProductModal.stock_quantity} available</div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Features:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {showProductModal.features.map((feature, index) => (
                          <li key={index}>• {feature}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Applications:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {showProductModal.applications.map((app, index) => (
                          <li key={index}>• {app}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200">
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    addToCart(showProductModal);
                    setShowProductModal(null);
                  }}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => toggleWishlist(showProductModal.id)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  {wishlist.includes(showProductModal.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierMarketplacePage;
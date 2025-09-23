# KaliFinder Architecture Overview

A comprehensive guide to the KaliFinder search-as-a-service platform architecture, including system design, data flow, and integration patterns.

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Search Engine │
│   (React)       │◄──►│   (Express)     │◄──►│   (Elasticsearch)│
│                 │    │                 │    │                 │
│ - Search Widget │    │ - Authentication│    │ - Product Index │
│ - Shadow DOM    │    │ - Business Logic│    │ - Vector Search │
│ - Responsive UI │    │ - Data Sync     │    │ - Text Search   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Host Website  │    │   Database      │    │   AI/ML Service │
│                 │    │   (PostgreSQL)  │    │   (Transformers)│
│ - Any Website   │    │                 │    │                 │
│ - WordPress     │    │ - Product Data  │    │ - Embeddings    │
│ - Shopify       │    │ - User Data     │    │ - Semantic Search│
│ - WooCommerce   │    │ - Analytics     │    │ - Similarity    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔄 Data Flow Architecture

### 1. Product Data Ingestion

```
E-commerce Store ──► Webhook/API ──► Backend ──► Database ──► Elasticsearch
     │                    │            │           │            │
     │                    │            │           │            ▼
     │                    │            │           │      ┌─────────────┐
     │                    │            │           │      │ AI Embeddings│
     │                    │            │           │      │ Generation   │
     │                    │            │           │      └─────────────┘
     │                    │            │           │            │
     │                    │            │           │            ▼
     │                    │            │           │      ┌─────────────┐
     │                    │            │           │      │ Vector Index │
     │                    │            │           │      │ Storage      │
     │                    │            │           │      └─────────────┘
```

### 2. Search Request Flow

```
User Input ──► Frontend ──► Backend API ──► Elasticsearch ──► Results
    │              │             │               │              │
    │              │             │               │              ▼
    │              │             │               │         ┌─────────┐
    │              │             │               │         │ Ranking │
    │              │             │               │         │ & Boost │
    │              │             │               │         └─────────┘
    │              │             │               │              │
    │              │             │               │              ▼
    │              │             │               │         ┌─────────┐
    │              │             │               │         │ Response│
    │              │             │               │         │ Formatting│
    │              │             │               │         └─────────┘
```

## 🎯 Component Architecture

### Frontend Components

```
KalifindSearch (Main Component)
├── ShadowDOMSearchDropdown
│   ├── KalifindSearchDesktop
│   │   ├── SearchHeader
│   │   ├── FilterSidebar
│   │   │   ├── CategoryFilter
│   │   │   ├── PriceFilter
│   │   │   ├── BrandFilter
│   │   │   └── StockFilter
│   │   └── ProductGrid
│   │       ├── ProductCard
│   │       ├── Pagination
│   │       └── SortControls
│   └── KalifindSearchMobile
│       ├── MobileSearchHeader
│       ├── CollapsibleFilters
│       └── MobileProductList
├── AutocompleteDropdown
│   ├── SuggestionList
│   └── RecentSearches
└── Recommendations
    ├── RecommendedProducts
    └── PopularSearches
```

### Backend Services

```
Express Server
├── Authentication Middleware
├── CORS Middleware
├── Rate Limiting
├── Routes
│   ├── Search Routes
│   │   ├── Product Search
│   │   ├── Autocomplete
│   │   ├── Recommendations
│   │   └── Popular Searches
│   ├── Product Management
│   │   ├── CRUD Operations
│   │   ├── Boost Rules
│   │   └── Facet Configuration
│   ├── Store Management
│   │   ├── Store Registration
│   │   ├── API Key Management
│   │   └── Webhook Handling
│   └── Analytics
│       ├── Search Analytics
│       ├── Product Performance
│       └── Usage Tracking
├── Business Logic Services
│   ├── Search Service
│   ├── Product Sync Service
│   ├── Analytics Service
│   └── Notification Service
└── Data Access Layer
    ├── Prisma ORM
    ├── Elasticsearch Client
    └── External API Clients
```

## 🗄️ Database Architecture

### PostgreSQL Schema Design

```
Users & Authentication
├── users (id, email, role, created_at)
├── sessions (id, user_id, token, expires)
├── accounts (id, user_id, provider, access_token)
└── password_reset_tokens (id, user_id, token, expires)

Store Management
├── store_vendors (id, user_id, name, store_type)
├── shopify_stores (id, vendor_id, shop_domain, access_token)
├── woocommerce_stores (id, vendor_id, store_url, consumer_key)
└── api_keys (id, vendor_id, token, status)

Product Catalog
├── shopify_products (id, store_id, title, price, description)
├── woocommerce_products (id, store_id, title, price, description)
├── product_variants (id, product_id, sku, price, stock)
├── product_images (id, product_id, url, alt_text)
├── categories (id, name, slug, parent_id)
├── tags (id, name, slug)
└── product_attributes (id, product_id, name, value)

Search Configuration
├── boost_rules (id, store_id, type, matcher, weight)
├── facets (id, store_id, field, label, visible)
├── recommendations (id, vendor_id, type, items, generated_at)
└── color_mappings (id, store_id, color_name, hex_value)

Analytics & Billing
├── usage_daily (id, vendor_id, date, searches, api_calls)
├── plans (id, name, slug, limits, is_active)
├── subscriptions (id, vendor_id, plan_id, status, current_period_end)
├── invoices (id, subscription_id, amount, status, attempted_at)
└── webhook_events (id, topic, status, payload, received_at)
```

### Elasticsearch Index Structure

```json
{
  "products_v1": {
    "mappings": {
      "properties": {
        "id": { "type": "keyword" },
        "title": {
          "type": "text",
          "analyzer": "standard",
          "fields": {
            "raw": { "type": "keyword" },
            "suggest": { "type": "completion" }
          }
        },
        "description": { "type": "text" },
        "price": { "type": "float" },
        "salePrice": { "type": "float" },
        "categories": { "type": "keyword" },
        "brands": { "type": "keyword" },
        "colors": { "type": "keyword" },
        "sizes": { "type": "keyword" },
        "tags": { "type": "keyword" },
        "stockStatus": { "type": "keyword" },
        "featured": { "type": "boolean" },
        "boost": { "type": "float" },
        "storeUrl": { "type": "keyword" },
        "storeType": { "type": "keyword" },
        "vector": {
          "type": "dense_vector",
          "dims": 384
        },
        "createdAt": { "type": "date" },
        "updatedAt": { "type": "date" }
      }
    }
  }
}
```

## 🔍 Search Architecture

### Hybrid Search Implementation

```
User Query ──► Query Processing ──► Multi-Stage Search
    │                   │                    │
    │                   ▼                    ▼
    │            ┌─────────────┐    ┌─────────────────┐
    │            │ Text Search │    │ Vector Search   │
    │            │             │    │                 │
    │            │ - Keywords  │    │ - Embeddings    │
    │            │ - Fuzzy     │    │ - Semantic      │
    │            │ - Prefix    │    │ - Similarity    │
    │            └─────────────┘    └─────────────────┘
    │                   │                    │
    │                   ▼                    ▼
    │            ┌─────────────────────────────────────┐
    │            │        Result Fusion                │
    │            │                                     │
    │            │ - Combine text & vector scores      │
    │            │ - Apply boosting rules              │
    │            │ - Business logic ranking            │
    │            └─────────────────────────────────────┘
    │                              │
    │                              ▼
    │            ┌─────────────────────────────────────┐
    │            │        Final Results                │
    │            │                                     │
    │            │ - Ranked product list               │
    │            │ - Faceted filters                   │
    │            │ - Pagination metadata               │
    │            └─────────────────────────────────────┘
```

### Boosting Rules Engine

```typescript
interface BoostRule {
  id: number;
  type: "product" | "category" | "tag" | "brand" | "attribute";
  matcher: {
    term?: Record<string, string>;
    range?: Record<string, { gte?: number; lte?: number }>;
    bool?: Record<string, any>;
  };
  weight: number;
  priority: number;
  startAt?: Date;
  endAt?: Date;
  status: "active" | "inactive";
}

// Example boosting rules
const boostingRules = [
  {
    type: "category",
    matcher: { term: { "categories.keyword": "electronics" } },
    weight: 2.0,
  },
  {
    type: "product",
    matcher: { term: { "tags.keyword": "featured" } },
    weight: 3.0,
  },
  {
    type: "attribute",
    matcher: { range: { price: { gte: 100, lte: 500 } } },
    weight: 1.5,
  },
];
```

## 🔗 Integration Architecture

### E-commerce Platform Integration

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Shopify       │    │   WooCommerce   │    │   Custom APIs   │
│                 │    │                 │    │                 │
│ - Webhooks      │    │ - REST API      │    │ - GraphQL       │
│ - Admin API     │    │ - Webhooks      │    │ - REST API      │
│ - GraphQL       │    │ - REST API      │    │ - Custom Hooks  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Sync Service                            │
│                                                                 │
│ - Product Sync                                                  │
│ - Inventory Updates                                             │
│ - Image Processing                                              │
│ - Category Mapping                                              │
│ - Attribute Normalization                                       │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Search Index Update                          │
│                                                                 │
│ - Real-time Indexing                                            │
│ - Batch Processing                                              │
│ - Embedding Generation                                          │
│ - Facet Updates                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Frontend Embedding Architecture

```
Host Website ──► Script Injection ──► Shadow DOM ──► React App
     │                   │               │              │
     │                   │               │              ▼
     │                   │               │         ┌─────────┐
     │                   │               │         │ Search  │
     │                   │               │         │ Widget  │
     │                   │               │         │         │
     │                   │               │         │ - Modal │
     │                   │               │         │ - Filters│
     │                   │               │         │ - Results│
     │                   │               │         └─────────┘
     │                   │               │              │
     │                   │               │              ▼
     │                   │               │         ┌─────────┐
     │                   │               │         │ API     │
     │                   │               │         │ Calls   │
     │                   │               │         └─────────┘
     │                   │               │              │
     │                   │               │              ▼
     │                   │               │         ┌─────────┐
     │                   │               │         │ Backend │
     │                   │               │         │ API     │
     │                   │               │         └─────────┘
```

## 🎨 Frontend Architecture Patterns

### State Management Architecture

```
Global State (Zustand)
├── Search State
│   ├── Query
│   ├── Filters
│   ├── Results
│   └── Pagination
├── UI State
│   ├── Modal Open/Close
│   ├── Loading States
│   └── Error States
└── User Preferences
    ├── Recent Searches
    ├── Filter Preferences
    └── Theme Settings

Local State (React)
├── Component State
│   ├── Form Inputs
│   ├── UI Interactions
│   └── Temporary Data
├── Context State
│   ├── Theme Context
│   ├── Search Context
│   └── Cart Context
└── Refs
    ├── DOM References
    ├── Timer References
    └── Animation References
```

### Component Communication Patterns

```
Parent Component (ShadowDOMSearchDropdown)
├── Props Down
│   ├── storeUrl
│   ├── onClose
│   └── isOpen
├── Callbacks Up
│   ├── handleSearch
│   ├── handleFilterChange
│   └── handleProductClick
└── Event Handling
    ├── Keyboard Events
    ├── Click Events
    └── Scroll Events

Child Components
├── KalifindSearch
│   ├── Search Logic
│   ├── Filter Management
│   └── Result Display
├── KalifindSearchDesktop
│   ├── Desktop Layout
│   ├── Sidebar Filters
│   └── Product Grid
└── KalifindSearchMobile
    ├── Mobile Layout
    ├── Collapsible UI
    └── Touch Interactions
```

## 🔒 Security Architecture

### Authentication & Authorization Flow

```
Client Request ──► API Gateway ──► Authentication Middleware
     │                   │                    │
     │                   │                    ▼
     │                   │            ┌─────────────┐
     │                   │            │ API Key     │
     │                   │            │ Validation  │
     │                   │            └─────────────┘
     │                   │                    │
     │                   │                    ▼
     │                   │            ┌─────────────┐
     │                   │            │ Vendor      │
     │                   │            │ Permission  │
     │                   │            │ Check       │
     │                   │            └─────────────┘
     │                   │                    │
     │                   │                    ▼
     │                   │            ┌─────────────┐
     │                   │            │ Store       │
     │                   │            │ Access      │
     │                   │            │ Validation  │
     │                   │            └─────────────┘
     │                   │                    │
     │                   │                    ▼
     │                   │            ┌─────────────┐
     │                   │            │ Request     │
     │                   │            │ Processing  │
     │                   │            └─────────────┘
```

### Data Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                          │
├─────────────────────────────────────────────────────────────┤
│ 1. Network Security                                         │
│    - HTTPS/TLS Encryption                                   │
│    - CORS Configuration                                     │
│    - Rate Limiting                                          │
├─────────────────────────────────────────────────────────────┤
│ 2. Authentication                                           │
│    - API Key Authentication                                 │
│    - JWT Token Validation                                   │
│    - Session Management                                     │
├─────────────────────────────────────────────────────────────┤
│ 3. Authorization                                            │
│    - Role-Based Access Control                              │
│    - Resource-Level Permissions                             │
│    - Vendor Isolation                                       │
├─────────────────────────────────────────────────────────────┤
│ 4. Input Validation                                         │
│    - Request Schema Validation                              │
│    - SQL Injection Prevention                               │
│    - XSS Protection                                         │
├─────────────────────────────────────────────────────────────┤
│ 5. Data Protection                                          │
│    - Database Encryption                                    │
│    - Sensitive Data Masking                                 │
│    - Audit Logging                                          │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Analytics Architecture

### Data Collection Pipeline

```
User Interactions ──► Frontend Analytics ──► Backend Processing ──► Data Storage
     │                        │                       │                    │
     │                        ▼                       ▼                    ▼
     │                ┌─────────────┐    ┌─────────────────┐    ┌─────────────┐
     │                │ Event       │    │ Analytics       │    │ PostgreSQL  │
     │                │ Tracking    │    │ Service         │    │ Database    │
     │                │             │    │                 │    │             │
     │                │ - Search    │    │ - Data          │    │ - Usage     │
     │                │ - Click     │    │   Aggregation   │    │   Metrics   │
     │                │ - Filter    │    │ - Real-time     │    │ - Search    │
     │                │ - Cart      │    │   Processing    │    │   Analytics │
     │                └─────────────┘    └─────────────────┘    └─────────────┘
     │                        │                       │                    │
     │                        ▼                       ▼                    ▼
     │                ┌─────────────┐    ┌─────────────────┐    ┌─────────────┐
     │                │ Real-time   │    │ Batch           │    │ Analytics   │
     │                │ Metrics     │    │ Processing      │    │ Dashboard   │
     │                │             │    │                 │    │             │
     │                │ - Live      │    │ - Daily         │    │ - Reports   │
     │                │   Updates   │    │   Summaries     │    │ - Charts    │
     │                │ - Alerts    │    │ - Trend         │    │ - Insights  │
     │                └─────────────┘    │   Analysis      │    └─────────────┘
     │                                   └─────────────────┘
```

## 🚀 Deployment Architecture

### Production Deployment

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN           │    │   Load Balancer │    │   Application   │
│                 │    │                 │    │   Servers       │
│ - Static Assets │    │ - SSL/TLS       │    │                 │
│ - Frontend JS   │    │ - Health Checks │    │ - Node.js Apps  │
│ - Images        │    │ - Auto Scaling  │    │ - PM2 Process   │
└─────────────────┘    └─────────────────┘    │   Management    │
         │                       │             └─────────────────┘
         │                       │                       │
         │                       ▼                       ▼
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │   Database      │    │   Search        │
         │              │   Cluster       │    │   Cluster       │
         │              │                 │    │                 │
         │              │ - PostgreSQL    │    │ - Elasticsearch │
         │              │ - Read Replicas │    │ - Multi-node    │
         │              │ - Backups       │    │ - High          │
         │              └─────────────────┘    │   Availability  │
         │                                     └─────────────────┘
         │                                               │
         ▼                                               ▼
┌─────────────────┐                            ┌─────────────────┐
│   Monitoring    │                            │   Storage       │
│                 │                            │                 │
│ - Error         │                            │ - Cloudflare R2 │
│   Tracking      │                            │ - Image Storage │
│ - Performance   │                            │ - File Backups  │
│   Monitoring    │                            │ - CDN           │
│ - Uptime        │                            │   Integration   │
│   Monitoring    │                            └─────────────────┘
└─────────────────┘
```

## 🔧 Development Architecture

### Development Environment

```
Developer Machine
├── Frontend Development
│   ├── Vite Dev Server
│   ├── Hot Module Replacement
│   └── TypeScript Compilation
├── Backend Development
│   ├── Node.js with tsx
│   ├── Database Migrations
│   └── API Testing
├── Database
│   ├── Local PostgreSQL
│   ├── Prisma Studio
│   └── Seed Data
└── Search Engine
    ├── Local Elasticsearch
    ├── Index Management
    └── Search Testing

CI/CD Pipeline
├── Code Quality
│   ├── ESLint
│   ├── TypeScript Check
│   └── Unit Tests
├── Build Process
│   ├── Frontend Build
│   ├── Backend Build
│   └── Docker Images
└── Deployment
    ├── Staging Environment
    ├── Production Deployment
    └── Health Checks
```

## 📈 Scalability Architecture

### Horizontal Scaling Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Scaling Layers                           │
├─────────────────────────────────────────────────────────────┤
│ 1. Application Layer                                        │
│    - Multiple Node.js Instances                             │
│    - Load Balancer Distribution                             │
│    - Stateless Application Design                           │
├─────────────────────────────────────────────────────────────┤
│ 2. Database Layer                                           │
│    - Read Replicas for Search Queries                       │
│    - Connection Pooling                                     │
│    - Query Optimization                                     │
├─────────────────────────────────────────────────────────────┤
│ 3. Search Layer                                             │
│    - Elasticsearch Cluster                                  │
│    - Index Sharding                                         │
│    - Caching Layer (Redis)                                  │
├─────────────────────────────────────────────────────────────┤
│ 4. Storage Layer                                            │
│    - CDN for Static Assets                                  │
│    - Cloudflare R2 for Images                               │
│    - Distributed File Storage                               │
└─────────────────────────────────────────────────────────────┘
```

### Performance Optimization

```
┌─────────────────────────────────────────────────────────────┐
│                Performance Optimization                     │
├─────────────────────────────────────────────────────────────┤
│ Frontend Optimizations                                      │
│ - Code Splitting & Lazy Loading                             │
│ - Bundle Size Optimization                                  │
│ - Image Optimization                                        │
│ - CDN Delivery                                              │
├─────────────────────────────────────────────────────────────┤
│ Backend Optimizations                                       │
│ - Database Query Optimization                               │
│ - Response Compression                                      │
│ - Caching Strategies                                        │
│ - Async Processing                                          │
├─────────────────────────────────────────────────────────────┤
│ Search Optimizations                                        │
│ - Index Optimization                                        │
│ - Query Caching                                             │
│ - Result Pagination                                         │
│ - Faceted Search Efficiency                                 │
└─────────────────────────────────────────────────────────────┘
```

This architecture provides a robust, scalable foundation for the KaliFinder search-as-a-service platform, supporting high-performance search functionality with comprehensive analytics and business management features.

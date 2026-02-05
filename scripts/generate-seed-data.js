/**
 * Generate seed data files for Remodely.AI app
 * Transforms surprise-granite-site data into app-ready format
 */

const fs = require('fs');
const path = require('path');

// Source paths
const SLABS_PATH = '/Users/homepc/surprise-granite-site/data/slabs.json';
const STONE_PRICING_PATH = '/Users/homepc/surprise-granite-site/tools/room-designer/stone-pricing.json';
const MSI_MATERIALS_PATH = '/Users/homepc/surprise-granite-site/tools/room-designer/data/msi-materials.json';
const DALTILE_MATERIALS_PATH = '/Users/homepc/surprise-granite-site/tools/room-designer/data/daltile-materials.json';

// Target paths
const OUTPUT_DIR = '/Users/homepc/slabSnap-backend/src/data';

// Helper to extract color family from primary color
function extractColorFamily(primaryColor) {
  if (!primaryColor) return 'Other';
  const color = primaryColor.toLowerCase();
  if (color.includes('white')) return 'White';
  if (color.includes('black')) return 'Black';
  if (color.includes('gray') || color.includes('grey')) return 'Grey';
  if (color.includes('beige') || color.includes('cream')) return 'Beige';
  if (color.includes('brown') || color.includes('tan')) return 'Brown';
  if (color.includes('blue')) return 'Blue';
  if (color.includes('green')) return 'Green';
  if (color.includes('gold') || color.includes('yellow')) return 'Gold';
  if (color.includes('red') || color.includes('burgundy')) return 'Red';
  return 'Multi';
}

// Transform slabs.json product to VendorProduct format
function transformSlabProduct(product) {
  const sku = product.variants?.[0]?.sku || `SKU-${product.id.split('/').pop()}`;
  const price = parseFloat(product.price) || 12.99;

  // Calculate realistic sqft price based on tier
  let pricePerSqFt = price;
  if (product.brandTier === 'luxury') {
    pricePerSqFt = 45 + Math.random() * 30;
  } else if (product.brandTier === 'premium') {
    pricePerSqFt = 28 + Math.random() * 20;
  } else {
    pricePerSqFt = 18 + Math.random() * 15;
  }

  return {
    id: product.id.replace('gid://shopify/Product/', 'slab-'),
    name: product.title.replace(' Sample', ''),
    brand: product.vendor,
    sku: sku,
    material_type: product.productType,
    color_family: extractColorFamily(product.primaryColor),
    finish: product.style === 'Grain' ? 'Polished' : 'Polished',
    unit_price: Math.round(pricePerSqFt * 100) / 100,
    price_unit: 'sqft',
    primary_image_url: product.images?.[0] || null,
    images: product.images || [],
    origin_country: product.originCountry,
    availability: product.available ? 'in_stock' : 'special_order',
    description: product.description,
    tags: product.tags || [],
    trending: product.trending > 0,
    views: product.views || 0,
    slug: product.countertopSlug || product.handle,
    brand_tier: product.brandTier,
    primary_color: product.primaryColor,
    accent_color: product.accentColor,
    style: product.style,
  };
}

// Transform stone-pricing.json granite to VendorProduct format
function transformStonePricing(granite) {
  return {
    id: `granite-${granite.id}`,
    name: granite.name,
    brand: granite.brand,
    sku: granite.id.toUpperCase(),
    material_type: 'Granite',
    color_family: extractColorFamily(granite.color),
    finish: 'Polished',
    unit_price: granite.price,
    price_unit: 'sqft',
    primary_image_url: granite.primaryImage,
    images: granite.images || [granite.primaryImage],
    origin_country: null,
    availability: 'in_stock',
    description: `${granite.name} granite - ${granite.tier}`,
    tags: [granite.tier, granite.brand],
    trending: false,
    views: 0,
    slug: granite.slug,
    brand_tier: granite.tier?.includes('Low') ? 'value' : granite.tier?.includes('Mid') ? 'premium' : 'luxury',
    primary_color: granite.color,
    accent_color: null,
    style: null,
  };
}

// Generate marketplace-slabs.json
function generateMarketplaceSlabs() {
  console.log('Loading source data...');

  const slabsData = JSON.parse(fs.readFileSync(SLABS_PATH, 'utf8'));
  const stonePricingData = JSON.parse(fs.readFileSync(STONE_PRICING_PATH, 'utf8'));

  console.log(`Found ${slabsData.length} products in slabs.json`);
  console.log(`Found ${stonePricingData.granite.length} granite items in stone-pricing.json`);

  // Transform slabs.json products
  const slabProducts = slabsData.map(transformSlabProduct);

  // Transform stone-pricing.json granites (filter out ones already in slabs)
  const existingNames = new Set(slabProducts.map(p => p.name.toLowerCase()));
  const graniteProducts = stonePricingData.granite
    .filter(g => !existingNames.has(g.name.toLowerCase()))
    .map(transformStonePricing);

  // Combine and sort by views/trending
  const allProducts = [...slabProducts, ...graniteProducts]
    .sort((a, b) => (b.views + (b.trending ? 1000 : 0)) - (a.views + (a.trending ? 1000 : 0)));

  console.log(`Total products: ${allProducts.length}`);

  // Add featured flags to top products
  allProducts.slice(0, 20).forEach(p => p.featured = true);
  allProducts.slice(0, 50).forEach(p => p.bestSeller = true);

  const output = {
    version: '1.0',
    generated: new Date().toISOString(),
    source: 'Surprise Granite Marketplace + Stone Pricing',
    productCount: allProducts.length,
    products: allProducts,
  };

  const outputPath = path.join(OUTPUT_DIR, 'marketplace-slabs.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`Written to ${outputPath}`);

  return allProducts;
}

// Generate vendors.json
function generateVendors() {
  const vendors = [
    {
      id: 'sg-main',
      company_name: 'Surprise Granite',
      type: 'fabricator',
      location: {
        address: '11560 N. Dysart Rd.',
        city: 'Surprise',
        state: 'AZ',
        zip: '85379',
        lat: 33.6848,
        lng: -112.3621,
      },
      phone: '(602) 833-3189',
      email: 'info@surprisegranite.com',
      website: 'www.surprisegranite.com',
      logo_url: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=200',
      services: ['Granite Fabrication', 'Custom Countertops', 'Remnants', 'Full Slabs', 'Installation'],
      rating: 4.9,
      review_count: 342,
      verified: true,
      featured: true,
    },
    {
      id: 'msi-phoenix',
      company_name: 'MSI Surfaces - Phoenix',
      type: 'stone-supplier',
      location: {
        address: '4405 W Roosevelt St',
        city: 'Phoenix',
        state: 'AZ',
        zip: '85043',
        lat: 33.4484,
        lng: -112.1563,
      },
      phone: '(602) 393-6330',
      email: 'phoenix@msisurfaces.com',
      website: 'www.msisurfaces.com',
      logo_url: 'https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=200',
      services: ['Natural Stone', 'Quartz', 'Porcelain', 'Wholesale', 'Pro Network Partner'],
      rating: 5.0,
      review_count: 428,
      verified: true,
      featured: true,
    },
    {
      id: 'cosentino-tempe',
      company_name: 'Cosentino - Tempe',
      type: 'stone-supplier',
      location: {
        address: '8307 S Priest Dr',
        city: 'Tempe',
        state: 'AZ',
        zip: '85284',
        lat: 33.3426,
        lng: -111.9705,
      },
      phone: '(480) 763-9400',
      email: 'tempe@cosentino.com',
      website: 'www.cosentino.com',
      logo_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200',
      services: ['Silestone', 'Dekton', 'Sensa Granite', 'Premium Surfaces'],
      rating: 4.8,
      review_count: 521,
      verified: true,
      featured: true,
    },
    {
      id: 'arizona-tile-tempe',
      company_name: 'Arizona Tile - Tempe',
      type: 'tile-store',
      location: {
        address: '8829 S Priest Dr',
        city: 'Tempe',
        state: 'AZ',
        zip: '85284',
        lat: 33.3358,
        lng: -111.9706,
      },
      phone: '(480) 893-9393',
      email: 'tempe@arizonatile.com',
      website: 'www.arizonatile.com',
      logo_url: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=200',
      services: ['Natural Stone', 'Tile', 'Pavers', 'Hardscaping', '230+ Varieties'],
      rating: 4.6,
      review_count: 387,
      verified: true,
    },
    {
      id: 'the-yard-az',
      company_name: 'The Yard AZ',
      type: 'stone-supplier',
      location: {
        address: '2334 W Lone Cactus Dr',
        city: 'Phoenix',
        state: 'AZ',
        zip: '85027',
        lat: 33.6912,
        lng: -112.1054,
      },
      phone: '(602) 633-9273',
      email: 'info@theyardaz.com',
      website: 'www.theyardaz.com',
      logo_url: 'https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=200',
      services: ['Remnants', 'Full Slabs', 'Granite', 'Marble', 'Quartzite', 'Discount Pricing'],
      rating: 4.7,
      review_count: 215,
      verified: true,
    },
    {
      id: 'cambria-avondale',
      company_name: 'Cambria',
      type: 'stone-supplier',
      location: {
        address: '1250 N Fairway Dr Building C, Suite 103',
        city: 'Avondale',
        state: 'AZ',
        zip: '85323',
        lat: 33.4439,
        lng: -112.3497,
      },
      phone: '(623) 471-6872',
      email: 'avondale@cambriausa.com',
      website: 'www.cambriausa.com',
      logo_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200',
      services: ['Premium Quartz', 'Exclusive Designs', 'American Made', 'By Appointment'],
      rating: 4.9,
      review_count: 412,
      verified: true,
      featured: true,
    },
    {
      id: 'aracruz-granite',
      company_name: 'Aracruz Granite',
      type: 'stone-supplier',
      location: {
        address: '2310 W Sherman St',
        city: 'Phoenix',
        state: 'AZ',
        zip: '85009',
        lat: 33.4525,
        lng: -112.0932,
      },
      phone: '(602) 252-1171',
      email: 'info@aracruzgranite.com',
      website: 'www.aracruzgranite.com',
      logo_url: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=200',
      services: ['Granite Slabs', 'Quartzite', 'Natural Stone', 'Wholesale'],
      rating: 4.7,
      review_count: 156,
      verified: true,
    },
    {
      id: 'architectural-surfaces',
      company_name: 'Architectural Surfaces',
      type: 'stone-supplier',
      location: {
        address: '9175 E Pima Center Pkwy suite a-1',
        city: 'Scottsdale',
        state: 'AZ',
        zip: '85258',
        lat: 33.6424,
        lng: -111.8902,
      },
      phone: '(480) 210-3570',
      email: 'scottsdale@architecturalsurfaces.com',
      website: 'www.architecturalsurfaces.com',
      logo_url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=200',
      services: ['Imported Stone', 'Quartz', 'Tile', '35 National Showrooms'],
      rating: 4.5,
      review_count: 298,
      verified: true,
    },
    {
      id: 'unique-design-solutions',
      company_name: 'Unique Design Solutions',
      type: 'tile-store',
      location: {
        address: '2514 E Mohawk Ln # 101',
        city: 'Phoenix',
        state: 'AZ',
        zip: '85050',
        lat: 33.5706,
        lng: -112.0336,
      },
      phone: '(602) 971-3166',
      email: 'info@uniquedesignsolutions.com',
      website: 'www.uniquedesignsolutions.com',
      logo_url: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=200',
      services: ['Ceramic Tile', 'Porcelain Tile', 'Glass Tile', 'Custom Designs', 'Pro Network Partner'],
      rating: 5.0,
      review_count: 186,
      verified: true,
      featured: true,
    },
    {
      id: 'emser-tile',
      company_name: 'Emser Tile',
      type: 'tile-store',
      location: {
        address: '2604 S 38th St',
        city: 'Phoenix',
        state: 'AZ',
        zip: '85034',
        lat: 33.4278,
        lng: -111.9965,
      },
      phone: '(602) 263-8453',
      email: 'phoenix@emser.com',
      website: 'www.emser.com',
      logo_url: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=200',
      services: ['Ceramic Tile', 'Porcelain Tile', 'Natural Stone', 'Commercial Projects'],
      rating: 4.6,
      review_count: 342,
      verified: true,
    },
    {
      id: 'villagio-tile',
      company_name: 'Villagio Tile & Stone',
      type: 'tile-store',
      location: {
        address: '8340 E Raintree Dr',
        city: 'Scottsdale',
        state: 'AZ',
        zip: '85260',
        lat: 33.6153,
        lng: -111.8911,
      },
      phone: '(480) 422-6700',
      email: 'info@villagiotile.com',
      website: 'www.villagiotile.com',
      logo_url: 'https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=200',
      services: ['Natural Stone', 'Porcelain Tiles', 'Custom Design', 'Premier Showroom'],
      rating: 4.8,
      review_count: 289,
      verified: true,
    },
    {
      id: 'cactus-stone-tile',
      company_name: 'Cactus Stone & Tile',
      type: 'stone-supplier',
      location: {
        address: '5005 E Madison St',
        city: 'Phoenix',
        state: 'AZ',
        zip: '85034',
        lat: 33.4655,
        lng: -111.9818,
      },
      phone: '(602) 914-2202',
      email: 'info@cactusstone.com',
      website: 'www.cactusstone.com',
      logo_url: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=200',
      services: ['Wholesale Tile', 'Natural Stone Slabs', 'Granite', 'Marble'],
      rating: 4.7,
      review_count: 256,
      verified: true,
    },
  ];

  const output = {
    version: '1.0',
    generated: new Date().toISOString(),
    source: 'Surprise Granite Pro Network',
    vendorCount: vendors.length,
    vendors: vendors,
  };

  const outputPath = path.join(OUTPUT_DIR, 'vendors.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`Written ${vendors.length} vendors to ${outputPath}`);

  return vendors;
}

// Generate pricing-tiers.json
function generatePricingTiers() {
  const msiData = JSON.parse(fs.readFileSync(MSI_MATERIALS_PATH, 'utf8'));
  const daltileData = JSON.parse(fs.readFileSync(DALTILE_MATERIALS_PATH, 'utf8'));

  const pricingTiers = {
    version: '1.0',
    generated: new Date().toISOString(),
    sources: ['MSI Price Lists - January 2025', 'Daltile CTF Price List - January 2026'],

    msi: {
      brand: 'MSI',
      quartz: Object.entries(msiData.quartz)
        .filter(([key]) => key.startsWith('group'))
        .map(([key, group]) => ({
          group: key,
          label: group.label,
          price_2cm: group.price2cm,
          price_3cm: group.price3cm,
          color_count: group.colors?.length || 0,
          colors: group.colors?.map(c => ({ name: c.name, sku: c.sku, color: c.color })) || [],
        })),
      lvt_flooring: Object.entries(msiData.lvtFlooring).map(([key, series]) => ({
        series: key,
        label: series.label,
        warranty: series.warranty,
        thickness: series.thickness,
        wear_layer: series.wearLayer,
        price_per_sqft: series.pricePerSF,
        color_count: series.colors?.length || 0,
      })),
    },

    daltile: {
      brand: 'Daltile',
      granite: daltileData.materials.granite.map(g => ({
        id: g.id,
        name: g.name,
        sku: g.sku,
        price_per_sqft: g.price,
        color: g.color,
        finish: g.finish,
      })),
      quartz: daltileData.materials.quartz.map(q => ({
        id: q.id,
        name: q.name,
        sku: q.sku,
        price_per_sqft: q.price,
        color: q.color,
        finish: q.finish,
      })),
      quartzite: daltileData.materials.quartzite.map(q => ({
        id: q.id,
        name: q.name,
        sku: q.sku,
        price_per_sqft: q.price,
        color: q.color,
        finish: q.finish,
      })),
      price_tiers: daltileData.priceTiers,
    },

    general_tiers: {
      budget: { min: 5, max: 20, label: 'Budget-Friendly', description: 'Entry-level granite and basic quartz' },
      mid: { min: 20, max: 40, label: 'Popular Choice', description: 'Premium granite, mid-tier quartz, basic marble' },
      premium: { min: 40, max: 70, label: 'Premium', description: 'Luxury quartz, marble, quartzite' },
      luxury: { min: 70, max: 150, label: 'Ultra-Luxury', description: 'Exotic quartzite, rare marble, designer surfaces' },
    },
  };

  const outputPath = path.join(OUTPUT_DIR, 'pricing-tiers.json');
  fs.writeFileSync(outputPath, JSON.stringify(pricingTiers, null, 2));
  console.log(`Written to ${outputPath}`);

  return pricingTiers;
}

// Main execution
console.log('=== Generating Remodely.AI Seed Data ===\n');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

generateMarketplaceSlabs();
console.log('');
generateVendors();
console.log('');
generatePricingTiers();

console.log('\n=== Seed Data Generation Complete ===');

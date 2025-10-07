/**
 * Script to get Vendor ID and Store IDs for analytics configuration
 * Run this in your backend directory to get the IDs you need
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getVendorAndStoreIds() {
  try {
    console.log('🔍 Fetching vendor and store information...\n');
    
    // Get all vendors
    const vendors = await prisma.storeVendor.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        shopifyStores: {
          select: {
            id: true,
            storeName: true,
            storeUrl: true,
            status: true
          }
        },
        woocommerceStores: {
          select: {
            id: true,
            storeName: true,
            storeUrl: true,
            status: true
          }
        }
      }
    });

    if (vendors.length === 0) {
      console.log('❌ No vendors found in the database.');
      return;
    }

    console.log('📊 Found vendors and their stores:\n');
    
    vendors.forEach((vendor, index) => {
      console.log(`🏪 Vendor ${index + 1}:`);
      console.log(`   ID: ${vendor.id}`);
      console.log(`   Name: ${vendor.name}`);
      console.log(`   User Email: ${vendor.user.email}`);
      console.log(`   User ID: ${vendor.userId}`);
      console.log(`   Store Type: ${vendor.storeType}`);
      
      if (vendor.shopifyStores.length > 0) {
        console.log(`   🛍️  Shopify Stores:`);
        vendor.shopifyStores.forEach(store => {
          console.log(`      - ID: ${store.id}, Name: ${store.storeName}, URL: ${store.storeUrl}, Status: ${store.status}`);
        });
      }
      
      if (vendor.woocommerceStores.length > 0) {
        console.log(`   🛒 WooCommerce Stores:`);
        vendor.woocommerceStores.forEach(store => {
          console.log(`      - ID: ${store.id}, Name: ${store.storeName}, URL: ${store.storeUrl}, Status: ${store.status}`);
        });
      }
      
      console.log('');
    });

    // Show the search script configuration for each vendor
    console.log('🔧 Search Script Configuration:\n');
    
    vendors.forEach((vendor, index) => {
      console.log(`For Vendor ${index + 1} (${vendor.name}):`);
      
      // Shopify stores
      if (vendor.shopifyStores.length > 0) {
        vendor.shopifyStores.forEach(store => {
          console.log(`   Shopify Store: ${store.storeName}`);
          console.log(`   <script src="https://your-cdn-domain.com/kalifind-search.js?storeUrl=${encodeURIComponent(store.storeUrl)}&vendorId=${vendor.id}&storeId=${store.id}"></script>`);
          console.log('');
        });
      }
      
      // WooCommerce stores
      if (vendor.woocommerceStores.length > 0) {
        vendor.woocommerceStores.forEach(store => {
          console.log(`   WooCommerce Store: ${store.storeName}`);
          console.log(`   <script src="https://your-cdn-domain.com/kalifind-search.js?storeUrl=${encodeURIComponent(store.storeUrl)}&vendorId=${vendor.id}&storeId=${store.id}"></script>`);
          console.log('');
        });
      }
    });

    console.log('✅ Configuration complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Copy the script tags above to your store websites');
    console.log('2. Replace "https://your-cdn-domain.com" with your actual CDN URL');
    console.log('3. Test the analytics by visiting your store and using the search');
    console.log('4. Check your dashboard to see the analytics data');

  } catch (error) {
    console.error('❌ Error fetching vendor data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
getVendorAndStoreIds();

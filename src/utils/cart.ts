import type { CartProduct, CartResponse, Product } from '../types';

// Store type detection - ALWAYS use explicit storeType from backend
/**
 * Update cart data for purchase tracking
 */
const updateCartDataForTracking = (product: CartProduct, price: number): void => {
  try {
    // Get existing cart data
    const existingData = localStorage.getItem('kalifind_cart_data');
    const cartData = existingData
      ? JSON.parse(existingData)
      : {
        totalValue: 0,
        itemCount: 0,
        productIds: [],
      };

    // Add new item to cart data
    cartData.totalValue += price;
    cartData.itemCount += 1;
    if (!cartData.productIds.includes(product.id)) {
      cartData.productIds.push(product.id);
    }

    // Save updated cart data
    localStorage.setItem('kalifind_cart_data', JSON.stringify(cartData));

    // Also update global state for immediate access
    (window as Window & { kalifindCart?: typeof cartData }).kalifindCart = cartData;

    console.log('📊 Cart tracking data updated:', cartData);
  } catch (error) {
    console.warn('Failed to update cart tracking data:', error);
  }
};

export const detectStoreType = (product: CartProduct): 'shopify' | 'woocommerce' => {
  // ✅ ALWAYS use storeType from product data (provided by backend)
  // Backend already determines store type when indexing products
  if (product.storeType) {
    return product.storeType;
  }

  // ❌ Fallback: Check for Shopify-specific fields (not reliable for custom domains!)
  // This is only used if backend doesn't provide storeType (should never happen)
  if (product.shopifyVariantId) {
    console.warn('⚠️ Using fallback Shopify detection - storeType should be provided by backend');
    return 'shopify';
  }

  // ❌ Final fallback to WooCommerce
  console.warn('⚠️ Using fallback WooCommerce detection - storeType should be provided by backend');
  return 'woocommerce';
};

// WooCommerce add to cart implementation
export const addToWooCommerceCart = async (product: CartProduct): Promise<CartResponse> => {
  try {
    // Extract numeric product ID - try wooProductId first, then fall back to id
    let productId = product.wooProductId;

    // If wooProductId is not available, try to extract from the id field
    if (!productId && product.id) {
      // Handle cases where id might be in format "woocommerce-{storeId}-{wooProductId}"
      const idParts = product.id.split('-');
      if (idParts.length >= 3 && idParts[0] === 'woocommerce') {
        productId = idParts[2]; // Extract the actual WooCommerce product ID
      } else {
        productId = product.id; // Fallback to the full id
      }
    }

    if (!productId) {
      throw new Error('Product ID is required for WooCommerce');
    }

    console.log('WooCommerce cart - Product ID:', productId, 'Store URL:', product.storeUrl);

    // Use WooCommerce AJAX endpoint directly
    const formData = new FormData();
    formData.append('product_id', productId.toString());
    formData.append('quantity', '1');
    const response = await fetch(`${product.storeUrl}/?wc-ajax=add_to_cart`, {
      method: 'POST',
      body: formData,
      credentials: 'include', // Include cookies for session
      mode: 'cors', // Explicitly set CORS mode
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    // Check if the response indicates success
    if (result && (result.error || result.fragments === undefined)) {
      throw new Error(result.message || 'Failed to add to cart');
    }

    console.log('WooCommerce cart success');

    return {
      success: true,
      message: `${product.title} added to cart!`,
    };
  } catch (error) {
    console.error('WooCommerce cart error:', error);
    throw new Error(`Failed to add ${product.title} to cart: ${error}`);
  }
};

// Shopify add to cart implementation using Shopify Cart API
export const addToShopifyCart = async (product: CartProduct): Promise<CartResponse> => {
  try {
    // Get Shopify variant ID - must use shopifyVariantId, not product.id
    let variantId = product.shopifyVariantId;

    if (!variantId) {
      throw new Error(
        'Shopify variant ID is required for cart operations. Product may not have variants configured.'
      );
    }

    // Extract numeric ID from GID format if needed
    // Shopify cart API expects numeric ID, not GID format
    if (variantId.startsWith('gid://shopify/ProductVariant/')) {
      variantId = variantId.split('/').pop() || variantId;
    }

    console.log('Adding to Shopify cart:', {
      originalVariantId: product.shopifyVariantId,
      extractedVariantId: variantId,
      storeUrl: product.storeUrl,
      productTitle: product.title,
    });

    // Use Shopify Cart API directly with FormData
    const formData = new FormData();
    formData.append('id', variantId);
    formData.append('quantity', '1');

    // Shopify cart/add.js expects form data, not JSON
    const response = await fetch(`${product.storeUrl}/cart/add.js`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Shopify cart API error:', {
        status: response.status,
        statusText: response.statusText,
        responseText: errorText,
        variantId,
        storeUrl: product.storeUrl,
      });

      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.description || errorMessage;
      } catch (_e) {
        // If response is not JSON, use the text as error message
        if (errorText) {
          errorMessage = errorText;
        }
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();

    // Store cart ID for future operations
    if (result.token) {
      localStorage.setItem('shopify_cart_id', result.token);
    }

    // Update cart fragments if successful
    if (result) {
      updateCartFragments(result);
    }

    return {
      success: true,
      message: `${product.title} added to cart!`,
      cart: result,
    };
  } catch (error) {
    console.error('Shopify cart error:', error);
    throw new Error(`Failed to add ${product.title} to cart: ${error}`);
  }
};

// Shopify cart format
interface ShopifyCart {
  item_count: number;
  items: unknown[];
  total_price: string;
}

// Update cart fragments in the DOM
export const updateCartFragments = (cart: CartResponse | ShopifyCart) => {
  // Update cart count selectors
  const cartSelectors = [
    '.cart-count',
    '.cart-item-count',
    '.header-cart-count',
    '.mini-cart-count',
    '.cart-badge',
    '[data-cart-count]',
    '.cart-counter',
    '.cart-quantity',
    '.cart-items-count',
  ];

  cartSelectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element) => {
      if (element.textContent !== undefined) {
        // Handle both Shopify cart format and our CartResponse format
        const itemCount = 'item_count' in cart
          ? cart.item_count
          : cart.cart?.item_count || 0;
        element.textContent = itemCount.toString();
      }
    });
  });

  // Update cart total selectors
  const totalSelectors = [
    '.cart-total',
    '.cart-subtotal',
    '.mini-cart-total',
    '[data-cart-total]',
    '.cart-price',
    '.cart-amount',
    '.total-price',
  ];

  totalSelectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element) => {
      if (element.textContent !== undefined) {
        // Handle both Shopify cart format and our CartResponse format
        const totalPrice = 'total_price' in cart
          ? cart.total_price
          : cart.cart?.total_price || '0';
        element.textContent = totalPrice.toString();
      }
    });
  });
};

// Helper function to check if product has multiple variants
const hasMultipleVariants = (product: Product): boolean => {
  const sizes = product.sizes || [];
  const colors = product.colors || [];

  // If either sizes or colors have more than one option, it has multiple variants
  return sizes.length > 1 || colors.length > 1;
};

// Main add to cart function with automatic store detection
export const addToCart = async (product: Product, storeUrl: string): Promise<CartResponse> => {
  try {
    // Check if product is external (always redirect to product page)
    if (product.productType === 'external') {
      if (product.productUrl) {
        window.open(product.productUrl, '_blank');
        return {
          success: true,
          message: 'Redirected to external product page',
        };
      } else {
        throw new Error('External product requires product URL');
      }
    }

    // Check if product is variable (redirect to product page)
    if (product.productType === 'variable') {
      if (product.productUrl) {
        window.open(product.productUrl, '_blank');
        return {
          success: true,
          message: 'Redirected to product page for variant selection',
        };
      } else {
        throw new Error('Variable product requires product URL');
      }
    }

    // Check if product has multiple variants (sizes/colors) - redirect to product page
    if (hasMultipleVariants(product)) {
      if (product.productUrl) {
        window.open(product.productUrl, '_blank');
        return {
          success: true,
          message:
            'Redirected to product page for variant selection (multiple sizes/colors available)',
        };
      } else {
        throw new Error('Product with multiple variants requires product URL');
      }
    }

    // Create cart product with store information
    const cartProduct: CartProduct = {
      ...product,
      storeUrl,
      storeType: detectStoreType({
        ...product,
        storeUrl,
        storeType: product.storeType as 'shopify' | 'woocommerce',
      }),
    };

    console.log('Adding to cart:', {
      product: cartProduct.title,
      productType: cartProduct.productType,
      storeType: cartProduct.storeType,
      productId: cartProduct.id,
      variantId: cartProduct.shopifyVariantId,
      wooProductId: cartProduct.wooProductId,
      hasShopifyVariantId: !!cartProduct.shopifyVariantId,
      hasWooProductId: !!cartProduct.wooProductId,
      sizes: cartProduct.sizes,
      colors: cartProduct.colors,
      hasMultipleVariants: hasMultipleVariants(cartProduct),
    });

    // Debug: Log the full product object to see what fields are available
    console.log('Full cart product object:', cartProduct);

    // Add to cart based on store type
    let result: CartResponse;

    if (cartProduct.storeType === 'shopify') {
      result = await addToShopifyCart(cartProduct);
    } else if (cartProduct.storeType === 'woocommerce') {
      result = await addToWooCommerceCart(cartProduct);
    } else {
      throw new Error('Unsupported store type');
    }

    // Trigger custom event for UI integration
    window.dispatchEvent(
      new CustomEvent('kalifind:cart:added', {
        detail: {
          product: cartProduct,
          storeType: cartProduct.storeType,
          cart: result.cart,
          message: result.message,
        },
      })
    );

    // ADD UBI TRACKING HERE
    try {
      const { getUBIClient } = await import('../analytics/ubiClient');
      const ubiClient = getUBIClient();
      if (ubiClient) {
        ubiClient.trackAddToCart(
          cartProduct.id,
          cartProduct.title,
          parseFloat(cartProduct.price) || 0,
          1
        );
      }
    } catch (ubiError) {
      console.warn('UBI tracking failed:', ubiError);
    }

    // STORE CART DATA FOR PURCHASE TRACKING
    try {
      updateCartDataForTracking(cartProduct, parseFloat(cartProduct.price) || 0);
    } catch (error) {
      console.warn('Failed to update cart tracking data:', error);
    }

    return result;
  } catch (error) {
    console.error('Add to cart error:', error);

    // Final fallback: redirect to product page
    if (product.productUrl) {
      window.open(product.productUrl, '_blank');
      return {
        success: true,
        message: 'Redirected to product page due to cart error',
      };
    }

    throw error;
  }
};

// Error handling with fallback
export const handleCartError = (error: Error | unknown, product: Product): void => {
  console.error('Cart error:', error);

  // Show user-friendly error message
  const errorMessage = error instanceof Error ? error.message : 'Failed to add to cart';

  // Try to show notification if available
  if (typeof window !== 'undefined') {
    // Try to trigger a notification system if it exists
    window.dispatchEvent(
      new CustomEvent('kalifind:cart:error', {
        detail: {
          product: product,
          error: errorMessage,
          fallbackUrl: product.productUrl,
        },
      })
    );
  }

  // Fallback: redirect to product page
  if (product.productUrl) {
    setTimeout(() => {
      window.open(product.productUrl, '_blank');
    }, 1000);
  }
};

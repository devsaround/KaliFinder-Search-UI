import { CartProduct, CartResponse, CartError, Product } from '../types';
import { toast } from 'sonner';

// Store type detection
export const detectStoreType = (product: CartProduct): 'shopify' | 'woocommerce' => {
  // Check if storeType is explicitly set
  if (product.storeType) {
    return product.storeType;
  }
  
  // Check store URL for Shopify indicators
  if (product.storeUrl?.includes('myshopify.com') || 
      product.storeUrl?.includes('shopify.com') ||
      product.shopifyVariantId) {
    return 'shopify';
  }
  
  // Default to WooCommerce
  return 'woocommerce';
};

// WooCommerce add to cart implementation using backend proxy
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

    // Use backend proxy to avoid CORS issues
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/v1/cart/woocommerce/add`,
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          storeUrl: product.storeUrl,
          productId: productId,
          quantity: 1,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Update cart fragments if successful
    if (result.success && result.data) {
      updateCartFragments(result.data);
    }
    
    // Show success toast
    toast.success(`${product.title} added to cart!`, {
      duration: 2000,
    });
    
    return {
      success: true,
      message: `${product.title} added to cart!`,
      cart: result.data
    };
    
  } catch (error) {
    console.error('WooCommerce cart error:', error);
    
    // Show error toast
    toast.error(`Failed to add ${product.title} to cart`, {
      duration: 3000,
    });
    
    throw new Error(`Failed to add ${product.title} to cart: ${error}`);
  }
};

// Shopify add to cart implementation
export const addToShopifyCart = async (product: CartProduct): Promise<CartResponse> => {
  try {
    // Get Shopify variant ID
    const variantId = product.shopifyVariantId || product.id;
    
    console.log('Shopify cart product data:', {
      title: product.title,
      id: product.id,
      shopifyVariantId: product.shopifyVariantId,
      variantId: variantId,
      storeUrl: product.storeUrl
    });
    
    if (!variantId) {
      throw new Error('Variant ID is required for Shopify');
    }

    // Use backend proxy to avoid CORS issues
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/v1/cart/shopify/add`,
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          storeUrl: product.storeUrl,
          variantId: variantId,
          quantity: 1,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Update cart fragments if successful
    if (result.success && result.cart) {
      updateCartFragments(result.cart);
    }
    
    return {
      success: true,
      message: `${product.title} added to cart!`,
      cart: result.cart
    };
    
  } catch (error) {
    console.error('Shopify cart error:', error);
    throw new Error(`Failed to add ${product.title} to cart: ${error}`);
  }
};

// Update cart fragments in the DOM
export const updateCartFragments = (cart: any) => {
  // Update cart count selectors
  const cartSelectors = [
    ".cart-count", ".cart-item-count", ".header-cart-count",
    ".mini-cart-count", ".cart-badge", "[data-cart-count]",
    ".cart-counter", ".cart-quantity", ".cart-items-count"
  ];
  
  cartSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      if (element.textContent !== undefined) {
        element.textContent = cart.item_count?.toString() || "0";
      }
    });
  });

  // Update cart total selectors  
  const totalSelectors = [
    ".cart-total", ".cart-subtotal", ".mini-cart-total", "[data-cart-total]",
    ".cart-price", ".cart-amount", ".total-price"
  ];
  
  totalSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      if (element.textContent !== undefined) {
        element.textContent = cart.total_price || "0";
      }
    });
  });
};

// Main add to cart function with automatic store detection
export const addToCart = async (product: Product, storeUrl: string): Promise<CartResponse> => {
  try {
    // Check if product is variable (redirect to product page)
    if (product.productType === "variable") {
      if (product.productUrl) {
        window.open(product.productUrl, "_blank");
        return {
          success: true,
          message: "Redirected to product page for variant selection"
        };
      } else {
        throw new Error("Variable product requires product URL");
      }
    }

    // Create cart product with store information
    const cartProduct: CartProduct = {
      ...product,
      storeUrl,
      storeType: detectStoreType({ ...product, storeUrl, storeType: product.storeType as any })
    };

    console.log('Adding to cart:', {
      product: cartProduct.title,
      storeType: cartProduct.storeType,
      productId: cartProduct.id,
      variantId: cartProduct.shopifyVariantId,
      wooProductId: cartProduct.wooProductId
    });

    // Add to cart based on store type
    let result: CartResponse;
    
    if (cartProduct.storeType === "shopify") {
      result = await addToShopifyCart(cartProduct);
    } else if (cartProduct.storeType === "woocommerce") {
      result = await addToWooCommerceCart(cartProduct);
    } else {
      throw new Error("Unsupported store type");
    }

    // Trigger custom event for UI integration
    window.dispatchEvent(
      new CustomEvent("kalifind:cart:added", {
        detail: {
          product: cartProduct,
          storeType: cartProduct.storeType,
          cart: result.cart,
          message: result.message
        },
      })
    );

    return result;
    
  } catch (error) {
    console.error("Add to cart error:", error);
    
    // Show error toast
    toast.error(`Failed to add ${product.title} to cart`, {
      duration: 3000,
    });
    
    // Fallback: redirect to product page
    if (product.productUrl) {
      window.open(product.productUrl, "_blank");
      return {
        success: true,
        message: "Redirected to product page due to cart error"
      };
    }
    
    throw error;
  }
};

// Error handling with fallback
export const handleCartError = (error: any, product: Product): void => {
  console.error("Cart error:", error);
  
  // Show user-friendly error message
  const errorMessage = error.message || "Failed to add to cart";
  
  // Try to show notification if available
  if (typeof window !== 'undefined') {
    // Try to trigger a notification system if it exists
    window.dispatchEvent(
      new CustomEvent("kalifind:cart:error", {
        detail: {
          product: product,
          error: errorMessage,
          fallbackUrl: product.productUrl
        },
      })
    );
  }
  
  // Fallback: redirect to product page
  if (product.productUrl) {
    setTimeout(() => {
      window.open(product.productUrl, "_blank");
    }, 1000);
  }
};

/**
 * KaliFinder AJAX Cart Implementation
 *
 * Follows official documentation:
 * - WooCommerce: https://woocommerce.com/document/ajax-add-to-cart/
 * - Shopify: https://shopify.dev/docs/api/ajax/reference/cart
 *
 * Handles add to cart, update cart, and remove from cart operations
 * for both WooCommerce and Shopify stores.
 */

import type { Product } from '../types';
import { safeLocalStorage } from './safe-storage';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type Platform = 'woocommerce' | 'shopify';

interface WooCommerceCartResponse {
  error?: boolean;
  product_url?: string;
  fragments?: Record<string, string>;
  cart_hash?: string;
  notices?: string;
}

interface ShopifyCartResponse {
  items: ShopifyCartItem[];
  item_count: number;
  total_price: number;
  token?: string;
}

interface ShopifyCartItem {
  id: number;
  properties: Record<string, unknown>;
  quantity: number;
  variant_id: number;
  key: string;
  title: string;
  price: number;
  original_price: number;
  discounted_price: number;
  line_price: number;
  original_line_price: number;
  total_discount: number;
  discounts: unknown[];
  sku: string;
  grams: number;
  vendor: string;
  taxable: boolean;
  product_id: number;
  product_has_only_default_variant: boolean;
  gift_card: boolean;
  final_price: number;
  final_line_price: number;
  url: string;
  featured_image: {
    aspect_ratio: number;
    alt: string;
    height: number;
    url: string;
    width: number;
  };
  image: string;
  handle: string;
  requires_shipping: boolean;
  product_type: string;
  product_title: string;
  product_description: string;
  variant_title: string;
  variant_options: string[];
  options_with_values: Array<{
    name: string;
    value: string;
  }>;
  line_level_discount_allocations: unknown[];
  line_level_total_discount: number;
}

// ============================================================================
// WOOCOMMERCE AJAX CART
// ============================================================================

export class WooCommerceAjaxCart {
  private storeUrl: string;

  constructor(storeUrl: string) {
    this.storeUrl = storeUrl;
  }

  /**
   * Add product to WooCommerce cart using AJAX
   * Follows: https://woocommerce.com/document/ajax-add-to-cart/
   */
  async addToCart(product: Product, quantity = 1): Promise<boolean> {
    try {
      // Extract product ID (handle both simple and variable products)
      let productId = product.wooProductId || product.id;

      // Handle prefixed IDs (e.g., "woocommerce-{storeId}-{productId}")
      if (typeof productId === 'string' && productId.includes('-')) {
        const parts = productId.split('-');
        const lastPart = parts[parts.length - 1];
        if (lastPart) {
          productId = lastPart;
        }
      }

      if (!productId) {
        throw new Error('Product ID is required for WooCommerce');
      }

      console.log('🛒 [WooCommerce] Adding to cart:', {
        productId,
        quantity,
        storeUrl: this.storeUrl,
        productTitle: product.title,
      });

      // Prepare form data
      const formData = new FormData();
      formData.append('product_id', productId.toString());
      formData.append('quantity', quantity.toString());

      // Add variation ID if present
      if (product.wooVariationId) {
        formData.append('variation_id', product.wooVariationId.toString());
      }

      // Add variation attributes if present
      if (product.attributes && Object.keys(product.attributes).length > 0) {
        Object.entries(product.attributes).forEach(([key, value]) => {
          formData.append(key, value.toString());
        });
      }

      // WooCommerce AJAX endpoint
      const ajaxUrl = `${this.storeUrl}/?wc-ajax=add_to_cart`;

      const response = await fetch(ajaxUrl, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include cookies for session
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: WooCommerceCartResponse = await response.json();

      // Check for WooCommerce error response
      if (data.error && data.product_url) {
        console.warn(
          '⚠️ [WooCommerce] Product requires configuration, redirecting to product page'
        );
        window.location.href = data.product_url;
        return false;
      }

      // Success - trigger WooCommerce fragment refresh
      if (data.fragments) {
        this.updateFragments(data.fragments);
        this.triggerWooCommerceEvents(data, productId, quantity);
      }

      console.log('✅ [WooCommerce] Added to cart successfully');
      return true;
    } catch (error) {
      console.error('❌ [WooCommerce] Add to cart failed:', error);
      throw error;
    }
  }

  /**
   * Update WooCommerce cart fragments (mini cart, cart count, etc.)
   * SECURITY NOTE: HTML comes from WooCommerce API response, which is trusted.
   * WooCommerce sanitizes fragment content server-side.
   */
  private updateFragments(fragments: Record<string, string>): void {
    Object.entries(fragments).forEach(([selector, html]) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        // Using innerHTML for WooCommerce cart fragments (server-sanitized content)
        element.innerHTML = html;
      });
    });
  }

  /**
   * Trigger WooCommerce native events for theme compatibility
   */
  private triggerWooCommerceEvents(
    data: WooCommerceCartResponse,
    productId: string | number,
    quantity: number
  ): void {
    // Trigger standard WooCommerce event
    const wcEvent = new CustomEvent('added_to_cart', {
      detail: {
        fragments: data.fragments,
        cart_hash: data.cart_hash,
      },
    });
    document.body.dispatchEvent(wcEvent);

    // Trigger jQuery event for legacy themes (if jQuery is available)
    if (typeof window !== 'undefined' && 'jQuery' in window) {
      const jquery = (window as Window & { jQuery?: unknown }).jQuery;
      if (jquery && typeof jquery === 'function') {
        try {
          (
            jquery as (selector: unknown) => {
              trigger: (event: string, data: unknown[]) => void;
            }
          )(document.body).trigger('added_to_cart', [data.fragments, data.cart_hash]);
        } catch (e) {
          console.warn('Failed to trigger jQuery event:', e);
        }
      }
    }

    // Trigger KaliFinder custom event
    const kfEvent = new CustomEvent('kaliFinder.cart.add', {
      detail: {
        platform: 'woocommerce',
        productId,
        quantity,
        fragments: data.fragments,
      },
    });
    document.dispatchEvent(kfEvent);
  }

  /**
   * Update cart item quantity
   */
  async updateCartItemQuantity(cartItemKey: string, quantity: number): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('cart_item_key', cartItemKey);
      formData.append('quantity', quantity.toString());

      const response = await fetch(`${this.storeUrl}/?wc-ajax=update_cart_item_quantity`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      const data = await response.json();

      if (data.fragments) {
        this.updateFragments(data.fragments);
      }

      return true;
    } catch (error) {
      console.error('❌ [WooCommerce] Update cart quantity failed:', error);
      return false;
    }
  }

  /**
   * Remove item from cart
   */
  async removeCartItem(cartItemKey: string): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('cart_item_key', cartItemKey);

      const response = await fetch(`${this.storeUrl}/?wc-ajax=remove_from_cart`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      const data = await response.json();

      if (data.fragments) {
        this.updateFragments(data.fragments);
      }

      return true;
    } catch (error) {
      console.error('❌ [WooCommerce] Remove cart item failed:', error);
      return false;
    }
  }
}

// ============================================================================
// SHOPIFY AJAX CART
// ============================================================================

export class ShopifyAjaxCart {
  private storeUrl: string;

  constructor(storeUrl: string) {
    this.storeUrl = storeUrl;
  }

  /**
   * Save cart token to localStorage
   */
  private saveCartToken(token: string): void {
    safeLocalStorage.setItem('shopify_cart_token', token);
  } /**
   * Add product to Shopify cart using AJAX
   * Follows: https://shopify.dev/docs/api/ajax/reference/cart
   */
  async addToCart(product: Product, quantity = 1): Promise<boolean> {
    try {
      let variantId = product.shopifyVariantId;

      if (!variantId) {
        throw new Error('Shopify variant ID is required');
      }

      // Extract numeric ID from GID format if needed
      if (typeof variantId === 'string' && variantId.startsWith('gid://shopify/ProductVariant/')) {
        variantId = variantId.split('/').pop() || variantId;
      }

      console.log('🛒 [Shopify] Adding to cart:', {
        variantId,
        quantity,
        storeUrl: this.storeUrl,
        productTitle: product.title,
      });

      // Shopify Cart API expects items array
      const payload = {
        items: [
          {
            id: variantId,
            quantity,
          },
        ],
      };

      const response = await fetch(`${this.storeUrl}/cart/add.js`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [Shopify] Add to cart error:', errorData);

        throw new Error(
          (errorData as { message?: string; description?: string }).message ||
            (errorData as { message?: string; description?: string }).description ||
            `HTTP ${response.status}`
        );
      }

      const data = await response.json();

      // Save cart token if provided
      if (data.token) {
        this.saveCartToken(data.token);
      }

      // Fetch updated cart to get full cart state
      await this.refreshCart();

      // Trigger Shopify theme events
      this.triggerShopifyEvents(variantId, quantity);

      console.log('✅ [Shopify] Added to cart successfully');
      return true;
    } catch (error) {
      console.error('❌ [Shopify] Add to cart failed:', error);

      // Trigger error event
      const errorEvent = new CustomEvent('kaliFinder.cart.add.error', {
        detail: {
          platform: 'shopify',
          variantId: product.shopifyVariantId,
          quantity,
          error,
        },
      });
      document.dispatchEvent(errorEvent);

      throw error;
    }
  }

  /**
   * Refresh cart data and update UI
   */
  private async refreshCart(): Promise<ShopifyCartResponse | null> {
    try {
      const response = await fetch(`${this.storeUrl}/cart.js`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const cartData: ShopifyCartResponse = await response.json();

      // Update cart count in UI
      this.updateCartUI(cartData);

      // Trigger cart updated event
      const uiEvent = new CustomEvent('kaliFinder.cart.updated', {
        detail: { cart: cartData },
      });
      document.dispatchEvent(uiEvent);

      return cartData;
    } catch (error) {
      console.error('❌ [Shopify] Failed to refresh cart:', error);
      return null;
    }
  }

  /**
   * Update Shopify cart UI elements
   */
  private updateCartUI(cart: ShopifyCartResponse): void {
    // Update cart count
    const cartCountSelectors = [
      '[data-cart-count]',
      '.cart-count',
      '.cart-item-count',
      '#CartCount',
      '.header__cart-count',
      '.cart-link__bubble',
    ];

    cartCountSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        element.textContent = cart.item_count.toString();
        element.setAttribute('data-cart-count', cart.item_count.toString());
      });
    });

    // Update cart total
    const cartTotalSelectors = ['[data-cart-total]', '.cart-total', '.cart__total', '#CartTotal'];

    cartTotalSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        const formattedPrice = this.formatMoney(cart.total_price);
        element.textContent = formattedPrice;
      });
    });
  }

  /**
   * Format Shopify money (cents to dollars)
   */
  private formatMoney(cents: number): string {
    const dollars = cents / 100;
    return `$${dollars.toFixed(2)}`;
  }

  /**
   * Trigger Shopify theme events for compatibility
   */
  private triggerShopifyEvents(variantId: string | number, quantity: number): void {
    // Trigger Shopify theme event
    const shopifyEvent = new CustomEvent('cart:item:added', {
      detail: {
        variant_id: variantId,
        quantity,
      },
    });
    document.dispatchEvent(shopifyEvent);

    // Trigger KaliFinder custom event
    const kfEvent = new CustomEvent('kaliFinder.cart.add', {
      detail: {
        platform: 'shopify',
        variantId,
        quantity,
      },
    });
    document.dispatchEvent(kfEvent);
  }

  /**
   * Update cart item quantity
   * Follows: https://shopify.dev/docs/api/ajax/reference/cart#post-cart-change-js
   */
  async updateCartItemQuantity(lineItemKey: string, quantity: number): Promise<boolean> {
    try {
      const payload = {
        id: lineItemKey,
        quantity,
      };

      const response = await fetch(`${this.storeUrl}/cart/change.js`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data: ShopifyCartResponse = await response.json();
      this.updateCartUI(data);

      return true;
    } catch (error) {
      console.error('❌ [Shopify] Update cart quantity failed:', error);
      return false;
    }
  }

  /**
   * Remove item from cart (set quantity to 0)
   */
  async removeCartItem(lineItemKey: string): Promise<boolean> {
    return this.updateCartItemQuantity(lineItemKey, 0);
  }

  /**
   * Clear entire cart
   */
  async clearCart(): Promise<boolean> {
    try {
      const response = await fetch(`${this.storeUrl}/cart/clear.js`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      await response.json();
      await this.refreshCart();

      return true;
    } catch (error) {
      console.error('❌ [Shopify] Clear cart failed:', error);
      return false;
    }
  }

  /**
   * Get current cart state
   */
  async getCart(): Promise<ShopifyCartResponse | null> {
    return this.refreshCart();
  }
}

// ============================================================================
// UNIFIED CART FACTORY
// ============================================================================

/**
 * Create appropriate cart instance based on platform
 */
export function createCartInstance(platform: Platform, storeUrl: string) {
  if (platform === 'shopify') {
    return new ShopifyAjaxCart(storeUrl);
  } else {
    return new WooCommerceAjaxCart(storeUrl);
  }
}

/**
 * Detect platform from product or store URL
 */
export function detectPlatform(product: Product): Platform {
  // Use explicit storeType from product if available
  if (product.storeType) {
    return product.storeType as Platform;
  }

  // Fallback: Check for Shopify-specific fields
  if (product.shopifyVariantId) {
    return 'shopify';
  }

  // Default to WooCommerce
  return 'woocommerce';
}

import { useCallback, useState } from 'react';
import type { Product } from '../types';
import { addToCart as addToCartUtil, handleCartError } from '../utils/cart';

interface UseCartReturn {
  addingToCart: string | null;
  cartMessage: string | null;
  addToCart: (product: Product, storeUrl?: string) => Promise<void>;
}

export function useCart(): UseCartReturn {
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [cartMessage, setCartMessage] = useState<string | null>(null);

  const addToCart = useCallback(async (product: Product, storeUrl?: string) => {
    setAddingToCart(product.id);
    setCartMessage(`Adding ${product.title} to cart...`);

    try {
      const success = await addToCartUtil(product, storeUrl || '');

      if (success) {
        setCartMessage(`✓ ${product.title} added to cart!`);
        setTimeout(() => setCartMessage(null), 3000);

        // Track potential checkout initiation when cart has multiple items
        trackCheckoutInitiation();
      } else {
        throw new Error('Failed to add to cart');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      const errorMessage = handleCartError(error, product);
      setCartMessage(`✗ ${errorMessage}`);
      setTimeout(() => setCartMessage(null), 5000);
    } finally {
      setAddingToCart(null);
    }
  }, []);

  return {
    addingToCart,
    cartMessage,
    addToCart,
  };
}

/**
 * Track checkout initiation when cart has sufficient items
 */
const trackCheckoutInitiation = (): void => {
  try {
    const cartData = localStorage.getItem('kalifind_cart_data');
    if (cartData) {
      const parsed = JSON.parse(cartData);

      // Track checkout initiation when user has 2+ items or high-value cart
      if (parsed.itemCount >= 2 || parsed.totalValue >= 50) {
        console.log('🛒 Checkout initiation triggered - cart has enough items');

        // Import and use UBI client
        import('../analytics/ubiClient')
          .then(({ getUBIClient }) => {
            const ubiClient = getUBIClient();
            if (ubiClient) {
              ubiClient.trackCheckoutInitiated(
                parsed.totalValue,
                parsed.itemCount,
                parsed.productIds
              );
            }
          })
          .catch((error) => {
            console.warn('Failed to track checkout initiation:', error);
          });
      }
    }
  } catch (error) {
    console.warn('Failed to track checkout initiation:', error);
  }
};

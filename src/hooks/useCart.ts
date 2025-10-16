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

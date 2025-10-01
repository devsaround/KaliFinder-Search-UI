import { CartProduct, CartResponse, CartError, Product } from '../types';

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

    // Try fetch first, but expect CORS issues
    try {
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
      
      console.log('WooCommerce cart success via fetch');
      
    } catch (fetchError) {
      // CORS is expected for WooCommerce stores, silently use iframe fallback
      console.log('Using iframe method for cart addition (CORS-free)');
      
      // Use iframe method for CORS-free cart addition
      return new Promise((resolve, reject) => {
        console.log('Creating iframe for cart addition...');
        
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.name = "cart-submit-" + Date.now();
        iframe.style.position = "absolute";
        iframe.style.left = "-9999px";
        iframe.style.top = "-9999px";
        iframe.style.width = "1px";
        iframe.style.height = "1px";
        document.body.appendChild(iframe);
        
        const form = document.createElement("form");
        form.method = "POST";
        form.action = `${product.storeUrl}/?wc-ajax=add_to_cart`;
        form.target = iframe.name;
        form.style.display = "none";
        form.enctype = "application/x-www-form-urlencoded";
        
        const productIdField = document.createElement("input");
        productIdField.type = "hidden";
        productIdField.name = "product_id";
        productIdField.value = productId.toString();
        
        const quantityField = document.createElement("input");
        quantityField.type = "hidden";
        quantityField.name = "quantity";
        quantityField.value = "1";
        
        // Add nonce field if available (WooCommerce security)
        const nonceField = document.createElement("input");
        nonceField.type = "hidden";
        nonceField.name = "woocommerce-add-to-cart-nonce";
        nonceField.value = ""; // This might need to be fetched from the store
        
        form.appendChild(productIdField);
        form.appendChild(quantityField);
        form.appendChild(nonceField);
        document.body.appendChild(form);
        
        console.log('Form created:', {
          action: form.action,
          productId: productId,
          target: iframe.name
        });
        
        let resolved = false;
        
        // Handle iframe load event
        iframe.onload = () => {
          if (resolved) return;
          resolved = true;
          
          console.log('Iframe loaded, checking response...');
          
          try {
            // Try to access iframe content (may fail due to CORS)
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDoc) {
              // Check for success indicators in the response
              const bodyText = iframeDoc.body?.textContent || '';
              console.log('Iframe content:', bodyText.substring(0, 200));
              
              if (bodyText.includes('error') || bodyText.includes('failed') || bodyText.includes('Error')) {
                reject(new Error('Cart addition failed - error in response'));
                return;
              }
            }
            
            // Assume success if no error detected
            console.log('Cart addition successful via iframe');
            resolve({
              success: true,
              message: `${product.title} added to cart!`
            });
          } catch (e) {
            // If we can't access iframe content due to CORS, assume success
            console.log('Cannot access iframe content (CORS), assuming success');
            resolve({
              success: true,
              message: `${product.title} added to cart!`
            });
          }
          
          // Cleanup
          setTimeout(() => {
            try {
              if (document.body.contains(form)) {
                document.body.removeChild(form);
              }
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            } catch (cleanupError) {
              console.warn('Cleanup error:', cleanupError);
            }
          }, 1000);
        };
        
        iframe.onerror = () => {
          if (resolved) return;
          resolved = true;
          console.error('Iframe error occurred');
          reject(new Error('Failed to submit cart form'));
        };
        
        // Submit the form
        console.log('Submitting form...');
        form.submit();
        
        // Fallback timeout - if iframe doesn't load within 5 seconds, assume success
        setTimeout(() => {
          if (resolved) return;
          resolved = true;
          console.log('Iframe timeout - assuming success');
          resolve({
            success: true,
            message: `${product.title} added to cart!`
          });
        }, 5000);
      });
    }
    
    return {
      success: true,
      message: `${product.title} added to cart!`
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
      throw new Error('Shopify variant ID is required for cart operations. Product may not have variants configured.');
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
      productTitle: product.title
    });

    // Use Shopify Cart API directly with FormData
    const formData = new FormData();
    formData.append('id', variantId);
    formData.append('quantity', '1');

    // Try to add to existing cart first
    let cartId = localStorage.getItem('shopify_cart_id');
    let response;

    try {
      // Shopify cart/add.js expects form data, not JSON
      response = await fetch(`${product.storeUrl}/cart/add.js`, {
        method: "POST",
        headers: { 
          "Accept": "application/json"
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
          storeUrl: product.storeUrl
        });
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.description || errorMessage;
        } catch (e) {
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
        cart: result
      };
      
    } catch (corsError) {
      console.warn('Direct Shopify API failed, trying fallback method:', corsError);
      
      // Fallback: Use form submission method for CORS-free cart addition
      return await addToShopifyCartFallback(product);
    }
    
  } catch (error) {
    console.error('Shopify cart error:', error);
    throw new Error(`Failed to add ${product.title} to cart: ${error}`);
  }
};

// Fallback method for Shopify cart addition using form submission (CORS-free)
export const addToShopifyCartFallback = async (product: CartProduct): Promise<CartResponse> => {
  return new Promise((resolve, reject) => {
    try {
      console.log('Using Shopify fallback method for cart addition');
      
      // Extract numeric ID from GID format if needed
      let variantId = product.shopifyVariantId!;
      if (variantId.startsWith('gid://shopify/ProductVariant/')) {
        variantId = variantId.split('/').pop() || variantId;
      }
      
      // Create a hidden form for cart addition
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `${product.storeUrl}/cart/add`;
      form.style.display = 'none';
      
      // Add variant ID
      const variantInput = document.createElement('input');
      variantInput.type = 'hidden';
      variantInput.name = 'id';
      variantInput.value = variantId;
      form.appendChild(variantInput);
      
      // Add quantity
      const quantityInput = document.createElement('input');
      quantityInput.type = 'hidden';
      quantityInput.name = 'quantity';
      quantityInput.value = '1';
      form.appendChild(quantityInput);
      
      // Add form to document and submit
      document.body.appendChild(form);
      form.submit();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(form);
      }, 1000);
      
      // Return success response
      resolve({
        success: true,
        message: `${product.title} added to cart!`,
        cart: null
      });
      
    } catch (error) {
      console.error('Shopify fallback cart error:', error);
      reject(new Error(`Failed to add ${product.title} to cart: ${error}`));
    }
  });
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
        // Handle both Shopify cart format and our CartResponse format
        const itemCount = cart.item_count || cart.items?.length || 0;
        element.textContent = itemCount.toString();
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
        // Handle both Shopify cart format and our CartResponse format
        const totalPrice = cart.total_price || cart.total || "0";
        element.textContent = totalPrice.toString();
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
      storeType: detectStoreType({ ...product, storeUrl, storeType: product.storeType as "shopify" | "woocommerce" })
    };

    console.log('Adding to cart:', {
      product: cartProduct.title,
      storeType: cartProduct.storeType,
      productId: cartProduct.id,
      variantId: cartProduct.shopifyVariantId,
      wooProductId: cartProduct.wooProductId,
      hasShopifyVariantId: !!cartProduct.shopifyVariantId,
      hasWooProductId: !!cartProduct.wooProductId
    });
    
    // Debug: Log the full product object to see what fields are available
    console.log('Full cart product object:', cartProduct);

    // Add to cart based on store type
    let result: CartResponse;
    
    try {
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
      
    } catch (cartError) {
      console.warn("Direct cart addition failed, trying fallback methods:", cartError);
      
      // Fallback 1: Try backend proxy for WooCommerce
      if (cartProduct.storeType === "woocommerce") {
        try {
          console.log("Trying backend proxy for WooCommerce cart...");
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/v1/cart/woocommerce/add`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify({
              storeUrl: cartProduct.storeUrl,
              productId: cartProduct.wooProductId || cartProduct.id,
              quantity: 1,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            console.log("Backend proxy cart addition successful");
            return {
              success: true,
              message: `${cartProduct.title} added to cart!`,
              cart: result.cart
            };
          }
        } catch (backendError) {
          console.warn("Backend proxy failed:", backendError);
        }
      }
      
      // Fallback 2: Try to redirect to product page with add-to-cart parameter
      if (product.productUrl) {
        const url = new URL(product.productUrl);
        url.searchParams.set('add-to-cart', cartProduct.wooProductId || cartProduct.id);
        window.open(url.toString(), "_blank");
        return {
          success: true,
          message: "Redirected to product page to add to cart"
        };
      }
      
      // Fallback 3: Redirect to product page
      if (product.productUrl) {
        window.open(product.productUrl, "_blank");
        return {
          success: true,
          message: "Redirected to product page due to cart error"
        };
      }
      
      throw cartError;
    }
    
  } catch (error) {
    console.error("Add to cart error:", error);
    
    // Final fallback: redirect to product page
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
export const handleCartError = (error: Error | unknown, product: Product): void => {
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

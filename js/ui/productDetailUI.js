import { products } from "../data/products.js";
import { cartService } from "../services/cart.js";

export class ProductDetailUI {
constructor() {
  // Inicializar dataLayer explícitamente
  window.dataLayer = window.dataLayer || [];
  
  try {
    this.productId = new URLSearchParams(window.location.search).get("id");
    
    // Verificar si tenemos un ID de producto
    if (!this.productId) {
      console.error("No se proporcionó un ID de producto");
      window.location.href = "index.html"; // Ruta relativa
      return;
    }
    
    this.product = products.find((p) => p.id === parseInt(this.productId));

    // Verificar si encontramos el producto
    if (!this.product) {
      console.error(`No se encontró un producto con ID: ${this.productId}`);
      window.location.href = "index.html"; // Ruta relativa
      return;
    }

    this.quantity = 1;
    this.initElements();
    this.renderProduct();
    this.setupEventListeners();
    
    // Enviar evento view_item al cargar la página de detalle
    this.sendViewItemEvent();
    
    // Verificar que GTM se cargó correctamente
    setTimeout(() => {
      if (typeof google_tag_manager === 'undefined') {
        console.error('Google Tag Manager no se ha cargado correctamente');
      } else {
        console.log('Google Tag Manager se ha cargado correctamente');
      }
    }, 2000);
    
  } catch (error) {
    console.error("Error al inicializar ProductDetailUI:", error);
  }
}

initElements() {
  try {
    this.mainImage = document.getElementById("main-product-image");
    this.title = document.querySelector(".product-title");
    this.price = document.querySelector(".product-price");
    this.description = document.querySelector(".product-description");
    this.stockStatus = document.querySelector(".stock-status");
    this.category = document.querySelector(".category");
    this.sku = document.querySelector(".sku");
    this.quantityInput = document.getElementById("quantity");
    this.addToCartBtn = document.querySelector(".add-to-cart");
    this.checkoutBtn = document.querySelector(".button.button--primary.checkout");
  } catch (error) {
    console.error("Error al inicializar elementos:", error);
  }
}

renderProduct() {
  try {
    document.title = `${this.product.name} - The Cocktail Store`;

    this.mainImage.src = this.product.image;
    this.mainImage.alt = this.product.name;
    this.title.textContent = this.product.name;
    this.price.textContent = `$${this.product.price.toFixed(2)}`;
    this.description.textContent = this.product.description;
    this.stockStatus.textContent =
      this.product.stock > 0 ? "En stock" : "Agotado";
    this.stockStatus.className = `stock-status ${
      this.product.stock > 0 ? "in-stock" : "out-of-stock"
    }`;
    this.category.textContent = this.product.category;
    this.sku.textContent = `PROD-${this.product.id}`;

    const categoryLink = document.querySelector(".category-link");
    if (categoryLink) {
      categoryLink.textContent =
        this.product.category.charAt(0).toUpperCase() +
        this.product.category.slice(1);
      categoryLink.href = `index.html?category=${this.product.category}`; // Ruta relativa
    }
    
    const productName = document.querySelector(".product-name");
    if (productName) {
      productName.textContent = this.product.name;
    }
  } catch (error) {
    console.error("Error al renderizar el producto:", error);
  }
}

setupEventListeners() {
  try {
    document
      .querySelector(".quantity-btn.minus")
      .addEventListener("click", () => {
        if (this.quantity > 1) {
          this.quantity--;
          this.quantityInput.value = this.quantity;
        }
      });

    document
      .querySelector(".quantity-btn.plus")
      .addEventListener("click", () => {
        if (this.quantity < this.product.stock) {
          this.quantity++;
          this.quantityInput.value = this.quantity;
        }
      });

    this.quantityInput.addEventListener("change", () => {
      let value = parseInt(this.quantityInput.value);
      if (isNaN(value) || value < 1) value = 1;
      if (value > this.product.stock) value = this.product.stock;
      this.quantity = value;
      this.quantityInput.value = value;
    });

    // Usamos una bandera para evitar envíos duplicados
    let isAddingToCart = false;

    this.addToCartBtn.addEventListener("click", () => {
      // Evitar múltiples clics rápidos
      if (isAddingToCart) return;
      isAddingToCart = true;
      
      console.log(
        "Añadiendo al carrito:",
        this.product,
        "Cantidad:",
        this.quantity
      );
      
      // Añadir al carrito
      cartService.addItem(this.product, this.quantity);
      
      // Enviar evento add_to_cart
      this.sendAddToCartEvent();

      const originalText = this.addToCartBtn.textContent;
      this.addToCartBtn.textContent = "¡Añadido!";
      this.addToCartBtn.disabled = true;

      setTimeout(() => {
        this.addToCartBtn.textContent = originalText;
        this.addToCartBtn.disabled = false;
        isAddingToCart = false;
      }, 2000);
    });
    
    // Añadir evento para el botón de checkout
    if (this.checkoutBtn) {
      // Usamos una bandera para evitar envíos duplicados
      let isCheckingOut = false;
      
      this.checkoutBtn.addEventListener("click", (e) => {
        // Evitar múltiples clics rápidos
        if (isCheckingOut) return;
        isCheckingOut = true;
        
        // Añadir el producto al carrito antes de proceder al checkout
        cartService.addItem(this.product, this.quantity);
        
        // Enviar evento begin_checkout
        this.sendBeginCheckoutEvent();
        
        // Permitir un pequeño retraso para que el evento se envíe antes de la navegación
        setTimeout(() => {
          isCheckingOut = false;
          // La navegación se manejará por el onclick="window.location.href='checkout.html'"
        }, 100);
      });
    }
  } catch (error) {
    console.error("Error al configurar event listeners:", error);
  }
}

// Método para enviar el evento view_item al cargar la página
sendViewItemEvent() {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null }); // Limpiar el objeto ecommerce anterior
    window.dataLayer.push({
      event: 'view_item',
      ecommerce: {
        currency: 'USD',
        value: this.product.price,
        items: [{
          item_id: this.product.id.toString(),
          item_name: this.product.name,
          item_brand: this.product.brand || "The Cocktail Store",
          item_category: this.product.category,
          price: this.product.price,
          quantity: 1
        }]
      }
    });
    
    console.log('Evento view_item enviado en página de detalle:', {
      event: 'view_item',
      product: this.product.name,
      id: this.product.id
    });
  } catch (error) {
    console.error("Error al enviar evento view_item:", error);
  }
}

// Método para enviar el evento add_to_cart
sendAddToCartEvent() {
  try {
    const itemValue = this.product.price * this.quantity;
    
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null }); // Limpiar el objeto ecommerce anterior
    window.dataLayer.push({
      event: 'add_to_cart',
      ecommerce: {
        currency: 'USD',
        value: itemValue,
        items: [{
          item_id: this.product.id.toString(),
          item_name: this.product.name,
          item_brand: this.product.brand || "The Cocktail Store",
          item_category: this.product.category,
          price: this.product.price,
          quantity: this.quantity
        }]
      }
    });
    
    console.log('Evento add_to_cart enviado:', {
      event: 'add_to_cart',
      product: this.product.name,
      id: this.product.id,
      quantity: this.quantity,
      value: itemValue
    });
  } catch (error) {
    console.error("Error al enviar evento add_to_cart:", error);
  }
}

// Método para enviar el evento begin_checkout
sendBeginCheckoutEvent() {
  try {
    const itemValue = this.product.price * this.quantity;
    
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null }); // Limpiar el objeto ecommerce anterior
    window.dataLayer.push({
      event: 'begin_checkout',
      ecommerce: {
        currency: 'USD',
        value: itemValue,
        items: [{
          item_id: this.product.id.toString(),
          item_name: this.product.name,
          item_brand: this.product.brand || "The Cocktail Store",
          item_category: this.product.category,
          price: this.product.price,
          quantity: this.quantity
        }]
      }
    });
    
    console.log('Evento begin_checkout enviado:', {
      event: 'begin_checkout',
      product: this.product.name,
      id: this.product.id,
      quantity: this.quantity,
      value: itemValue
    });
  } catch (error) {
    console.error("Error al enviar evento begin_checkout:", error);
  }
}
}




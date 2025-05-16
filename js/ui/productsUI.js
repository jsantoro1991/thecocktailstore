import { products } from "../data/products.js";
import { cartService } from "../services/cart.js";

export class ProductsUI {
constructor() {
  this.products = products;
  this.filteredProducts = [...products];
  this.currentCategory = "all";
  this.lastSentListId = null; // Para controlar cuándo se envió el último evento

  this.productsGrid = document.querySelector(".products__grid");
  this.filterButtons = document.querySelectorAll(".filter__button");
  this.searchInput = document.querySelector(".nav__search-input");

  this.handleFilter = this.handleFilter.bind(this);
  this.handleSearch = this.handleSearch.bind(this);
  this.handleAddToCart = this.handleAddToCart.bind(this);
  this.handleSelectItem = this.handleSelectItem.bind(this);

  this.setupEventListeners();
  this.renderProducts();
}

setupEventListeners() {
  this.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      this.handleFilter(button.dataset.filter);
    });
  });

  this.searchInput.addEventListener("input", this.handleSearch);

  this.productsGrid.addEventListener("click", (e) => {
    // Manejar clic en botón "Añadir al Carrito"
    const addButton = e.target.closest(".product__button");
    if (addButton) {
      const productId = parseInt(addButton.dataset.id);
      const product = this.products.find((p) => p.id === productId);
      if (product) {
        this.handleAddToCart(product);
      }
      return;
    }
    
    // Manejar clic en botón "Ver Detalles" o en la imagen o título del producto
    const detailsLink = e.target.closest(".button--secondary") || 
                        e.target.closest(".product__img-link") ||
                        e.target.closest(".product__title a");
    if (detailsLink) {
      const href = detailsLink.getAttribute('href');
      if (href && href.includes('product.html?id=')) {
        const productId = parseInt(href.split('=')[1]);
        const product = this.products.find(p => p.id === productId);
        if (product) {
          // Cambiado de handleViewDetails a handleSelectItem
          this.handleSelectItem(product, e);
        }
      }
    }
  });
}

handleFilter(category) {
  this.currentCategory = category;
  this.filterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === category);
  });

  this.applyFilters();
}

handleSearch(e) {
  const searchTerm = e.target.value.toLowerCase();
  this.applyFilters(searchTerm);
}

applyFilters(searchTerm = "") {
  this.filteredProducts = this.products.filter((product) => {
    const matchesCategory =
      this.currentCategory === "all" ||
      product.category === this.currentCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  this.renderProducts();
}

handleAddToCart(product) {
  cartService.addItem(product);

  const button = this.productsGrid.querySelector(`[data-id="${product.id}"]`);
  if (button) {
    button.textContent = "¡Añadido!";
    button.classList.add("added");
    setTimeout(() => {
      button.textContent = "Añadir al Carrito";
      button.classList.remove("added");
    }, 1500);
  }
}

// Método renombrado y modificado para enviar select_item en lugar de view_item
handleSelectItem(product, event) {
  // Encontrar el índice del producto en la lista filtrada actual
  const itemIndex = this.filteredProducts.findIndex(p => p.id === product.id);
  
  // Enviar el evento select_item al dataLayer
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null }); // Limpiar el objeto ecommerce anterior
  window.dataLayer.push({
    event: 'select_item',
    ecommerce: {
      currency: 'USD',
      value: product.price,
      items: [{
        item_id: product.id.toString(),
        item_name: product.name,
        item_brand: product.brand || "The Cocktail Store",
        item_category: product.category,
        price: product.price,
        index: itemIndex >= 0 ? itemIndex : undefined,
        quantity: 1,
        item_list_name: this.currentCategory === 'all' ? 'Todos los productos' : this.currentCategory,
        item_list_id: this.currentCategory
      }]
    }
  });
  
  console.log('Evento select_item enviado:', {
    event: 'select_item',
    product: product.name,
    id: product.id,
    list: this.currentCategory === 'all' ? 'Todos los productos' : this.currentCategory
  });
  
  // No prevenimos el evento por defecto para permitir la navegación a la página de detalles
}

renderProducts() {
  this.productsGrid.innerHTML = this.filteredProducts
    .map(
      (product) => `
          <article class="product__card">
              <a href="product.html?id=${
                product.id
              }" class="product__img-link">
                  <img src="${product.image}" alt="${
        product.name
      }" class="product__img">
              </a>
              <div class="product__content">
                  <h3 class="product__title">
                      <a href="product.html?id=${product.id}">${
        product.name
      }</a>
                  </h3>
                  <p class="product__description">${product.description}</p>
                  <p class="product__price">$${product.price.toFixed(2)}</p>
                  <div class="product__buttons">
                      <a href="product.html?id=${
                        product.id
                      }" class="button button--secondary">Ver Detalles</a>
                      <button class="button product__button" data-id="${
                        product.id
                      }">
                          <i class="fas fa-cart-plus"></i>
                      </button>
                  </div>
              </div>
          </article>
      `
    )
    .join("");

  if (!document.getElementById("productsStyles")) {
    const styles = document.createElement("style");
    styles.id = "productsStyles";
    styles.textContent = `
      .product__card {
          background: var(--bg-color);
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,.1);
          transition: .3s;
      }

      .product__card:hover {
          transform: translateY(-5px);
      }

      .product__img {
          width: 100%;
          height: 200px;
          object-fit: cover;
      }

      .product__content {
          padding: 1.5rem;
      }

      .product__title {
          font-size: var(--h3-font-size);
          margin-bottom: var(--mb-1);
      }

      .product__description {
          color: var(--text-color-light);
          margin-bottom: var(--mb-2);
          font-size: var(--small-font-size);
      }

      .product__price {
          color: var(--primary-color);
          font-size: var(--h2-font-size);
          font-weight: 600;
          margin-bottom: var(--mb-2);
      }

      .product__button {
          width: 100%;
      }

      .product__button.added {
          background-color: var(--secondary-color);
      }
  `;
    document.head.appendChild(styles);
  }
  
  // Solo enviamos el evento si hay productos y si la lista ha cambiado
  if (this.filteredProducts.length > 0) {
    this.sendViewItemListEvent();
  }
}

// Método para enviar el evento view_item_list
sendViewItemListEvent() {
  // Crear un identificador único para esta lista de productos
  const currentListId = `${this.currentCategory}-${this.filteredProducts.length}`;
  
  // Solo enviar el evento si la lista ha cambiado
  if (this.lastSentListId !== currentListId) {
    // Preparar los items para el dataLayer
    const items = this.filteredProducts.map((product, index) => {
      return {
        item_id: product.id.toString(),
        item_name: product.name,
        item_brand: product.brand || "The Cocktail Store",
        item_category: product.category,
        price: product.price,
        index: index,
        quantity: 1
      };
    });
    
    // Limpiar cualquier dato de ecommerce anterior
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    
    // Enviar el evento al dataLayer
    window.dataLayer.push({
      event: 'view_item_list',
      ecommerce: {
        items: items,
        item_list_name: this.currentCategory === 'all' ? 'Todos los productos' : this.currentCategory,
        item_list_id: this.currentCategory
      }
    });
    
    console.log('Evento view_item_list enviado:', {
      event: 'view_item_list',
      items: items,
      item_list_name: this.currentCategory === 'all' ? 'Todos los productos' : this.currentCategory
    });
    
    // Actualizar el ID de la última lista enviada
    this.lastSentListId = currentListId;
  }
}
}
export const productsUI = new ProductsUI();
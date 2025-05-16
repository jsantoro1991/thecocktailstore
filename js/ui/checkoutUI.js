import { cartService } from "../services/cart.js";
import { checkoutService } from "../services/checkout.js";

export class CheckoutUI {
constructor() {
  this.form = document.getElementById("shipping-form");
  this.orderItems = document.querySelector(".order-items");
  this.orderTotals = document.querySelector(".order-totals");

  this.renderOrderSummary();
  this.setupEventListeners();
  this.prefillForm();
  
  // Enviar evento add_shipping_info al cargar la página
  this.sendAddShippingInfoEvent();
}

setupEventListeners() {
  this.form.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(this.form);
    const shippingInfo = {
      fullname: formData.get("fullname"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      city: formData.get("city"),
      postal: formData.get("postal"),
      country: formData.get("country"),
    };

    const shippingMethod = formData.get("shipping");

    checkoutService.saveShippingInfo(shippingInfo);
    checkoutService.setShippingMethod(shippingMethod);
    
    // Enviar evento add_payment_info antes de redirigir a la página de pago
    this.sendAddPaymentInfoEvent(shippingInfo, shippingMethod);
    
    // Pequeño retraso para asegurar que el evento se envíe antes de la redirección
    setTimeout(() => {
      window.location.href = "/payment.html";
    }, 100);
  });
}

renderOrderSummary() {
  const cart = cartService.getItems();

  this.orderItems.innerHTML = cart
    .map(
      (item) => `
      <div class="order-item">
          <div class="item-image">
              <img src="${item.image}" alt="${item.name}">
              <span class="item-quantity">${item.quantity}</span>
          </div>
          <div class="item-info">
              <h4>${item.name}</h4>
              <p>$${item.price.toFixed(2)}</p>
          </div>
      </div>
  `
    )
    .join("");

  const subtotal = cartService.getTotal();
  const shipping = checkoutService.getShippingCost();
  const tax = checkoutService.getTaxAmount();
  const total = subtotal + shipping + tax;

  this.orderTotals.innerHTML = `
      <div class="total-row">
          <span>Subtotal</span>
          <span>$${subtotal.toFixed(2)}</span>
      </div>
      <div class="total-row">
          <span>Envío</span>
          <span>$${shipping.toFixed(2)}</span>
      </div>
      <div class="total-row">
          <span>Impuestos</span>
          <span>$${tax.toFixed(2)}</span>
      </div>
      <div class="total-row total-final">
          <span>Total</span>
          <span>$${total.toFixed(2)}</span>
      </div>
  `;
}

prefillForm() {
  const shippingInfo = checkoutService.shippingInfo;

  if (Object.keys(shippingInfo).length === 0) return;

  for (const [key, value] of Object.entries(shippingInfo)) {
    const input = this.form.elements[key];
    if (input) input.value = value;
  }

  const shippingMethod = checkoutService.shippingMethod;
  const radioButton = this.form.querySelector(
    `input[name="shipping"][value="${shippingMethod}"]`
  );
  if (radioButton) radioButton.checked = true;
}

// Método para enviar el evento add_shipping_info
sendAddShippingInfoEvent() {
  const cart = cartService.getItems();
  const subtotal = cartService.getTotal();
  const shipping = checkoutService.getShippingCost();
  const tax = checkoutService.getTaxAmount();
  const total = subtotal + shipping + tax;
  
  // Preparar los items para el dataLayer
  const items = cart.map((item, index) => {
    return {
      item_id: item.id.toString(),
      item_name: item.name,
      item_brand: item.brand || "The Cocktail Store",
      item_category: item.category,
      price: item.price,
      quantity: item.quantity,
      index: index
    };
  });
  
  // Enviar el evento al dataLayer
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null }); // Limpiar el objeto ecommerce anterior
  window.dataLayer.push({
    event: 'add_shipping_info',
    ecommerce: {
      currency: 'USD',
      value: total,
      shipping_tier: checkoutService.shippingMethod || 'standard',
      items: items
    }
  });
  
  console.log('Evento add_shipping_info enviado:', {
    event: 'add_shipping_info',
    value: total,
    shipping_tier: checkoutService.shippingMethod || 'standard',
    items_count: items.length
  });
}

// Método para enviar el evento add_payment_info
sendAddPaymentInfoEvent(shippingInfo, shippingMethod) {
  const cart = cartService.getItems();
  const subtotal = cartService.getTotal();
  const shipping = checkoutService.getShippingCost();
  const tax = checkoutService.getTaxAmount();
  const total = subtotal + shipping + tax;
  
  // Preparar los items para el dataLayer
  const items = cart.map((item, index) => {
    return {
      item_id: item.id.toString(),
      item_name: item.name,
      item_brand: item.brand || "The Cocktail Store",
      item_category: item.category,
      price: item.price,
      quantity: item.quantity,
      index: index
    };
  });
  
  // Enviar el evento al dataLayer
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null }); // Limpiar el objeto ecommerce anterior
  window.dataLayer.push({
    event: 'add_payment_info',
    ecommerce: {
      currency: 'USD',
      value: total,
      payment_type: 'credit_card', // Valor por defecto, se podría actualizar si tienes opciones de pago
      items: items,
      shipping_tier: shippingMethod || 'standard',
      // Información adicional opcional
      customer_info: {
        email: shippingInfo.email,
        phone: shippingInfo.phone,
        shipping_country: shippingInfo.country,
        shipping_postal_code: shippingInfo.postal
      }
    }
  });
  
  console.log('Evento add_payment_info enviado:', {
    event: 'add_payment_info',
    value: total,
    payment_type: 'credit_card',
    shipping_tier: shippingMethod || 'standard',
    items_count: items.length
  });
}
}

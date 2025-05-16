import { cartService } from "../services/cart.js";
import { checkoutService } from "../services/checkout.js";

export class PaymentUI {
constructor() {
  this.form = document.getElementById("payment-form");
  this.orderItems = document.querySelector(".order-items");
  this.orderTotals = document.querySelector(".order-totals");

  this.renderOrderSummary();
  this.setupEventListeners();
}

setupEventListeners() {
  const paymentOptions = document.querySelectorAll('input[name="payment"]');
  paymentOptions.forEach((option) => {
    option.addEventListener("change", () => {
      const paymentDetails = document.querySelectorAll(".payment-details");
      paymentDetails.forEach((detail) => (detail.style.display = "none"));

      const selectedOption = option.value;
      const selectedDetails = document.querySelector(
        `.payment-details[data-method="${selectedOption}"]`
      );
      if (selectedDetails) selectedDetails.style.display = "block";
    });
  });

  this.form.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(this.form);
    const paymentMethod = formData.get("payment");

    let paymentInfo = { method: paymentMethod };

    if (paymentMethod === "credit-card") {
      paymentInfo = {
        ...paymentInfo,
        cardNumber: formData.get("card-number"),
        cardHolder: formData.get("card-holder"),
        expiry: formData.get("expiry"),
        cvv: formData.get("cvv"),
      };
    }

    checkoutService.savePaymentInfo(paymentInfo);

    // Enviar evento purchase antes de procesar el pago
    this.sendPurchaseEvent(paymentMethod);
    
    this.processPayment();
  });
}

renderOrderSummary() {
  const cart = cartService.getItems();
  console.log("Cart items in payment:", cart);

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
  const tax = subtotal * 0.21;
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

processPayment() {
  const submitButton = this.form.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> Procesando...';

  setTimeout(() => {
    checkoutService
      .placeOrder()
      .then((orderDetails) => {
        console.log("Order details before redirect:", orderDetails);
        window.location.href = `/confirmation.html?order=${orderDetails.orderNumber}`;
      })
      .catch((error) => {
        alert("Error al procesar el pago: " + error.message);
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      });
  }, 2000);
}

// Método para enviar el evento purchase
sendPurchaseEvent(paymentMethod) {
  const cart = cartService.getItems();
  const subtotal = cartService.getTotal();
  const shipping = checkoutService.getShippingCost();
  const tax = subtotal * 0.21;
  const total = subtotal + shipping + tax;
  
  // Generar un ID de transacción único
  const transactionId = 'TCS-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  
  // Obtener información de envío
  const shippingInfo = checkoutService.shippingInfo || {};
  
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
    event: 'purchase',
    ecommerce: {
      transaction_id: transactionId,
      value: total,
      tax: tax,
      shipping: shipping,
      currency: 'USD',
      coupon: '', // Si tienes sistema de cupones, añadirlo aquí
      items: items,
      // Información adicional
      payment_type: paymentMethod,
      shipping_tier: checkoutService.shippingMethod || 'standard',
      customer: {
        email: shippingInfo.email || '',
        phone: shippingInfo.phone || '',
        shipping_address: {
          address: shippingInfo.address || '',
          city: shippingInfo.city || '',
          country: shippingInfo.country || '',
          postal_code: shippingInfo.postal || ''
        }
      }
    }
  });
  
  console.log('Evento purchase enviado:', {
    event: 'purchase',
    transaction_id: transactionId,
    value: total.toFixed(2),
    items_count: items.length,
    payment_type: paymentMethod
  });
}
}
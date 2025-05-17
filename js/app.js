// Asegurar que dataLayer existe antes de cualquier operación
window.dataLayer = window.dataLayer || [];

// Importaciones condicionales para evitar errores si los módulos no existen
let cartUI, productsUI;

try {
// Importaciones dinámicas para manejar posibles errores
import("./ui/cartUI.js").then(module => {
  cartUI = module.cartUI;
  initApp();
}).catch(error => {
  console.warn("No se pudo cargar cartUI.js:", error);
  initApp();
});

import("./ui/productsUI.js").then(module => {
  productsUI = module.productsUI;
  initApp();
}).catch(error => {
  console.warn("No se pudo cargar productsUI.js:", error);
  initApp();
});
} catch (error) {
console.warn("Error al importar módulos:", error);
initApp();
}

// Variable para controlar la inicialización
let appInitialized = false;

function initApp() {
// Evitar inicialización múltiple
if (appInitialized) return;
appInitialized = true;

class App {
  constructor() {
    this.initializeApp();
  }

  initializeApp() {
    if (cartUI) this.cartUI = cartUI;
    if (productsUI) this.productsUI = productsUI;

    this.setupMobileMenu();
  }

  setupMobileMenu() {
    try {
      const menuButton = document.createElement("button");
      menuButton.className = "nav__toggle";
      menuButton.innerHTML = '<i class="fas fa-bars"></i>';

      const nav = document.querySelector(".nav");
      const menu = document.querySelector(".nav__menu");

      // Verificar que los elementos existen antes de manipularlos
      if (nav && menu) {
        nav.insertBefore(menuButton, menu);

        menuButton.addEventListener("click", () => {
          menu.classList.toggle("show");
        });

        const navLinks = document.querySelectorAll(".nav__link");
        navLinks.forEach((link) => {
          link.addEventListener("click", () => {
            menu.classList.remove("show");
          });
        });
      }

      if (!document.getElementById("mobileStyles")) {
        const styles = document.createElement("style");
        styles.id = "mobileStyles";
        styles.textContent = `
          .nav__toggle {
              display: none;
              font-size: 1.25rem;
              cursor: pointer;
              color: var(--text-color);
              transition: .3s;
          }

          @media screen and (max-width: 768px) {
              .nav__toggle {
                  display: block;
              }

              .nav__menu {
                  position: fixed;
                  top: 4rem;
                  left: -100%;
                  width: 80%;
                  height: 100vh;
                  padding: 2rem;
                  background-color: var(--bg-color);
                  box-shadow: 2px 0 4px rgba(0,0,0,.1);
                  transition: .4s;
              }

              .nav__menu.show {
                  left: 0;
              }

              .nav__list {
                  flex-direction: column;
              }

              .nav__item {
                  margin: 1.5rem 0;
              }
          }
        `;
        document.head.appendChild(styles);
      }
    } catch (error) {
      console.error("Error en setupMobileMenu:", error);
    }
  }
}

// Crear la instancia de App de forma segura
try {
  window.app = new App();
  console.log("App inicializada correctamente");
} catch (error) {
  console.error("Error al inicializar App:", error);
}
}

// Asegurarse de que el DOM esté cargado
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', checkAndInitApp);
} else {
checkAndInitApp();
}

function checkAndInitApp() {
// Verificar si estamos en la página correcta antes de inicializar
const isIndexPage = window.location.pathname.endsWith('/') || 
                    window.location.pathname.endsWith('index.html') ||
                    window.location.pathname.endsWith('thecocktailstore/');

if (isIndexPage) {
  console.log("Página principal detectada, inicializando App...");
  // Dar tiempo a que GTM se cargue primero
  setTimeout(initApp, 100);
} else {
  console.log("No es la página principal, no se inicializa App");
}
}

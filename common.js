// Utilitários compartilhados: header, tema, cart badge, mobile menu

function createHeader(active = "") {
  const cartCount = typeof getCartCount === "function" ? getCartCount() : 0;

  return `
    <header class="header">
      <a href="index.html" class="logo">
        <span>Marketplace</span> Moderno
      </a>

      <button class="menu-toggle" id="menuToggle" aria-label="Menu">☰</button>

      <nav class="nav" id="nav">
        <a href="index.html" class="${active === "home" ? "active" : ""}">Início</a>
        <a href="vehicles.html" class="${active === "vehicles" ? "active" : ""}">Veículos</a>
        <a href="electronics.html" class="${active === "electronics" ? "active" : ""}">Eletrônicos</a>
        <a href="furniture.html" class="${active === "furniture" ? "active" : ""}">Móveis</a>
        <a href="about.html" class="${active === "about" ? "active" : ""}">Sobre</a>
      </nav>

      <div class="actions">
        <button class="icon-btn" id="themeToggle" title="Alternar tema">🌓</button>
        <a href="cart.html" class="icon-btn" title="Carrinho">
          🛒
          <span class="cart-badge" id="cartBadge">${cartCount}</span>
        </a>
        <a href="login.html" class="btn btn-sm btn-ghost">Login</a>
      </div>
    </header>
  `;
}

function createFooter() {
  return `
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h3>Marketplace</h3>
          <p>Plataforma moderna de veículos, eletrônicos e móveis premium.</p>
        </div>
        <div class="footer-section">
          <h3>Categorias</h3>
          <a href="vehicles.html">Veículos</a>
          <a href="electronics.html">Eletrônicos</a>
          <a href="furniture.html">Móveis</a>
        </div>
        <div class="footer-section">
          <h3>Conta</h3>
          <a href="login.html">Login</a>
          <a href="register.html">Cadastro</a>
          <a href="cart.html">Carrinho</a>
          <a href="admin.html">Admin</a>
        </div>
        <div class="footer-section">
          <h3>Contato</h3>
          <p>contato@marketplace.com</p>
          <p>(11) 99999-9999</p>
        </div>
      </div>
      <p class="footer-copy">© 2026 Marketplace Moderno — Projeto portfólio</p>
    </footer>
  `;
}

function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light") document.body.classList.add("light-mode");

  const btn = document.getElementById("themeToggle");
  if (btn) {
    btn.addEventListener("click", () => {
      document.body.classList.toggle("light-mode");
      localStorage.setItem(
        "theme",
        document.body.classList.contains("light-mode") ? "light" : "dark"
      );
    });
  }
}

function initMobileMenu() {
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
  }
}

function updateCartBadge() {
  const badge = document.getElementById("cartBadge");
  if (badge && typeof getCartCount === "function") {
    badge.textContent = getCartCount();
  }
}

function renderProductCard(product, options = {}) {
  const { showWish = true } = options;
  const inWish = typeof isInWishlist === "function" && isInWishlist(product.id);
  const badgeClass = (product.badge || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  return `
    <article class="product-card" data-id="${product.id}">
      <div class="img-wrap">
        <span class="badge ${badgeClass}">${product.badge || ""}</span>
        ${
          showWish
            ? `<button class="wish-btn ${inWish ? "active" : ""}" data-wish="${product.id}" title="Favoritar">${inWish ? "♥" : "♡"}</button>`
            : ""
        }
        <img src="${product.image}" alt="${product.name}" loading="lazy" />
      </div>
      <div class="product-body">
        <h3>${product.name}</h3>
        <p>${product.desc}</p>
        <div class="price">${formatPrice(product.price)}</div>
        <div class="product-actions">
          <button class="btn-primary add-cart-btn" data-id="${product.id}">
            Adicionar
          </button>
        </div>
      </div>
    </article>
  `;
}

function bindProductEvents(container) {
  if (!container) return;

  container.addEventListener("click", (e) => {
    const addBtn = e.target.closest(".add-cart-btn");
    if (addBtn) {
      e.preventDefault();
      const id = Number(addBtn.dataset.id);
      const product = PRODUCTS.find((p) => p.id === id);
      if (product) addToCart(product);
      return;
    }

    const wishBtn = e.target.closest(".wish-btn");
    if (wishBtn) {
      e.preventDefault();
      const id = Number(wishBtn.dataset.wish);
      const active = toggleWishlist(id);
      wishBtn.classList.toggle("active", active);
      wishBtn.textContent = active ? "♥" : "♡";
    }
  });
}

function mountLayout(activePage) {
  const headerSlot = document.getElementById("app-header");
  const footerSlot = document.getElementById("app-footer");

  if (headerSlot) headerSlot.innerHTML = createHeader(activePage);
  if (footerSlot) footerSlot.innerHTML = createFooter();

  initTheme();
  initMobileMenu();
  updateCartBadge();

  window.addEventListener("cartUpdated", updateCartBadge);
}

// Loader
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.classList.add("hide");
    setTimeout(() => loader.remove(), 400);
  }
});

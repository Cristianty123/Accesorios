document.addEventListener("DOMContentLoaded", function () {
    // Constantes y configuraciones
    const CONFIG = {
        apiBaseUrl: `http://localhost:8080`,
        localStorageKeys: {
            selectedItem: "accesorioSeleccionado",
            cart: "cart"
        },
        itemTypeMapping: {
            parqueo: "PARQ",
            externos: "EXT",
            internos: "INTE",
            luces_led: "LUCES",
            elevavidrios: "MOD_ELEVA",
            audio: "AUDIO"
        }
    };

    // Configuración de transiciones
    const TRANSITION = {
        duration: 500, // ms
        loader: document.createElement('div')
    };

    // Configura el loader (añádelo al final del DOM)
    TRANSITION.loader.className = 'loader-transition';
    TRANSITION.loader.innerHTML = '<div class="loader-spinner"></div>';
    document.body.appendChild(TRANSITION.loader);

    // Elementos del DOM
    const DOM = {
        content: document.getElementById("contenido"),
        navLinks: document.querySelectorAll(".nav-link"),
        header: document.getElementById('header'),
        menuToggle: document.querySelector('.mobile-menu-toggle'),
        mainNav: document.querySelector('.main-nav')
    };

    // Módulo del Carrito
    const CartManager = {
        items: JSON.parse(localStorage.getItem(CONFIG.localStorageKeys.cart)) || [],

        init() {
            if (document.querySelector('.cart-container')) {
                if (!Array.isArray(this.items)) {
                    this.items = [];
                    this.saveCart();
                }

                this.renderCart();
                this.setupEventListeners();
            }
        },

        saveCart() {
            localStorage.setItem(CONFIG.localStorageKeys.cart, JSON.stringify(this.items));
        },

        showNotification(message, type = 'success') {
            const types = {
                success: { icon: 'fa-check-circle', color: '#00c853', title: '¡Éxito!' },
                warning: { icon: 'fa-exclamation-triangle', color: '#ff9100', title: 'Advertencia' },
                error: { icon: 'fa-times-circle', color: '#ff1744', title: 'Error' }
            };

            const notification = document.createElement('div');
            notification.className = `cart-notification ${type}`;
            notification.innerHTML = `
                <div class="notification-icon">
                    <i class="fas ${types[type].icon}"></i>
                </div>
                <div class="notification-content">
                    <h4>${types[type].title}</h4>
                    <p>${message}</p>
                </div>
                <div class="notification-progress"></div>
            `;
            notification.style.setProperty('--notification-color', types[type].color);
            document.body.appendChild(notification);

            setTimeout(() => notification.classList.add('visible'), 100);
            setTimeout(() => {
                notification.classList.remove('visible');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        },

        updateCount() {
            const count = this.items.reduce((total, item) => total + item.quantity, 0);
            document.querySelectorAll('.cart-count').forEach(el => el.textContent = count);
        },

        renderCart() {
            const cartItemsContainer = document.getElementById('cart-items');
            const cartEmpty = document.getElementById('cart-empty');
            const cartSummary = document.getElementById('cart-summary');

            if (this.items.length === 0) {
                cartEmpty.style.display = 'block';
                cartItemsContainer.style.display = 'none';
                cartSummary.style.display = 'none';
                return;
            }

            cartEmpty.style.display = 'none';
            cartItemsContainer.style.display = 'block';
            cartSummary.style.display = 'block';

            // Solo renderizar si no hay items o si la cantidad cambió
            if (!cartItemsContainer.children.length ||
                cartItemsContainer.children.length !== this.items.length) {
                cartItemsContainer.innerHTML = this.items.map(item => `
                <div class="cart-item" data-id="${item.id}">
                    <img src="${CONFIG.apiBaseUrl}/uploads/${item.image}" alt="${item.name}" class="item-image">
                    <div class="item-details">
                        <h3 class="item-title">${item.name}</h3>
                        <p class="item-price">$${Number(item.price).toLocaleString('es-CO')}</p>
                        <div class="item-actions">
                            <div class="quantity-control">
                                <button class="quantity-btn minus">-</button>
                                <span class="item-quantity">${item.quantity}</span>
                                <button class="quantity-btn plus">+</button>
                            </div>
                            <span class="remove-item">Eliminar</span>
                        </div>
                    </div>
                </div>
            `).join('');
            }

            this.updateTotals();
        },

        updateTotals() {
            const subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const shipping = subtotal > 100000 ? 0 : 10000;
            const total = subtotal + shipping;

            // Animación suave para los cambios
            ['subtotal', 'shipping', 'total'].forEach(id => {
                const element = document.getElementById(`cart-${id}`);
                if (element) {
                    element.style.transition = 'color 0.3s ease';
                    element.style.color = 'var(--primary-color)';
                    setTimeout(() => {
                        element.style.color = '';
                    }, 300);
                }
            });

            document.getElementById('cart-subtotal').textContent = `$${subtotal.toLocaleString('es-CO')}`;
            document.getElementById('cart-shipping').textContent = shipping === 0 ? 'Gratis' : `$${shipping.toLocaleString('es-CO')}`;
            document.getElementById('cart-total').textContent = `$${total.toLocaleString('es-CO')}`;
        },

        setupEventListeners() {
            // Remueve cualquier listener previo (si es necesario)
            document.removeEventListener('click', this.handleCartClick);

            // Asigna el nuevo handler con bind para mantener el contexto
            this.handleCartClick = this.handleCartClick.bind(this);
            document.addEventListener('click', this.handleCartClick);

            // Botón de checkout (usa evento directo en lugar de delegation)
            const checkoutBtn = document.getElementById('checkout-btn');
            if (checkoutBtn) {
                checkoutBtn.onclick = () => this.handleCheckout();
            }
        },
        destroy() {
            // Limpia los event listeners cuando salgas de la página
            document.removeEventListener('click', this.handleCartClick);
            const checkoutBtn = document.getElementById('checkout-btn');
            if (checkoutBtn) checkoutBtn.onclick = null;
        },

        handleCartClick(e) {
            const itemElement = e.target.closest('.cart-item');
            if (itemElement) {
                const itemId = itemElement.dataset.id;
                const item = this.items.find(i => i.id === itemId);

                if (e.target.classList.contains('plus')) {
                    if (item.quantity < item.stock) {
                        item.quantity++;
                        this.updateItem(itemId, item.quantity);
                    } else {
                        this.showNotification(`Stock máximo: ${item.stock} unidades`, 'error');
                    }
                }
                else if (e.target.classList.contains('minus')) {
                    if (item.quantity > 1) {
                        item.quantity--;
                        this.updateItem(itemId, item.quantity);
                    }
                } else if (e.target.classList.contains('remove-item')) {
                    this.removeItem(itemId);
                }
                return;
            }

            // Manejar botón "Continuar comprando"
            const continueBtn = e.target.closest('.btn-continue');
            if (continueBtn) {
                e.preventDefault();
                const page = continueBtn.getAttribute('data-page') || 'venta_accesorios.html?page=1';
                NavigationManager.loadPage(page);
            }

            // Manejar botón "Vaciar carrito"
            if (e.target.closest('#clear-cart')) {
                e.preventDefault();
                this.clearCart();
            }
        },

        handleCheckout() {
            if (this.items.length === 0) {
                this.showNotification('El carrito está vacío', 'error');
                return;
            }
            alert('Redirigiendo a proceso de pago...');
        },

        clearCart() {
            this.items = [];
            this.saveCart();
            this.renderCart();
            this.updateCount();
            this.showNotification('Carrito vaciado', 'success');
        },

        updateItem(id, quantity) {
            const item = this.items.find(i => i.id === id);
            if (item) {
                item.quantity = quantity;
                this.saveCart();

                // Actualizar solo los elementos necesarios
                const itemElement = document.querySelector(`.cart-item[data-id="${id}"]`);
                if (itemElement) {
                    // Actualizar cantidad
                    const quantityElement = itemElement.querySelector('.item-quantity');
                    if (quantityElement) quantityElement.textContent = quantity;

                    // Actualizar subtotal del item si lo muestras
                    const priceElement = itemElement.querySelector('.item-price');
                    if (priceElement) {
                        const price = parseFloat(priceElement.textContent.replace(/[^0-9.]/g, ''));
                        const subtotalElement = itemElement.querySelector('.item-subtotal');
                        if (subtotalElement) {
                            subtotalElement.textContent = `$${(price * quantity).toLocaleString('es-CO')}`;
                        }
                    }
                }

                // Actualizar totales
                this.updateTotals();
                this.updateCount();
            }
        },

        removeItem(id) {
            this.items = this.items.filter(item => item.id !== id);
            this.saveCart();
            this.renderCart();
            this.updateCount();
        },

        addItem(item) {
            const existingItem = this.items.find(i => i.id === item.id);

            if (existingItem) {
                if (existingItem.quantity >= existingItem.stock) {
                    this.showNotification(`Stock máximo alcanzado (${item.stock} unidades)`, 'error');
                    return;
                }
                existingItem.quantity++;
            } else {
                if (item.stock < 1) {
                    this.showNotification('Producto agotado', 'error');
                    return;
                }
                this.items.push({ ...item, quantity: 1 });
            }

            this.saveCart();
            this.updateCount();
            this.showNotification(`${item.name} agregado al carrito`);
        }
    };

    // Módulo de UI/Header
    const HeaderManager = {
        init() {
            this.setupScrollBehavior();
            this.setupMobileMenu();
        },

        setupScrollBehavior() {
            document.addEventListener('scroll', () => {
                const shouldAddScrolled = window.scrollY > 50 || DOM.menuToggle.classList.contains('open');
                DOM.header.classList.toggle('scrolled', shouldAddScrolled);
            });
        },

        setupMobileMenu() {
            DOM.menuToggle.addEventListener('click', () => {
                DOM.menuToggle.classList.toggle('open');
                DOM.mainNav.classList.toggle('active');

                if (DOM.menuToggle.classList.contains('open')) {
                    DOM.header.classList.add('scrolled');
                } else if (window.scrollY <= 50) {
                    DOM.header.classList.remove('scrolled');
                }
            });
        }
    };

    // Módulo de Navegación
    const NavigationManager = {
        init() {
            this.setupNavLinks();
            this.setupContentClickHandlers();
            this.setupPopState();
            this.loadInitialPage();
        },

        setupNavLinks() {
            DOM.navLinks.forEach(link => {
                link.addEventListener("click", (event) => {
                    event.preventDefault();
                    this.loadPage(link.getAttribute("data-page"));
                });
            });
        },

        setupContentClickHandlers() {
            DOM.content.addEventListener("click", (e) => {
                const categoryButton = e.target.closest(".category-button");
                if (categoryButton) {
                    const itemType = categoryButton.getAttribute("data-tipo");
                    if (itemType) {
                        this.loadPage(`venta_accesorios.html?tipo=${itemType}`);
                    }
                }
            });
        },

        setupPopState() {
            window.onpopstate = function (event) {
                if (event.state?.page) {
                    this.loadPage(event.state.page, false);
                }
            }.bind(this);
        },

        loadInitialPage() {
            const initialPage = location.hash ? location.hash.substring(1) : "inicio.html";
            this.loadPage(initialPage, false);
        },

        async loadPage(url, addToHistory = true) {
            try {
                if (document.querySelector('.cart-container')) {
                    CartManager.destroy();
                }
                DOM.content.classList.add('fade-out');
                TRANSITION.loader.style.display = 'block';
                await new Promise(resolve => setTimeout(resolve, 300));

                const response = await fetch(url);
                if (!response.ok) throw new Error("Failed to load page");
                const html = await response.text();

                DOM.content.classList.remove('fade-out');
                DOM.content.classList.add('content-transition');
                DOM.content.style.opacity = '0';
                DOM.content.innerHTML = html;

                TRANSITION.loader.style.display = 'none';
                DOM.content.classList.add('fade-in');
                await new Promise(resolve => setTimeout(resolve, 50));
                DOM.content.style.opacity = '1';

                if (addToHistory) {
                    history.pushState({ page: url }, "", `#${url}`);
                }

                this.handlePageSpecificLogic(url);

                setTimeout(() => {
                    DOM.content.classList.remove('fade-in');
                }, TRANSITION.duration);

            } catch (error) {
                console.error("Error loading page:", error);
                DOM.content.innerHTML = `<p>Error al cargar la página: ${url}</p>`;
                DOM.content.classList.remove('fade-out', 'fade-in');
                DOM.content.style.opacity = '1';
                TRANSITION.loader.style.display = 'none';
            }
        },

        handlePageSpecificLogic(url) {
            if (url.startsWith("venta_accesorios.html")) {
                const params = new URLSearchParams(url.split("?")[1]);
                ItemsManager.loadItems(params.get("tipo"));
            } else if (url === "informacion_item.html") {
                ItemsManager.showItemDetails();
                this.setupAddToCartButton();
            } else if (url === "cart.html") {
                CartManager.init();
            }
        },

        setupAddToCartButton() {
            document.getElementById('add-to-cart-btn')?.addEventListener('click', () => {
                const itemData = localStorage.getItem(CONFIG.localStorageKeys.selectedItem);
                if (!itemData) return;

                const item = JSON.parse(itemData);
                CartManager.addItem({
                    id: item.id,
                    name: item.name,
                    price: item.sellingprice,
                    image: item.imageurl,
                    stock: item.stock
                });
            });
        }
    };

    // Módulo de Gestión de Items
    const ItemsManager = {
        async loadItems(itemType, page = 1) {
            const panel = document.querySelector(".panel-accesorios");
            const pagination = document.getElementById("paginacion");

            if (!panel || !pagination) return;

            panel.style.opacity = '0';
            await new Promise(resolve => setTimeout(resolve, 200));

            this.updateActiveFilters(itemType);

            panel.innerHTML = "<p>Cargando accesorios...</p>";
            pagination.innerHTML = "";

            try {
                const response = await fetch(this.buildItemsUrl(itemType, page));

                if (!response.ok) {
                    const errorData = await response.json();
                    if (response.status === 404) {
                        panel.innerHTML = `<p>${errorData.message}</p>`;
                        this.updateCategoryTitle(itemType);
                        panel.style.opacity = '1';
                        return;
                    }
                    throw new Error(errorData.message || 'Error al conectar con el servidor');
                }

                const { items, totalPages, currentPage, pagesToShow } = await response.json();

                if (items.length === 0) {
                    panel.innerHTML = "<p>No se encontraron accesorios.</p>";
                    panel.style.opacity = '1';
                    return;
                }

                this.renderItems(items);
                this.setupItemInfoButtons(items);
                this.renderPagination(itemType, currentPage, totalPages, pagesToShow);
                this.updateCategoryTitle(itemType);
                UIHelper.equalizeItemHeights();

                await new Promise(resolve => setTimeout(resolve, 50));
                panel.style.opacity = '1';

            } catch (error) {
                console.error("Error loading items:", error);
                panel.innerHTML = `<p>${error.message.includes('servidor') ? error.message : 'Error al cargar los accesorios'}</p>`;
                panel.style.opacity = '1';
            }
        },

        buildItemsUrl(itemType, page) {
            const itemTypeId = itemType ? CONFIG.itemTypeMapping[itemType] : null;
            const baseUrl = `${CONFIG.apiBaseUrl}/items/public/page?page=${page}`;
            return itemTypeId ? `${baseUrl}&itemTypeId=${itemTypeId}` : baseUrl;
        },

        renderItems(items) {
            const panel = document.querySelector(".panel-accesorios");
            panel.innerHTML = items.map(item => this.createItemCard(item)).join("");
        },

        createItemCard(item) {
            return `
                <div class="accesorio">
                    <img class="image-48" src="${CONFIG.apiBaseUrl}/uploads/${item.imageurl || 'default.png'}" alt="${item.name}" />
                    <div class="descripcion">${item.name}</div>
                    <div class="precio">Cop $${Number(item.sellingprice).toLocaleString("es-CO")}</div>
                    <div class="frame-114">
                        <div class="informacion" data-id="${item.id}">INFORMACION</div>
                    </div>
                </div>
            `;
        },

        setupItemInfoButtons(items) {
            document.querySelectorAll(".informacion").forEach(button => {
                button.addEventListener("click", () => {
                    const item = items.find(i => i.id === button.getAttribute("data-id"));
                    if (item) {
                        localStorage.setItem(CONFIG.localStorageKeys.selectedItem, JSON.stringify(item));
                        NavigationManager.loadPage("informacion_item.html");
                    }
                });
            });
        },

        renderPagination(itemType, currentPage, totalPages, pagesToShow) {
            const pagination = document.getElementById("paginacion");
            const fragment = document.createDocumentFragment();

            if (currentPage > 1) {
                fragment.appendChild(this.createPaginationButton("<< Anterior", () => {
                    this.loadItems(itemType, currentPage - 1);
                }));
            }

            pagesToShow.forEach(page => {
                if (page === "...") {
                    const separator = document.createElement("span");
                    separator.textContent = "...";
                    separator.classList.add("paginacion-separador");
                    fragment.appendChild(separator);
                } else {
                    const pageNum = parseInt(page);
                    const button = this.createPaginationButton(
                        page,
                        () => this.loadItems(itemType, pageNum)
                    );
                    if (pageNum === currentPage) button.classList.add("activo");
                    fragment.appendChild(button);
                }
            });

            if (currentPage < totalPages) {
                fragment.appendChild(this.createPaginationButton("Siguiente >>", () => {
                    this.loadItems(itemType, currentPage + 1);
                }));
            }

            pagination.appendChild(fragment);
        },

        createPaginationButton(text, onClick) {
            const button = document.createElement("button");
            button.textContent = text;
            button.style.transition = 'all 0.3s ease';

            button.addEventListener("click", async (e) => {
                e.preventDefault();
                button.style.transform = 'scale(0.95)';
                await new Promise(resolve => setTimeout(resolve, 150));
                button.style.transform = 'scale(1)';
                onClick();
            });

            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
            });

            button.addEventListener('mouseleave', () => {
                button.style.transform = '';
                button.style.boxShadow = '';
            });

            return button;
        },

        updateCategoryTitle(itemType) {
            const titleElement = document.querySelector(".titulo-categoria");
            if (!titleElement) return;

            if (itemType && CONFIG.itemTypeMapping[itemType]) {
                const categoryName = itemType.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
                titleElement.textContent = `Los mejores accesorios de ${categoryName}`;
            } else {
                titleElement.textContent = "Todos los accesorios disponibles";
            }
        },

        updateActiveFilters(itemType) {
            const filtersContainer = document.querySelector(".filtros");
            if (!filtersContainer) return;

            document.querySelectorAll('.btn-filtro').forEach(button => {
                const buttonType = button.getAttribute('data-tipo');
                const newButton = button.cloneNode(true);

                const isActive = (buttonType === itemType) ||
                    (!buttonType && !itemType) ||
                    (buttonType === 'null' && itemType === null) ||
                    (buttonType === 'undefined' && itemType === undefined);

                if (isActive && !button.classList.contains('activo')) {
                    newButton.classList.add('animate-active');
                    setTimeout(() => newButton.classList.remove('animate-active'), 500);
                }

                newButton.classList.toggle('activo', isActive);
                button.replaceWith(newButton);

                newButton.addEventListener('click', async (e) => {
                    e.preventDefault();
                    newButton.style.transform = 'scale(0.95)';
                    await new Promise(resolve => setTimeout(resolve, 150));
                    newButton.style.transform = '';
                    this.loadItems(buttonType);
                });

                newButton.addEventListener('mouseenter', () => {
                    if (!newButton.classList.contains('activo')) {
                        newButton.style.transform = 'translateY(-2px)';
                        newButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                    }
                });

                newButton.addEventListener('mouseleave', () => {
                    if (!newButton.classList.contains('activo')) {
                        newButton.style.transform = '';
                        newButton.style.boxShadow = '';
                    }
                });
            });
        },

        showItemDetails() {
            const itemData = localStorage.getItem(CONFIG.localStorageKeys.selectedItem);
            if (!itemData) return;

            const item = JSON.parse(itemData);
            this.updateItemDetails(item);
        },

        updateItemDetails(item) {
            const setTextContent = (id, text) => {
                const element = document.getElementById(id);
                if (element) element.textContent = text;
            };

            setTextContent("nombre", item.name);
            setTextContent("categoria", item.itemtype?.name || "Sin categoría");
            setTextContent("categoria-texto", item.itemtype?.name || "No especificada");
            setTextContent("descripcion", item.description || "Descripción no disponible");
            setTextContent("precio", `$${Number(item.sellingprice || 0).toLocaleString("es-CO")}`);

            const stockElement = document.getElementById("stock");
            if (stockElement) {
                stockElement.innerHTML = item.stock > 0
                    ? `✅ <span style="color: green;">En stock:</span> ${item.stock} unidades`
                    : `❌ <span style="color: red;">Agotado</span>`;
            }

            const shippingElement = document.getElementById("envio");
            if (shippingElement) {
                shippingElement.textContent = item.free_shipping
                    ? "Envío gratis"
                    : `Costo de envío: $${Number(item.price_shipping || 0).toLocaleString("es-CO")} COP`;
            }

            const imageElement = document.getElementById("imagen");
            if (imageElement) {
                imageElement.src = item.imageurl
                    ? `${CONFIG.apiBaseUrl}/uploads/${item.imageurl}`
                    : "../img/placeholder-producto.jpg";
                imageElement.alt = item.name || "Imagen del producto";
            }

            const buyButton = document.querySelector('.btn-comprar');
            if (buyButton) {
                if (item.stock > 0) {
                    buyButton.disabled = false;
                    buyButton.innerHTML = '<i class="fas fa-shopping-cart"></i> Comprar ahora';
                } else {
                    buyButton.disabled = true;
                    buyButton.innerHTML = '<i class="fas fa-times-circle"></i> Agotado';
                }
            }
        }
    };

    // Helper functions
    const UIHelper = {
        equalizeItemHeights() {
            const items = document.querySelectorAll(".accesorio");
            if (items.length === 0) return;

            let maxHeight = 0;
            items.forEach(item => {
                item.style.height = "auto";
                maxHeight = Math.max(maxHeight, item.offsetHeight);
            });

            items.forEach(item => {
                item.style.height = `${maxHeight}px`;
            });
        }
    };

    // Inicialización
    HeaderManager.init();
    NavigationManager.init();
    CartManager.updateCount(); // Actualizar contador del carrito al inicio
});
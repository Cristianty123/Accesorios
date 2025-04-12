document.addEventListener("DOMContentLoaded", function () {
    // Constantes y configuraciones
    const CONFIG = {
        apiBaseUrl: `http://localhost:8080`,
        localStorageKeys: {
            selectedItem: "accesorioSeleccionado"
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

                // Forzar estado scrolled cuando el menú está abierto
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
                // 1. Iniciar animación de salida
                DOM.content.classList.add('fade-out');

                // 2. Mostrar loader
                TRANSITION.loader.style.display = 'block';

                // 3. Pequeño delay para que se complete la animación de salida
                await new Promise(resolve => setTimeout(resolve, 300));

                // 4. Cargar el nuevo contenido
                const response = await fetch(url);
                if (!response.ok) throw new Error("Failed to load page");
                const html = await response.text();

                // 5. Insertar el nuevo contenido (oculto)
                DOM.content.classList.remove('fade-out');
                DOM.content.classList.add('content-transition');
                DOM.content.style.opacity = '0';
                DOM.content.innerHTML = html;

                // 6. Ocultar loader
                TRANSITION.loader.style.display = 'none';

                // 7. Animación de entrada
                DOM.content.classList.add('fade-in');
                await new Promise(resolve => setTimeout(resolve, 50)); // Pequeño delay

                // 8. Restaurar opacidad
                DOM.content.style.opacity = '1';

                // 9. Manejar historia
                if (addToHistory) {
                    history.pushState({ page: url }, "", `#${url}`);
                }

                // 10. Manejar lógica específica de la página
                this.handlePageSpecificLogic(url);

                // 11. Remover clase de animación después de completar
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
            }
        }
    };

    // Módulo de Gestión de Items
    const ItemsManager = {
        async loadItems(itemType, page = 1) {
            const panel = document.querySelector(".panel-accesorios");
            const pagination = document.getElementById("paginacion");

            if (!panel || !pagination) return;

            // Animación de salida
            panel.style.opacity = '0';
            await new Promise(resolve => setTimeout(resolve, 200));

            // Resto de tu código existente...
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
                        panel.style.opacity = '1'; // Restaurar opacidad
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

                // Animación de entrada
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
            const baseUrl = `${CONFIG.apiBaseUrl}/items/page?page=${page}`;
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

            // Botón "Anterior"
            if (currentPage > 1) {
                fragment.appendChild(this.createPaginationButton("<< Anterior", () => {
                    this.loadItems(itemType, currentPage - 1);
                }));
            }

            // Números de página
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

            // Botón "Siguiente"
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

                // Animación al hacer clic
                button.style.transform = 'scale(0.95)';
                await new Promise(resolve => setTimeout(resolve, 150));
                button.style.transform = 'scale(1)';

                onClick();
            });

            // Efecto hover con JavaScript como fallback
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

                // Determinar si está activo
                const isActive = (buttonType === itemType) ||
                    (!buttonType && !itemType) ||
                    (buttonType === 'null' && itemType === null) ||
                    (buttonType === 'undefined' && itemType === undefined);

                // Animación al activarse
                if (isActive && !button.classList.contains('activo')) {
                    newButton.classList.add('animate-active');
                    setTimeout(() => newButton.classList.remove('animate-active'), 500);
                }

                newButton.classList.toggle('activo', isActive);
                button.replaceWith(newButton);

                newButton.addEventListener('click', async (e) => {
                    e.preventDefault();

                    // Animación al hacer clic
                    newButton.style.transform = 'scale(0.95)';
                    await new Promise(resolve => setTimeout(resolve, 150));
                    newButton.style.transform = '';

                    this.loadItems(buttonType);
                });

                // Efectos hover
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
            setTextContent("categoria", item.itemtype.name);
            setTextContent("categoria-texto", item.itemtype.name);
            setTextContent("descripcion", item.description);
            setTextContent("precio", `$${Number(item.sellingprice).toLocaleString("es-CO")}`);

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
                    : `Costo de envío: $${Number(item.price_shipping).toLocaleString("es-CO")} COP`;
            }

            const imageElement = document.getElementById("imagen");
            if (imageElement) {
                imageElement.src = `${CONFIG.apiBaseUrl}/uploads/${item.imageurl}`;
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
});
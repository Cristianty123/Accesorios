const host = "192.168.1.18";

const Cart = {
    // Inicialización segura con verificación de array
    items: JSON.parse(localStorage.getItem('cart')) || [],

    init() {
        if (document.querySelector('.cart-container')) {
            // Verificar y normalizar items
            if (!Array.isArray(this.items)) {
                this.items = [];
                localStorage.setItem('cart', JSON.stringify(this.items));
            }
            this.renderCart();
            this.setupEventListeners();
        }
    },

    showNotification(message, type = 'success') {
        const types = {
            success: {
                icon: 'fa-check-circle',
                color: '#00c853',
                title: '¡Éxito!'
            },
            warning: {
                icon: 'fa-exclamation-triangle',
                color: '#ff9100',
                title: 'Advertencia'
            },
            error: {
                icon: 'fa-times-circle',
                color: '#ff1744',
                title: 'Error'
            }
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

        // Estilos dinámicos
        notification.style.setProperty('--notification-color', types[type].color);

        document.body.appendChild(notification);

        // Animación de entrada
        setTimeout(() => {
            notification.classList.add('visible');
        }, 100);

        // Animación de salida
        setTimeout(() => {
            notification.classList.remove('visible');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    },

    updateCount() {
        document.querySelectorAll('.cart-count').forEach(el => {
            el.textContent = this.items.reduce((total, item) => total + item.quantity, 0);
        });
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

        // Renderizar items
        cartItemsContainer.innerHTML = this.items.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <img src="http://${host}:8080/uploads/${item.image}" alt="${item.name}" class="item-image">
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

        // Actualizar totales
        this.updateTotals();
    },

    updateTotals() {
        const subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal > 100000 ? 0 : 10000; // Envío gratis sobre $100,000
        const total = subtotal + shipping;

        document.getElementById('cart-subtotal').textContent = `$${subtotal.toLocaleString('es-CO')}`;
        document.getElementById('cart-shipping').textContent = shipping === 0 ? 'Gratis' : `$${shipping.toLocaleString('es-CO')}`;
        document.getElementById('cart-total').textContent = `$${total.toLocaleString('es-CO')}`;
    },

    setupEventListeners() {
        // Delegación de eventos mejorada
        document.addEventListener('click', (e) => {
            const itemElement = e.target.closest('.cart-item');

            if (!itemElement) return;

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
        });

        // Botón de checkout
        if (document.getElementById('checkout-btn')) {
            document.getElementById('checkout-btn').addEventListener('click', () => {
                alert('Redirigiendo a proceso de pago...');
            });
        }
    },

    addItemFromDetails() {
        const itemData = localStorage.getItem("accesorioSeleccionado");
        if (itemData) {
            try {
                const item = JSON.parse(itemData);
                this.addItem({
                    id: item.id,
                    name: item.name,
                    price: item.sellingprice,
                    image: item.imageurl,
                    quantity: 1
                });
            } catch (error) {
                console.error("Error al agregar al carrito:", error);
            }
        }
    },

    updateItem(id, quantity) {
        const item = this.items.find(i => i.id === id);
        if (item) {
            item.quantity = quantity;
            localStorage.setItem('cart', JSON.stringify(this.items));
            this.renderCart();
            this.updateCount();
        }
    },

    removeItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        localStorage.setItem('cart', JSON.stringify(this.items));
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

        localStorage.setItem('cart', JSON.stringify(this.items));
        this.updateCount();
        this.showNotification(`${item.name} agregado al carrito`);
    },

};

document.addEventListener("DOMContentLoaded", function () {
    const contenido = document.getElementById("contenido");
    const links = document.querySelectorAll(".nav-link");
    const botonesCategoria = document.querySelectorAll(".boton-categoria");
    const tipoToItemTypeId = {
        parqueo: "PARQ",
        externos: "EXT",
        internos: "INTE",
        luces_led: "LUCES",
        elevavidrios: "MOD_ELEVA",
        audio: "AUDIO"
    };
    document.querySelector('.mobile-menu-toggle').addEventListener('click', function() {
        document.querySelector('.main-nav').classList.toggle('active');
        this.classList.toggle('open');
    });
    function mostrarInformacionItem() {
        const itemData = localStorage.getItem("accesorioSeleccionado");

        if (!itemData) {
            console.error("No se encontró producto seleccionado");
            window.location.href = "venta_accesorios.html";
            return;
        }

        try {
            const item = JSON.parse(itemData);

            // Asignar valores a elementos del DOM con validación
            const setTextContent = (id, text) => {
                const element = document.getElementById(id);
                if(element) element.textContent = text;
            };

            const setInnerHTML = (id, html) => {
                const element = document.getElementById(id);
                if(element) element.innerHTML = html;
            };

            // Mostrar información principal
            setTextContent("nombre", item.name || "Nombre no disponible");
            setTextContent("descripcion", item.description || "Descripción no disponible");
            setTextContent("precio", `$${Number(item.sellingprice || 0).toLocaleString("es-CO")}`);

            // Manejar categoría
            const categoriaElement = document.getElementById("categoria");
            const categoriaTextoElement = document.getElementById("categoria-texto");
            if (item.itemtype?.name) {
                categoriaElement.textContent = item.itemtype.name;
                categoriaTextoElement.textContent = item.itemtype.name;
            } else {
                categoriaElement.textContent = "Sin categoría";
                categoriaTextoElement.textContent = "No especificada";
            }

            // Manejar imagen
            const imagenElement = document.getElementById("imagen");
            if (item.imageurl) {
                imagenElement.src = `http://${host}:8080/uploads/${item.imageurl}`;
                imagenElement.alt = item.name || "Imagen del producto";
            } else {
                imagenElement.src = "../img/placeholder-producto.jpg";
            }

            // Mostrar stock
            const stock = Number(item.stock) || 0;
            setInnerHTML("stock", stock > 0
                ? `✅ <span style="color: green;">En stock:</span> ${stock} unidades`
                : `❌ <span style="color: red;">Agotado</span>`);

            // Mostrar detalles de envío
            const envioElement = document.getElementById("envio");
            if (item.free_shipping) {
                envioElement.textContent = "🚚 Envío gratis";
            } else {
                const shippingCost = Number(item.price_shipping) || 0;
                envioElement.textContent = `📦 Costo de envío: $${shippingCost.toLocaleString("es-CO")} COP`;
            }

            // Configurar botón de compra
            const btnComprar = document.querySelector('.btn-comprar');
            if (stock > 0) {
                btnComprar.disabled = false;
                btnComprar.innerHTML = '<i class="fas fa-shopping-cart"></i> Comprar ahora';
                btnComprar.onclick = () => {
                    Cart.addItem({
                        id: item.id,
                        name: item.name,
                        price: item.sellingprice,
                        image: item.imageurl,
                        stock: stock,
                        shipping: item.free_shipping ? 0 : item.price_shipping
                    });
                };
            } else {
                btnComprar.disabled = true;
                btnComprar.innerHTML = '<i class="fas fa-times-circle"></i> Agotado';
            }

        } catch (error) {
            console.error("Error al procesar el producto:", error);
            // Redirigir a lista de productos en caso de error
            window.location.href = "venta_accesorios.html";
        }
    }

    function igualarAlturaAccesorios() {
        const tarjetas = document.querySelectorAll(".accesorio");

        let maxHeight = 0;
        tarjetas.forEach(card => {
            card.style.height = "auto"; // Reinicia para evitar acumulaciones
            const altura = card.offsetHeight;
            if (altura > maxHeight) {
                maxHeight = altura;
            }
        });

        tarjetas.forEach(card => {
            card.style.height = maxHeight + "px";
        });
    }

    Cart.init();

    // Función para cargar contenido dinámico
    function cargarPagina(url, agregarHistorial = true) {
        // Remover CSS dinámico anterior
        document.querySelectorAll('link[data-dynamic-css]').forEach(link => link.remove());

        fetch(url)
            .then(response => response.text())
            .then(data => {
                contenido.innerHTML = data;

                // Cargar CSS específico para cada página
                if (url === "cart.html") {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = '../css/style_cart.css';
                    link.setAttribute('data-dynamic-css', 'true');
                    document.head.appendChild(link);
                } else if (url === "informacion_item.html") {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = '../css/style_informacion_item.css';
                    link.setAttribute('data-dynamic-css', 'true');
                    document.head.appendChild(link);
                }

                if (agregarHistorial) {
                    history.pushState({ page: url }, "", `#${url}`);
                }

                // Ejecutar lógica específica de cada página
                switch(true) {
                    case url === "inicio.html":
                        agregarEventosInicio();
                        break;

                    case url.startsWith("venta_accesorios.html"):
                        const params = new URLSearchParams(url.split("?")[1]);
                        agregarEventosMostrarAccesorios(params.get("tipo"));
                        break;

                    case url === "informacion_item.html":
                        mostrarInformacionItem();
                        break;

                    case url === "cart.html":
                        Cart.init(); // Inicializar carrito
                        break;
                }
            })
            .catch(error => console.error("Error al cargar la página:", error));
    }

    // Manejar clics en los enlaces de navegación
    links.forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            const page = this.getAttribute("data-page");
            cargarPagina(page);
        });
    });
    // Manejar clics en los botones de categorías
    function agregarEventosInicio() {
        const botonesCategoria = document.querySelectorAll(".category-button");
        botonesCategoria.forEach(boton => {
            boton.addEventListener("click", function () {
                const tipo = this.getAttribute("data-tipo");
                if (tipo) {
                    const pagina = `venta_accesorios.html?tipo=${tipo}`;
                    cargarPagina(pagina);
                }
            });
        });
    }
    // Función para agregar eventos y accesorios en venta_accesorios.html
    function agregarEventosMostrarAccesorios(tipo, pagina = 1) {
        const itemTypeId = tipoToItemTypeId[tipo];
        const panelAccesorios = document.querySelector(".panel-accesorios");
        const titulo = document.querySelector(".titulo-categoria");
        const paginacion = document.getElementById("paginacion");
        const filtrosContainer = document.querySelector(".filtros");

        if (!panelAccesorios || !paginacion) return;

        // Limpiar completamente el contenido antes de cargar nuevos datos
        panelAccesorios.innerHTML = "";

        // Limpiar paginación pero mantener los botones de filtro
        while (paginacion.firstChild) {
            paginacion.removeChild(paginacion.firstChild);
        }

        // Actualizar título
        if (titulo) {
            if (tipo && tipoToItemTypeId[tipo]) {
                const textoTitulo = tipo.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
                titulo.textContent = `Los mejores accesorios de ${textoTitulo}`;
            } else {
                titulo.textContent = "Todos los accesorios disponibles";
            }
        }

        // Configurar filtros si existen
        if (filtrosContainer) {
            // Actualizar clase activa en todos los botones
            document.querySelectorAll('.btn-filtro').forEach(boton => {
                boton.classList.remove('activo');
                if (boton.getAttribute('data-tipo') === tipo) {
                    boton.classList.add('activo');
                } else if (!tipo && !boton.getAttribute('data-tipo')) {
                    boton.classList.add('activo');
                }

                // Remover event listeners antiguos primero
                boton.replaceWith(boton.cloneNode(true));
            });

            // Agregar nuevos event listeners
            document.querySelectorAll('.btn-filtro').forEach(boton => {
                boton.addEventListener('click', function(e) {
                    e.preventDefault();
                    const nuevoTipo = this.getAttribute('data-tipo');
                    agregarEventosMostrarAccesorios(nuevoTipo);
                });
            });
        }

        const baseUrl = `http://${host}:8080/items/public/page?page=${pagina}`;
        const url = itemTypeId ? `${baseUrl}&itemTypeId=${itemTypeId}` : baseUrl;

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errorData => {
                        throw errorData;
                    });
                }
                return response.json();
            })
            .then(data => {
                const accesorios = data.items || [];
                const totalPaginas = data.totalPages || 1;
                const currentPage = data.currentPage || 1;
                const pagesToShow = data.pagesToShow || [];

                if (accesorios.length === 0) {
                    panelAccesorios.innerHTML = "<p>No se encontraron accesorios para esta página.</p>";
                    return;
                }

                // Construir HTML de accesorios
                let accesoriosHTML = '';
                accesorios.forEach(accesorio => {
                    accesoriosHTML += `
                <div class="accesorio">
                    <img class="image-48" src="http://${host}:8080/uploads/${accesorio.imageurl || 'default.png'}" alt="${accesorio.name}" />
                    <div class="descripcion">${accesorio.name}</div>
                    <div class="precio">Cop $${Number(accesorio.sellingprice).toLocaleString("es-CO")}</div>
                    <div class="frame-114">
                        <div class="informacion" data-id="${accesorio.id}">INFORMACION</div>
                    </div>
                </div>
                `;
                });
                panelAccesorios.innerHTML = accesoriosHTML;

                // Configurar eventos para botones de información
                const botonesInformacion = document.querySelectorAll(".informacion");
                botonesInformacion.forEach(boton => {
                    boton.addEventListener("click", () => {
                        const id = boton.getAttribute("data-id");
                        const accesorio = accesorios.find(item => item.id === id);
                        if (accesorio) {
                            localStorage.setItem("accesorioSeleccionado", JSON.stringify(accesorio));
                            cargarPagina("informacion_item.html");
                        }
                    });
                });

                // Crear paginación basada en el JSON recibido
                const fragmentPaginacion = document.createDocumentFragment();

                // Botón "Anterior" (solo uno)
                if (currentPage > 1) {
                    const btnAnterior = document.createElement("button");
                    btnAnterior.textContent = "<< Anterior";
                    btnAnterior.addEventListener("click", (e) => {
                        e.preventDefault();
                        agregarEventosMostrarAccesorios(tipo, currentPage - 1);
                    });
                    fragmentPaginacion.appendChild(btnAnterior);
                }

                // Botones numerados (exactamente los que vienen en pagesToShow)
                pagesToShow.forEach(pageNum => {
                    if (pageNum === "...") {
                        const separador = document.createElement("span");
                        separador.textContent = "...";
                        separador.classList.add("paginacion-separador"); // opcional, por estilo
                        fragmentPaginacion.appendChild(separador);
                    } else {
                        const page = parseInt(pageNum);
                        const boton = document.createElement("button");
                        boton.textContent = page;
                        if (page === currentPage) {
                            boton.classList.add("activo");
                        }
                        boton.addEventListener("click", (e) => {
                            e.preventDefault();
                            agregarEventosMostrarAccesorios(tipo, page);
                        });
                        fragmentPaginacion.appendChild(boton);
                    }
                });

                // Botón "Siguiente" (solo uno)
                if (currentPage < totalPaginas) {
                    const btnSiguiente = document.createElement("button");
                    btnSiguiente.textContent = "Siguiente >>";
                    btnSiguiente.addEventListener("click", (e) => {
                        e.preventDefault();
                        agregarEventosMostrarAccesorios(tipo, currentPage + 1);
                    });
                    fragmentPaginacion.appendChild(btnSiguiente);
                }

                // Agregar toda la paginación de una vez
                paginacion.appendChild(fragmentPaginacion);

                igualarAlturaAccesorios();
            })
            .catch(error => {
                console.error("Error al cargar los accesorios:", error);
                if (error.status === 404 && error.message === "La página seleccionada no tiene items.") {
                    panelAccesorios.innerHTML = "<p>No hay accesorios disponibles en esta página.</p>";
                    paginacion.innerHTML = "";
                } else {
                    panelAccesorios.innerHTML = "<p>Error al cargar los accesorios.</p>";
                    paginacion.innerHTML = "";
                }
            });
    }
    // Manejar el botón de atrás/adelante del navegador
    window.onpopstate = function (event) {
        if (event.state && event.state.page) {
            cargarPagina(event.state.page, false);
        }
    };

    // Cargar la página inicial si hay una URL en el hash
    const initialPage = location.hash ? location.hash.substring(1) : "inicio.html";
    cargarPagina(initialPage, false);
});

document.addEventListener('scroll', () => {
    const header = document.getElementById('header'); // Selects the header element by its ID

    // Adds or removes the 'scrolled' class based on the scroll position
    if (window.scrollY > 50) {
        header.classList.add('scrolled'); // Adds the 'scrolled' class if the scroll position is greater than 50 pixels
    } else {
        header.classList.remove('scrolled'); // Removes the 'scrolled' class if the scroll position is 50 pixels or less
    }
});
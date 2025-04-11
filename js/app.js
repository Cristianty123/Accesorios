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
        if (!itemData) return;

        const item = JSON.parse(itemData);
        document.getElementById("nombre").textContent = item.name;
        document.getElementById("categoria").textContent = item.itemtype.name;
        document.getElementById("categoria-texto").textContent = item.itemtype.name;
        document.getElementById("imagen").src = `http://${host}:8080/uploads/${item.imageurl}`;
        document.getElementById("descripcion").textContent = item.description;
        document.getElementById("stock").innerHTML = item.stock > 0
            ? `✅ <span style="color: green;">En stock:</span> ${item.stock} unidades`
            : `❌ <span style="color: red;">Agotado</span>`;
        document.getElementById("precio").textContent = `$${Number(item.sellingprice).toLocaleString("es-CO")}`;

        if (item.free_shipping) {
            document.getElementById("envio").textContent = "🚚 Envío gratis";
        } else {
            document.getElementById("envio").textContent = `📦 Costo de envío: $${Number(item.price_shipping).toLocaleString("es-CO")} COP`;
        }
    }
    const host = "localhost";
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
    // Función para cargar contenido dinámico
    function cargarPagina(url, agregarHistorial = true) {
        fetch(url)
            .then(response => response.text())
            .then(data => {
                contenido.innerHTML = data;
                if (agregarHistorial) {
                    history.pushState({ page: url }, "", `#${url}`);
                }
                if (url === "inicio.html") {
                    agregarEventosInicio(); // agrega los eventos de la pagina de inicio
                }
                if (url.startsWith("venta_accesorios.html")) {
                    const params = new URLSearchParams(url.split("?")[1]);
                    const tipo = params.get("tipo"); // será null si no hay tipo
                    agregarEventosMostrarAccesorios(tipo); // tipo puede ser null o string
                }
                if (url === "informacion_item.html") {
                    mostrarInformacionItem();
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

        const baseUrl = `http://${host}:8080/items/page?page=${pagina}`;
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
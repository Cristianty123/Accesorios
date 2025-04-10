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
    const host = "localhost";
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
        const botonesCategoria = document.querySelectorAll(".boton-categoria");
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
    // Función para agregar eventos y accesorios en venta_accesorios.html se uso json de prueba
    function agregarEventosMostrarAccesorios(tipo, pagina = 1) {
        const itemTypeId = tipoToItemTypeId[tipo];
        const panelAccesorios = document.querySelector(".panel-accesorios");
        const titulo = document.querySelector(".titulo-categoria");
        const paginacion = document.getElementById("paginacion");

        if (!panelAccesorios || !paginacion) return;

        if (titulo) {
            if (tipo && tipoToItemTypeId[tipo]) {
                const textoTitulo = tipo.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
                titulo.textContent = `Los mejores accesorios de ${textoTitulo}`;
            } else {
                titulo.textContent = "Todos los accesorios disponibles";
            }
        }

        panelAccesorios.innerHTML = "";
        paginacion.innerHTML = "";

        const baseUrl = `http://${host}:8080/items/page?page=${pagina}`;
        const url = itemTypeId ? `${baseUrl}&itemTypeId=${itemTypeId}` : baseUrl;

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errorData => {
                        throw errorData; // Lanza el JSON con el mensaje de error
                    });
                }
                return response.json();
            })
            .then(data => {
                const accesorios = data.items || [];
                const totalPaginas = data.totalPages || 1;

                if (accesorios.length === 0) {
                    panelAccesorios.innerHTML = "<p>No se encontraron accesorios para esta página.</p>";
                    return; // no mostrar paginación
                }
                accesorios.forEach(accesorio => {
                    const accesorioHTML = `
                    <div class="accesorio">
                        <img class="image-48" src="http://${host}:8080/uploads/${accesorio.imageurl || 'default.png'}" alt="${accesorio.name}" />
                        <div class="descripcion">${accesorio.name}</div>
                        <div class="nuevo">Nuevo</div>
                        <div class="precio">Cop $${Number(accesorio.sellingprice).toLocaleString("es-CO")}</div>
                        <div class="frame-114">
                            <div class="informacion">INFORMACION</div>
                        </div>
                    </div>
                `;
                    panelAccesorios.innerHTML += accesorioHTML;
                });

                // Botón "Anterior"
                if (pagina > 1) {
                    const btnAnterior = document.createElement("button");
                    btnAnterior.textContent = "<< Anterior";
                    // no le ponemos "activo"
                    btnAnterior.addEventListener("click", () => {
                        agregarEventosMostrarAccesorios(tipo, pagina - 1);
                    });
                    paginacion.appendChild(btnAnterior);
                }

                // Botones numerados
                for (let i = 1; i <= totalPaginas; i++) {
                    const boton = document.createElement("button");
                    boton.textContent = i;
                    if (i === pagina) {
                        boton.classList.add("activo"); // solo el actual
                    }
                    boton.addEventListener("click", () => {
                        agregarEventosMostrarAccesorios(tipo, i);
                    });
                    paginacion.appendChild(boton);
                }

                // Botón "Siguiente"
                if (pagina < totalPaginas) {
                    const btnSiguiente = document.createElement("button");
                    btnSiguiente.textContent = "Siguiente >>";
                    // no le ponemos "activo"
                    btnSiguiente.addEventListener("click", () => {
                        agregarEventosMostrarAccesorios(tipo, pagina + 1);
                    });
                    paginacion.appendChild(btnSiguiente);
                }

            })
            .catch(error => {
                console.error("Error al cargar los accesorios:", error);
                // Validamos si es error 404 específicamente
                if (error.status === 404 && error.message === "La página seleccionada no tiene items.") {
                    panelAccesorios.innerHTML = "<p>No hay accesorios disponibles en esta página.</p>";
                    paginacion.innerHTML = ""; // aseguramos limpiar la paginación
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
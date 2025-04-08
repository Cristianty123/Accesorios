document.addEventListener("DOMContentLoaded", function () {
    const contenido = document.getElementById("contenido");
    const links = document.querySelectorAll(".nav-link");
    const botonesCategoria = document.querySelectorAll(".boton-categoria");

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
                if (url === "categoria_parqueo.html") {
                    agregarEventosCategoriaParqueo();
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
                    const pagina = `categoria_${tipo.toLowerCase()}.html`;
                    cargarPagina(pagina);
                }
            });
        });
    }
    // Función para agregar eventos y accesorios en categoria_parqueo.html se uso json de prueba
    function agregarEventosCategoriaParqueo() {
        const panelAccesorios = document.querySelector(".panel-accesorios");

        if (!panelAccesorios) return;

        panelAccesorios.innerHTML = ""; // Limpia antes de cargar

        // URL de tu backend: cambia si tu backend corre en otra IP o puerto
        const url = "http://localhost:8080/items/page?page=1";

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const accesorios = data.items; // 👈 Suponiendo que el JSON tiene una propiedad "items"

                accesorios.forEach(accesorio => {
                    const accesorioHTML = `
                <div class="accesorio">
                    <img class="image-48" src="${accesorio.imageUrl || 'default.png'}" alt="${accesorio.name}" />
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
            })
            .catch(error => {
                console.error("Error al cargar los accesorios:", error);
                panelAccesorios.innerHTML = "<p>Error al cargar los accesorios.</p>";
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
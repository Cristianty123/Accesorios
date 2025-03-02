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
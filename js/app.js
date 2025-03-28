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
        const accesorios = [
            {
                "nombre": "Kit cámara reversa + arnés Mazda 3 Sedán",
                "precio": 305000,
                "imagen": "image-480.png",
                "nuevo": true
            },
            {
                "nombre": "Cable conector cámara reversa",
                "precio": 150000,
                "imagen": "image-481.png",
                "nuevo": true
            },
            {
                "nombre": "Cámara reversa Volkswagen Jetta",
                "precio": 110000,
                "imagen": "image-482.png",
                "nuevo": true
            },
            {
                "nombre": "Cámara reversa Volkswagen Jetta",
                "precio": 110000,
                "imagen": "image-482.png",
                "nuevo": true
            },
            {
                "nombre": "Cámara reversa Volkswagen Jetta",
                "precio": 110000,
                "imagen": "image-482.png",
                "nuevo": true
            }
        ];

        const panelAccesorios = document.querySelector(".panel-accesorios");

        if (!panelAccesorios) return; // Evitar errores si la página no tiene este contenedor

        panelAccesorios.innerHTML = ""; // Limpiar contenido previo

        accesorios.forEach(accesorio => {
            const accesorioHTML = `
            <div class="accesorio">
                <img class="image-48" src="${accesorio.imagen}" alt="${accesorio.nombre}" />
                <div class="descripcion">${accesorio.nombre}</div>
                ${accesorio.nuevo ? '<div class="nuevo">Nuevo</div>' : ''}
                <div class="precio">Cop $${accesorio.precio.toLocaleString("es-CO")}</div>
                <div class="frame-114">
                    <div class="informacion">INFORMACION</div>
                </div>
            </div>
            `;
            panelAccesorios.innerHTML += accesorioHTML;
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
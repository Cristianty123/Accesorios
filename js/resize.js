document.addEventListener('DOMContentLoaded', function() {
    const nosotrosSection = document.getElementById('nosotros');

    function adjustPageSize() {
        if (window.location.pathname.includes('nosotros.html')) {
            document.body.style.height = 'auto'; // Ajusta el tamaño de la página
        } else {
            document.body.style.height = '100vh'; // Tamaño por defecto para otras páginas
        }
    }

    window.addEventListener('load', adjustPageSize);
    window.addEventListener('resize', adjustPageSize);
});
document.addEventListener("DOMContentLoaded", function () {
    const text = "¡BIENVENIDO A LA MISIÓN (app nombre)!";
    const element = document.getElementById("typewriter");
    let i = 0;

    function typeWriter() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, 120); // velocidad de escritura
        }
    }

    typeWriter();
});
document.addEventListener("DOMContentLoaded", function () {
    const text = "\u00A1BIENVENIDO A LA MISI\u00D3N EXOPLANETAS!";
    const element = document.getElementById("typewriter");
    let i = 0;

    function typeWriter() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(typeWriter, 120);
        }
    }

    typeWriter();
});
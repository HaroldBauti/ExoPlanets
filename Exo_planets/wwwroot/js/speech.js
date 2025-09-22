var voices = [];
var selectedVoice = null;

// Cargar las voces disponibles cuando el navegador lo permita
function loadVoices() {
    voices = speechSynthesis.getVoices();
    console.log(voices);  // Ver las voces disponibles en la consola

    // Aquí, puedes poner el nombre exacto de la voz que deseas seleccionar
    var selectedVoiceName = "Google español"; // O el nombre de la voz que prefieras

    // Buscar la voz por su nombre
    selectedVoice = voices.find(function (voice) {
        return voice.name === selectedVoiceName;
    });

    // Si no se encuentra la voz, selecciona una predeterminada (como la primera voz)
    if (!selectedVoice) {
        selectedVoice = voices[0];
    }
}

// Esperar a que las voces estén disponibles
speechSynthesis.onvoiceschanged = function () {
    loadVoices();
}


// Función para hacer la llamada al endpoint Query
async function fetchQueryResult(message, id) {
    try {
        // Realizamos la llamada al servidor
        const response = await fetch(`/api/Nasa/Query?message=${encodeURIComponent(message)}&id=${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Verificar si la respuesta fue exitosa
        if (response.ok) {
            const data = await response.json();
            return data;  // Retornamos los datos obtenidos del servidor
        } else {
            throw new Error('Error en la respuesta del servidor');
        }
    } catch (error) {
        console.error('Error al llamar al endpoint:', error);
        alert("Hubo un error al obtener la respuesta del servidor.");
        return null;
    }
}

// Función para manejar el evento de clic y reproducir el texto
async function speakText() {
    var text = document.getElementById("userText").value;

    // Si el campo está vacío, mostrar una advertencia
    if (text.trim() === "") {
        alert("Por favor, ingresa un texto.");
        return;
    }

    // Llamar al endpoint Query en otro controlador
    const result = await fetchQueryResult(text, 1); // Suponemos que id=1 por ejemplo

    if (result) {
        // Reproducir el texto usando la síntesis de voz
        const utterance = new SpeechSynthesisUtterance(result.value);

        utterance.voice = selectedVoice; utterance.rate = 1;
        window.speechSynthesis.speak(utterance);
    }
}

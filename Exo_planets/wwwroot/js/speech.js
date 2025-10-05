// speech.js - Chatbot de Exoplanetas CORREGIDO
class ExoplanetChatbot {
    constructor() {
        this.voices = [];
        this.selectedVoice = null;
        this.chatHistory = [];
        this.isSpeaking = false;
        this.audioEnabled = true;
        this.init();
    }

    init() {
        this.loadVoices();
        this.loadChatHistory();
        this.setupEventListeners();
        this.showWelcomeMessage();
    }

    // Cargar voces disponibles - MANTENIDO IGUAL
    loadVoices() {
        this.voices = speechSynthesis.getVoices();
        console.log('Voces disponibles:', this.voices);

        // Buscar Google español o cualquier voz en español
        const spanishVoices = this.voices.filter(voice =>
            voice.lang.includes('es') || voice.name.toLowerCase().includes('spanish')
        );

        this.selectedVoice = this.voices.find(voice => voice.name === "Google español") ||
            spanishVoices[0] ||
            this.voices[0];

        if (this.selectedVoice) {
            console.log('Voz seleccionada:', this.selectedVoice.name);
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        speechSynthesis.onvoiceschanged = () => this.loadVoices();

        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    // Guardar y cargar historial - MANTENIDO
    saveChatHistory() {
        try {
            localStorage.setItem('exoplanet_chat_history', JSON.stringify(this.chatHistory));
        } catch (error) {
            console.warn('No se pudo guardar en localStorage:', error);
        }
    }

    loadChatHistory() {
        try {
            const saved = localStorage.getItem('exoplanet_chat_history');
            if (saved) {
                this.chatHistory = JSON.parse(saved);
                this.renderChatHistory();
            }
        } catch (error) {
            console.warn('Error cargando historial:', error);
            this.chatHistory = [];
        }
    }

    clearChatHistory() {
        this.chatHistory = [];
        this.saveChatHistory();
        this.renderChatHistory();
        this.showWelcomeMessage();
    }

    // 🚨 CORRECCIÓN PRINCIPAL: Función fetch simplificada como en tu código original
    async fetchQueryResult(message, id = 1) {
        try {
            console.log('Enviando consulta:', message);

            const response = await fetch(`/api/Nasa/Query?message=${encodeURIComponent(message)}&id=${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Verificar si la respuesta fue exitosa - IGUAL QUE TU CÓDIGO ORIGINAL
            if (response.ok) {
                const data = await response.json();
                console.log('Respuesta recibida:', data);
                return data;  // Retornamos los datos obtenidos del servidor
            } else {
                throw new Error('Error en la respuesta del servidor');
            }
        } catch (error) {
            console.error('Error al llamar al endpoint:', error);
            throw new Error('Hubo un error al obtener la respuesta del servidor.');
        }
    }

    // 🚨 NUEVO: Función para verificar si una imagen existe
    async checkImageExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // 🚨 CORRECCIÓN: Enviar mensaje simplificado
    async sendMessage() {
        const userInput = document.getElementById('userText');
        const message = userInput.value.trim();

        if (!message) {
            this.showNotification('Por favor, escribe un mensaje.', 'warning');
            return;
        }

        // Agregar mensaje del usuario
        this.addMessageToChat('user', message);
        userInput.value = '';

        // Mostrar indicador de typing
        this.showTypingIndicator();

        try {
            // 🚨 CORRECCIÓN: Llamada directa como en tu código original
            const result = await this.fetchQueryResult(message, 1);
            this.hideTypingIndicator();

            // 🚨 CORRECCIÓN: Validación más flexible como en tu código original
            if (result) {
                console.log('Resultado procesado:', result);

                // 🚨 MODIFICACIÓN: Agregar respuesta del bot con imagen si está disponible
                this.addMessageToChat('bot', result.value, result.url);

                // Reproducir audio si está habilitado
                if (this.audioEnabled) {
                    this.speakText(result.value);
                }

            } else {
                throw new Error('No se recibió respuesta del servidor');
            }

        } catch (error) {
            this.hideTypingIndicator();
            console.error('Error en sendMessage:', error);
            this.addMessageToChat('bot', `❌ ${error.message}`);
        }

        this.saveChatHistory();
    }

    // 🚨 MODIFICACIÓN: Agregar mensaje al chat con soporte para imagen
    addMessageToChat(sender, text, imageUrl = null) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const messageId = 'msg_' + Date.now();

        const message = {
            id: messageId,
            sender: sender,
            text: text,
            imageUrl: imageUrl,
            timestamp: new Date().toISOString()
        };

        this.chatHistory.push(message);

        const messageDiv = document.createElement('div');
        messageDiv.id = messageId;
        messageDiv.className = `message ${sender}-message`;

        if (sender === 'user') {
            messageDiv.innerHTML = `
                <div class="message-bubble user-bubble">
                    <div class="message-content">${this.escapeHtml(text)}</div>
                    <div class="message-time">${this.getFormattedTime()}</div>
                </div>
               <div class="message-avatar bot-avatar">
                    <img src="/img/user-atronauta.jpg" class="bot-avatar-img" alt="Bot Avatar" />
                </div>
            `;
        } else {
            // 🚨 MODIFICACIÓN: Agregar imagen si está disponible
            let imageHtml = '';
            if (imageUrl && imageUrl !== "N/A") {
                imageHtml = `
                    <div class="message-image-container">
                        <img src="${imageUrl}" 
                             alt="Imagen relacionada" 
                             class="message-image"
                             onload="this.classList.add('image-loaded')"
                             onerror="chatbot.handleImageError(this)">                     
                    </div>
                `;
            }

            messageDiv.innerHTML = `
                <div class="message-avatar bot-avatar">
                    <img src="/img/logo-cahtbot.jpg" class="bot-avatar-img" alt="Bot Avatar" />
                </div>
                <div class="message-bubble bot-bubble">
                    <div class="message-content">${this.escapeHtml(text)}</div>
                    ${imageHtml}
                    <div class="message-time">${this.getFormattedTime()}</div>
                    <div class="message-actions">
                        <button class="btn-action" onclick="chatbot.copyMessage('${messageId}')" title="Copiar">
                            <i class="bi bi-copy"></i>
                        </button>
                        <button class="btn-action" onclick="chatbot.speakText('${this.escapeHtml(text)}')" title="Leer en voz alta">
                            <i class="bi bi-volume-up"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        chatMessages.appendChild(messageDiv);
        this.scrollToBottom();

        setTimeout(() => {
            messageDiv.classList.add('message-visible');
        }, 10);
    }

    // Mostrar mensaje de bienvenida
    showWelcomeMessage() {
        const welcomeMessage = "¡Hola! Soy tu asistente de exoplanetas. Puedes preguntarme sobre cualquier exoplaneta, sus características, métodos de descubrimiento y más. ¿En qué puedo ayudarte?";
        this.addMessageToChat('bot', welcomeMessage);
    }

    // Mostrar indicador de typing
    showTypingIndicator() {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const typingDiv = document.createElement('div');
        typingDiv.id = 'typingIndicator';
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-avatar bot-avatar">
                <img src="/img/logo-cahtbot.jpg" class="bot-avatar-img" alt="Bot Avatar" />
            </div>
            <div class="message-bubble bot-bubble">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    // Ocultar indicador de typing
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Dentro de la clase ExoplanetChatbot, agrega esta función:
    handleImageError(imgElement) {
        imgElement.style.display = 'none';
        // Crear elemento de error si no existe
        const errorElement = document.createElement('div');
        errorElement.className = 'image-error';
        errorElement.innerHTML = `
       
    `;
        imgElement.parentNode.appendChild(errorElement);
    }

    // 🚨 MODIFICACIÓN: Renderizar historial del chat con soporte para imágenes
    renderChatHistory() {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        chatMessages.innerHTML = '';

        this.chatHistory.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.id = message.id;
            messageDiv.className = `message ${message.sender}-message message-visible`;

            if (message.sender === 'user') {
                messageDiv.innerHTML = `
                    <div class="message-bubble user-bubble">
                        <div class="message-content">${this.escapeHtml(message.text)}</div>
                        <div class="message-time">${this.getFormattedTime(message.timestamp)}</div>
                    </div>
                    <div class="message-avatar user-avatar">
                       <img src="/img/user-atronauta.jpg" class="bot-avatar-img" alt="Bot Avatar" />
                    </div>
                `;
            } else {
                // 🚨 MODIFICACIÓN: Agregar imagen si está disponible en el historial
                let imageHtml = '';
                if (message.imageUrl) {
                    imageHtml = `
                        <div class="message-image-container">
                            <img src="${message.imageUrl}" 
                                 alt="Imagen relacionada" 
                                 class="message-image"
                                 onload="this.classList.add('image-loaded')"
                                 onerror="chatbot.handleImageError(this)">     
                        </div>
                    `;
                }

                messageDiv.innerHTML = `
                    <div class="message-avatar bot-avatar">
                        <img src="/img/logo-cahtbot.jpg" class="bot-avatar-img" alt="Bot Avatar" />
                    </div>
                    <div class="message-bubble bot-bubble">
                        <div class="message-content">${this.escapeHtml(message.text)}</div>
                        ${imageHtml}
                        <div class="message-time">${this.getFormattedTime(message.timestamp)}</div>
                        <div class="message-actions">
                            <button class="btn-action" onclick="chatbot.copyMessage('${message.id}')" title="Copiar">
                                <i class="bi bi-copy"></i>
                            </button>
                            <button class="btn-action" onclick="chatbot.speakText('${this.escapeHtml(message.text)}')" title="Leer en voz alta">
                                <i class="bi bi-volume-up"></i>
                            </button>
                        </div>
                    </div>
                `;
            }

            chatMessages.appendChild(messageDiv);
        });

        this.scrollToBottom();
    }

    // 🚨 CORRECCIÓN: Función speakText simplificada como en tu código original
    speakText(text) {
        if (!this.audioEnabled) return;

        if (this.isSpeaking) {
            speechSynthesis.cancel();
        }

        this.isSpeaking = true;

        const utterance = new SpeechSynthesisUtterance(text);

        // Configuración IDÉNTICA a tu código original
        utterance.voice = this.selectedVoice;
        utterance.rate = 1; // Misma velocidad que tu código original
        utterance.volume = 1;

        utterance.onend = () => {
            this.isSpeaking = false;
        };

        utterance.onerror = (error) => {
            console.error('Error en síntesis de voz:', error);
            this.isSpeaking = false;
        };

        speechSynthesis.speak(utterance);
    }

    // Copiar mensaje
    copyMessage(messageId) {
        const message = this.chatHistory.find(msg => msg.id === messageId);
        if (message) {
            navigator.clipboard.writeText(message.text).then(() => {
                this.showNotification('Mensaje copiado al portapapeles', 'success');
            }).catch(err => {
                console.error('Error al copiar:', err);
                this.showNotification('Error al copiar', 'error');
            });
        }
    }

    // Alternar audio
    toggleAudio() {
        this.audioEnabled = !this.audioEnabled;
        const button = document.getElementById('toggleAudio');

        if (button) {
            if (this.audioEnabled) {
                button.classList.remove('disabled');
                button.innerHTML = '<i class="bi bi-volume-up"></i>';
                this.showNotification('Audio activado', 'success');
            } else {
                button.classList.add('disabled');
                button.innerHTML = '<i class="bi bi-volume-mute"></i>';
                this.showNotification('Audio desactivado', 'info');
            }
        }
    }

    // Utilidades
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getFormattedTime(timestamp = null) {
        const date = timestamp ? new Date(timestamp) : new Date();
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    scrollToBottom() {
        const chatContainer = document.getElementById('chatContainer');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    showNotification(message, type = 'info') {
        // Notificación simple
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// Inicializar chatbot
let chatbot;

document.addEventListener('DOMContentLoaded', function () {
    chatbot = new ExoplanetChatbot();
});

// Funciones globales
function clearChat() {
    if (confirm('¿Estás seguro de que quieres limpiar todo el historial del chat?')) {
        chatbot.clearChatHistory();
    }
}

function toggleAudio() {
    if (chatbot) {
        chatbot.toggleAudio();
    }
}


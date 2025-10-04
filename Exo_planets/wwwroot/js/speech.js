// speech.js - Chatbot de Exoplanetas Mejorado
class ExoplanetChatbot {
    constructor() {
        this.voices = [];
        this.selectedVoice = null;
        this.chatHistory = [];
        this.isSpeaking = false;
        this.init();
    }

    init() {
        this.loadVoices();
        this.loadChatHistory();
        this.setupEventListeners();
    }

    // Cargar voces disponibles
    loadVoices() {
        this.voices = speechSynthesis.getVoices();
        console.log('Voces disponibles:', this.voices);

        // Buscar voces en español
        const spanishVoices = this.voices.filter(voice =>
            voice.lang.includes('es') || voice.name.toLowerCase().includes('spanish')
        );

        // Priorizar Google español, luego cualquier voz en español, luego la primera disponible
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

        // Enter para enviar mensaje
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    // Guardar historial del chat
    saveChatHistory() {
        try {
            localStorage.setItem('exoplanet_chat_history', JSON.stringify(this.chatHistory));
        } catch (error) {
            console.warn('No se pudo guardar en localStorage:', error);
            // Fallback a sessionStorage
            sessionStorage.setItem('exoplanet_chat_history', JSON.stringify(this.chatHistory));
        }
    }

    // Cargar historial del chat
    loadChatHistory() {
        try {
            const saved = localStorage.getItem('exoplanet_chat_history') ||
                sessionStorage.getItem('exoplanet_chat_history');
            if (saved) {
                this.chatHistory = JSON.parse(saved);
                this.renderChatHistory();
            }
        } catch (error) {
            console.warn('Error cargando historial:', error);
            this.chatHistory = [];
        }
    }

    // Limpiar historial
    clearChatHistory() {
        this.chatHistory = [];
        this.saveChatHistory();
        this.renderChatHistory();
    }

    // Llamada al endpoint
    async fetchQueryResult(message, id = 1) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seg timeout

            const response = await fetch(`/api/Nasa/Query?message=${encodeURIComponent(message)}&id=${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('Error en fetchQueryResult:', error);

            if (error.name === 'AbortError') {
                throw new Error('La solicitud tardó demasiado tiempo. Intenta nuevamente.');
            }

            throw new Error('Error de conexión. Verifica tu conexión a internet.');
        }
    }

    // Enviar mensaje
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
            const result = await this.fetchQueryResult(message);
            this.hideTypingIndicator();

            if (result && result.value) {
                // Agregar respuesta del bot
                this.addMessageToChat('bot', result.value);

                // Actualizar datos del exoplaneta
                this.updateExoplanetData(result);

                // Reproducir audio si está habilitado
                if (this.isAudioEnabled()) {
                    this.speakText(result.value);
                }

            } else {
                throw new Error('Respuesta inválida del servidor');
            }

        } catch (error) {
            this.hideTypingIndicator();
            this.addMessageToChat('bot', `❌ ${error.message}`);
            this.showNotification(error.message, 'error');
        }

        this.saveChatHistory();
    }

    // Agregar mensaje al chat
    addMessageToChat(sender, text) {
        const chatMessages = document.getElementById('chatMessages');
        const messageId = 'msg_' + Date.now();

        const message = {
            id: messageId,
            sender: sender,
            text: text,
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
                <div class="message-avatar user-avatar">
                    <i class="bi bi-person-fill"></i>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-avatar bot-avatar">
                    <i class="bi bi-robot"></i>
                </div>
                <div class="message-bubble bot-bubble">
                    <div class="message-content">${this.escapeHtml(text)}</div>
                    <div class="message-time">${this.getFormattedTime()}</div>
                  
                </div>
            `;
        }


        //<div class="message-actions">
        //    <button class="btn-action" onclick="chatbot.copyMessage('${messageId}')" title="Copiar">
        //        <i class="bi bi-copy"></i>
        //    </button>
        //    <button class="btn-action" onclick="chatbot.speakText('${this.escapeHtml(text)}')" title="Leer en voz alta">
        //        <i class="bi bi-volume-up"></i>
        //    </button>
        //</div>

        chatMessages.appendChild(messageDiv);
        this.scrollToBottom();

        // Animación de entrada
        setTimeout(() => {
            messageDiv.classList.add('message-visible');
        }, 10);
    }

    // Mostrar indicador de typing
    showTypingIndicator() {
        const chatMessages = document.getElementById('chatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typingIndicator';
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-avatar bot-avatar">
                <i class="bi bi-robot"></i>
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

    // Renderizar historial del chat
    renderChatHistory() {
        const chatMessages = document.getElementById('chatMessages');
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
                        <i class="bi bi-person-fill"></i>
                    </div>
                `;
            } else {
                messageDiv.innerHTML = `
                    <div class="message-avatar ">
                        <img src="/img/logo-cahtbot.jpg" class="bot-avatar" />
                    </div>
                    <div class="message-bubble bot-bubble">
                        <div class="message-content">${this.escapeHtml(message.text)}</div>
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

    // Actualizar datos del exoplaneta
    updateExoplanetData(data) {
        const updateField = (elementId, value, suffix = '') => {
            const element = document.getElementById(elementId);
            if (element && value) {
                element.textContent = value + suffix;
                element.parentElement.style.display = 'block';
            }
        };

        updateField('metodoDisplay', data.met_desc);
        updateField('nombreDisplay', data.name_exoplaneta);
        updateField('ratioDisplay', data.ratio);
        updateField('temperaturaDisplay', data.temp, ' K');
        updateField('añoDisplay', data.yearDisc);

        // Mostrar panel si hay datos
        const panel = document.getElementById('exoplanetDataPanel');
        if (data.name_exoplaneta || data.met_desc) {
            panel.style.display = 'block';
        }
    }

    // Reproducir texto
    speakText(text) {
        if (this.isSpeaking) {
            speechSynthesis.cancel();
        }

        this.isSpeaking = true;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.selectedVoice;
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;

        utterance.onend = () => {
            this.isSpeaking = false;
        };

        utterance.onerror = (error) => {
            console.error('Error en síntesis de voz:', error);
            this.isSpeaking = false;
            this.showNotification('Error al reproducir audio', 'error');
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

    // Verificar si audio está habilitado
    isAudioEnabled() {
        return !document.getElementById('toggleAudio')?.classList.contains('disabled');
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
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    showNotification(message, type = 'info') {
        // Implementar notificación toast si es necesario
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// Inicializar chatbot
const chatbot = new ExoplanetChatbot();

// Función global para limpiar chat (usada en el HTML)
function clearChat() {
    if (confirm('¿Estás seguro de que quieres limpiar todo el historial del chat?')) {
        chatbot.clearChatHistory();
        chatbot.showNotification('Chat limpiado', 'success');
    }
}

// Función global para alternar audio
function toggleAudio() {
    const button = document.getElementById('toggleAudio');
    const isEnabled = !button.classList.contains('disabled');

    if (isEnabled) {
        button.classList.add('disabled');
        button.innerHTML = '<i class="bi bi-volume-mute"></i>';
        chatbot.showNotification('Audio desactivado', 'info');
    } else {
        button.classList.remove('disabled');
        button.innerHTML = '<i class="bi bi-volume-up"></i>';
        chatbot.showNotification('Audio activado', 'success');
    }
}
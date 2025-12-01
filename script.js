// API Configuration
let API_ENDPOINT = localStorage.getItem('apiEndpoint') || 'http://localhost:5678/webhook/cb9ca299-e31e-4cd9-a0a6-3f03825479db';
let DEV_MODE = localStorage.getItem('devMode') === 'true' || false;

// Docker Services Data
const dockerServices = [
    {
        name: 'nginx',
        displayName: 'Nginx',
        description: 'Servidor web',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nginx/nginx-original.svg'
    },
    {
        name: 'apache',
        displayName: 'Apache',
        description: 'Servidor web',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apache/apache-original.svg'
    },
    {
        name: 'postgresql',
        displayName: 'PostgreSQL',
        description: 'Base de datos',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg'
    },
    {
        name: 'redis',
        displayName: 'Redis',
        description: 'Cache/BD en memoria',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg'
    },
    {
        name: 'centos',
        displayName: 'CentOS',
        description: 'Sistema operativo Linux',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/centos/centos-original.svg'
    },
    {
        name: 'debian',
        displayName: 'Debian',
        description: 'Sistema operativo Linux',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/debian/debian-original.svg'
    },
    {
        name: 'elasticsearch',
        displayName: 'Elasticsearch',
        description: 'Motor de búsqueda',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/elasticsearch/elasticsearch-original.svg'
    },
    {
        name: 'rabbitmq',
        displayName: 'RabbitMQ',
        description: 'Message broker',
        icon: 'https://www.vectorlogo.zone/logos/rabbitmq/rabbitmq-icon.svg'
    },
    {
        name: 'jenkins',
        displayName: 'Jenkins',
        description: 'CI/CD',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jenkins/jenkins-original.svg'
    },
    {
        name: 'grafana',
        displayName: 'Grafana',
        description: 'Monitoreo',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/grafana/grafana-original.svg'
    },
    {
        name: 'prometheus',
        displayName: 'Prometheus',
        description: 'Métricas',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prometheus/prometheus-original.svg'
    },
    {
        name: 'portainer',
        displayName: 'Portainer',
        description: 'Gestión Docker',
        icon: 'https://portainer-io.github.io/portainer-docs/images/logo.svg'
    },
    {
        name: 'ubuntu',
        displayName: 'Ubuntu',
        description: 'Sistema operativo Linux',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ubuntu/ubuntu-plain.svg'
    },
    {
        name: 'python',
        displayName: 'Python',
        description: 'Entorno Python',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg'
    },
    {
        name: 'kibana',
        displayName: 'Kibana',
        description: 'Visualización de datos Elasticsearch',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kibana/kibana-original.svg'
    },
      {
          name: 'busybox',
          displayName: 'BusyBox',
          description: 'Herramientas Unix compactas',
          icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg'
      }
 ];

// Global Variables
let selectedServices = new Set();

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeServiceGrid();
    setupEventListeners();
    loadSettings();
    loadContainers(); // Cargar contenedores al inicio
});

// Initialize Service Selection Grid
function initializeServiceGrid() {
    const servicesGrid = document.getElementById('servicesGrid');
    servicesGrid.innerHTML = '';
    
    dockerServices.forEach(service => {
        const serviceElement = document.createElement('div');
        serviceElement.className = 'service-option';
        serviceElement.dataset.service = service.name;
        serviceElement.onclick = () => toggleService(service.name);
        
        serviceElement.innerHTML = `
            <img src="${service.icon}" alt="${service.displayName}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iIzY2N2VlYSIvPgo8dGV4dCB4PSIyNCIgeT0iMzAiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjE2IiBmb250LWZhbWlseT0iQXJpYWwiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkQ8L3RleHQ+Cjwvc3ZnPgo='">
            <h4>${service.displayName}</h4>
            <p>${service.description}</p>
        `;
        
        servicesGrid.appendChild(serviceElement);
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Modal close on outside click
    window.onclick = function(event) {
        const serviceModal = document.getElementById('serviceModal');
        const chatModal = document.getElementById('chatModal');
        const settingsModal = document.getElementById('settingsModal');

        if (event.target === serviceModal) {
            closeServiceModal();
        }
        if (event.target === chatModal) {
            closeChatModal();
        }
        if (event.target === settingsModal) {
            closeSettingsModal();
        }
    };
}

// Load and display containers
async function loadContainers() {
    try {
        const response = await fetch('/api/containers');
        if (response.ok) {
            const containers = await response.json();
            updateContainersGrid(containers);
        } else {
            console.error('Error loading containers:', response.status);
            showNotification('Error al cargar contenedores', 'error');
        }
    } catch (error) {
        console.error('Error fetching containers:', error);
        showNotification('Error de conexión al cargar contenedores', 'error');
    }
}

// Update containers grid with data
function updateContainersGrid(containers) {
    const containersGrid = document.getElementById('containersGrid');

    if (containers.length === 0) {
        containersGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-docker"></i>
                <h3>No hay contenedores</h3>
                <p>Crea un servicio para comenzar</p>
            </div>
        `;
        return;
    }

    containersGrid.innerHTML = '';

    containers.forEach(container => {
        const statusClass = container.state === 'running' ? 'running' :
                           container.state === 'exited' ? 'stopped' :
                           container.state === 'paused' ? 'paused' : 'stopped';

        const statusText = container.state === 'running' ? 'Ejecutándose' :
                          container.state === 'exited' ? 'Detenido' :
                          container.state === 'paused' ? 'Pausado' : 'Desconocido';

        // Formatear puertos
        let portsText = 'N/A';
        if (container.ports) {
            const portMappings = [];
            for (const [containerPort, hostBindings] of Object.entries(container.ports)) {
                if (hostBindings) {
                    hostBindings.forEach(binding => {
                        if (binding.HostPort) {
                            portMappings.push(`${binding.HostPort}:${containerPort}`);
                        }
                    });
                }
            }
            if (portMappings.length > 0) {
                portsText = portMappings.join(', ');
            }
        }

        const containerCard = document.createElement('div');
        containerCard.className = 'container-card';
        containerCard.innerHTML = `
            <div class="card-header">
                <div class="status-indicator ${statusClass}"></div>
                <h3>${container.name}</h3>
                <span class="container-id">#${container.id}</span>
            </div>
            <div class="card-body">
                <div class="service-info">
                    <img src="${container.icon}" alt="${container.service}" class="service-icon" onerror="this.src='https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg'">
                    <div class="service-details">
                        <p><strong>Servicio:</strong> ${container.service}</p>
                        <p><strong>Imagen:</strong> ${container.image}</p>
                        <p><strong>Puerto:</strong> ${portsText}</p>
                        <p><strong>Estado:</strong> <span class="status ${statusClass}">${statusText}</span></p>
                    </div>
                </div>
            </div>
            <div class="card-actions">
                <button class="btn-icon" title="Ver logs" onclick="viewLogs('${container.id}')">
                    <i class="fas fa-file-alt"></i>
                </button>
                <button class="btn-icon" title="Reiniciar" onclick="restartContainer('${container.id}')">
                    <i class="fas fa-redo"></i>
                </button>
                <button class="btn-icon ${statusClass === 'running' ? '' : 'success'}" title="${statusClass === 'running' ? 'Parar' : 'Iniciar'}" onclick="${statusClass === 'running' ? 'stopContainer' : 'startContainer'}('${container.id}')">
                    <i class="fas fa-${statusClass === 'running' ? 'stop' : 'play'}"></i>
                </button>
                <button class="btn-icon danger" title="Eliminar" onclick="deleteContainer('${container.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        containersGrid.appendChild(containerCard);
    });
}

// Service Modal Functions
function openServiceModal() {
    document.getElementById('serviceModal').style.display = 'block';
    selectedServices.clear();
    updateServiceSelection();
}

function closeServiceModal() {
    document.getElementById('serviceModal').style.display = 'none';
    selectedServices.clear();
    updateServiceSelection();
}

function toggleService(serviceName) {
    if (selectedServices.has(serviceName)) {
        selectedServices.delete(serviceName);
    } else {
        selectedServices.add(serviceName);
    }
    updateServiceSelection();
}

function updateServiceSelection() {
    const createBtn = document.getElementById('createBtn');
    const serviceOptions = document.querySelectorAll('.service-option');
    
    serviceOptions.forEach(option => {
        const serviceName = option.dataset.service;
        if (selectedServices.has(serviceName)) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
    
    createBtn.disabled = selectedServices.size === 0;
}

async function createServices() {
    if (selectedServices.size === 0) return;
    
    showLoading();
    
    try {
        const componentsArray = Array.from(selectedServices);
        
        console.log('Creando servicios. Endpoint:', API_ENDPOINT);
        console.log('Servicios seleccionados:', componentsArray);
        
        const result = await makeAPICall({ components: componentsArray });
        console.log('Services created successfully:', result);

        showNotification('Servicios creados exitosamente', 'success');
        closeServiceModal();

        // Recargar lista de contenedores después de crear servicios
        setTimeout(() => {
            loadContainers();
        }, 2000); // Esperar 2 segundos para que Docker termine de crear los contenedores
        
    } catch (error) {
        console.error('Error creating services:', error);
        showNotification('Error al crear los servicios', 'error');
    } finally {
        hideLoading();
    }
}

// Chat Modal Functions
function openChatModal() {
    document.getElementById('chatModal').style.display = 'block';
    // Focus on input
    setTimeout(() => {
        document.getElementById('chatInput').focus();
    }, 100);
}

function closeChatModal() {
    document.getElementById('chatModal').style.display = 'none';
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    
    // Clear input
    chatInput.value = '';
    
    // Disable send button while processing
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    try {
        console.log('Enviando mensaje al endpoint:', API_ENDPOINT);
        console.log('Payload:', JSON.stringify({ components: [message] }));
        
        const result = await makeAPICall({ components: [message] });
        console.log('Chat response:', result);
        
        const botResponse = result.output || 'Lo siento, no pude procesar tu mensaje.';
        addMessageToChat(botResponse, 'bot');
        
    } catch (error) {
        console.error('Error sending message:', error);
        let errorMessage = 'Lo siento, ocurrió un error al procesar tu mensaje.';
        
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            errorMessage = 'Error de conexión: No se pudo conectar al servidor. Verifica que el endpoint esté disponible y que no haya problemas de CORS.';
        }
        
        addMessageToChat(errorMessage, 'bot');
    } finally {
        // Re-enable send button
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        
        // Focus back on input
        chatInput.focus();
    }
}

function addMessageToChat(message, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}-message`;
    
    const avatar = sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
    
    // Process markdown for bot messages
    const processedMessage = sender === 'bot' ? processMarkdown(message) : escapeHtml(message);
    
    messageElement.innerHTML = `
        <div class="message-avatar">
            ${avatar}
        </div>
        <div class="message-content">
            ${processedMessage}
        </div>
    `;
    
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Simple markdown processor
function processMarkdown(text) {
    // Escape HTML first
    text = escapeHtml(text);
    
    // Process markdown
    text = text
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Code blocks
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        // Inline code
        .replace(/`(.*?)`/g, '<code>$1</code>')
        // Headers
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        // Line breaks
        .replace(/\n/g, '<br>');
    
    return text;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Utility Functions
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#e53e3e' : '#667eea'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 3000;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Add CSS animations for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(notificationStyles);

// Docker Action Helper Function
async function performDockerAction(action, containerId, confirmMessage = null) {
    if (confirmMessage && !confirm(confirmMessage)) {
        return;
    }

    try {
        const response = await fetch('/api/docker/action', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: action,
                container_id: containerId
            })
        });

        if (response.ok) {
            const result = await response.json();
            return result;
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Unknown error');
        }
    } catch (error) {
        console.error(`Error performing ${action}:`, error);
        throw error;
    }
}

// Container Management Functions
async function stopContainer(containerId) {
    try {
        await performDockerAction('stop_container', containerId, '¿Estás seguro de que quieres detener este contenedor?');
        showNotification('Contenedor detenido exitosamente', 'success');
        loadContainers(); // Recargar lista
    } catch (error) {
        showNotification('Error al detener el contenedor: ' + error.message, 'error');
    }
}

async function startContainer(containerId) {
    try {
        await performDockerAction('start_container', containerId);
        showNotification('Contenedor iniciado exitosamente', 'success');
        loadContainers(); // Recargar lista
    } catch (error) {
        showNotification('Error al iniciar el contenedor: ' + error.message, 'error');
    }
}

async function restartContainer(containerId) {
    try {
        await performDockerAction('restart_container', containerId);
        showNotification('Contenedor reiniciado exitosamente', 'success');
        loadContainers(); // Recargar lista
    } catch (error) {
        showNotification('Error al reiniciar el contenedor: ' + error.message, 'error');
    }
}

async function deleteContainer(containerId) {
    try {
        await performDockerAction('delete_container', containerId, '¿Estás seguro de que quieres eliminar este contenedor? Esta acción no se puede deshacer.');
        showNotification('Contenedor eliminado exitosamente', 'success');
        loadContainers(); // Recargar lista
    } catch (error) {
        showNotification('Error al eliminar el contenedor: ' + error.message, 'error');
    }
}

function viewLogs(containerId) {
    // Abrir logs en una nueva ventana/modal
    console.log('Viewing logs for container:', containerId);
    // Por ahora solo mostrar un mensaje
    showNotification('Funcionalidad de logs próximamente', 'info');
}

// Debug Functions - Available globally for console testing
window.testAPI = async function() {
    console.log('🔍 Probando conectividad con API...');
    console.log('Endpoint:', API_ENDPOINT);
    
    try {
        const testPayload = { components: ['test-connection'] };
        console.log('Enviando payload de prueba:', testPayload);
        
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            mode: 'cors',
            body: JSON.stringify(testPayload)
        });
        
        console.log('✅ Request enviado exitosamente');
        console.log('Status:', response.status);
        console.log('Headers:', [...response.headers.entries()]);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Respuesta del servidor:', result);
        } else {
            console.log('❌ Error HTTP:', response.status, response.statusText);
            const errorText = await response.text();
            console.log('Error body:', errorText);
        }
        
    } catch (error) {
        console.log('❌ Error de conectividad:', error);
        
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            console.log('💡 Posibles causas:');
            console.log('   - El servidor no está ejecutándose');
            console.log('   - Problema de CORS');
            console.log('   - Firewall bloqueando la conexión');
            console.log('   - URL incorrecta');
        }
    }
};

// Helper function to make API calls
async function makeAPICall(payload) {
    if (DEV_MODE) {
        // Modo desarrollo - simular respuesta
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, output: 'Respuesta simulada en modo desarrollo' };
    }
    
    // Usar modo CORS normal ya que n8n tiene CORS configurado
    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify(payload)
    });
    
    if (response.ok) {
        return await response.json();
    } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
}

window.checkEndpoint = function() {
    console.log('📋 Configuración actual:');
    console.log('API_ENDPOINT:', API_ENDPOINT);
    console.log('DEV_MODE:', DEV_MODE);
    console.log('');
    console.log('💡 Para probar la conexión, ejecuta: testAPI()');
    console.log('💡 Para habilitar modo desarrollo: DEV_MODE = true');
};

// Settings Modal Functions
function openSettingsModal() {
    document.getElementById('settingsModal').style.display = 'block';
    loadSettings();
}

function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
}

function loadSettings() {
    const apiEndpointInput = document.getElementById('apiEndpoint');
    const devModeInput = document.getElementById('devMode');
    
    if (apiEndpointInput) {
        apiEndpointInput.value = API_ENDPOINT;
    }
    if (devModeInput) {
        devModeInput.checked = DEV_MODE;
    }
}

function saveSettings() {
    const apiEndpointInput = document.getElementById('apiEndpoint');
    const devModeInput = document.getElementById('devMode');
    
    if (apiEndpointInput.value.trim()) {
        API_ENDPOINT = apiEndpointInput.value.trim();
        localStorage.setItem('apiEndpoint', API_ENDPOINT);
    }
    
    DEV_MODE = devModeInput.checked;
    localStorage.setItem('devMode', DEV_MODE.toString());
    
    showNotification('Configuración guardada exitosamente', 'success');
    closeSettingsModal();
    
    console.log('✅ Configuración actualizada:');
    console.log('API_ENDPOINT:', API_ENDPOINT);
    console.log('DEV_MODE:', DEV_MODE);
}

async function testConnection() {
    const statusElement = document.getElementById('connectionStatus');
    const statusDot = statusElement.querySelector('.status-dot');
    const statusText = statusElement.querySelector('span:last-child');
    const testBtn = document.getElementById('testBtn');
    
    // Update UI to testing state
    statusDot.className = 'status-dot testing';
    statusText.textContent = 'Probando conexión...';
    testBtn.disabled = true;
    testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Probando...';
    
    try {
        const result = await makeAPICall({ components: ['connection-test'] });
        console.log('Connection test result:', result);
        
        statusDot.className = 'status-dot success';
        statusText.textContent = 'Conexión exitosa';
        showNotification('Conexión establecida correctamente', 'success');
        
    } catch (error) {
        console.error('Test connection error:', error);
        statusDot.className = 'status-dot error';
        
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            statusText.textContent = 'Error de conexión (CORS/Red)';
            showNotification('Error: No se pudo conectar al servidor', 'error');
        } else {
            statusText.textContent = `Error: ${error.message}`;
            showNotification(`Error de conexión: ${error.message}`, 'error');
        }
    } finally {
        testBtn.disabled = false;
        testBtn.innerHTML = '<i class="fas fa-plug"></i> Probar Conexión';
    }
}

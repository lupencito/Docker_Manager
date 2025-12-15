Plataforma de Despliegue Flexible con Docker y Orquestación de Contenedores
Este proyecto presenta una solución integral para la administración de sistemas informáticos en red, centrada en la creación de una infraestructura escalable, eficiente y flexible utilizando tecnologías de contenedores con implementación de IA.

-Estado del Proyecto
Este trabajo forma parte del Programa Modular en Administración de Sistemas Informáticos en Red de la UNED (Curso 2025/2026).

-Descripción
El objetivo principal es diseñar y desplegar una plataforma que permita gestionar servicios de red de forma aislada y portable. Se utiliza Docker para la creación de imágenes y orquestación para asegurar la disponibilidad y el escalado de los servicios, con uso de IA y automatización n8n.

-Características principales:
Despliegue Automatizado: Uso de Docker Compose para levantar microservicios.

Flexibilidad: Configuración de redes internas y volúmenes de datos persistentes.

Orquestación: Gestión del ciclo de vida de los contenedores para entornos de producción/prácticos.

Optimización de Recursos: Administración eficiente de la infraestructura de red subyacente.

-Stack Tecnológico
Contenedores: Docker, Docker Desktop.

Orquestación: Docker Compose, n8n.

SO Base: Linux Debian 12.11.

Herramientas: Portainer (opcional), Git, Terminal de comandos.

-Indice de archivos
container_management.json, execute_ssh_command.json: copia de la automatización n8n.
index.html, script.js, styles.css: copia de la interfaz web.
server.py: Proxy CORS

-Guía de usuario
Instalar Docker en Debian.
Importar archivos a n8n.
Arrancar docker n8n con el comando: docker run -it --rm
--name n8n
-p 5678:5678
-e GENERIC_TIMEZONE="Africa/Casablanca"
-e TZ="Africa/Casablanca"
-e N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true
-e N8N_RUNNERS_ENABLED=true
-e N8N_SECURE_COOKIE=false
-v n8n_data:/home/node/.n8n
docker.n8n.io/n8nio/n8n
Verificar que la ip de conexión del webhook es la correcta.
Ejecutar el Proxy CORS en Debian con: Python3 server.py.
Ejecutar el index.html para acceder al Docker Manager.

-Autor
Nombre: Santiago Manuel Escuder Pérez

Tutor: Ernesto Fábregas Acosta

Institución: UNED (Universidad Nacional de Educación a Distancia)



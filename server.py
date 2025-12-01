#!/usr/bin/env python3
"""
Servidor HTTP simple con proxy CORS para Docker Manager
Uso: python server.py
Luego ve a: http://localhost:8000
"""

import http.server
import socketserver
import urllib.request
import urllib.parse
import json
import sys
from urllib.error import URLError

try:
    import docker
    from docker.errors import NotFound, APIError
    DOCKER_AVAILABLE = True
except ImportError:
    DOCKER_AVAILABLE = False
    docker = None
    NotFound = None
    APIError = None
    print("⚠️  Módulo 'docker' no disponible. Instala con: pip install docker")

class CORSProxyHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Agregar headers CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        super().end_headers()

    def do_OPTIONS(self):
        # Manejar preflight requests
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        # Si es una petición para obtener contenedores
        if self.path == '/api/containers':
            self.handle_containers_request()
            return
        # Para otras rutas, servir archivos normalmente
        super().do_GET()

    def do_POST(self):
        # Si es una petición al proxy API
        if self.path.startswith('/api/proxy'):
            self.handle_proxy_request()
        # Si es una petición para acciones de Docker
        elif self.path == '/api/docker/action':
            self.handle_docker_action()
        else:
            super().do_POST()

    def handle_proxy_request(self):
        try:
            # Leer el cuerpo de la petición
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            # Parsear JSON para obtener la URL target
            try:
                data = json.loads(post_data.decode('utf-8'))
                target_url = data.get('target_url')
                payload = data.get('payload', {})
            except json.JSONDecodeError:
                self.send_error(400, 'Invalid JSON')
                return

            if not target_url:
                self.send_error(400, 'Missing target_url')
                return

            # Hacer la petición al servidor real
            headers = {'Content-Type': 'application/json'}
            req_data = json.dumps(payload).encode('utf-8')
            
            request = urllib.request.Request(
                target_url, 
                data=req_data, 
                headers=headers,
                method='POST'
            )
            
            try:
                with urllib.request.urlopen(request, timeout=30) as response:
                    response_data = response.read()
                    
                    # Enviar respuesta exitosa
                    self.send_response(response.status)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(response_data)
                    
            except URLError as e:
                # Error de conexión
                self.send_response(503)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                error_response = json.dumps({
                    'error': 'Connection failed',
                    'message': str(e)
                }).encode('utf-8')
                self.wfile.write(error_response)
                
        except Exception as e:
            # Error interno
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            }).encode('utf-8')
            self.wfile.write(error_response)

    def handle_docker_action(self):
        if not DOCKER_AVAILABLE or docker is None:
            self.send_response(503)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = json.dumps({
                'error': 'Docker not available',
                'message': 'El módulo docker de Python no está instalado. Instala con: pip install docker'
            }).encode('utf-8')
            self.wfile.write(error_response)
            return

        try:
            # Leer el cuerpo de la petición
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)

            # Parsear JSON
            try:
                data = json.loads(post_data.decode('utf-8'))
                action = data.get('action')
                container_id = data.get('container_id')
            except json.JSONDecodeError:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                error_response = json.dumps({
                    'error': 'Invalid JSON'
                }).encode('utf-8')
                self.wfile.write(error_response)
                return

            if not action or not container_id:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                error_response = json.dumps({
                    'error': 'Missing action or container_id'
                }).encode('utf-8')
                self.wfile.write(error_response)
                return

            # Conectar a Docker
            client = docker.from_env()

            # Ejecutar la acción correspondiente
            try:
                if action == 'stop_container':
                    container = client.containers.get(container_id)
                    container.stop()
                    message = 'Contenedor detenido exitosamente'
                elif action == 'start_container':
                    container = client.containers.get(container_id)
                    container.start()
                    message = 'Contenedor iniciado exitosamente'
                elif action == 'restart_container':
                    container = client.containers.get(container_id)
                    container.restart()
                    message = 'Contenedor reiniciado exitosamente'
                elif action == 'delete_container':
                    container = client.containers.get(container_id)
                    container.remove(force=True)
                    message = 'Contenedor eliminado exitosamente'
                else:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    error_response = json.dumps({
                        'error': 'Unknown action',
                        'message': f'Action {action} not supported'
                    }).encode('utf-8')
                    self.wfile.write(error_response)
                    return

                # Respuesta exitosa
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                success_response = json.dumps({
                    'success': True,
                    'message': message
                }).encode('utf-8')
                self.wfile.write(success_response)

            except Exception as e:
                error_message = str(e)
                if 'not found' in error_message.lower() or 'no such container' in error_message.lower():
                    self.send_response(404)
                    error_type = 'Container not found'
                else:
                    self.send_response(500)
                    error_type = 'Docker operation failed'

                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                error_response = json.dumps({
                    'error': error_type,
                    'message': error_message
                }).encode('utf-8')
                self.wfile.write(error_response)
                return
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                error_response = json.dumps({
                    'error': 'Docker API error',
                    'message': str(e)
                }).encode('utf-8')
                self.wfile.write(error_response)

        except Exception as e:
            # Error interno
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            }).encode('utf-8')
            self.wfile.write(error_response)

    def handle_containers_request(self):
        if not DOCKER_AVAILABLE or docker is None:
            self.send_response(503)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = json.dumps({
                'error': 'Docker not available',
                'message': 'El módulo docker de Python no está instalado. Instala con: pip install docker'
            }).encode('utf-8')
            self.wfile.write(error_response)
            return

        try:
            # Conectar a Docker
            client = docker.from_env()

            # Obtener contenedores
            containers = client.containers.list(all=True)

            # Formatear respuesta
            containers_data = []
            for container in containers:
                # Obtener información del contenedor
                container_info = {
                    'id': container.short_id,
                    'name': container.name,
                    'image': container.image.tags[0] if container.image.tags else container.image.short_id,
                    'status': container.status,
                    'state': container.attrs['State']['Status'],
                    'ports': container.attrs['NetworkSettings']['Ports']
                }

                # Intentar determinar el servicio basado en la imagen
                image_name = container_info['image'].lower()
                service_name = 'unknown'
                service_icon = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg'

                if 'nginx' in image_name:
                    service_name = 'Nginx'
                    service_icon = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nginx/nginx-original.svg'
                elif 'apache' in image_name or 'httpd' in image_name:
                    service_name = 'Apache'
                    service_icon = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apache/apache-original.svg'
                elif 'postgres' in image_name:
                    service_name = 'PostgreSQL'
                    service_icon = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg'
                elif 'redis' in image_name:
                    service_name = 'Redis'
                    service_icon = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg'
                elif 'centos' in image_name:
                    service_name = 'CentOS'
                    service_icon = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/centos/centos-original.svg'
                elif 'debian' in image_name:
                    service_name = 'Debian'
                    service_icon = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/debian/debian-original.svg'
                elif 'ubuntu' in image_name:
                    service_name = 'Ubuntu'
                    service_icon = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ubuntu/ubuntu-plain.svg'
                elif 'python' in image_name:
                    service_name = 'Python'
                    service_icon = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg'
                elif 'kibana' in image_name:
                    service_name = 'Kibana'
                    service_icon = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kibana/kibana-original.svg'
                elif 'busybox' in image_name:
                    service_name = 'BusyBox'
                    service_icon = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg'

                container_info['service'] = service_name
                container_info['icon'] = service_icon

                containers_data.append(container_info)

            # Enviar respuesta
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(containers_data).encode('utf-8'))

        except Exception as e:
            # Error al obtener contenedores
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = json.dumps({
                'error': 'Failed to get containers',
                'message': str(e)
            }).encode('utf-8')
            self.wfile.write(error_response)

def run_server(port=8000):
    try:
        with socketserver.TCPServer(("", port), CORSProxyHandler) as httpd:
            print(f"🚀 Servidor Docker Manager iniciado en http://localhost:{port}")
            print(f"📁 Sirviendo archivos desde: {httpd.server_address}")
            print("🔧 Proxy CORS habilitado en /api/proxy")
            print("⏹️  Presiona Ctrl+C para detener")
            print()
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Servidor detenido")
    except OSError as e:
        if e.errno == 10048:  # Puerto en uso
            print(f"❌ Puerto {port} en uso. Intentando puerto {port + 1}...")
            run_server(port + 1)
        else:
            print(f"❌ Error al iniciar servidor: {e}")

if __name__ == "__main__":
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("❌ Puerto inválido. Usando puerto 8000")
    
    run_server(port)
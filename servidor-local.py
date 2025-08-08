#!/usr/bin/env python3
"""
Servidor local simple para probar la página de rutas no pavimentadas
Uso: python servidor-local.py
Luego visita: http://localhost:8000/rutas-no-pavimentadas.html
"""

import http.server
import socketserver
import os
import sys
from urllib.parse import urlparse

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        # Silenciar logs innecesarios pero mantener errores importantes
        if "404" in str(args) or "500" in str(args):
            super().log_message(format, *args)
    
    def handle_one_request(self):
        """Manejar una petición con captura de errores"""
        try:
            super().handle_one_request()
        except ConnectionResetError:
            # El cliente cerró la conexión, es normal en desarrollo
            pass
        except BrokenPipeError:
            # El cliente no está escuchando, es normal
            pass
        except Exception as e:
            print(f"⚠️  Error manejando petición: {e}")
    
    def end_headers(self):
        # Agregar headers CORS para desarrollo local
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def guess_type(self, path):
        # Asegurar tipos MIME correctos
        result = super().guess_type(path)
        if result is None:
            mimetype, encoding = None, None
        elif isinstance(result, tuple) and len(result) == 2:
            mimetype, encoding = result
        else:
            mimetype = result
            encoding = None
            
        if path.endswith('.geojson'):
            return 'application/geo+json'
        if path.endswith('.json'):
            return 'application/json'
        return mimetype

def main():
    # Intentar puertos alternativos si 8000 está ocupado
    PORTS = [8000, 8001, 8080, 3000, 5000]
    
    # Cambiar al directorio del script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Verificar que existe el archivo principal
    if not os.path.exists('rutas-no-pavimentadas.html'):
        print("❌ Error: No se encuentra el archivo rutas-no-pavimentadas.html")
        print("   Asegúrate de estar en el directorio correcto")
        return
    
    for PORT in PORTS:
        try:
            # Usar ThreadingTCPServer para mejor manejo de conexiones múltiples
            with socketserver.ThreadingTCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
                # Permitir reusar la dirección inmediatamente
                httpd.allow_reuse_address = True
                
                print(f"🌐 Servidor iniciado en puerto {PORT}")
                print(f"📍 Visita: http://localhost:{PORT}/rutas-no-pavimentadas.html")
                print(f"📂 Sirviendo archivos desde: {os.getcwd()}")
                print("🛑 Presiona Ctrl+C para detener el servidor")
                print("-" * 40)
                
                httpd.serve_forever()
                break  # Si llegamos aquí, el servidor funcionó
                
        except OSError as e:
            if e.errno == 10048 or "Address already in use" in str(e):  # Puerto en uso
                print(f"⚠️  Puerto {PORT} ocupado, intentando siguiente...")
                continue
            else:
                print(f"❌ Error del sistema en puerto {PORT}: {e}")
                continue
        except KeyboardInterrupt:
            print("\n👋 Servidor detenido correctamente")
            break
        except Exception as e:
            print(f"❌ Error inesperado en puerto {PORT}: {e}")
            continue
    else:
        print("❌ No se pudo iniciar el servidor en ningún puerto disponible")
        sys.exit(1)

if __name__ == "__main__":
    main()

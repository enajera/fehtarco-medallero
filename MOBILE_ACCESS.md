# Acceso Móvil - Medallero

## Configuración para acceder desde el móvil

La aplicación ahora está configurada para ser accesible desde cualquier dispositivo en la red local.

### Requisitos previos:

1. **Obtén tu IP local:**
   - Abre una terminal/PowerShell en tu PC
   - Ejecuta: `ipconfig`
   - Busca "IPv4 Address" bajo tu conexión WiFi (ej: 192.168.0.3)

### Para acceder desde el móvil:

1. **Asegúrate de que el servidor está corriendo:**
   ```bash
   npm run dev:all
   ```

2. **En tu móvil, conectado a la MISMA WiFi:**
   - Abre el navegador
   - Ingresa: `http://192.168.0.3:5173` (reemplaza con tu IP)

### Configuraciones realizadas:

✅ **Frontend (Vite):**
- `vite.config.ts`: Configurado con `host: '0.0.0.0'` para escuchar en todas las interfaces
- Proxy automático: `/api` → `http://192.168.0.3:3000`
- `.env`: `VITE_API_URL=/api` (usa URL relativa para el proxy)

✅ **Backend (Express):**
- `.env`: `CORS_ORIGIN="http://localhost:5173,http://192.168.0.3:5173"`
- Permite solicitudes desde localhost Y desde la IP local
- `PORT=3000` (escucha en todas las interfaces)

### Solución de problemas:

#### "No puedo acceder a la app desde el móvil"
- ✅ Verifica que estés en la MISMA WiFi
- ✅ Confirma tu IP con `ipconfig` en el PC
- ✅ Asegúrate de que ambos servicios están corriendo
- ✅ Intenta desactivar el firewall temporalmente para probar

#### "La app carga pero no puedo ver los datos"
- ✅ Abre la consola del navegador (F12)
- ✅ Verifica si hay errores de CORS
- ✅ El backend debe estar corriendo en `http://192.168.0.3:3000`
- ✅ Revisa el `.env` del backend: `CORS_ORIGIN` debe incluir tu IP

#### "Error de conexión a la API"
- ✅ Verifica que `npm run dev:all` está corriendo ambos servicios
- ✅ En el móvil, ve a `http://192.168.0.3:3000/health` (si existe)
- ✅ Puede ser problema del firewall bloqueando los puertos

### Firewall de Windows:

Si tienes problemas de conexión, agrega excepciones:

1. Abre **Windows Defender Firewall**
2. Click en **Allow an app through firewall**
3. Click **Change settings**
4. Click **Allow another app...**
5. Busca y agrega **Node.js**
6. Asegúrate de que está permitido en **Private** y **Public**

### Puertos necesarios:

- **5173**: Frontend (Vite)
- **3000**: Backend (Express API)

Ambos deben estar accesibles desde tu móvil.

### URL de acceso:

- **Desde PC:** `http://localhost:5173`
- **Desde móvil:** `http://192.168.0.3:5173`

Reemplaza `192.168.0.3` con tu IP real.

¡Disfruta usando la app en el móvil! 📱

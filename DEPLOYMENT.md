# Guía de Despliegue - Waveline Music Player

Esta guía te ayudará a desplegar tu aplicación en GitHub Pages (frontend) y un servicio de backend.

## 📋 Requisitos Previos

- Cuenta de GitHub
- Repositorio Git inicializado
- Node.js 20+ instalado localmente

## 🚀 Opción 1: GitHub Pages (Frontend) + Backend Separado

### Paso 1: Preparar el Repositorio

1. **Inicializa Git si no lo has hecho:**
   ```bash
   cd TallerReproductorDeMusica
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Crea un repositorio en GitHub:**
   - Ve a https://github.com/new
   - Crea un repositorio (por ejemplo: `music-player`)
   - NO inicialices con README, .gitignore o licencia

3. **Conecta tu repositorio local:**
   ```bash
   git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
   git branch -M main
   git push -u origin main
   ```

### Paso 2: Configurar GitHub Pages

1. **Ve a tu repositorio en GitHub**
2. **Settings → Pages**
3. **Source:** Selecciona "GitHub Actions"
4. El workflow `.github/workflows/deploy.yml` ya está configurado

### Paso 3: Desplegar el Backend

**IMPORTANTE:** GitHub Pages solo sirve archivos estáticos. Necesitas desplegar el backend por separado.

#### Opción A: Render (Recomendado - Gratis)

1. Ve a https://render.com y crea una cuenta
2. Click en "New +" → "Web Service"
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Name:** `music-player-backend`
   - **Root Directory:** (déjalo VACÍO)
   - **Build Command:** `npm install && npm run build:backend`
   - **Start Command:** `npm start`
   - **Environment Variables:**
     ```
     JWT_SECRET=tu-secreto-super-seguro-minimo-32-caracteres
     NODE_ENV=production
     PORT=4000
     ```
5. Click "Create Web Service"
6. Copia la URL que te da Render (ej: `https://music-player-backend.onrender.com`)

#### Opción B: Railway

1. Ve a https://railway.app
2. "New Project" → "Deploy from GitHub repo"
3. Selecciona tu repositorio
4. Configura las variables de entorno (igual que Render)
5. Copia la URL generada

#### Opción C: Heroku

1. Instala Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
2. Ejecuta:
   ```bash
   heroku create tu-app-backend
   heroku config:set JWT_SECRET=tu-secreto-super-seguro
   heroku config:set NODE_ENV=production
   git push heroku main
   ```

### Paso 4: Actualizar la URL del Backend

1. **Edita `.github/workflows/deploy.yml`:**
   ```yaml
   - name: Build frontend
     run: npm run build:frontend
     env:
       VITE_API_URL: https://TU-BACKEND-URL.onrender.com  # ← Cambia esto
   ```

2. **Commit y push:**
   ```bash
   git add .github/workflows/deploy.yml
   git commit -m "Update backend URL"
   git push
   ```

### Paso 5: Verificar el Despliegue

1. Ve a tu repositorio en GitHub
2. Click en "Actions" para ver el progreso del despliegue
3. Una vez completado, tu app estará en:
   ```
   https://TU-USUARIO.github.io/TU-REPO/
   ```

## 🔧 Desarrollo Local

### Backend
```bash
cd TallerReproductorDeMusica
npm run dev:backend
```
El backend estará en: http://localhost:4000

### Frontend
```bash
cd TallerReproductorDeMusica
npm run dev:frontend
```
El frontend estará en: http://localhost:3000

## 🐛 Solución de Problemas

### Error: "Failed to fetch" en el frontend

**Causa:** El frontend no puede conectarse al backend.

**Solución:**
1. Verifica que la URL del backend en el workflow sea correcta
2. Asegúrate de que el backend esté desplegado y funcionando
3. Verifica que el backend tenga CORS configurado correctamente

### Error: "JWT_SECRET is required"

**Causa:** Falta la variable de entorno JWT_SECRET en el backend.

**Solución:**
1. Ve a la configuración de tu servicio de backend (Render/Railway/Heroku)
2. Agrega la variable de entorno JWT_SECRET con un valor seguro (mínimo 32 caracteres)

### Error: "Root directory does not exist" en Render

**Causa:** El Root Directory está mal configurado.

**Solución:**
1. Ve a Settings en tu servicio de Render
2. Deja el campo "Root Directory" COMPLETAMENTE VACÍO
3. Guarda y haz un Manual Deploy

### El despliegue de GitHub Actions falla

**Causa:** Puede haber errores en el build.

**Solución:**
1. Ve a "Actions" en tu repositorio
2. Click en el workflow fallido para ver los logs
3. Revisa los errores y corrígelos
4. Haz commit y push de nuevo

### Error 404 en GitHub Pages

**Causa:** GitHub Pages no está configurado correctamente.

**Solución:**
1. Ve a Settings → Pages
2. Asegúrate de que "Source" esté en "GitHub Actions"
3. Espera unos minutos después del despliegue

## 📝 Notas Importantes

1. **Seguridad:**
   - NUNCA hagas commit de archivos `.env` con secretos reales
   - Usa variables de entorno en los servicios de despliegue
   - Genera un JWT_SECRET seguro para producción

2. **CORS:**
   - El backend debe permitir requests desde tu dominio de GitHub Pages
   - Esto ya está configurado en el código

3. **Base de Datos:**
   - Actualmente usa almacenamiento en archivos JSON
   - Para producción, considera migrar a una base de datos real

4. **Costos:**
   - GitHub Pages: Gratis
   - Render (tier gratuito): Gratis pero se duerme después de 15 min de inactividad
   - Railway: $5/mes de crédito gratis
   - Heroku: Ya no tiene tier gratuito

## 🎯 Próximos Pasos

Una vez desplegado, puedes:
1. Completar las tareas restantes del spec (UI de playlists, reproductor, etc.)
2. Agregar más funcionalidades
3. Mejorar el diseño
4. Migrar a una base de datos real

## 📚 Recursos Adicionales

- [Documentación de GitHub Pages](https://docs.github.com/en/pages)
- [Documentación de Render](https://render.com/docs)
- [Documentación de Railway](https://docs.railway.app/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

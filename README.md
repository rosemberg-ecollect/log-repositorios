# Report Git

Aplicación para consultar merges recientes de repositorios privados de GitHub, con autenticación por cuenta del usuario y acceso seguro para equipos internos.

## ¿Qué hace la app?

- Muestra merge commits de repositorios seleccionados.
- Permite elegir una rama y un rango de fechas.
- Carga tags asociados a cada commit.
- Filtra por mensaje, autor o tag.
- Paginación y exportación a CSV.
- Requiere login con GitHub para consultar repositorios privados.

## Arquitectura actual

La aplicación ya no usa un PAT fijo en el navegador. La estructura actual es:

- Frontend: React + Vite
- Backend: Express
- Autenticación: GitHub OAuth
- El token de acceso del usuario vive solo en el backend y no se expone al navegador.

Esto es lo correcto cuando los repositorios son privados y la app se comparte con varias personas.

## Requisitos

- Node.js 20 o superior
- Una cuenta de GitHub
- Permisos sobre los repositorios privados que se quieren consultar
- La OAuth App autorizada por la organización, si aplica

## Configurar GitHub OAuth

1. Ingresa a GitHub.
2. Ve a Settings → Developer settings → OAuth Apps.
3. Crea una nueva OAuth App.
4. Completa estos valores para desarrollo local:
   - Application name: `Report Git`
   - Homepage URL: `http://localhost:5173`
   - Authorization callback URL: `http://localhost:5173/auth/github/callback`
5. Guarda el `Client ID` y el `Client Secret`.

## Crear el archivo `.env`

En la raíz del proyecto crea un archivo `.env` con este contenido:

```env
PORT=3001
VITE_GITHUB_OWNER=ecollectco
GITHUB_CLIENT_ID=tu_client_id
GITHUB_CLIENT_SECRET=tu_client_secret
GITHUB_REDIRECT_URI=http://localhost:5173/auth/github/callback
SESSION_SECRET=una_clave_larga_y_segura
VITE_PORT=5173
```

### Variables importantes

- `VITE_GITHUB_OWNER`: propietario u organización de los repositorios.
- `GITHUB_CLIENT_ID`: identificador de la OAuth App.
- `GITHUB_CLIENT_SECRET`: secreto de la OAuth App.
- `GITHUB_REDIRECT_URI`: callback del login.
- `SESSION_SECRET`: clave segura para la sesión del backend.

> Para producción, cambia el callback por tu dominio real, por ejemplo `https://mi-dominio.com/auth/github/callback`.

## Instalar y ejecutar

En la raíz del proyecto:

```bash
npm install
```

Inicia el backend:

```bash
npm run dev:server
```

En otra terminal, inicia el frontend:

```bash
npm run dev
```

Abre la app en:

```text
http://localhost:5173
```

## Flujo de uso

1. El usuario hace clic en “Ingresar con GitHub”.
2. GitHub autentica al usuario.
3. El backend recibe el código de autorización.
4. El backend intercambia ese código por un token del usuario.
5. El backend consulta la API de GitHub con ese token.
6. El frontend muestra los merges de los repositorios privados autorizados.

## Requisitos de acceso en GitHub

Para que varios compañeros puedan usar la app con repos privados:

- cada usuario debe tener acceso al repositorio en GitHub,
- la OAuth App debe estar autorizada por la organización,
- el repositorio debe ser visible para la cuenta del usuario autenticado.

## Comandos disponibles

```bash
npm install
npm run dev:server
npm run dev
npm run build
npm run preview
```

## Solución de problemas

### Error de autenticación con GitHub

- Verifica que `GITHUB_CLIENT_ID` y `GITHUB_CLIENT_SECRET` sean correctos.
- Confirma que `GITHUB_REDIRECT_URI` coincide exactamente con la OAuth App.
- Revisa que la app esté autorizada por la organización.

### Error 401 o 403 al consultar GitHub

- Asegúrate de que el usuario autenticado tenga acceso al repositorio privado.
- Revisa que la organización haya autorizado la app.
- Confirma que el repo exista y el nombre sea correcto.

### Error de login no redirige

- Verifica que el backend esté corriendo en el puerto configurado.
- Confirma que el proxy de Vite esté apuntando a `http://localhost:3001`.
- Revisa que la callback esté registrada exactamente igual en GitHub.

### Error de limitación de API

GitHub restringe el número de peticiones por hora. Evita recargas excesivas y consulta solo lo necesario.

## Seguridad

No guardes tokens personales ni secretos en el frontend. El token del usuario debe vivir en el backend, donde la app hace las llamadas a GitHub.

## Visualización

<img width="1314" height="693" alt="image" src="https://github.com/user-attachments/assets/f8289d63-2dcc-4b1a-908f-9f9100648d28" />

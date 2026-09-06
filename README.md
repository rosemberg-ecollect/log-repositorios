# Report Git

Aplicación web para consultar merges de repositorios de GitHub por aplicación, rama y rango de fechas. Los resultados incluyen tags, permiten filtrar por mensaje o ingeniero, paginar y descargar un reporte CSV.

## Requisitos

- Node.js 20 o superior.
- Una cuenta de GitHub con acceso a los repositorios que se desean consultar.
- `pnpm` instalado. También se puede usar `npm`.

## Crear el token de GitHub

La aplicación utiliza un Personal Access Token (PAT) para consultar la API de GitHub.

1. Inicia sesión en [GitHub](https://github.com/).
2. Abre tu foto de perfil y entra en **Settings**.
3. En el menú lateral, selecciona **Developer settings**.
4. Entra en **Personal access tokens** y selecciona **Fine-grained tokens**.
5. Pulsa **Generate new token**.
6. Asigna un nombre, por ejemplo `report-git-local`.
7. Define una fecha de expiración. Se recomienda no usar tokens permanentes.
8. En **Resource owner**, selecciona el propietario de los repositorios.
9. En **Repository access**, selecciona **Only select repositories** y elige los repositorios que consultará la aplicación.
10. En **Repository permissions**, concede como mínimo:
  - **Contents: Read-only**
  - **Metadata: Read-only**
11. Pulsa **Generate token**.
12. Copia el token inmediatamente. GitHub no volverá a mostrarlo.

### Seguridad del token

No compartas el token, no lo pegues en el código fuente y no lo subas a GitHub. El archivo `.env` está incluido en `.gitignore` para evitar que se versionen las credenciales.

Esta aplicación es frontend y las variables con prefijo `VITE_` se incorporan al navegador. Por eso el token puede ser visible para quien inspeccione la aplicación publicada. Usa siempre permisos mínimos y repositorios limitados. Para un entorno productivo, mueve las llamadas a GitHub a un backend o función serverless.

Si un token se expone, revócalo desde **Settings → Developer settings → Personal access tokens** y genera uno nuevo.

## Configurar el entorno

En la raíz del proyecto, crea un archivo llamado `.env`:

```env
VITE_GITHUB_OWNER=ecollectco
VITE_GITHUB_TOKEN=pega_aqui_tu_token
```

`VITE_GITHUB_OWNER` es el propietario u organización de los repositorios. Si los repositorios pertenecen a otra cuenta u organización, cambia `ecollectco` por el valor correspondiente.

No incluyas comillas ni espacios adicionales alrededor del token. Después de modificar `.env`, reinicia el servidor de desarrollo.

## Instalar y ejecutar

Con `pnpm`:

```bash
pnpm install
pnpm dev
```

Con `npm`:

```bash
npm install
npm run dev
```

Abre la URL que indique Vite, normalmente:

```text
http://localhost:5173
```

## Uso

1. Selecciona una aplicación.
2. Espera a que se carguen sus ramas.
3. Selecciona una rama.
4. Opcionalmente, define las fechas inicial y final.
5. Pulsa **Consultar**.
6. Usa el filtro de resultados para buscar por mensaje o ingeniero.
7. Descarga el resultado filtrado con **Descargar CSV**.

## Comandos disponibles

```bash
pnpm dev       # Inicia el servidor de desarrollo
pnpm build     # Verifica tipos y genera la compilación de producción
pnpm lint      # Ejecuta Oxlint
pnpm preview   # Sirve localmente la compilación de producción
```

## Solución de problemas

### Error 401 o 403 de GitHub

- Comprueba que el token no esté vacío o vencido.
- Revisa que el token tenga acceso a los repositorios seleccionados.
- Confirma que `VITE_GITHUB_OWNER` sea correcto.
- Reinicia Vite después de cambiar `.env`.

### Error `repository not found`

Verifica que el repositorio exista, que su nombre esté listado en la aplicación y que el token tenga acceso a él.

### Error de límite de solicitudes

GitHub aplica límites a su API. Usa un token válido, evita recargar repetidamente la aplicación y consulta únicamente los repositorios necesarios.

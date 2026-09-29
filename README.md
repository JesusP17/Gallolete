# 🏋️‍♂️ GalloLeTe - Sistema de Gestión de Gimnasio

¡Bienvenido a **GalloLeTe**! Este es un proyecto académico y profesional de gestión integral para gimnasios desarrollado con **Node.js, Express.js, API REST, MySQL, HTML, CSS y JavaScript Vanilla**.

---

## 🚀 Requisitos Previos

Antes de ejecutar la aplicación, asegúrate de tener instalado en tu computadora:

1. **Node.js** (Versión 18 o superior)  
   - Descárgalo gratis desde: [nodejs.org](https://nodejs.org/)
2. **Servidor MySQL** (MySQL Server, XAMPP, WAMP o MySQL Workbench)  
   - Si usas XAMPP, solo necesitas activar el módulo de **MySQL**.
3. **Visual Studio Code** (Opcional pero recomendado)  
   - Descárgalo desde: [code.visualstudio.com](https://code.visualstudio.com/)

---

## 🗄️ Configuración de la Base de Datos (MySQL)

1. Abre tu gestor de base de datos MySQL (MySQL Workbench, phpMyAdmin o consola MySQL).
2. Ejecuta en primer lugar el script de creación de estructura ubicado en:
   `database/schema.sql`
   *(Esto creará la base de datos `gallolete_db` y las 8 tablas requeridas con sus llaves foráneas)*.
3. Ejecuta el script de datos iniciales de prueba ubicado en:
   `database/seed.sql`
   *(Esto insertará datos de prueba para clientes, membresías, entrenadores, ejercicios, rutinas y usuarios)*.

---

## ⚙️ Configuración del Proyecto en Node.js

1. Abre la carpeta del proyecto `GalloLeTe` en tu terminal o dentro de **Visual Studio Code**.
2. Copia o revisa el archivo de variables de entorno `.env` en la raíz del proyecto:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=gallolete_db
   DB_PORT=3306
   JWT_SECRET=gallolete_secreto_super_seguro_2026
   ```
   *(Ajusta `DB_USER` y `DB_PASSWORD` según tus credenciales de MySQL si es necesario)*.

3. Instala las dependencias necesarias ejecutando en la terminal:
   ```bash
   npm install
   ```

---

## ▶️ Cómo Ejecutar el Proyecto

### Opción A: Desde la Terminal (CMD, PowerShell o VS Code Terminal)
Ejecuta el siguiente comando en la raíz del proyecto:
```bash
npm start
```

### Opción B: Desde Visual Studio Code (Con la tecla F5)
1. Abre el proyecto en Visual Studio Code (`Archivo -> Abrir carpeta... -> GalloLeTe`).
2. Presiona la tecla **F5** (o ve al menú de la izquierda **Ejecutar y depurar -> Iniciar depuración**).
3. ¡El servidor se iniciará automáticamente!

---

## 🌐 Acceso a la Aplicación Web

Una vez iniciado el servidor, abre tu navegador web de preferencia e ingresa a:

👉 **`http://localhost:3000`**

### 🔑 Usuarios de Prueba para Iniciar Sesión

| Rol | Usuario / Correo | Contraseña |
| --- | --- | --- |
| **Administrador** | `admin@gallolete.com` | `admin2026` |
| **Entrenador** | `carlos@gallolete.com` | `entrenador2026` |
| **Recepcionista** | `maria@gallolete.com` | `recepcion2026` |

El personal entra eligiendo su rol en la pantalla de inicio de sesión (ahí ve su contraseña). Los clientes crean su cuenta con su correo de Gmail; el registro no está disponible para el personal.

---

## 🧪 Pruebas con Postman

En la raíz del proyecto encontrarás el archivo:
`GalloLeTe.postman_collection.json`

1. Abre **Postman**.
2. Haz clic en **Import** (Importar) y selecciona el archivo `GalloLeTe.postman_collection.json`.
3. Podrás probar cada uno de los endpoints de la API REST (`/api/auth`, `/api/clientes`, `/api/membresias`, etc.).

---

## 📁 Estructura del Proyecto

- `/config` - Configuración del pool de conexión a MySQL.
- `/controllers` - Controladores con la lógica de negocio HTTP.
- `/database` - Scripts SQL (`schema.sql` y `seed.sql`).
- `/middlewares` - Verificación de Tokens JWT, roles y captura de errores.
- `/models` - Consultas SQL estructuradas por entidad.
- `/public` - Frontend Web (HTML, CSS y JS modular).
- `/routes` - Mapeo de rutas y verbos HTTP para la API REST.
- `.vscode` - Configuración para ejecutar con la tecla F5 en Visual Studio Code.

# POS Cafe Backend API

Backend REST API untuk sistem POS (Point of Sale) Cafe yang dibangun dengan **Hono**, **Drizzle ORM**, dan **PostgreSQL**.

## 📋 Daftar Isi

- [Prasyarat](#prasyarat)
- [Setup Database](#setup-database)
- [Instalasi & Konfigurasi](#instalasi--konfigurasi)
- [Menjalankan Server](#menjalankan-server)
- [Struktur Proyek](#struktur-proyek)
- [Autentikasi & Otorisasi](#autentikasi--otorisasi)
- [API Documentation](#api-documentation)
- [Testing dengan Postman](#testing-dengan-postman)
- [Database Schema](#database-schema)

---

## Prasyarat

Pastikan Anda telah menginstal:

- **Node.ts** >= 18.0.0 ([Download](https://nodejs.org/))
- **PostgreSQL** >= 12.0 ([Download](https://www.postgresql.org/download/))
- **Git** (opsional, untuk version control)
- **Postman** (untuk API testing)

### Verifikasi Instalasi

```bash
# Check Node.ts
node --version

# Check npm
npm --version

# Check PostgreSQL
psql --version
```

---

## Setup Database

### 1. Buat Database PostgreSQL

> **⚠️ CATATAN**: Sesuaikan username dan password dengan konfigurasi PostgreSQL di device Anda. Contoh di bawah menggunakan `developer` dan `developer123`, tetapi Anda bisa menggunakan credentials yang berbeda.

Buka PostgreSQL terminal atau gunakan pgAdmin:

```sql
-- Login ke PostgreSQL (ganti 'postgres' dengan user yang Anda punya)
psql -U postgres

-- Buat database baru
CREATE DATABASE cafe_pos;

-- Buat user baru (OPSIONAL - Anda bisa gunakan user existing)
-- Ganti 'developer' dan 'developer123' dengan credentials Anda sendiri
CREATE USER developer WITH PASSWORD 'developer123';

-- Berikan permissions ke user
ALTER ROLE developer WITH LOGIN;
GRANT ALL PRIVILEGES ON DATABASE cafe_pos TO developer;
ALTER DATABASE cafe_pos OWNER TO developer;

-- Keluar
\q
```

**Alternatif**: Jika Anda ingin menggunakan user PostgreSQL yang sudah ada (misalnya `postgres`), gunakan:

```sql
-- Langsung gunakan user existing
CREATE DATABASE cafe_pos OWNER postgres;
```

Atau gunakan command line:

```bash
# Buat database
createdb -U postgres cafe_pos

# Buat user baru (OPSIONAL)
createuser -U postgres developer
psql -U postgres -c "ALTER ROLE developer WITH PASSWORD 'developer123';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE cafe_pos TO developer;"

# ATAU gunakan user existing (postgres)
psql -U postgres -c "ALTER DATABASE cafe_pos OWNER TO postgres;"
```

### 2. Verifikasi Koneksi Database

Sesuaikan `username` dengan yang Anda gunakan (contoh: `developer` atau `postgres`):

```bash
# Jika menggunakan user 'developer'
psql -U developer -d cafe_pos -h localhost

# Atau jika menggunakan user 'postgres'
psql -U postgres -d cafe_pos -h localhost
```

Jika berhasil, Anda akan melihat prompt `cafe_pos=#`. Ketik `\q` untuk keluar.

---

## Instalasi & Konfigurasi

### 1. Clone Repository

```bash
cd /home/dimas/Project/Freelance/fastwork/pos-cafe/pengerjaan-backend/server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Edit `.env` dengan konfigurasi Anda. Sesuaikan database credentials dengan yang Anda gunakan di langkah sebelumnya:

```dotenv
# Database Configuration
# Ganti 'developer' dan 'developer123' dengan credentials PostgreSQL Anda
# Format: postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL=postgresql://developer:developer123@localhost:5432/cafe_pos

# Server Configuration
NODE_ENV=development
PORT=3000

# JWT Configuration
# ⚠️ PENTING: Ganti dengan secret key yang kuat dan unik untuk production!
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Bcrypt Configuration
BCRYPT_SALT_ROUNDS=10

# Seed Configuration (Optional)
# Ganti password sesuai keinginan Anda
SEED_ADMIN_PASSWORD=admin123
```

#### Contoh Konfigurasi untuk Berbagai Skenario

**Skenario 1: Menggunakan user `developer` (seperti contoh)**

```dotenv
DATABASE_URL=postgresql://developer:developer123@localhost:5432/cafe_pos
```

**Skenario 2: Menggunakan user `postgres` (default)**

```dotenv
DATABASE_URL=postgresql://postgres:your_postgres_password@localhost:5432/cafe_pos
```

**Skenario 3: Remote database**

```dotenv
DATABASE_URL=postgresql://username:password@remote-host.com:5432/cafe_pos
```

**Skenario 4: Windows dengan PostgreSQL default**

```dotenv
DATABASE_URL=postgresql://postgres@localhost/cafe_pos
```

> **💡 TIP**: Untuk mendapatkan connection string yang tepat, gunakan format:
> ```
> postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
> ```

> **⚠️ PENTING**: Untuk production, gunakan secret key yang kuat dan unik!
> - Minimal 32 karakter
> - Gunakan kombinasi huruf, angka, dan simbol khusus

### 4. Apply Database Migrations

Sebelum menjalankan migrations, pastikan `.env` sudah dikonfigurasi dengan benar.

```bash
# Push schema ke database (Drizzle ORM)
npm run db:push

# Generate migration files (jika ada perubahan schema)
npm run db:generate

# Run migration SQL file (untuk functions, triggers, views)
npm run db:migrate
```

Jika mendapat error koneksi, pastikan:
1. PostgreSQL running
2. Database `cafe_pos` sudah dibuat
3. Username dan password di `.env` sudah benar
4. User memiliki permission pada database

### 5. Seed Database (Initial Data)

```bash
npm run db:seed
```

Ini akan membuat:

- **4 Roles**: owner, admin, cashier, kitchen
- **4 Categories**: Beverage, Food, Dessert, Topping
- **1 Outlet**: Cafe Main
- **8 Menu Items**: 4 beverages + 4 toppings
- **10 Tables**: Table 1-10
- **1 Admin User**: 
  - Username: `admin`
  - Password: `admin123` (atau sesuai `SEED_ADMIN_PASSWORD` di `.env`)
- **2 Tax Rates**: PPN (10%) dan Service Charge (5%)

---

## Menjalankan Server

### Development Mode (dengan auto-reload)

```bash
npm run dev
```

Output yang diharapkan:

```
> cafe-pos-backend@1.0.0 dev
> node --watch src/index.ts

Server running at http://localhost:3000
```

### Production Mode

```bash
npm start
```

### Database Management

```bash
# Buka Drizzle Studio (UI untuk melihat data)
npm run db:studio

# Generate new migration (jika ada perubahan schema)
npm run db:generate

# Apply migrations
npm run db:push

# Reseed database
npm run db:seed
```

---

## Struktur Proyek

```
server/
├── src/
│   ├── index.ts                 # Entry point & route configuration
│   ├── controllers/             # Business logic handlers
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── role.controller.ts
│   │   ├── outlet.controller.ts
│   │   └── employee.controller.ts
│   ├── services/                # Service layer
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── role.service.ts
│   │   ├── outlet.service.ts
│   │   └── employee.service.ts
│   ├── repositories/            # Data access layer
│   │   ├── user.repository.ts
│   │   ├── role.repository.ts
│   │   ├── outlet.repository.ts
│   │   ├── employee.repository.ts
│   │   └── refresh-token.repository.ts
│   ├── routes/                  # API routes
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── roles.ts
│   │   ├── outlets.ts
│   │   └── employees.ts
│   ├── middleware/              # Custom middleware
│   │   └── auth.middleware.ts
│   ├── utils/                   # Utility functions
│   │   └── jwt.ts
│   └── db/
│       ├── index.ts             # Database connection
│       ├── schemas/             # Drizzle ORM schemas
│       ├── migrations.sql       # SQL migrations
│       └── seed.ts              # Database seeder
├── .env                         # Environment variables
├── .env.example                 # Example env file
├── package.tson
├── drizzle.config.ts
└── README.md
```

### Architecture Pattern

Proyek ini menggunakan **Repository → Service → Controller → Routes** pattern:

1. **Routes**: Mendefinisikan endpoint HTTP
2. **Controllers**: Handle HTTP requests & responses
3. **Services**: Business logic & data orchestration
4. **Repositories**: Database queries (Data Access Layer)
5. **Middleware**: Authentication & authorization checks

---

## Autentikasi & Otorisasi

### JWT Token Structure

Access token berisi:

```json
{
  "id": 1,
  "email": "admin@local.test",
  "name": "Administrator",
  "roleId": 2,
  "role": "admin",
  "iat": 1706169600,
  "exp": 1706170500
}
```

### Authorization Rules

| Resource | GET (list) | GET (detail) | POST | PUT | DELETE |
|----------|-----------|--------------|------|-----|--------|
| `/api/users` | Public | Public | admin, owner | admin, owner | admin, owner |
| `/api/roles` | Public | Public | owner | owner | owner |
| `/api/outlets` | Public | Public | admin, owner | admin, owner | admin, owner |
| `/api/employees` | Public | Public | admin, owner | admin, owner | admin, owner |
| `/api/auth/me` | - | ✓ (Login required) | - | - | - |
| `/api/auth/logout` | - | - | ✓ (Login required) | - | - |

### Passing Token di Request

Semua protected endpoints memerlukan header:

```
Authorization: Bearer <access_token>
```

Contoh dengan cURL:

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## API Documentation

### Authentication Endpoints

#### 1. Login

```
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

> **📝 CATATAN**: Default credentials:
> - Username: `admin`
> - Password: `admin123` (atau sesuai `SEED_ADMIN_PASSWORD` di `.env`)
>
> Credentials ini hanya tersedia setelah menjalankan `npm run db:seed`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "name": "Administrator",
    "email": "admin@local.test",
    "roleId": 2,
    "role": "admin",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2. Register

```
POST /api/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "name": "New User",
  "roleId": 3
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "New User",
    "email": "newuser@example.com",
    "roleId": 3,
    "role": "cashier",
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

#### 3. Get Current User

```
GET /api/auth/me
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "roleId": 2,
    "username": "admin",
    "name": "Administrator",
    "email": "admin@local.test",
    "photo": null,
    "status": "active",
    "createdAt": "2024-01-25T10:30:00Z",
    "updatedAt": "2024-01-25T10:30:00Z"
  }
}
```

#### 4. Refresh Token

```
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 5. Logout

```
POST /api/auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Users Endpoints

#### 1. List All Users (No Pagination)

```
GET /api/users
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "roleId": 2,
      "username": "admin",
      "name": "Administrator",
      "email": "admin@local.test",
      "photo": null,
      "status": "active",
      "createdAt": "2024-01-25T10:30:00Z",
      "updatedAt": "2024-01-25T10:30:00Z"
    }
  ]
}
```

#### 2. List Users with Pagination

```
GET /api/users/list?page=1&limit=10&search=admin&sortBy=name&sortOrder=asc
```

**Query Parameters:**

- `page` (int): Nomor halaman (default: 1)
- `limit` (int): Jumlah data per halaman (default: 20)
- `search` (string): Cari by name atau email
- `sortBy` (string): Kolom untuk sorting
- `sortOrder` (string): `asc` atau `desc`

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "roleId": 2,
      "username": "admin",
      "name": "Administrator",
      "email": "admin@local.test",
      "photo": null,
      "status": "active",
      "createdAt": "2024-01-25T10:30:00Z",
      "updatedAt": "2024-01-25T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10
  }
}
```

#### 3. Get User by ID

```
GET /api/users/:id
```

**Response (200 OK):**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "roleId": 2,
    "username": "admin",
    "name": "Administrator",
    "email": "admin@local.test",
    "photo": null,
    "status": "active",
    "createdAt": "2024-01-25T10:30:00Z",
    "updatedAt": "2024-01-25T10:30:00Z"
  }
}
```

#### 4. Create User (Admin/Owner only)

```
POST /api/users
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "username": "cashier1",
  "name": "Cashier One",
  "email": "cashier1@example.com",
  "password": "password123",
  "roleId": 3,
  "status": "active"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "user": {
    "id": 3,
    "roleId": 3,
    "username": "cashier1",
    "name": "Cashier One",
    "email": "cashier1@example.com",
    "photo": null,
    "status": "active",
    "createdAt": "2024-01-25T11:00:00Z",
    "updatedAt": "2024-01-25T11:00:00Z"
  }
}
```

#### 5. Update User (Admin/Owner only)

```
PUT /api/users/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Cashier One Updated",
  "email": "cashier1_new@example.com",
  "status": "inactive"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "user": {
    "id": 3,
    "roleId": 3,
    "username": "cashier1",
    "name": "Cashier One Updated",
    "email": "cashier1_new@example.com",
    "photo": null,
    "status": "inactive",
    "createdAt": "2024-01-25T11:00:00Z",
    "updatedAt": "2024-01-25T11:15:00Z"
  }
}
```

#### 6. Delete User (Admin/Owner only)

```
DELETE /api/users/:id
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "success": true
}
```

---

### Roles Endpoints

#### 1. List All Roles

```
GET /api/roles
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "owner",
      "description": "System owner with full access",
      "createdAt": "2024-01-25T10:00:00Z",
      "updatedAt": "2024-01-25T10:00:00Z"
    },
    {
      "id": 2,
      "name": "admin",
      "description": "Administrator",
      "createdAt": "2024-01-25T10:00:00Z",
      "updatedAt": "2024-01-25T10:00:00Z"
    },
    {
      "id": 3,
      "name": "cashier",
      "description": "Cashier staff",
      "createdAt": "2024-01-25T10:00:00Z",
      "updatedAt": "2024-01-25T10:00:00Z"
    }
  ]
}
```

#### 2. List Roles with Pagination

```
GET /api/roles/list?page=1&limit=5
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 5
  }
}
```

#### 3. Get Role by ID

```
GET /api/roles/:id
```

**Response (200 OK):**

```json
{
  "success": true,
  "role": {
    "id": 2,
    "name": "admin",
    "description": "Administrator",
    "createdAt": "2024-01-25T10:00:00Z",
    "updatedAt": "2024-01-25T10:00:00Z"
  }
}
```

#### 4. Create Role (Owner only)

```
POST /api/roles
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "manager",
  "description": "Manager role"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "role": {
    "id": 5,
    "name": "manager",
    "description": "Manager role",
    "createdAt": "2024-01-25T11:30:00Z",
    "updatedAt": "2024-01-25T11:30:00Z"
  }
}
```

#### 5. Update Role (Owner only)

```
PUT /api/roles/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "description": "Updated manager description"
}
```

#### 6. Delete Role (Owner only)

```
DELETE /api/roles/:id
Authorization: Bearer <access_token>
```

---

### Outlets Endpoints

#### 1. List All Outlets

```
GET /api/outlets
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Cafe Main",
      "address": "Jl. Utama No. 123",
      "city": "Jakarta",
      "province": "DKI Jakarta",
      "phoneNumber": "021-123456",
      "createdBy": 1,
      "createdAt": "2024-01-25T10:30:00Z",
      "updatedAt": "2024-01-25T10:30:00Z"
    }
  ]
}
```

#### 2. List Outlets with Pagination

```
GET /api/outlets/list?page=1&limit=10&search=cafe
```

#### 3. Get Outlet by ID

```
GET /api/outlets/:id
```

#### 4. Create Outlet (Admin/Owner only)

```
POST /api/outlets
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Cafe Branch 2",
  "address": "Jl. Cabang No. 456",
  "city": "Bandung",
  "province": "Jawa Barat",
  "phoneNumber": "022-987654"
}
```

**Note**: `createdBy` akan otomatis diisi dari user yang login.

#### 5. Update Outlet (Admin/Owner only)

```
PUT /api/outlets/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Cafe Main Updated",
  "phoneNumber": "021-999999"
}
```

#### 6. Delete Outlet (Admin/Owner only)

```
DELETE /api/outlets/:id
Authorization: Bearer <access_token>
```

---

### Employees Endpoints

#### 1. List All Employees

```
GET /api/employees
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 1,
      "outletId": 1,
      "biographyData": "System administrator",
      "name": "Admin",
      "position": "Admin",
      "email": "admin@local.test",
      "salary": "0",
      "imagePath": null,
      "createdBy": 1,
      "createdAt": "2024-01-25T10:30:00Z",
      "updatedAt": "2024-01-25T10:30:00Z"
    }
  ]
}
```

#### 2. List Employees with Pagination

```
GET /api/employees/list?page=1&limit=10&search=admin&sortBy=position
```

#### 3. Get Employee by ID

```
GET /api/employees/:id
```

#### 4. Create Employee (Admin/Owner only)

```
POST /api/employees
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "userId": 3,
  "outletId": 1,
  "name": "Cashier One",
  "position": "Cashier",
  "email": "cashier1@example.com",
  "salary": "3000000",
  "biographyData": "Experienced cashier"
}
```

**Note**: `createdBy` akan otomatis diisi dari user yang login.

#### 5. Update Employee (Admin/Owner only)

```
PUT /api/employees/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "position": "Senior Cashier",
  "salary": "3500000",
  "imagePath": "/images/cashier1.jpg"
}
```

#### 6. Delete Employee (Admin/Owner only)

```
DELETE /api/employees/:id
Authorization: Bearer <access_token>
```

---

## Testing dengan Postman

### 1. Setup Postman Collection

#### Import Environment Variables

1. Buka Postman
2. Click **Environment** (gear icon di top-right)
3. Click **Create New** environment
4. Tambahkan variables:

```json
{
  "base_url": "http://localhost:3000/api",
  "access_token": "",
  "refresh_token": "",
  "user_id": 1,
  "outlet_id": 1,
  "employee_id": 1
}
```

5. **Save** environment ini

### 2. Test Authentication Flow

#### Request 1: Login

```
POST {{base_url}}/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

> **💡 TIPS**: 
> - Ganti `admin` dengan username yang Anda buat
> - Ganti `admin123` dengan password yang sesuai
> - Default: username `admin`, password sesuai `SEED_ADMIN_PASSWORD` di `.env`

**Post-request Script** (untuk auto-save token):

```javascript
if (pm.response.code === 200) {
  const data = pm.response.tson();
  pm.environment.set("access_token", data.data.accessToken);
  pm.environment.set("refresh_token", data.data.refreshToken);
  pm.environment.set("user_id", data.data.id);
  console.log("✅ Login successful, tokens saved");
}
```

#### Request 2: Get Current User

```
GET {{base_url}}/auth/me
Authorization: Bearer {{access_token}}
```

#### Request 3: Refresh Token

```
POST {{base_url}}/auth/refresh
Content-Type: application/json

{
  "refreshToken": "{{refresh_token}}"
}
```

**Post-request Script**:

```javascript
if (pm.response.code === 200) {
  const data = pm.response.tson();
  pm.environment.set("access_token", data.data.accessToken);
  console.log("✅ Token refreshed");
}
```

#### Request 4: Logout

```
POST {{base_url}}/auth/logout
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "refreshToken": "{{refresh_token}}"
}
```

---

### 3. Test User Management

#### GET List Users

```
GET {{base_url}}/users
```

#### GET Paginated Users

```
GET {{base_url}}/users/list?page=1&limit=10&search=admin
```

#### GET Single User

```
GET {{base_url}}/users/{{user_id}}
```

#### POST Create User (Requires Auth)

```
POST {{base_url}}/users
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "username": "newuser",
  "name": "New User",
  "email": "newuser@example.com",
  "password": "password123",
  "roleId": 3,
  "status": "active"
}
```

#### PUT Update User

```
PUT {{base_url}}/users/{{user_id}}
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "name": "Updated Name",
  "status": "active"
}
```

#### DELETE User

```
DELETE {{base_url}}/users/{{user_id}}
Authorization: Bearer {{access_token}}
```

---

### 4. Test Roles Management

#### GET All Roles

```
GET {{base_url}}/roles
```

#### GET Paginated Roles

```
GET {{base_url}}/roles/list?page=1&limit=5
```

#### CREATE Role (Owner only)

```
POST {{base_url}}/roles
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "name": "supervisor",
  "description": "Supervisor role"
}
```

---

### 5. Test Outlets Management

#### GET All Outlets

```
GET {{base_url}}/outlets
```

#### GET Paginated Outlets

```
GET {{base_url}}/outlets/list?page=1&limit=10&search=cafe
```

#### CREATE Outlet (Admin/Owner only)

```
POST {{base_url}}/outlets
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "name": "Cafe Branch 2",
  "address": "Jl. Cabang No. 456",
  "city": "Bandung",
  "province": "Jawa Barat",
  "phoneNumber": "022-987654"
}
```

---

### 6. Test Employees Management

#### GET All Employees

```
GET {{base_url}}/employees
```

#### CREATE Employee (Admin/Owner only)

```
POST {{base_url}}/employees
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "userId": 3,
  "outletId": {{outlet_id}},
  "name": "New Cashier",
  "position": "Cashier",
  "email": "cashier@example.com",
  "salary": "3000000",
  "biographyData": "New cashier"
}
```

---

### 7. Error Response Examples

#### Missing Token

```
GET {{base_url}}/auth/me
```

**Response (401 Unauthorized):**

```json
{
  "error": "Unauthorized: Missing or invalid token"
}
```

#### Insufficient Permissions

```
POST {{base_url}}/roles
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "name": "new_role",
  "description": "Test"
}
```

**Response (403 Forbidden)** - jika user adalah `admin`:

```json
{
  "error": "Forbidden: You do not have permission to access this resource. Required role: owner"
}
```

#### Invalid Credentials

```
POST {{base_url}}/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "wrongpassword"
}
```

**Response (401 Unauthorized):**

```json
{
  "error": "Invalid password"
}
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          Database Tables                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐              │
│  │  roles   │◄─────│  users   │─────►│ refresh  │              │
│  └──────────┘      │          │      │ tokens   │              │
│                    └──────────┘      └──────────┘              │
│                         ▲ │                                      │
│                         │ │                                      │
│                    created_by                                   │
│                         │ ▼                                      │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐              │
│  │ outlets  │◄─────│employees │─────►│ tables   │              │
│  └──────────┘      │          │      └──────────┘              │
│                    └──────────┘                                 │
│                                                                   │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐              │
│  │categories│◄─────│  menus   │─────►│ recipes  │              │
│  └──────────┘      │          │      │& raw mat │              │
│                    └──────────┘      └──────────┘              │
│                                                                   │
│  ┌──────────────────────────────────────────────────┐          │
│  │              transactions & payments              │          │
│  │   (untuk transaksi kasir & pembayaran)          │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `users` | User authentication | id, username, email, password, roleId, createdBy |
| `roles` | User roles | id, name, description |
| `refresh_tokens` | JWT refresh tokens | id, userId, token, expiresAt |
| `outlets` | Cafe outlets/branches | id, name, address, city, province, createdBy |
| `employees` | Employee records | id, userId, outletId, position, salary, imagePath, createdBy |
| `tables` | Dining tables per outlet | id, outletId, tableNumber, status, createdBy |
| `categories` | Menu categories | id, name, type, createdBy |
| `menus` | Menu items | id, outletId, categoryId, name, price, currentStock, createdBy |
| `transactions` | Sales transactions | id, outletId, tableId, cashierId, status, totalPrice, createdBy |
| `payments` | Payment records | id, transactionId, paymentMethod, amountPaid, createdBy |

---

## Common Issues & Solutions

### Issue 1: Database Connection Error

```
Error: getaddrinfo ENOTFOUND localhost
```

**Solution:**

1. Pastikan PostgreSQL running
2. Check DATABASE_URL di `.env`
3. Verify PostgreSQL credentials

```bash
psql -U developer -d cafe_pos -h localhost
```

### Issue 2: Port Already in Use

```
Error: listen EADDRINUSE :::3000
```

**Solution:**

```bash
# Ganti port di .env
PORT=3001

# atau kill process yang menggunakan port 3000
lsof -i :3000
kill -9 <PID>
```

### Issue 3: Token Invalid

```
Error: Unauthorized: Invalid or expired access token
```

**Solution:**

1. Login ulang untuk mendapatkan token baru
2. Check token expiry (default: 15m)
3. Gunakan refresh token untuk mendapatkan token baru

### Issue 4: Insufficient Permissions

```
Error: Forbidden: You do not have permission...
```

**Solution:**

- Check user role di database
- Hanya `admin` dan `owner` yang bisa create/update/delete
- Hanya `owner` yang bisa manage roles

---

## Production Deployment

### Environment Setup

Customize semua values sesuai dengan infrastruktur production Anda:

```dotenv
# Database Configuration
# Ganti dengan credentials dan host production database Anda
DATABASE_URL=postgresql://prod_user:prod_password@prod_host.com:5432/cafe_pos_prod

# Server Configuration
NODE_ENV=production
PORT=3000

# JWT Configuration - WAJIB ganti dengan key yang kuat!
# Generate strong key: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-very-long-secret-key-minimum-32-characters-change-this
JWT_REFRESH_SECRET=your-very-long-refresh-secret-minimum-32-characters-change-this
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Bcrypt Configuration - tingkatkan untuk production
BCRYPT_SALT_ROUNDS=12

# Seed Configuration
# Ganti dengan password admin yang kuat
SEED_ADMIN_PASSWORD=your-strong-admin-password-change-this
```

### Deployment Steps

```bash
# 1. Install dependencies (production only)
npm install --production

# 2. Verify environment configuration
# Pastikan semua .env variables sudah benar

# 3. Setup database (jika baru)
npm run db:push
npm run db:migrate

# 4. Seed database dengan data initial (optional)
npm run db:seed

# 5. Start server
npm start

# 6. (Recommended) Gunakan process manager seperti PM2
npm install -g pm2
pm2 start src/index.ts --name "cafe-pos-api"
pm2 save
pm2 startup
```

### Generate Strong JWT Secrets

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Important Security Notes

- ✅ Selalu gunakan HTTPS di production
- ✅ Jangan expose `.env` di version control
- ✅ Gunakan secret key yang berbeda untuk setiap environment
- ✅ Backup database secara berkala
- ✅ Monitor logs dan error rates
- ✅ Update dependencies secara regular

---

## Support & Troubleshooting

Jika mengalami masalah:

1. Check console output untuk error messages
2. Verify `.env` configuration
3. Check database connection dengan `psql`
4. Review Postman responses untuk error details
5. Check logs di Drizzle Studio

---

## License

MIT License

---

**Last Updated**: January 25, 2026  
**Version**: 1.0.0

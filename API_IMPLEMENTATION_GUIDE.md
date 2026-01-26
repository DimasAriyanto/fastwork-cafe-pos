# API Implementation Guide untuk React Frontend

## Struktur Folder

```
src/
├── api/
│   └── client.ts              # API Client dengan semua endpoints
├── hooks/
│   └── useAuth.ts             # Custom hooks untuk auth & data fetching
└── pages/
    ├── auth/
    │   └── LoginExample.tsx    # Contoh Login page
    └── owner/
        └── PegawaiExample.tsx  # Contoh CRUD Employee
```

## 1. Setup API Client

File: `src/api/client.ts`

API client ini menyediakan semua method untuk berkomunikasi dengan backend. Features:
- ✅ Auto-attach access token ke setiap request
- ✅ Auto-refresh token jika expired
- ✅ Error handling yang rapi
- ✅ Token management di localStorage

### Usage di Component:

```typescript
import { apiClient } from '../api/client';

// Login
const response = await apiClient.login(username, password);

// Get employees
const employees = await apiClient.getEmployees();

// Create employee
await apiClient.createEmployee({ name: 'John', email: '...' });

// Update employee
await apiClient.updateEmployee(1, { name: 'Jane' });

// Delete employee
await apiClient.deleteEmployee(1);
```

## 2. Custom Hooks

File: `src/hooks/useAuth.ts`

### useAuth() Hook

```typescript
import { useAuth } from '../hooks/useAuth';

export default function MyComponent() {
  const { user, isAuthenticated, loading, login, logout } = useAuth();

  // Check authentication status
  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Not logged in</div>;

  return <div>Welcome {user?.username}!</div>;
}
```

### useFetch() Hook

Untuk fetching data dengan loading, error, dan refresh:

```typescript
import { useFetch } from '../hooks/useAuth';
import { apiClient } from '../api/client';

export default function EmployeeList() {
  const { data: employees, loading, error, refetch } = useFetch(
    () => apiClient.getEmployees(),
    [] // dependencies
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {employees?.map(emp => (
        <div key={emp.id}>{emp.name}</div>
      ))}
      <button onClick={refetch}>Refresh Data</button>
    </div>
  );
}
```

## 3. Contoh Implementasi

### Login Page

```typescript
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/owner/dashboard');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

### Employee Management Page

```typescript
import { useFetch } from '../hooks/useAuth';
import { apiClient } from '../api/client';
import { useState } from 'react';

export default function EmployeeList() {
  const { data: employees, loading, error, refetch } = useFetch(
    () => apiClient.getEmployees(),
    []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this employee?')) {
      try {
        setIsSubmitting(true);
        await apiClient.deleteEmployee(id);
        refetch();
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleCreate = async (formData) => {
    try {
      setIsSubmitting(true);
      await apiClient.createEmployee(formData);
      refetch();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <table>
        <tbody>
          {employees?.map(emp => (
            <tr key={emp.id}>
              <td>{emp.name}</td>
              <td>{emp.email}</td>
              <td>
                <button onClick={() => handleDelete(emp.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Outlet Management

```typescript
import { apiClient } from '../api/client';

// Get all outlets
const outlets = await apiClient.getOutlets();

// Get specific outlet
const outlet = await apiClient.getOutletById(1);

// Create outlet
await apiClient.createOutlet({
  name: 'Cafe Downtown',
  address: '...',
  phone: '...'
});

// Update outlet
await apiClient.updateOutlet(1, {
  name: 'Cafe Downtown Updated'
});

// Delete outlet
await apiClient.deleteOutlet(1);
```

### User Management

```typescript
import { apiClient } from '../api/client';

// Get all users
const users = await apiClient.getUsers();

// Get specific user
const user = await apiClient.getUserById(1);

// Create user
await apiClient.createUser({
  username: 'newuser',
  email: 'user@example.com',
  roleId: 2
});

// Update user
await apiClient.updateUser(1, {
  email: 'newemail@example.com'
});

// Delete user
await apiClient.deleteUser(1);
```

## 4. Token Management

Tokens otomatis disimpan di localStorage:
- `accessToken` - JWT access token (15 menit)
- `refreshToken` - JWT refresh token (7 hari)
- `user` - User object JSON

Semua ini ditangani otomatis oleh `apiClient`, jadi Anda tidak perlu manual manage token.

## 5. Error Handling

API client akan throw error jika ada masalah. Handle di try-catch:

```typescript
try {
  const result = await apiClient.someMethod();
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(message);
}
```

Common errors:
- `Session expired. Please login again.` - Token expired
- `Unauthorized` - Access token tidak valid
- `Invalid JSON in request body` - Request body invalid

## 6. Logout

```typescript
const { logout } = useAuth();

const handleLogout = async () => {
  await logout();
  navigate('/login');
};
```

## 7. Protected Routes

File sudah ada di `src/routes/ProtectedRoute.tsx`. Gunakan untuk protect routes berdasarkan role:

```typescript
<Route element={<ProtectedRoute allowedRoles={['OWNER']} />}>
  <Route path="/owner/dashboard" element={<Dashboard />} />
</Route>
```

## 8. Checklist Implementasi

- [ ] Copy file `src/api/client.ts` ke project
- [ ] Copy file `src/hooks/useAuth.ts` ke project
- [ ] Update Login page dengan `useAuth()` hook
- [ ] Update setiap page yang perlu API dengan `useFetch()` atau `apiClient`
- [ ] Pastikan backend server running di http://localhost:3000
- [ ] Test login dan API calls

## 9. Debugging

Enable API logging:

```typescript
// Di src/api/client.ts, uncomment console.error untuk lihat error details
```

Atau gunakan browser DevTools Network tab untuk lihat:
- Request/response bodies
- Headers (termasuk Authorization)
- Status codes

---

**Contoh lengkap sudah ada di:**
- `src/pages/auth/LoginExample.tsx` - Login implementation
- `src/pages/owner/PegawaiExample.tsx` - CRUD example

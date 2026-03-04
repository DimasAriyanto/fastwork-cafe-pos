import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository.ts';
import { RoleRepository } from '../repositories/role.repository.ts';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository.ts';
import { EmployeeRepository } from '../repositories/employee.repository.ts';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.ts';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

export class AuthService {
  private userRepository: UserRepository;
  private roleRepository: RoleRepository;
  private refreshTokenRepository: RefreshTokenRepository;
  private employeeRepository: EmployeeRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.roleRepository = new RoleRepository();
    this.refreshTokenRepository = new RefreshTokenRepository();
    this.employeeRepository = new EmployeeRepository();
  }

  async login(username: string, password: string) {
    // Repo returns object | undefined
    const user = await this.userRepository.findByUsername(username);

    if (!user) {
      throw new Error('User not found');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new Error('Invalid password');
    }

    // Cek status akun — soft delete set status = 'inactive'
    if (user.status !== 'active') {
      throw new Error('Akun tidak aktif atau telah dihapus');
    }

    // Get role name
    const role = await this.roleRepository.findById(user.roleId);
    if (!role) {
      throw new Error('Role does not exist');
    }
    const roleName = role.name.toUpperCase();

    // Get outlet id from employee profile
    const employee = await this.employeeRepository.findByUserId(user.id);
    const outletId = employee?.outletId || 1; // Default to 1 if not found

    // Generate tokens
    const accessToken = signAccessToken({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      roleId: user.roleId,
      role: roleName,
      outletId: outletId,
      cashierId: employee?.id,
    });

    const refreshToken = signRefreshToken({
      id: user.id,
      email: user.email,
    });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.refreshTokenRepository.create(user.id, refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        role: roleName, // Sudah uppercase (OWNER/CASHIER)
        imagePath: employee?.imagePath || user.photo,
      },
    };
  }

  async register(username: string, email: string, password: string, fullName: string, roleId: number) {
    // ⚠️ FIX: Cek object langsung (bukan .length > 0)
    const existingEmail = await this.userRepository.findByEmail(email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    const existingUsername = await this.userRepository.findByUsername(username);
    if (existingUsername) {
      throw new Error('Username already exists');
    }

    // Hash password
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    // ⚠️ FIX: Create return single object
    const user = await this.userRepository.create({
      roleId,
      name: fullName,
      username,
      email,
      password: hashed,
    });

    if (!user) throw new Error("Failed to create user");

    // Get role name
    const role = await this.roleRepository.findById(user.roleId);
    const roleName = role?.name || 'user';

    // Get outlet info
    const employee = await this.employeeRepository.findByUserId(user.id);
    const outletId = employee?.outletId || 1;

    // Generate tokens
    const accessToken = signAccessToken({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      roleId: user.roleId,
      role: roleName,
      outletId: outletId,
      cashierId: employee?.id,
    });

    const refreshToken = signRefreshToken({
      id: user.id,
      email: user.email,
    });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepository.create(user.id, refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        role: roleName.toUpperCase(),
        imagePath: employee?.imagePath || user.photo,
      },
    };
  }

  async getUserById(id: number) {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new Error('User not found');
    }

    // 👇 TAMBAHAN: Ambil nama role berdasarkan roleId user
    const role = await this.roleRepository.findById(user.roleId);
    const roleName = role?.name || 'user'; // Default kalo gak ketemu

    // Get employee info for imagePath
    const employee = await this.employeeRepository.findByUserId(user.id);

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      role: roleName.toUpperCase(), // 👈 Konsisten dengan login
      roleName: roleName.toUpperCase(), // Tetap ada biar gak breaking change
      imagePath: employee?.imagePath || user.photo,
    };
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const decoded = verifyRefreshToken(refreshToken);

      // Check if token is valid in DB
      const isValid = await this.refreshTokenRepository.isTokenValid(refreshToken);
      if (!isValid) {
        throw new Error('Refresh token not found or expired');
      }

      // Get user info
      // ⚠️ FIX: Remove Array destructuring
      const user = await this.userRepository.findById(decoded.id);
      if (!user) {
        throw new Error('User not found');
      }

      // Get role name
      const role = await this.roleRepository.findById(user.roleId);
      const roleName = role?.name || 'user';

      // Get outlet info
      const employee = await this.employeeRepository.findByUserId(user.id);
      const outletId = employee?.outletId || 1;

      // Generate new access token
      const accessToken = signAccessToken({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        roleId: user.roleId,
        role: roleName,
        outletId: outletId,
        cashierId: employee?.id,
      });

      return {
        accessToken,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          roleId: user.roleId,
          role: roleName,
          imagePath: employee?.imagePath || user.photo,
        },
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    await this.refreshTokenRepository.deleteByToken(refreshToken);
    return { success: true };
  }
}
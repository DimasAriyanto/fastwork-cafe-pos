import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository.ts';
import { RoleRepository } from '../repositories/role.repository.ts';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository.ts';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.ts';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

export class AuthService {
  private userRepository: UserRepository;
  private roleRepository: RoleRepository;
  private refreshTokenRepository: RefreshTokenRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.roleRepository = new RoleRepository();
    this.refreshTokenRepository = new RefreshTokenRepository();
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

    // Get role name
    const role = await this.roleRepository.findById(user.roleId);
    if (!role) {
      throw new Error('Role does not exist');
    }
    const roleName = role.name.toUpperCase();

    // Generate tokens
    const accessToken = signAccessToken({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      roleId: user.roleId,
      role: roleName,
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

    // Generate tokens
    const accessToken = signAccessToken({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      roleId: user.roleId,
      role: roleName,
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

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      roleName: roleName.toUpperCase(), // 👈 PENTING: Kembalikan ini biar Frontend tau
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

      // Generate new access token
      const accessToken = signAccessToken({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        roleId: user.roleId,
        role: roleName,
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
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
    const userList = await this.userRepository.findByUsername(username);

    if (userList.length === 0) {
      throw new Error('User not found');
    }

    const user = userList[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new Error('Invalid password');
    }

    // Get role name
    const roleList = await this.roleRepository.findById(user.roleId);
    const roleName = roleList[0]?.name || 'user';

    // Generate tokens with role name
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

    // Store refresh token in DB with expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.refreshTokenRepository.create(user.id, refreshToken, expiresAt);

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      role: roleName,
      accessToken,
      refreshToken,
    };
  }

  async register(username: string, email: string, password: string, fullName: string, roleId: number) {
    // Check if user already exists (by email)
    const existingEmail = await this.userRepository.findByEmail(email);
    if (existingEmail.length > 0) {
      throw new Error('Email already exists');
    }

    const existingUsername = await this.userRepository.findByUsername(username);
    if (existingUsername.length > 0) {
      throw new Error('Username already exists');
    }

    // Hash password before storing
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await this.userRepository.create({
      roleId,
      name: fullName,
      username,
      email,
      password: hashed,
    });

    const user = newUser[0];

    // Get role name
    const roleList = await this.roleRepository.findById(user.roleId);
    const roleName = roleList[0]?.name || 'user';

    // Generate tokens with role name
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

    // Store refresh token in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepository.create(user.id, refreshToken, expiresAt);

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      role: roleName,
      accessToken,
      refreshToken,
    };
  }

  async getUserById(id: number) {
    const userList = await this.userRepository.findById(id);

    if (userList.length === 0) {
      throw new Error('User not found');
    }

    const user = userList[0];
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
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
      const userList = await this.userRepository.findById(decoded.id);
      if (userList.length === 0) {
        throw new Error('User not found');
      }

      const user = userList[0];

      // Get role name
      const roleList = await this.roleRepository.findById(user.roleId);
      const roleName = roleList[0]?.name || 'user';

      // Generate new access token with same payload as login
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
    // Delete refresh token from DB
    await this.refreshTokenRepository.deleteByToken(refreshToken);
    return { success: true };
  }
}

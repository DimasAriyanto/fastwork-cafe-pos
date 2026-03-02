import { writeFile, unlink, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { EmployeeRepository } from '../repositories/employee.repository';

export class EmployeeService {
  private repo: EmployeeRepository;

  constructor() {
    this.repo = new EmployeeRepository();
  }

  async getAll() {
    return await this.repo.findAll();
  }

  // Helper Simpan File
  private async saveFile(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const uploadDir = join(process.cwd(), 'uploads');
    const uploadPath = join(uploadDir, fileName);
    
    // Pastikan folder 'uploads' ada
    await mkdir(uploadDir, { recursive: true });
    
    await writeFile(uploadPath, Buffer.from(buffer));
    return `/uploads/${fileName}`;
  }

  async create(name: string, position: string, isActive: boolean, photo?: File, userData?: any) {
    let imagePath: string | null = null;
    
    if (photo) {
      imagePath = await this.saveFile(photo);
    }

    let userId = userData?.userId;

    // Jika ada data user (username, password), buat user dulu
    if (userData && !userId) {
      const { username, password } = userData;
      // Email di-generate otomatis dari username karena tidak diinput dari form
      const email = `${username}@cafeepos.local`;
      
      // 1. Cari Role 'cashier'
      const roleRepo = new (await import('../repositories/role.repository')).RoleRepository();
      const cashierRole = await roleRepo.findByName('cashier');
      if (!cashierRole) throw new Error("Role 'cashier' tidak ditemukan. Silakan run seed.");

      // 2. Hash Password
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.default.hash(password, 10);

      // 3. Create User
      const userRepo = new (await import('../repositories/user.repository')).UserRepository();
      const newUser = await userRepo.create({
        username,
        email,
        password: hashedPassword,
        name: name,
        roleId: cashierRole.id,
        status: 'active',
      });
      
      if (!newUser) throw new Error("Gagal membuat akun user untuk pegawai");
      userId = newUser.id;
    }

    if (!userId) throw new Error("Pegawai wajib memiliki akun user (user_id)");

    return await this.repo.create({
      userId,
      name,
      position,
      imagePath,
      outletId: 1,
      isActive
    });
  }

  async update(id: number, name: string, position: string, isActive: boolean, photo?: File, userData?: any) {
    const employee = await this.repo.findById(id);
    if (!employee) throw new Error("Pegawai tidak ditemukan");

    let imagePath = employee.imagePath;

    if (photo) {
      // Logic hapus foto lama (opsional)
      imagePath = await this.saveFile(photo);
    }

    // Update data akun user — selalu sinkronkan name ke tabel users
    if (employee.userId) {
      const userRepo = new (await import('../repositories/user.repository')).UserRepository();
      const userUpdate: any = { name }; // selalu sync name

      if (userData?.username) userUpdate.username = userData.username;
      if (userData?.email) userUpdate.email = userData.email;

      // Update password hanya jika diisi (tidak kosong)
      if (userData?.password && userData.password.trim() !== "") {
        const bcrypt = await import('bcrypt');
        userUpdate.password = await bcrypt.default.hash(userData.password, 10);
      }

      await userRepo.update(employee.userId, userUpdate);
    }

    return await this.repo.update(id, { name, position, isActive, imagePath });
  }

  async delete(id: number) {
    const employee = await this.repo.findById(id);
    if (!employee) return;

    // Soft delete: nonaktifkan pegawai
    await this.repo.softDelete(id);

    // Nonaktifkan akun user agar tidak bisa login
    if (employee.userId) {
      const userRepo = new (await import('../repositories/user.repository')).UserRepository();
      await userRepo.update(employee.userId, { status: 'inactive' });
    }
  }
}
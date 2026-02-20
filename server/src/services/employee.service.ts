import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
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
    // Pastikan folder 'uploads' sudah ada di root project
    const uploadPath = join(process.cwd(), 'uploads', fileName);
    
    await writeFile(uploadPath, Buffer.from(buffer));
    return `/uploads/${fileName}`;
  }

  async create(name: string, position: string, isActive: boolean, photo?: File) {
    let imagePath: string | null = null;
    
    if (photo) {
      imagePath = await this.saveFile(photo);
    }

    return await this.repo.create({
      name,
      position,
      imagePath,
      outletId: 1,
      isActive // 👈 Masuk ke DB
    });
  }

  async update(id: number, name: string, position: string, isActive: boolean, photo?: File) {
    const employee = await this.repo.findById(id);
    if (!employee) throw new Error("Pegawai tidak ditemukan");

    let imagePath = employee.imagePath;

    if (photo) {
      // Logic hapus foto lama (opsional)
      imagePath = await this.saveFile(photo);
    }

    // 👈 Update isActive juga
    return await this.repo.update(id, { name, position, isActive, imagePath });
  }

  async delete(id: number) {
    const employee = await this.repo.findById(id);
    if (employee) {
        // Hapus file fisik
        if (employee.imagePath) {
             try { await unlink(join(process.cwd(), employee.imagePath)); } catch (e) { console.error("Gagal hapus file", e); }
        }
        await this.repo.delete(id);
    }
  }
}
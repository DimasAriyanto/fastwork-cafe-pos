/**
 * Seed initial data untuk POS Cafe System (MySQL Version - Integer Price)
 * Usage: npx tsx src/db/seed.ts
 */

import 'dotenv/config';
import bcrypt from 'bcrypt';
import { eq, sql } from 'drizzle-orm';
import { db } from './index'; // Pastikan path ini benar
import {
  roles,
  categories,
  taxes,
  outlets,
  menus,
  menuVariants,
  toppings, // 👈 Pastikan import tabel toppings
  tables,
  users,
  employees,
} from './schemas/index';

async function seed() {
  console.log('🌱 Starting database seed (MySQL - Owner & Integer Price)...');

  try {
    // ----------------------------------------------------------------
    // 1. Seed Roles
    // ----------------------------------------------------------------
    console.log('📋 Seeding roles...');
    
    // Kita pastikan role yang ada cuma owner dan cashier
    await db
      .insert(roles)
      .values([
        { name: 'owner', description: 'System owner with full access' },
        { name: 'cashier', description: 'Cashier staff' },
      ])
      .onDuplicateKeyUpdate({ set: { id: sql`id` } });

    // Select ID Owner Role
    const ownerRoleData = await db
      .select()
      .from(roles)
      .where(eq(roles.name, 'owner'))
      .limit(1);

    const ownerRoleId = ownerRoleData[0]?.id || null;

    // ----------------------------------------------------------------
    // 2. Seed Owner User (Pengganti Admin)
    // ----------------------------------------------------------------
    let ownerUserId = null;

    if (ownerRoleId) {
      console.log('👤 Seeding OWNER user...');
      const hashed = await bcrypt.hash(
        process.env.SEED_ADMIN_PASSWORD || 'owner123', // Password default owner123
        10
      );

      await db
        .insert(users)
        .values([
          {
            roleId: ownerRoleId,
            username: 'owner', // Username jadi owner
            name: 'Owner System',
            email: 'owner@local.test',
            password: hashed,
            status: 'active',
          },
        ])
        .onDuplicateKeyUpdate({ set: { id: sql`id` } });

      const fetchedUser = await db
        .select()
        .from(users)
        .where(eq(users.username, 'owner'))
        .limit(1);

      ownerUserId = fetchedUser[0]?.id;
      console.log(`   - Owner user ID: ${ownerUserId}`);
    }

    // ----------------------------------------------------------------
    // 2.5 Seed Cashier User
    // ----------------------------------------------------------------
    let cashierUserId = null;
    
    const cashierRole = await db
      .select()
      .from(roles)
      .where(eq(roles.name, 'cashier'))
      .limit(1);
    
    const cashierRoleId = cashierRole[0]?.id;

    if (cashierRoleId) {
      console.log('👤 Seeding cashier user...');
      const hashedCashier = await bcrypt.hash('123456', 10);

      await db
        .insert(users)
        .values([
          {
            roleId: cashierRoleId,
            username: 'kasir1',
            name: 'Si Kasir Andalan',
            email: 'kasir@local.test',
            password: hashedCashier,
            status: 'active',
          },
        ])
        .onDuplicateKeyUpdate({ set: { id: sql`id` } });

      const fetchedCashier = await db
        .select()
        .from(users)
        .where(eq(users.username, 'kasir1'))
        .limit(1);

      cashierUserId = fetchedCashier[0]?.id;
      console.log(`   - Cashier user ID: ${cashierUserId}`);
    }

    // ----------------------------------------------------------------
    // 3. Seed Categories
    // ----------------------------------------------------------------
    console.log('☕ Seeding categories...');
    if (ownerUserId) {
      await db
        .insert(categories)
        .values([
          { name: 'Beverage', type: 'menu', createdBy: ownerUserId },
          { name: 'Food', type: 'menu', createdBy: ownerUserId },
          { name: 'Dessert', type: 'menu', createdBy: ownerUserId },
          { name: 'Topping', type: 'topping', createdBy: ownerUserId },
        ])
        .onDuplicateKeyUpdate({ set: { id: sql`id` } });
    }

    // ----------------------------------------------------------------
    // 4. Seed Taxes
    // ----------------------------------------------------------------
    console.log('💰 Seeding taxes...');
    await db
      .insert(taxes)
      .values([
        { name: 'PPN', category: 'general', percentage: '11.00', isActive: true }, // PPN 11%
        { name: 'Service Charge', category: 'service', percentage: '5.00', isActive: true },
      ])
      .onDuplicateKeyUpdate({ set: { id: sql`id` } });

    // ----------------------------------------------------------------
    // 5. Seed Outlets
    // ----------------------------------------------------------------
    console.log('🏪 Seeding outlets...');
    if (ownerUserId) {
        await db
        .insert(outlets)
        .values([
            {
            name: 'Cafe Pusat',
            address: 'Jl. Utama No. 1',
            city: 'Jakarta',
            province: 'DKI Jakarta',
            phoneNumber: '08123456789',
            createdBy: ownerUserId,
            },
        ])
        .onDuplicateKeyUpdate({ set: { id: sql`id` } });
    }

    const fetchedOutlet = await db
      .select()
      .from(outlets)
      .where(eq(outlets.name, 'Cafe Pusat'))
      .limit(1);
    
    const outletId = fetchedOutlet[0]?.id || 1;

    // ----------------------------------------------------------------
    // 6. Seed Menus (Harga = Integer)
    // ----------------------------------------------------------------
    console.log('🍵 Seeding menu items...');
    
    const categoryBeverage = await db
      .select()
      .from(categories)
      .where(eq(categories.name, 'Beverage'))
      .limit(1);

    if (categoryBeverage.length > 0 && ownerUserId) {
      await db
        .insert(menus)
        .values([
          {
            outletId,
            categoryId: categoryBeverage[0].id,
            name: 'Espresso',
            price: 18000, // Integer
            description: 'Classic Italian espresso',
            isAvailable: true,
            currentStock: 100,
            hasVariant: true,
            createdBy: ownerUserId,
          },
          {
            outletId,
            categoryId: categoryBeverage[0].id,
            name: 'Cappuccino',
            price: 28000, // Integer
            description: 'Espresso with milk foam',
            isAvailable: true,
            currentStock: 100,
            hasVariant: true,
            createdBy: ownerUserId,
          },
          {
            outletId,
            categoryId: categoryBeverage[0].id,
            name: 'Latte',
            price: 28000, // Integer
            description: 'Espresso with steamed milk',
            isAvailable: true,
            currentStock: 100,
            hasVariant: false,
            createdBy: ownerUserId,
          },
          {
            outletId,
            categoryId: categoryBeverage[0].id,
            name: 'Americano',
            price: 22000, // Integer
            description: 'Espresso with hot water',
            isAvailable: false,
            currentStock: 100,
            hasVariant: false,
            createdBy: ownerUserId,
          },
        ])
        .onDuplicateKeyUpdate({ set: { id: sql`id` } });
    }

    // ----------------------------------------------------------------
    // 6.5 Seed Menu Variants (Harga Adjustment = Integer)
    // ----------------------------------------------------------------
    console.log('🔄 Seeding menu variants...');

    const espressoMenu = await db.select().from(menus).where(eq(menus.name, 'Espresso')).limit(1);
    const cappucinoMenu = await db.select().from(menus).where(eq(menus.name, 'Cappuccino')).limit(1);

    if (espressoMenu.length > 0) {
      await db.insert(menuVariants).values([
        { menuId: espressoMenu[0].id, name: 'Single Shot', priceAdjustment: 0, isAvailable: true },
        { menuId: espressoMenu[0].id, name: 'Double Shot', priceAdjustment: 5000, isAvailable: true }, // +5000
      ]).onDuplicateKeyUpdate({ set: { id: sql`id` } });
    }

    if (cappucinoMenu.length > 0) {
      await db.insert(menuVariants).values([
        { menuId: cappucinoMenu[0].id, name: 'Regular (Hot)', priceAdjustment: 0, isAvailable: true },
        { menuId: cappucinoMenu[0].id, name: 'Large (Iced)', priceAdjustment: 4000, isAvailable: true }, // +4000
      ]).onDuplicateKeyUpdate({ set: { id: sql`id` } });
    }

    // ----------------------------------------------------------------
    // 7. Seed Toppings (TABEL TOPPINGS - Harga Integer)
    // ----------------------------------------------------------------
    console.log('✨ Seeding toppings...');
    
    // Pastikan kita insert ke tabel `toppings`
    if (ownerUserId && outletId) {
      await db
        .insert(toppings) // 👈 Tabel Toppings
        .values([
          {
            outletId,
            name: 'Extra Shot',
            price: 6000, // Integer
            isAvailable: true,
            stock: 200,
          },
          {
            outletId,
            name: 'Vanilla Syrup',
            price: 4000, // Integer
            isAvailable: true,
            stock: 150,
          },
          {
            outletId,
            name: 'Cheese Foam',
            price: 5000, // Integer
            isAvailable: true,
            stock: 100,
          },
          {
            outletId,
            name: 'Boba Pearl',
            price: 3000, // Integer
            isAvailable: true,
            stock: 500,
          },
        ])
        .onDuplicateKeyUpdate({ set: { id: sql`id` } });
    }

    // ----------------------------------------------------------------
    // 8. Seed Tables
    // ----------------------------------------------------------------
    console.log('🪑 Seeding tables...');
    if (ownerUserId) {
        const tableSeeds = [];
        for (let i = 1; i <= 10; i++) {
        tableSeeds.push({
            outletId,
            tableNumber: `Meja ${i}`,
            seatsCapacity: 4,
            status: 'available',
            createdBy: ownerUserId,
        });
        }
        await db.insert(tables).values(tableSeeds).onDuplicateKeyUpdate({ set: { id: sql`id` } });
    }

    // ----------------------------------------------------------------
    // 9. Seed Employees
    // ----------------------------------------------------------------
    console.log('🧑‍💼 Seeding employees...');
    
    // 9.1 Owner Employee
    if (ownerUserId && outletId) {
      await db
        .insert(employees)
        .values([
          {
            userId: ownerUserId,
            outletId: outletId,
            name: 'Owner System',
            position: 'Owner', // Position Owner
            createdBy: ownerUserId,
          },
        ])
        .onDuplicateKeyUpdate({ set: { id: sql`id` } });
    }

    // 9.2 Cashier Employee
    if (cashierUserId && outletId) {
      await db
        .insert(employees)
        .values([
          {
            userId: cashierUserId, 
            outletId: outletId,
            name: 'Si Kasir Andalan',
            position: 'Cashier',
            createdBy: ownerUserId || undefined,
          },
        ])
        .onDuplicateKeyUpdate({ set: { id: sql`id` } });
    }

    console.log('✅ Database seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seed:', error);
    process.exit(1);
  }
}

seed();
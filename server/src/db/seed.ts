/**
 * Seed initial data untuk POS Cafe System
 * Jalankan file ini setelah migrations selesai
 *
 * Usage: node src/db/seed.js
 */

import 'dotenv/config';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  roles,
  categories,
  taxes,
  outlets,
  menus,
  tables,
  users,
  employees,
} from './schemas/index.ts';

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // 1. Seed Roles
    console.log('📋 Seeding roles...');
    const rolesResult = await db
      .insert(roles)
      .values([
        {
          name: 'owner',
          description: 'System owner with full access',
        },
        {
          name: 'admin',
          description: 'Administrator',
        },
        {
          name: 'cashier',
          description: 'Cashier staff',
        },
        {
          name: 'kitchen',
          description: 'Kitchen staff',
        },
      ])
      .onConflictDoNothing()
      .returning();

    console.log(`  - ${rolesResult.length} roles seeded`);

    console.log('👤 Seeding admin user...');
    const adminRole = await db
      .select()
      .from(roles)
      .where(eq(roles.name, 'admin'))
      .limit(1);

    const adminRoleId = adminRole[0]?.id || null;
    let adminUserId = null;

    if (adminRoleId) {
      const hashed = await bcrypt.hash(
        process.env.SEED_ADMIN_PASSWORD || 'admin123',
        parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
      );

      const adminUserResult = await db
        .insert(users)
        .values([
          {
            roleId: adminRoleId,
            username: 'admin',
            name: 'Administrator',
            email: 'admin@local.test',
            password: hashed,
            status: 'active',
          },
        ])
        .onConflictDoNothing()
        .returning();

      adminUserId = adminUserResult[0]?.id;
      console.log(`  - Admin user created (ID: ${adminUserId})`);
    }

    // 2. Seed Categories
    console.log('☕ Seeding categories...');
    await db
      .insert(categories)
      .values([
        {
          name: 'Beverage',
          type: 'menu',
          createdBy: adminUserId,
        },
        {
          name: 'Food',
          type: 'menu',
          createdBy: adminUserId,
        },
        {
          name: 'Dessert',
          type: 'menu',
          createdBy: adminUserId,
        },
        {
          name: 'Topping',
          type: 'topping',
          createdBy: adminUserId,
        },
      ])
      .onConflictDoNothing();

    // 3. Seed Taxes
    console.log('💰 Seeding taxes...');
    await db
      .insert(taxes)
      .values([
        {
          name: 'PPN',
          category: 'general',
          percentage: '10.00',
          isActive: true,
        },
        {
          name: 'Service Charge',
          category: 'service',
          percentage: '5.00',
          isActive: true,
        },
      ])
      .onConflictDoNothing();

    // 4. Seed Outlets
    console.log('🏪 Seeding outlets...');
    const outletResult = await db
      .insert(outlets)
      .values([
        {
          name: 'Cafe Main',
          address: 'Jl. Utama No. 123',
          city: 'Jakarta',
          province: 'DKI Jakarta',
          phoneNumber: '021-123456',
          createdBy: adminUserId,
        },
      ])
      .returning();

    const outletId = outletResult[0]?.id || 1;

    // 5. Seed Menus (Beverages)
    console.log('🍵 Seeding menu items...');
    const categoryBeverage = await db
      .select()
      .from(categories)
      .where(eq(categories.name, 'Beverage'))
      .limit(1);

    if (categoryBeverage.length > 0) {
      await db
        .insert(menus)
        .values([
          {
            outletId,
            categoryId: categoryBeverage[0].id,
            name: 'Espresso',
            price: '15000.00',
            description: 'Classic Italian espresso',
            isAvailable: true,
            currentStock: 100,
            preparationTime: 3,
            createdBy: adminUserId,
          },
          {
            outletId,
            categoryId: categoryBeverage[0].id,
            name: 'Cappuccino',
            price: '25000.00',
            description: 'Espresso with milk foam',
            isAvailable: true,
            currentStock: 100,
            preparationTime: 5,
            createdBy: adminUserId,
          },
          {
            outletId,
            categoryId: categoryBeverage[0].id,
            name: 'Latte',
            price: '25000.00',
            description: 'Espresso with steamed milk',
            isAvailable: true,
            currentStock: 100,
            preparationTime: 5,
            createdBy: adminUserId,
          },
          {
            outletId,
            categoryId: categoryBeverage[0].id,
            name: 'Americano',
            price: '20000.00',
            description: 'Espresso with hot water',
            isAvailable: true,
            currentStock: 100,
            preparationTime: 3,
            createdBy: adminUserId,
          },
        ])
        .onConflictDoNothing();
    }

    // 6. Seed Toppings
    const categoryTopping = await db
      .select()
      .from(categories)
      .where(eq(categories.name, 'Topping'))
      .limit(1);

    if (categoryTopping.length > 0) {
      await db
        .insert(menus)
        .values([
          {
            outletId,
            categoryId: categoryTopping[0].id,
            name: 'Extra Shot',
            price: '5000.00',
            description: 'Additional espresso shot',
            isAvailable: true,
            currentStock: 200,
            createdBy: adminUserId,
          },
          {
            outletId,
            categoryId: categoryTopping[0].id,
            name: 'Vanilla Syrup',
            price: '3000.00',
            description: 'Vanilla flavoring',
            isAvailable: true,
            currentStock: 150,
            createdBy: adminUserId,
          },
          {
            outletId,
            categoryId: categoryTopping[0].id,
            name: 'Caramel Syrup',
            price: '3000.00',
            description: 'Caramel flavoring',
            isAvailable: true,
            currentStock: 150,
            createdBy: adminUserId,
          },
          {
            outletId,
            categoryId: categoryTopping[0].id,
            name: 'Chocolate',
            price: '4000.00',
            description: 'Chocolate topping',
            isAvailable: true,
            currentStock: 100,
            createdBy: adminUserId,
          },
        ])
        .onConflictDoNothing();
    }

    // 7. Seed Tables
    console.log('🪑 Seeding tables...');
    const tableSeeds = [];
    for (let i = 1; i <= 10; i++) {
      tableSeeds.push({
        outletId,
        tableNumber: `Table ${i}`,
        seatsCapacity: 4,
        status: 'available',
        createdBy: adminUserId,
      });
    }

    await db.insert(tables).values(tableSeeds).onConflictDoNothing();

    // 8. Seed Admin Employee linked to admin user and outlet
    console.log('🧑‍💼 Seeding admin employee...');
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.email, 'admin@local.test'))
      .limit(1);

    const mainOutlet = await db
      .select()
      .from(outlets)
      .where(eq(outlets.name, 'Cafe Main'))
      .limit(1);

    if (adminUser.length > 0 && mainOutlet.length > 0) {
      const userId = adminUser[0].id;
      const outletRef = mainOutlet[0].id;

      await db
        .insert(employees)
        .values([
          {
            userId,
            outletId: outletRef,
            biographyData: 'System administrator',
            name: 'Admin',
            position: 'Admin',
            email: adminUser[0].email,
            salary: '0',
            createdBy: adminUserId,
          },
        ])
        .onConflictDoNothing();
    }

    console.log('✅ Database seed completed successfully!');
    console.log('\n📊 Seeded data:');
    console.log('  - 4 roles');
    console.log('  - 4 categories');
    console.log('  - 2 tax rates');
    console.log('  - 1 outlet');
    console.log('  - 8 menu items (4 beverages + 4 toppings)');
    console.log('  - 10 tables');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seed:', error);
    process.exit(1);
  }
}

seed();
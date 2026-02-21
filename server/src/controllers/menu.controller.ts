import { MenuService } from '../services/menu.service';
import type { Context } from 'hono';
import type { CreateMenuRequest, UpdateMenuRequest } from '../types/menu';
import { User } from '../types';

export class MenuController {
  private service: MenuService;

  constructor() {
    this.service = new MenuService();
  }

  /**
   * GET /menus
   * Mengambil daftar menu dengan pagination dan filter.
   */
  async listPaginated(c: Context) {
    try {
      const params = c.req.query();
      
      // Extract pagination parameters
      const page = parseInt(params.page || '1', 10);
      const limit = parseInt(params.limit || '10', 10);
      
      // Extract filter parameters
      const search = params.search || undefined;
      const categoryId = params.categoryId ? parseInt(params.categoryId, 10) : undefined;
      const outletId = params.outletId ? parseInt(params.outletId, 10) : 1; // Default ke Outlet 1
      
      // Extract sort parameters
      const sortBy = params.sortBy || undefined;
      const sortOrder = (params.sortOrder || 'desc') as 'asc' | 'desc';

      // Build filters object (exclude known parameters)
      const filters: Record<string, unknown> = {};
      Object.keys(params).forEach(key => {
        if (!['page', 'limit', 'search', 'categoryId', 'outletId', 'sortBy', 'sortOrder'].includes(key)) {
          filters[key] = params[key];
        }
      });

      // Build pagination options
      const paginationOptions = {
        page,
        limit,
        search,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        sortBy,
        sortOrder,
      };

      // Call service
      const result = await this.service.getAllMenus(
        paginationOptions,
        categoryId,
        outletId
      );

      return c.json({ 
        success: true, 
        data: result.data,
        meta: result.meta
      });
    } catch (error) {
      console.error('Error in listPaginated:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to fetch menus',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }

  /**
   * GET /menus/:id
   * Mengambil detail menu berdasarkan ID
   */
  async get(c: Context) {
    try {
      const id = Number(c.req.param('id'));
      
      if (isNaN(id)) {
        return c.json({ 
          success: false, 
          error: 'Invalid menu ID' 
        }, 400);
      }

      const item = await this.service.getMenuById(id);
      
      if (!item) {
        return c.json({ 
          success: false, 
          error: 'Menu tidak ditemukan' 
        }, 404);
      }
      
      return c.json({ 
        success: true, 
        menu: item 
      });
    } catch (error) {
      console.error('Error in get:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to fetch menu',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }

  /**
   * POST /menus
   * Membuat menu baru dengan dukungan upload gambar
   */
  async create(c: Context) {
    try {
      const body = await c.req.parseBody();
      const user = c.get('user') as User; 

      const name = String(body['name']);
      const categoryId = parseInt(body['categoryId'] as string, 10);
      const price = parseInt(body['price'] as string, 10);
      const description = body['description'] ? String(body['description']) : undefined;
      const currentStock = body['currentStock'] ? parseInt(body['currentStock'] as string, 10) : 0;
      const photo = body['image'] instanceof File ? body['image'] : undefined;

      // Validation
      if (!name || isNaN(categoryId) || isNaN(price)) {
        return c.json({ 
          success: false, 
          error: 'Missing required fields: name, categoryId, price' 
        }, 400);
      }

      // Handle variants if any (sent as JSON string in FormData)
      let variants = [];
      if (body['variants']) {
        try {
          variants = JSON.parse(String(body['variants']));
        } catch (e) {
          console.error("Gagal parse variants:", e);
        }
      }

      const data = { 
        name,
        categoryId,
        price,
        description,
        currentStock,
        variants,
        createdBy: user?.id,
        outletId: user?.outletId || 1 
      };

      const menu = await this.service.createMenu(data, photo);
      
      return c.json({ 
        success: true, 
        menu 
      }, 201);
    } catch (error) {
      console.error('Error in create:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to create menu',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }

  /**
   * PUT /menus/:id
   * Update menu berdasarkan ID dengan dukungan upload gambar
   */
  async update(c: Context) {
    try {
      const id = Number(c.req.param('id'));
      
      if (isNaN(id)) {
        return c.json({ 
          success: false, 
          error: 'Invalid menu ID' 
        }, 400);
      }

      const body = await c.req.parseBody();
      
      // Check if menu exists
      const existingMenu = await this.service.getMenuById(id);
      if (!existingMenu) {
        return c.json({ 
          success: false, 
          error: 'Menu tidak ditemukan' 
        }, 404);
      }

      const updateData: any = {};
      if (body['name']) updateData.name = String(body['name']);
      if (body['categoryId']) updateData.categoryId = parseInt(body['categoryId'] as string, 10);
      if (body['price']) updateData.price = parseInt(body['price'] as string, 10);
      if (body['description']) updateData.description = String(body['description']);
      if (body['isAvailable']) updateData.isAvailable = body['isAvailable'] === 'true';
      if (body['currentStock']) updateData.currentStock = parseInt(body['currentStock'] as string, 10);
      
      const photo = body['image'] instanceof File ? body['image'] : undefined;

      const menu = await this.service.updateMenu(id, updateData, photo);
      
      return c.json({ 
        success: true, 
        menu 
      });
    } catch (error) {
      console.error('Error in update:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to update menu',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }

  /**
   * DELETE /menus/:id
   * Hapus menu berdasarkan ID
   */
  async remove(c: Context) {
    try {
      const id = Number(c.req.param('id'));
      
      if (isNaN(id)) {
        return c.json({ 
          success: false, 
          error: 'Invalid menu ID' 
        }, 400);
      }

      // Check if menu exists
      const existingMenu = await this.service.getMenuById(id);
      if (!existingMenu) {
        return c.json({ 
          success: false, 
          error: 'Menu tidak ditemukan' 
        }, 404);
      }

      await this.service.deleteMenu(id);
      
      return c.json({ 
        success: true,
        message: 'Menu berhasil dihapus'
      });
    } catch (error) {
      console.error('Error in remove:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to delete menu',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }

  /**
   * GET /menus/outlet/:outletId
   * Mengambil menu berdasarkan outlet
   */
  async getByOutlet(c: Context) {
    try {
      const outletId = Number(c.req.param('outletId'));
      
      if (isNaN(outletId)) {
        return c.json({ 
          success: false, 
          error: 'Invalid outlet ID' 
        }, 400);
      }

      const params = c.req.query();
      const page = parseInt(params.page || '1', 10);
      const limit = parseInt(params.limit || '10', 10);
      const search = params.search || undefined;
      
      const result = await this.service.getMenusByOutlet(outletId, {
        page,
        limit,
        search
      });

      return c.json({ 
        success: true, 
        data: result.data,
        meta: result.meta
      });
    } catch (error) {
      console.error('Error in getByOutlet:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to fetch menus by outlet',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
}
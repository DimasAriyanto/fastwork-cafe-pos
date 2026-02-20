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
   * Membuat menu baru
   */
  async create(c: Context) {
    try {
      const body = await c.req.json<CreateMenuRequest>();
      const user = c.get('user') as User; 

      // Validation
      if (!body.name || !body.categoryId || !body.price) {
        return c.json({ 
          success: false, 
          error: 'Missing required fields: name, categoryId, price' 
        }, 400);
      }

      const data = { 
        ...body, 
        createdBy: user?.id,
        // Default ke Outlet 1 (Pusat) jika tidak ada di user
        outletId: user?.outletId || 1 
      };

      const menu = await this.service.createMenu(data);
      
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
   * Update menu berdasarkan ID
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

      const body = await c.req.json<UpdateMenuRequest>();
      
      // Check if menu exists
      const existingMenu = await this.service.getMenuById(id);
      if (!existingMenu) {
        return c.json({ 
          success: false, 
          error: 'Menu tidak ditemukan' 
        }, 404);
      }

      const menu = await this.service.updateMenu(id, body);
      
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
/**
 * ModuleRegistry - Core registry for dynamic modular architecture.
 * Modules register their metadata, routes, menus, and views here.
 */
class ModuleRegistry {
  constructor() {
    this.modules = new Map();
    this.listeners = [];
    this.currentPath = '/dashboard';
  }

  /**
   * Register a module with its configuration.
   * @param {Object} config
   * @param {string} config.id - Unique ID (e.g. 'pedagang')
   * @param {string} config.title - Display Title
   * @param {string} config.icon - Lucide icon name
   * @param {Array} config.menus - Array of menu items / sub-menus
   * @param {Object} config.views - Map of path => render function
   */
  registerModule(config) {
    if (!config.id || !config.menus) {
      console.error('Invalid module configuration:', config);
      return;
    }
    this.modules.set(config.id, config);
    this.notify();
  }

  getModules() {
    return Array.from(this.modules.values());
  }

  getModule(id) {
    return this.modules.get(id);
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn());
  }

  navigate(path) {
    this.currentPath = path;
    this.notify();
  }

  getCurrentRoute() {
    for (const mod of this.modules.values()) {
      for (const menu of mod.menus) {
        if (menu.path === this.currentPath) {
          return { module: mod, menu, render: mod.views[menu.path] };
        }
        if (menu.submenus) {
          for (const sub of menu.submenus) {
            if (sub.path === this.currentPath) {
              return { module: mod, menu, submenu: sub, render: mod.views[sub.path] };
            }
          }
        }
      }
    }
    // Fallback to first available route
    return null;
  }
}

export const registry = new ModuleRegistry();

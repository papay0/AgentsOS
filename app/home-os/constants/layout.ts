// Layout constants for AgentsOS
export const MENU_BAR_HEIGHT = 32;
export const DOCK_HEIGHT = 72;
export const DOCK_BOTTOM_SPACING = 8;
export const DOCK_TOP_SPACING = 8;
export const TOTAL_DOCK_AREA = DOCK_HEIGHT + DOCK_TOP_SPACING + DOCK_BOTTOM_SPACING; // 88px

// Workspace dimensions
export const WORKSPACE_TOP_OFFSET = MENU_BAR_HEIGHT;
export const WORKSPACE_BOTTOM_OFFSET = TOTAL_DOCK_AREA;

// Snap zone settings
export const SNAP_TRIGGER_WIDTH = 50;
export const SNAP_TRIGGER_HEIGHT = 30;

// Window constraints
export const MIN_WINDOW_WIDTH = 250;
export const MIN_WINDOW_HEIGHT = 200;

// Z-index layers
export const WINDOW_Z_INDEX_BASE = 10;
export const WINDOW_Z_INDEX_MAX = 90; // Keep windows below dock
export const DOCK_Z_INDEX = 100;
export const SNAP_OVERLAY_Z_INDEX = 60;

// Mobile specific constants
export const MOBILE_BREAKPOINT = 768;
export const MOBILE_MENU_BAR_HEIGHT = 32;
export const MOBILE_DOCK_HEIGHT = 88;
export const MOBILE_APPS_PER_PAGE = 16;
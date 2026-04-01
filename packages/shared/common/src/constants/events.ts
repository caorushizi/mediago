// ============================================================
// Platform IPC channels (Electron-only, have @handle() handlers)
// ============================================================

// Download management (platform-specific: context menus, file dialogs)
export const SHOW_DOWNLOAD_DIALOG = "show-download-dialog";
export const ON_DOWNLOAD_LIST_CONTEXT_MENU = "on-download-list-context-menu";
export const EXPORT_DOWNLOAD_LIST = "export-download-list";

// Favorites (platform-specific: file dialogs)
export const ON_FAVORITE_ITEM_CONTEXT_MENU = "on-favorite-item-context-menu";
export const EXPORT_FAVORITES = "export-favorites";
export const IMPORT_FAVORITES = "import-favorites";

// App state (platform-specific: file dialogs, shell)
export const GET_ENV_PATH = "get-env-path";
export const SELECT_DOWNLOAD_DIR = "select-download-dir";
export const SELECT_FILE = "select-file";
export const GET_SHARED_STATE = "get-shared-state";
export const SET_SHARED_STATE = "set-shared-state";
export const GET_MACHINE_ID = "get-machine-id";

// Windows and navigation
export const SHOW_BROWSER_WINDOW = "show-browser-window";
export const COMBINE_TO_HOME_PAGE = "combine-to-home-page";
export const OPEN_DIR = "open-dir";
export const OPEN_URL = "open-url";

// Webview
export const SET_WEBVIEW_BOUNDS = "set-webview-bounds";
export const WEBVIEW_LOAD_URL = "webview-load-url";
export const WEBVIEW_URL_CONTEXTMENU = "webview-url-contextmenu";
export const WEBVIEW_GO_BACK = "webview-go-back";
export const WEBVIEW_RELOAD = "webview-reload";
export const WEBVIEW_SHOW = "webview-show";
export const WEBVIEW_HIDE = "webview-hide";
export const WEBVIEW_GO_HOME = "webview-go-home";
export const WEBVIEW_CHANGE_USER_AGENT = "webview-change-user-agent";

// Plugin / cache
export const PLUGIN_READY = "plugin-ready";
export const CLEAR_WEBVIEW_CACHE = "clear-webview-cache";

// Updates
export const CHECK_UPDATE = "check-update";
export const START_UPDATE = "start-update";
export const INSTALL_UPDATE = "install-update";

// SWR cache keys (not IPC channels)
export const IS_SETUP = "is-setup";

// ============================================================
// Shared event names (used by both Go Core SSE and UI)
// ============================================================

export const DOWNLOAD_EVENT_NAME = "download-event";

// ============================================================
// Go Core IPC channel names (kept for Electron fallback handlers
// in home.controller.ts — these forward to Go Core)
// ============================================================

export const ADD_DOWNLOAD_ITEMS = "add-download-items";
export const EDIT_DOWNLOAD_ITEM = "edit-download-item";
export const GET_DOWNLOAD_ITEMS = "get-download-items";
export const START_DOWNLOAD = "start-download";
export const STOP_DOWNLOAD = "stop-download";
export const DELETE_DOWNLOAD_ITEM = "delete-download-item";
export const GET_DOWNLOAD_LOG = "get-download-log";
export const GET_VIDEO_FOLDERS = "get-video-folders";
export const GET_FAVORITES = "get-favorites";
export const ADD_FAVORITE = "add-favorite";
export const REMOVE_FAVORITE = "remove-favorite";
export const GET_APP_STORE = "get-app-store";
export const SET_APP_STORE = "set-app-store";
export const ADD_CONVERSION = "add-conversion";
export const GET_CONVERSIONS = "get-conversions";
export const DELETE_CONVERSION = "delete-conversion";
export const GET_PAGE_TITLE = "get-page-title";

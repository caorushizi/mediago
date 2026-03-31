/* eslint-disable no-console */
import type { AxiosInstance } from 'axios';
import { createApiClient } from './api';
import { EventSource } from 'eventsource';
import type {
  AddConversionParams,
  AddDownloadBatchParams,
  AddFavoriteParams,
  ApiResponse,
  AppStore,
  ConversionItem,
  ConversionPaginationParams,
  CreateTaskParams,
  CreateTaskResponse,
  DownloadPaginationParams,
  DownloadTask,
  EditDownloadTaskParams,
  EnvPaths,
  FavoriteItem,
  HealthResponse,
  PaginatedResponse,
  StartDownloadParams,
  Task,
  TaskEventEmitter,
  TaskListResponse,
  TaskLogResponse,
  UpdateConfigParams,
} from './types';
import { TaskStreamEventEmitter } from './eventEmitter';

/**
 * Options for initializing the MediaGoClient.
 */
export interface MediaGoClientOptions {
  /**
   * The base URL of the MediaGo server.
   * @default 'http://localhost:8080'
   */
  baseURL?: string;

  /**
   * API key for authentication. If provided, it will be sent as
   * an Authorization: Bearer header on every request.
   */
  apiKey?: string;
}

/**
 * The main client for interacting with the MediaGo API.
 */
export class MediaGoClient {
  public readonly api: AxiosInstance;
  private readonly baseURL: string;
  private apiKey?: string;

  /**
   * Creates an instance of MediaGoClient.
   * @param options - Configuration options for the client.
   */
  constructor(options: MediaGoClientOptions = {}) {
    this.baseURL = options.baseURL ?? 'http://localhost:8080';
    this.api = createApiClient(this.baseURL);
    if (options.apiKey) {
      this.setApiKey(options.apiKey);
    }
  }

  /**
   * Sets or updates the API key used for authentication.
   * @param key - The API key to use for Bearer token auth.
   */
  setApiKey(key: string): void {
    this.apiKey = key;
    this.api.defaults.headers.common['Authorization'] = `Bearer ${key}`;
  }

  /**
   * Checks the health of the server.
   * @returns A promise that resolves to the health status message.
   */
  async health(): Promise<ApiResponse<HealthResponse>> {
    return this.api.get('/healthy');
  }

  /**
   * Creates a new download task.
   * @param params - The parameters for the new task.
   * @returns The response from the server.
   */
  async createTask(
    params: CreateTaskParams,
  ): Promise<ApiResponse<CreateTaskResponse>> {
    return this.api.post('/api/tasks', params);
  }

  /**
   * Retrieves a single task by its ID.
   * @param id - The ID of the task to retrieve.
   * @returns The task information.
   */
  async getTask(id: string): Promise<ApiResponse<Task>> {
    return this.api.get(`/api/tasks/${id}`);
  }

  /**
   * Lists all current tasks.
   * @returns A list of all tasks.
   */
  async listTasks(): Promise<ApiResponse<TaskListResponse>> {
    return this.api.get('/api/tasks');
  }

  /**
   * Stops a running task.
   * @param id - The ID of the task to stop.
   * @returns A confirmation message.
   */
  async stopTask(
    id: string,
  ): Promise<ApiResponse<{ message: string }>> {
    return this.api.post(`/api/tasks/${id}/stop`);
  }

  /**
   * Retrieves the full log content of a task.
   * @param id - The ID of the task.
   * @returns The task log content.
   */
  async getTaskLogs(id: string): Promise<ApiResponse<TaskLogResponse>> {
    return this.api.get(`/api/tasks/${id}/logs`);
  }

  /**
   * Updates the server configuration.
   * @param config - The configuration settings to update.
   * @returns A confirmation message.
   */
  async updateConfig(
    config: UpdateConfigParams,
  ): Promise<ApiResponse<{ message: string }>> {
    return this.api.post('/api/config', config);
  }

  // #region Database-Persisted Download Tasks

  /**
   * Adds download tasks to the database (supports batch).
   */
  async addDownloadTasks(
    params: AddDownloadBatchParams,
  ): Promise<ApiResponse<DownloadTask[]>> {
    return this.api.post('/api/downloads', params);
  }

  /**
   * Gets paginated download tasks with optional file existence check.
   */
  async getDownloadTasks(
    params: DownloadPaginationParams = {},
  ): Promise<ApiResponse<PaginatedResponse<DownloadTask>>> {
    const query = new URLSearchParams();
    if (params.current) query.set('current', String(params.current));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    if (params.filter) query.set('filter', params.filter);
    if (params.localPath) query.set('localPath', params.localPath);
    return this.api.get(`/api/downloads?${query.toString()}`);
  }

  /**
   * Gets a single download task by ID.
   */
  async getDownloadTask(id: number): Promise<ApiResponse<DownloadTask>> {
    return this.api.get(`/api/downloads/${id}`);
  }

  /**
   * Edits a download task.
   */
  async editDownloadTask(
    id: number,
    params: EditDownloadTaskParams,
  ): Promise<ApiResponse<DownloadTask>> {
    return this.api.put(`/api/downloads/${id}`, params);
  }

  /**
   * Deletes a download task.
   */
  async deleteDownloadTask(
    id: number,
  ): Promise<ApiResponse<void>> {
    return this.api.delete(`/api/downloads/${id}`);
  }

  /**
   * Starts downloading a task.
   */
  async startDownload(
    id: number,
    params: StartDownloadParams,
  ): Promise<ApiResponse<void>> {
    return this.api.post(`/api/downloads/${id}/start`, params);
  }

  /**
   * Stops downloading a task.
   */
  async stopDownload(
    id: number,
  ): Promise<ApiResponse<void>> {
    return this.api.post(`/api/downloads/${id}/stop`);
  }

  /**
   * Gets download logs for a task.
   */
  async getDownloadLogs(
    id: number,
  ): Promise<ApiResponse<{ id: number; log: string }>> {
    return this.api.get(`/api/downloads/${id}/logs`);
  }

  /**
   * Gets distinct download folders.
   */
  async getDownloadFolders(): Promise<ApiResponse<string[]>> {
    return this.api.get('/api/downloads/folders');
  }

  /**
   * Exports download list as text.
   */
  async exportDownloadList(): Promise<ApiResponse<string>> {
    return this.api.get('/api/downloads/export');
  }

  /**
   * Batch updates download task status.
   */
  async updateDownloadStatus(
    ids: number[],
    status: string,
  ): Promise<ApiResponse<void>> {
    return this.api.put('/api/downloads/status', { ids, status });
  }

  /**
   * Updates the isLive flag of a download task.
   */
  async updateIsLive(
    id: number,
    isLive: boolean,
  ): Promise<ApiResponse<DownloadTask>> {
    return this.api.put(`/api/downloads/${id}/live`, { isLive });
  }

  /**
   * Gets active download tasks (waiting or downloading).
   */
  async getActiveTasks(): Promise<ApiResponse<DownloadTask[]>> {
    return this.api.get('/api/downloads/active');
  }

  // #endregion

  // #region Favorites

  /**
   * Gets all favorites.
   */
  async getFavorites(): Promise<ApiResponse<FavoriteItem[]>> {
    return this.api.get('/api/favorites');
  }

  /**
   * Adds a favorite.
   */
  async addFavorite(
    params: AddFavoriteParams,
  ): Promise<ApiResponse<FavoriteItem>> {
    return this.api.post('/api/favorites', params);
  }

  /**
   * Removes a favorite.
   */
  async removeFavorite(id: number): Promise<ApiResponse<void>> {
    return this.api.delete(`/api/favorites/${id}`);
  }

  /**
   * Exports favorites as JSON.
   */
  async exportFavorites(): Promise<ApiResponse<string>> {
    return this.api.get('/api/favorites/export');
  }

  /**
   * Imports favorites.
   */
  async importFavorites(
    favorites: AddFavoriteParams[],
  ): Promise<ApiResponse<void>> {
    return this.api.post('/api/favorites/import', { favorites });
  }

  // #endregion

  // #region Conversions

  /**
   * Gets paginated conversions.
   */
  async getConversions(
    params: ConversionPaginationParams = {},
  ): Promise<ApiResponse<PaginatedResponse<ConversionItem>>> {
    const query = new URLSearchParams();
    if (params.current) query.set('current', String(params.current));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    return this.api.get(`/api/conversions?${query.toString()}`);
  }

  /**
   * Adds a conversion record.
   */
  async addConversion(
    params: AddConversionParams,
  ): Promise<ApiResponse<ConversionItem>> {
    return this.api.post('/api/conversions', params);
  }

  /**
   * Deletes a conversion record.
   */
  async deleteConversion(id: number): Promise<ApiResponse<void>> {
    return this.api.delete(`/api/conversions/${id}`);
  }

  /**
   * Gets a conversion record by ID.
   */
  async getConversion(id: number): Promise<ApiResponse<ConversionItem>> {
    return this.api.get(`/api/conversions/${id}`);
  }

  // #endregion

  // #region Auth

  /**
   * Sets up authentication by configuring the initial API key.
   * Only works if no API key is currently configured.
   */
  async setupAuth(apiKey: string): Promise<ApiResponse<boolean>> {
    return this.api.post('/api/auth/setup', { apiKey });
  }

  /**
   * Signs in by validating the provided API key.
   */
  async signin(apiKey: string): Promise<ApiResponse<boolean>> {
    return this.api.post('/api/auth/signin', { apiKey });
  }

  /**
   * Checks whether authentication has been configured.
   */
  async isSetup(): Promise<ApiResponse<{ setuped: boolean }>> {
    return this.api.get('/api/auth/status');
  }

  // #endregion

  // #region Utility

  /**
   * Fetches the title of a web page by URL.
   */
  async getPageTitle(url: string): Promise<ApiResponse<{ data: string }>> {
    return this.api.get(`/api/url/title?url=${encodeURIComponent(url)}`);
  }

  /**
   * Gets server environment paths (configDir, binDir, platform).
   */
  async getEnvPaths(): Promise<ApiResponse<EnvPaths>> {
    return this.api.get('/api/env');
  }

  // #endregion

  // #region Config

  /**
   * Gets the full application configuration.
   */
  async getConfig(): Promise<ApiResponse<AppStore>> {
    return this.api.get('/api/config');
  }

  /**
   * Updates multiple configuration fields at once.
   */
  async setConfig(params: Partial<AppStore>): Promise<ApiResponse<{ message: string }>> {
    return this.api.post('/api/config', params);
  }

  /**
   * Gets a single configuration value by key.
   */
  async getConfigKey(key: string): Promise<ApiResponse<any>> {
    return this.api.get(`/api/config/${key}`);
  }

  /**
   * Sets a single configuration value by key.
   */
  async setConfigKey(key: string, value: any): Promise<ApiResponse<{ message: string }>> {
    return this.api.put(`/api/config/${key}`, { value });
  }

  // #endregion

  /**
   * Connects to the server's real-time event stream (SSE) and returns a typed event emitter.
   *
   * @example
   * const client = new MediaGoClient();
   * const events = client.streamEvents();
   *
   * events.on('download-start', (payload) => {
   *   console.log(`Task ${payload.id} started.`);
   * });
   *
   * events.on('download-failed', (payload) => {
   *   console.error(`Task ${payload.id} failed:`, payload.error);
   * });
   *
   * events.on('error', (error) => {
   *   console.error('SSE Connection Error:', error);
   * });
   *
   * // You would need to implement a way to close the underlying EventSource.
   *
   * @returns A strongly-typed event emitter for SSE events.
   */
  streamEvents(): TaskEventEmitter {
    const eventsURL = new URL('/api/events', this.baseURL);
    if (this.apiKey) {
      eventsURL.searchParams.set('token', this.apiKey);
    }
    const source = new EventSource(eventsURL.toString());
    return new TaskStreamEventEmitter(source);
  }
}

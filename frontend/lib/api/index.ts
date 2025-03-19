import { apiClient } from './apiClient';
import * as leadsApi from './leads';

// Re-export apiClient and its response types
export { apiClient } from './apiClient';
export type { ApiResponse, ApiError } from './apiClient';

// Re-export leads API
export * from './leads';

// Export a default object for convenience
export default {
  apiClient,
  leads: leadsApi,
  // Add other API modules as needed
}; 
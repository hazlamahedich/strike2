import { AIFunctionalitySetting, UpdateAIFunctionalitySetting } from '../types/llm';

/**
 * Get all AI functionality settings
 */
export async function getAIFunctionalitySettings(): Promise<AIFunctionalitySetting[]> {
  try {
    const response = await fetch('/api/ai/settings');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch AI functionality settings: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching AI functionality settings:', error);
    throw error;
  }
}

/**
 * Get a specific AI functionality setting by feature key
 */
export async function getAIFunctionalitySetting(featureKey: string): Promise<AIFunctionalitySetting> {
  try {
    const response = await fetch(`/api/ai/settings/${featureKey}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch AI functionality setting: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching AI functionality setting ${featureKey}:`, error);
    throw error;
  }
}

/**
 * Update an AI functionality setting
 */
export async function updateAIFunctionalitySetting(
  featureKey: string,
  update: UpdateAIFunctionalitySetting
): Promise<AIFunctionalitySetting> {
  try {
    const response = await fetch(`/api/ai/settings/${featureKey}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(update),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update AI functionality setting: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating AI functionality setting ${featureKey}:`, error);
    throw error;
  }
}

/**
 * Check if a specific AI functionality is enabled
 */
export async function isAIFunctionalityEnabled(featureKey: string): Promise<boolean> {
  try {
    const setting = await getAIFunctionalitySetting(featureKey);
    return setting.is_enabled;
  } catch (error) {
    console.error(`Error checking if AI functionality ${featureKey} is enabled:`, error);
    // Default to false if there's an error
    return false;
  }
} 
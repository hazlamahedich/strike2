// API functions extracted from the main API module for local use

/**
 * Get lead insights data
 */
export const getLeadInsights = async (leadId: string) => {
  console.log('⭐⭐⭐ Local API - getLeadInsights called with:', leadId);
  const API_ENDPOINT = '/api/v1/leads';
  
  try {
    const response = await fetch(`${API_ENDPOINT}/${leadId}/insights`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch insights: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching lead insights:', error);
    throw error;
  }
};

/**
 * Get lead timeline data
 */
export const getLeadTimeline = async (leadId: string) => {
  console.log('⭐⭐⭐ Local API - getLeadTimeline called with:', leadId);
  const API_ENDPOINT = '/api/v1/leads';
  
  try {
    const response = await fetch(`${API_ENDPOINT}/${leadId}/timeline`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch timeline: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching lead timeline:', error);
    throw error;
  }
};

/**
 * Add a note to a lead
 */
export const addLeadNote = async (leadId: string, note: string) => {
  console.log('⭐⭐⭐ Local API - addLeadNote called with:', leadId, note);
  const API_ENDPOINT = '/api/v1/leads';
  
  try {
    const response = await fetch(`${API_ENDPOINT}/${leadId}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: note }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to add note: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding lead note:', error);
    throw error;
  }
};

/**
 * Delete a lead
 */
export const deleteLead = async (id: string) => {
  console.log('⭐⭐⭐ Local API - deleteLead called with:', id);
  const API_ENDPOINT = '/api/v1/leads';
  
  try {
    const response = await fetch(`${API_ENDPOINT}/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete lead: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting lead:', error);
    throw error;
  }
}; 
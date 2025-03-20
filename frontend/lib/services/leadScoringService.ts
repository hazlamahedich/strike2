import { Lead } from '../types/leads';

interface LeadScore {
  score: number;
  probability: number;
  reasonCodes: string[];
  aiPowered: boolean;
}

/**
 * Score a lead using the backend scoring endpoint
 * This will automatically use AI if available and fall back to rule-based scoring if needed
 */
export async function scoreLeadWithFallback(lead: Lead): Promise<LeadScore> {
  try {
    const response = await fetch('/api/leads/score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lead }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to score lead: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in lead scoring:', error);
    
    // If there's a network error or other issue, fall back to local rule-based scoring
    // This is a double-fallback in case the API is completely unavailable
    return scoreLeadWithLocalRules(lead);
  }
}

/**
 * Score a lead using local rule-based logic
 * This is a last resort if the API is completely unavailable
 */
function scoreLeadWithLocalRules(lead: Lead): LeadScore {
  let score = 50; // Start with a neutral score
  const reasonCodes = [];
  
  // Rule 1: Score based on lead source
  if (lead.source) {
    const source = lead.source.toLowerCase();
    if (source.includes('referral')) {
      score += 20;
      reasonCodes.push('Referral leads have higher conversion rates');
    } else if (source.includes('website')) {
      score += 10;
      reasonCodes.push('Website leads show moderate intent');
    } else if (source.includes('cold') || source.includes('list')) {
      score -= 10;
      reasonCodes.push('Cold leads typically have lower conversion rates');
    }
  }
  
  // Rule 2: Score based on data completeness
  let completeness = 0;
  if (lead.name) completeness++;
  if (lead.company) completeness++;
  if (lead.position) completeness++;
  if (lead.email) completeness++;
  if (lead.phone) completeness++;
  
  if (completeness >= 4) {
    score += 15;
    reasonCodes.push('Complete contact information indicates higher quality lead');
  } else if (completeness <= 2) {
    score -= 10;
    reasonCodes.push('Incomplete contact information');
  }
  
  // Rule 3: Score based on recency
  if (lead.last_contact_date) {
    const daysSinceLastContact = Math.floor(
      (new Date().getTime() - new Date(lead.last_contact_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastContact < 7) {
      score += 10;
      reasonCodes.push('Recent contact indicates active engagement');
    } else if (daysSinceLastContact > 30) {
      score -= 15;
      reasonCodes.push('No recent contact');
    }
  } else {
    score -= 10;
    reasonCodes.push('No record of previous contact');
  }
  
  // Ensure score stays within 1-100 range
  score = Math.max(1, Math.min(100, score));
  
  // Convert score to probability (simple linear conversion)
  const probability = score / 100;
  
  // If we don't have at least 2 reason codes, add a generic one
  if (reasonCodes.length < 2) {
    reasonCodes.push('Based on standard lead scoring criteria');
  }
  
  return {
    score,
    probability,
    reasonCodes,
    aiPowered: false
  };
} 
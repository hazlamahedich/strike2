/**
 * Utilities for geocoding addresses and determining timezones
 */

import axios from 'axios';

type TimezoneResponse = {
  dstOffset: number;
  rawOffset: number;
  status: string;
  timeZoneId: string;
  timeZoneName: string;
};

/**
 * Gets timezone from an address using Google Maps Timezone API
 * 
 * @param address - Full or partial address string
 * @returns Promise with timezone ID (e.g., "America/New_York")
 */
export async function getTimezoneFromAddress(address: string): Promise<string> {
  try {
    if (!address || address.trim() === '') {
      return Intl.DateTimeFormat().resolvedOptions().timeZone; // Default to browser timezone
    }

    // First geocode the address to get coordinates
    const geocodingResponse = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      {
        params: {
          address: address,
          key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      }
    );

    if (geocodingResponse.data.status !== 'OK' || !geocodingResponse.data.results.length) {
      console.error('Geocoding failed:', geocodingResponse.data.status);
      return Intl.DateTimeFormat().resolvedOptions().timeZone; // Default to browser timezone
    }

    const { lat, lng } = geocodingResponse.data.results[0].geometry.location;
    const timestamp = Math.floor(Date.now() / 1000);

    // Then get the timezone for these coordinates
    const timezoneResponse = await axios.get<TimezoneResponse>(
      `https://maps.googleapis.com/maps/api/timezone/json`,
      {
        params: {
          location: `${lat},${lng}`,
          timestamp: timestamp,
          key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      }
    );

    if (timezoneResponse.data.status !== 'OK') {
      console.error('Timezone API failed:', timezoneResponse.data.status);
      return Intl.DateTimeFormat().resolvedOptions().timeZone; // Default to browser timezone
    }

    return timezoneResponse.data.timeZoneId;
  } catch (error) {
    console.error('Error getting timezone from address:', error);
    return Intl.DateTimeFormat().resolvedOptions().timeZone; // Default to browser timezone
  }
}

/**
 * Gets timezone from coordinates
 * 
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Promise with timezone ID
 */
export async function getTimezoneFromCoordinates(lat: number, lng: number): Promise<string> {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    
    const timezoneResponse = await axios.get<TimezoneResponse>(
      `https://maps.googleapis.com/maps/api/timezone/json`,
      {
        params: {
          location: `${lat},${lng}`,
          timestamp: timestamp,
          key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      }
    );

    if (timezoneResponse.data.status !== 'OK') {
      console.error('Timezone API failed:', timezoneResponse.data.status);
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    return timezoneResponse.data.timeZoneId;
  } catch (error) {
    console.error('Error getting timezone from coordinates:', error);
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
}

/**
 * Attempts to extract timezone from a record of lead data
 * Checks custom_fields.address first, then other location data
 * 
 * @param lead - Lead object
 * @returns Promise with timezone ID
 */
export async function getLeadTimezone(lead: any): Promise<string> {
  // First try to get timezone from address if available
  if (lead?.custom_fields?.address) {
    return getTimezoneFromAddress(lead.custom_fields.address);
  }
  
  // If no explicit address, try to construct one from other fields
  const addressParts = [];
  
  if (lead?.custom_fields?.city) addressParts.push(lead.custom_fields.city);
  if (lead?.custom_fields?.state) addressParts.push(lead.custom_fields.state);
  if (lead?.custom_fields?.country) addressParts.push(lead.custom_fields.country);
  if (lead?.custom_fields?.postal_code) addressParts.push(lead.custom_fields.postal_code);
  
  if (addressParts.length > 0) {
    return getTimezoneFromAddress(addressParts.join(', '));
  }
  
  // If we can't determine timezone, default to user's timezone
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
} 
import * as Location from "expo-location";

// Cache for geocoding results to avoid rate limits
const geocodeCache = new Map<string, { latitude: number; longitude: number } | null>();

// Rate limiting: track last request time and enforce minimum delay
let lastRequestTime = 0;
const MIN_REQUEST_DELAY_MS = 200; // 200ms between requests

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Geocode an address to coordinates using Expo Location API with caching and rate limiting
 */
export async function geocodeAddress(
  address: string,
  city: string,
  state: string,
  zipCode: string
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const fullAddress = `${address}, ${city}, ${state} ${zipCode}`;
    
    // Check cache first
    if (geocodeCache.has(fullAddress)) {
      const cached = geocodeCache.get(fullAddress);
      console.log(`[Geocoding] Using cached result for: ${fullAddress}`);
      return cached || null;
    }
    
    // Rate limiting: wait if needed
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_DELAY_MS) {
      const waitTime = MIN_REQUEST_DELAY_MS - timeSinceLastRequest;
      console.log(`[Geocoding] Rate limiting: waiting ${waitTime}ms`);
      await sleep(waitTime);
    }
    
    console.log(`[Geocoding] Attempting to geocode: ${fullAddress}`);
    lastRequestTime = Date.now();
    
    const results = await Location.geocodeAsync(fullAddress);
    
    if (results && results.length > 0) {
      const { latitude, longitude } = results[0];
      const coords = { latitude, longitude };
      
      // Cache the result
      geocodeCache.set(fullAddress, coords);
      
      console.log(`[Geocoding] Success: ${fullAddress} -> ${latitude}, ${longitude}`);
      return coords;
    }
    
    console.warn(`[Geocoding] No results for: ${fullAddress}`);
    
    // Cache null result to avoid retrying
    geocodeCache.set(fullAddress, null);
    return null;
  } catch (error: any) {
    // Check if it's a rate limit error
    if (error?.message?.includes("rate limit")) {
      console.warn(`[Geocoding] Rate limit hit, using cache or returning null`);
      // Cache null to prevent repeated attempts
      const fullAddress = `${address}, ${city}, ${state} ${zipCode}`;
      geocodeCache.set(fullAddress, null);
    } else {
      console.error(`[Geocoding] Error geocoding address:`, error);
    }
    return null;
  }
}

/**
 * Batch geocode multiple addresses with rate limiting
 */
export async function geocodeAddresses(
  addresses: Array<{
    address: string;
    city: string;
    state: string;
    zipCode: string;
  }>
): Promise<Array<{ latitude: number; longitude: number } | null>> {
  const results: Array<{ latitude: number; longitude: number } | null> = [];
  
  // Process addresses sequentially to respect rate limits
  for (const addr of addresses) {
    const result = await geocodeAddress(addr.address, addr.city, addr.state, addr.zipCode);
    results.push(result);
  }
  
  return results;
}

/**
 * Clear the geocoding cache
 */
export function clearGeocodeCache(): void {
  geocodeCache.clear();
  console.log("[Geocoding] Cache cleared");
}

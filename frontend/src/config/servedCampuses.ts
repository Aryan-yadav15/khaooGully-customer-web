/**
 * Configuration for campuses currently being served
 * 
 * To add a new campus to service:
 * 1. Add the campus code to the SERVED_CAMPUS_CODES array below
 * 2. The campus will automatically become available for selection
 * 3. Users in that campus will see pools and restaurants for that campus
 * 
 * Campus codes should match the 'code' field in the campuses table
 */

export const SERVED_CAMPUS_CODES = [
  'C5-1', // Kings Palace - 19
  // Add more campus codes here as you expand service
  // Example: 'C3', 'C15', 'C25'
];

/**
 * Check if a campus code is currently being served
 */
export const isCampusServed = (campusCode: string): boolean => {
  return SERVED_CAMPUS_CODES.includes(campusCode);
};

/**
 * Get display message for locked campuses
 */
export const getLockedCampusMessage = (): string => {
  return 'Coming Soon! We\'re not serving this campus yet.';
};

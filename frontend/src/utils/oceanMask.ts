/**
 * frontend/src/utils/oceanMask.ts
 * ─────────────────────────────────
 * Geographic boundary and point-in-polygon verification to prevent
 * selecting land coordinates in OceanEmbed.
 */

// Ray-casting algorithm for 2D point-in-polygon test
function isPointInPolygon(lat: number, lon: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > lon) !== (yj > lon)) && (lat < (xj - xi) * (lon - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Polygon: Indian Subcontinent mainland (India, Pakistan, Bangladesh, Nepal)
const INDIA_LAND_POLYGON: [number, number][] = [
  [8.08, 77.55],   // Kanyakumari
  [8.50, 76.95],   // Trivandrum
  [9.93, 76.26],   // Kochi
  [11.25, 75.78],  // Calicut
  [12.91, 74.85],  // Mangalore
  [15.49, 73.82],  // Goa
  [18.92, 72.83],  // Mumbai
  [20.50, 72.75],  // Daman
  [21.50, 72.20],  // Bhavnagar
  [20.70, 70.90],  // Diu
  [21.50, 69.50],  // Porbandar
  [22.30, 68.90],  // Dwarka
  [23.00, 68.50],  // Kutch coast
  [24.50, 68.00],  // Indo-Pak border coast
  [25.00, 66.50],  // Karachi
  [25.30, 62.00],  // Gwadar
  [30.00, 60.00],  // Pak-Iran border
  [37.00, 74.00],  // Kashmir North
  [31.50, 79.00],  // Himachal / Tibet border
  [28.00, 88.50],  // Sikkim / Nepal
  [27.50, 92.00],  // Bhutan border
  [28.50, 96.50],  // Arunachal North
  [26.00, 97.00],  // Myanmar border
  [22.00, 92.50],  // Chittagong border
  [21.50, 89.50],  // Sundarbans (Bangladesh)
  [21.60, 87.50],  // Digha / Odisha
  [19.80, 85.80],  // Puri
  [17.70, 83.30],  // Visakhapatnam
  [15.80, 80.50],  // Krishna delta
  [13.08, 80.27],  // Chennai
  [11.93, 79.83],  // Pondicherry
  [10.30, 79.85],  // Point Calimere
  [9.28, 79.30],   // Rameswaram
  [8.76, 78.13],   // Tuticorin
  [8.08, 77.55],   // Kanyakumari
];

// Polygon: Sri Lanka
const SRI_LANKA_POLYGON: [number, number][] = [
  [5.90, 80.40],
  [6.00, 80.10],
  [7.00, 79.80],
  [8.50, 79.80],
  [9.80, 80.20],
  [9.50, 80.80],
  [8.50, 81.30],
  [7.50, 81.80],
  [6.50, 81.80],
  [6.00, 81.10],
  [5.90, 80.40],
];

// Polygon: Arabian Peninsula (Oman, Yemen, Saudi Arabia, UAE)
const ARABIA_POLYGON: [number, number][] = [
  [12.50, 43.50],
  [13.00, 45.00],
  [14.50, 49.00],
  [16.50, 53.00],
  [17.50, 55.50],
  [19.00, 57.80],
  [22.50, 59.80],
  [24.00, 57.50],
  [26.00, 56.50],
  [30.00, 48.00],
  [33.00, 35.00],
  [22.00, 39.00],
  [15.00, 42.50],
  [12.50, 43.50],
];

// Polygon: Indochina / Myanmar / Thailand landmass
const INDOCHINA_POLYGON: [number, number][] = [
  [16.00, 94.20],
  [18.00, 94.00],
  [20.00, 92.80],
  [22.00, 92.50],
  [26.00, 97.00],
  [25.00, 105.00],
  [10.00, 105.00],
  [8.00, 100.00],
  [6.00, 100.00],
  [4.00, 103.00],
  [1.50, 104.00],
  [3.00, 101.00],
  [6.00, 99.50],
  [10.00, 98.50],
  [13.00, 98.20],
  [15.00, 97.80],
  [16.50, 96.00],
  [16.00, 94.20],
];

// Polygon: Horn of Africa / Somalia
const EAST_AFRICA_POLYGON: [number, number][] = [
  [12.00, 43.00],
  [12.00, 51.00],
  [8.00, 50.00],
  [3.00, 47.00],
  [-1.00, 42.00],
  [-5.00, 39.00],
  [-12.00, 40.00],
  [-12.00, 35.00],
  [5.00, 35.00],
  [12.00, 43.00],
];

export interface OceanValidationResult {
  isOcean: boolean;
  regionName: string;
}

/**
 * Validates if the given geographic coordinate is within the ocean
 * and returns the descriptive marine region name.
 */
export function validateOceanCoordinate(lat: number, lon: number): OceanValidationResult {
  // Check against defined land polygons
  if (isPointInPolygon(lat, lon, INDIA_LAND_POLYGON)) {
    return { isOcean: false, regionName: 'Indian Subcontinent (Land)' };
  }
  if (isPointInPolygon(lat, lon, SRI_LANKA_POLYGON)) {
    return { isOcean: false, regionName: 'Sri Lanka (Land)' };
  }
  if (isPointInPolygon(lat, lon, ARABIA_POLYGON)) {
    return { isOcean: false, regionName: 'Arabian Peninsula (Land)' };
  }
  if (isPointInPolygon(lat, lon, INDOCHINA_POLYGON)) {
    return { isOcean: false, regionName: 'Myanmar / Indochina (Land)' };
  }
  if (isPointInPolygon(lat, lon, EAST_AFRICA_POLYGON)) {
    return { isOcean: false, regionName: 'East Africa (Land)' };
  }

  // Extreme northern latitudes beyond ocean coverage in this longitude band
  if (lat > 25.5 && lon > 57.0 && lon < 95.0) {
    return { isOcean: false, regionName: 'Northern Landmass' };
  }

  // Determine oceanographic region name
  let name = 'Indian Ocean';
  if (lat >= 5.0 && lat <= 25.0 && lon >= 55.0 && lon <= 77.5) {
    name = 'Arabian Sea';
  } else if (lat >= 5.0 && lat <= 22.5 && lon >= 80.0 && lon <= 94.0) {
    name = 'Bay of Bengal';
  } else if (lat >= 4.0 && lat <= 15.0 && lon > 94.0 && lon <= 98.5) {
    name = 'Andaman Sea';
  } else if (lat >= -10.0 && lat < 5.0 && lon >= 50.0 && lon <= 100.0) {
    name = 'Equatorial Indian Ocean';
  } else if (lat > 20.0 && lon >= 57.0 && lon <= 60.5) {
    name = 'Gulf of Oman';
  } else if (lat >= 11.0 && lat <= 15.0 && lon >= 43.0 && lon <= 53.0) {
    name = 'Gulf of Aden';
  }

  return { isOcean: true, regionName: name };
}

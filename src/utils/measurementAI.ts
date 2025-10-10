/**
 * Measurement AI Enhancement Utilities
 * Provides intelligent measurement assistance
 */

/**
 * Validate measurements and provide suggestions
 */
export const validateMeasurements = (
  pins: { x: number; y: number }[],
  lines: { length: number }[]
): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} => {
  if (pins.length < 4 || lines.length < 2) {
    return {
      isValid: false,
      warnings: ["Not enough measurement points"],
      suggestions: ["Add at least 4 corner points to measure the remnant"],
    };
  }

  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check for unusual aspect ratios
  const sortedLines = [...lines].sort((a, b) => b.length - a.length);
  const aspectRatio = sortedLines[0].length / sortedLines[1].length;

  if (aspectRatio > 5) {
    warnings.push("Unusual aspect ratio detected");
    suggestions.push("Double-check your measurements - this shape seems very long and narrow");
  }

  // Check for very small measurements
  if (sortedLines[1].length < 6) {
    warnings.push("Very small width detected");
    suggestions.push("Ensure you have calibrated correctly for accurate small measurements");
  }

  // Check for very large measurements (unlikely for remnants)
  if (sortedLines[0].length > 120) {
    warnings.push("Unusually large dimension detected");
    suggestions.push("For remnants, dimensions over 10 feet are rare. Please verify your calibration");
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    suggestions,
  };
};

/**
 * Suggest measurement templates based on shape
 */
export const suggestTemplate = (pins: { x: number; y: number }[]): {
  name: string;
  description: string;
  icon: string;
  points: { x: number; y: number }[];
} | null => {
  const numPins = pins.length;
  
  if (numPins === 4) {
    return {
      name: "Rectangle",
      description: "Standard rectangular remnant",
      icon: "square-outline",
      points: pins,
    };
  } else if (numPins === 6) {
    return {
      name: "L-Shape",
      description: "L-shaped countertop remnant",
      icon: "git-branch-outline",
      points: pins,
    };
  } else if (numPins === 8) {
    return {
      name: "U-Shape",
      description: "U-shaped kitchen countertop",
      icon: "git-network-outline",
      points: pins,
    };
  }
  
  return null;
};

/**
 * Quick shape templates for common countertop shapes
 */
export const MEASUREMENT_TEMPLATES = {
  rectangle: {
    name: "Rectangle",
    icon: "square-outline",
    description: "Standard rectangular remnant",
    pinCount: 4,
  },
  lshape: {
    name: "L-Shape",
    icon: "git-branch-outline",
    description: "L-shaped kitchen counter",
    pinCount: 6,
  },
  ushape: {
    name: "U-Shape",
    icon: "git-network-outline",
    description: "U-shaped kitchen counter",
    pinCount: 8,
  },
  island: {
    name: "Island",
    icon: "square",
    description: "Kitchen island or standalone piece",
    pinCount: 4,
  },
  peninsula: {
    name: "Peninsula",
    icon: "grid",
    description: "Peninsula countertop",
    pinCount: 6,
  },
};

/**
 * Calculate area of polygon from points
 */
export const calculatePolygonArea = (points: { x: number; y: number }[], pixelsPerInch: number): number => {
  if (points.length < 3) return 0;

  // Shoelace formula
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  area = Math.abs(area / 2);

  // Convert pixel area to square inches
  const areaInSquareInches = area / (pixelsPerInch * pixelsPerInch);
  return areaInSquareInches;
};

/**
 * Calculate perimeter of polygon from points
 */
export const calculatePolygonPerimeter = (points: { x: number; y: number }[], pixelsPerInch: number): number => {
  if (points.length < 2) return 0;

  let perimeter = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const distance = Math.sqrt(
      Math.pow(points[j].x - points[i].x, 2) + Math.pow(points[j].y - points[i].y, 2)
    );
    perimeter += distance;
  }

  return perimeter / pixelsPerInch;
};

/**
 * Detect if shape has right angles (for rectangles)
 */
export const hasRightAngles = (lines: { angle?: number }[]): boolean => {
  if (lines.length < 3) return false;

  let rightAngleCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const line1 = lines[i];
    const line2 = lines[(i + 1) % lines.length];
    
    if (!line1.angle || !line2.angle) continue;

    const angleDiff = Math.abs(line1.angle - line2.angle);
    // Check if angle is close to 90 degrees
    if (Math.abs(angleDiff - 90) < 10 || Math.abs(angleDiff - 270) < 10) {
      rightAngleCount++;
    }
  }

  return rightAngleCount >= 2;
};

/**
 * Snap point to grid for better alignment
 */
export const snapToGrid = (point: { x: number; y: number }, gridSize: number): { x: number; y: number } => {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
};

/**
 * Generate measurement summary
 */
export const generateMeasurementSummary = (
  measurements: { length: number; width: number; area: number },
  type: "remnant" | "space"
): string => {
  const { length, width, area } = measurements;
  const areaInSqFt = (area / 144).toFixed(2);

  const summary = `${type === "remnant" ? "Remnant" : "Space"} Dimensions:
• Length: ${length.toFixed(1)}"
• Width: ${width.toFixed(1)}"
• Area: ${area.toFixed(1)} sq in (${areaInSqFt} sq ft)

${type === "space" ? "💡 Looking for remnants that are at least these dimensions" : "📦 This remnant is ready for listing"}`;

  return summary;
};

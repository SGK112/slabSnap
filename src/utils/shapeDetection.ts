import { getOpenAIClient } from "../api/openai";

export interface DetectedShape {
  type: 'rectangle' | 'square' | 'oval' | 'circle' | 'L-shape' | 'U-shape' | 'custom';
  confidence: number; // 0-1
  corners: { x: number; y: number }[]; // Normalized 0-1 coordinates
  description: string;
  suggestedPins?: { x: number; y: number }[];
}

export interface ShapeDetectionResult {
  shapes: DetectedShape[];
  primaryShape?: DetectedShape;
  message?: string;
}

/**
 * Detects shapes in an image using AI vision
 * Returns normalized corner coordinates (0-1 range) that can be mapped to any image size
 */
export async function detectShapesInImage(
  imageUri: string
): Promise<ShapeDetectionResult> {
  try {
    // Convert image to base64
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);

    // Prepare the prompt for shape detection
    const prompt = `Analyze this image and detect any measurable shapes like countertops, tables, slabs, sinks, or surfaces.

CRITICAL: Respond with ONLY valid JSON. No explanations, no markdown, no extra text. Just the JSON object.

For each shape you detect, provide:
1. Shape type (rectangle, square, oval, circle, L-shape, U-shape, or custom)
2. Corner coordinates as percentages (0-100) of image width and height
3. Confidence level (0-100)

JSON format (copy this structure exactly):
{
  "shapes": [
    {
      "type": "rectangle",
      "confidence": 95,
      "corners": [
        {"x": 10, "y": 20},
        {"x": 90, "y": 20},
        {"x": 90, "y": 80},
        {"x": 10, "y": 80}
      ],
      "description": "Large countertop surface"
    }
  ]
}

Rules:
- For rectangles/squares: Provide exactly 4 corners (top-left, top-right, bottom-right, bottom-left clockwise)
- For L-shapes: Provide exactly 6 corners in clockwise order
- For ovals/circles: Provide 4-8 points around the perimeter
- Focus on the MAIN measurable surface only
- If no clear shape is visible, return: {"shapes": []}
- Respond with ONLY the JSON object, nothing else`;

    // Call OpenAI GPT-4 Vision
    const client = getOpenAIClient();
    const result = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { 
              type: "image_url", 
              image_url: { 
                url: `data:image/jpeg;base64,${base64}` 
              } 
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 1000,
    });

    const responseText = result.choices[0]?.message?.content || "";
    
    console.log("[Shape Detection] AI Response:", responseText.substring(0, 200));
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = responseText.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    }
    
    // Try to find JSON object if wrapped in text
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }
    
    console.log("[Shape Detection] Extracted JSON:", jsonText.substring(0, 200));
    
    // Parse the response
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("[Shape Detection] JSON parse failed:", parseError);
      console.log("[Shape Detection] Problematic text:", jsonText);
      
      // If no shapes found or can't parse, return empty result
      return {
        shapes: [],
        message: "Could not detect clear shapes. Try taking a clearer photo or use manual mode.",
      };
    }
    
    // Validate the parsed structure
    if (!parsed.shapes || !Array.isArray(parsed.shapes) || parsed.shapes.length === 0) {
      console.log("[Shape Detection] No shapes in response");
      return {
        shapes: [],
        message: "No measurable shapes detected. Use manual mode to place pins.",
      };
    }
    
    // Normalize coordinates to 0-1 range
    const normalizedShapes: DetectedShape[] = parsed.shapes.map((shape: any) => ({
      type: shape.type,
      confidence: shape.confidence / 100,
      corners: shape.corners.map((c: any) => ({
        x: c.x / 100,
        y: c.y / 100,
      })),
      description: shape.description,
    }));

    // Find the shape with highest confidence
    const primaryShape = normalizedShapes.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    , normalizedShapes[0]);

    console.log("[Shape Detection] Success! Found", normalizedShapes.length, "shape(s)");

    return {
      shapes: normalizedShapes,
      primaryShape,
      message: normalizedShapes.length > 0 
        ? `Found ${normalizedShapes.length} shape${normalizedShapes.length > 1 ? 's' : ''}`
        : "No shapes detected. Try manual mode.",
    };
  } catch (error) {
    console.error("[Shape Detection] Error:", error);
    return {
      shapes: [],
      message: "Detection failed. Use manual mode to place pins.",
    };
  }
}

/**
 * Convert image blob to base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Suggest pin placements for a detected shape
 * Converts normalized coordinates to actual pixel positions
 */
export function convertShapeToPin(
  shape: DetectedShape,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number }[] {
  return shape.corners.map(corner => ({
    x: corner.x * imageWidth,
    y: corner.y * imageHeight,
  }));
}

/**
 * Determine if a shape should use straight lines or curves
 */
export function shouldUseCurves(shapeType: DetectedShape['type']): boolean {
  return shapeType === 'oval' || shapeType === 'circle';
}

/**
 * Calculate dimensions from detected shape
 */
export function estimateShapeDimensions(
  corners: { x: number; y: number }[],
  pixelsPerInch: number
): { length: number; width: number; area: number } | null {
  if (corners.length < 3) return null;

  // For rectangles and L-shapes, find min/max bounds
  const xCoords = corners.map(c => c.x);
  const yCoords = corners.map(c => c.y);
  
  const width = (Math.max(...xCoords) - Math.min(...xCoords)) / pixelsPerInch;
  const height = (Math.max(...yCoords) - Math.min(...yCoords)) / pixelsPerInch;
  
  // Calculate area based on shape type
  // For complex shapes, use polygon area formula
  let area = 0;
  for (let i = 0; i < corners.length; i++) {
    const j = (i + 1) % corners.length;
    area += corners[i].x * corners[j].y;
    area -= corners[j].x * corners[i].y;
  }
  area = Math.abs(area / 2) / (pixelsPerInch * pixelsPerInch);

  return {
    length: Math.max(width, height),
    width: Math.min(width, height),
    area,
  };
}

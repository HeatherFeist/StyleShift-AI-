import { GoogleGenAI } from "@google/genai";
import { EditOptions } from "../types";

/**
 * Helper to convert a File object to a Base64 string suitable for the API
 * (strips the data URL prefix).
 */
export const fileToGenerativePart = async (file: File): Promise<{ mimeType: string; data: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Extract the base64 data part (remove "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        mimeType: file.type,
        data: base64Data,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Helper to extract the base64 image string from a Gemini response.
 */
const extractImageFromResponse = (response: any): string => {
  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error("No candidates returned from Gemini.");
  }

  const parts = candidates[0].content?.parts;
  if (!parts) {
    throw new Error("No content parts returned.");
  }

  // Look for the inlineData part which contains the image
  const generatedImagePart = parts.find((p: any) => p.inlineData);

  if (generatedImagePart && generatedImagePart.inlineData) {
    const mimeType = generatedImagePart.inlineData.mimeType || 'image/png';
    const base64Data = generatedImagePart.inlineData.data;
    return `data:${mimeType};base64,${base64Data}`;
  }

  throw new Error("No image data found in the response.");
};

/**
 * Constructs a prompt based on the user's selected options, intelligently skipping
 * instructions if a reference image is provided for that category.
 */
const buildPrompt = (options: EditOptions): string => {
  const parts: string[] = [];

  // Strong Identity Preservation Instructions
  parts.push("STRICT REQUIREMENT: You are an expert photo editor. Your goal is to keep the person's facial identity, facial features (eyes, nose, lips, jawline), and facial expression EXACTLY as they appear in the first image (the Source Selfie).");
  parts.push("Do NOT generate a new face. Do NOT blend the face with other reference images. The final image must look like a photograph of the SAME person from the source image, just with different styling.");

  // Style Strength instructions
  if (options.styleStrength === 'Subtle') {
    parts.push("EDITING MODE: Subtle. Apply changes delicately. Blend new elements (like hair color) with the original lighting and textures. If a style change conflicts with identity, prioritize identity.");
  } else if (options.styleStrength === 'Intense') {
    parts.push("EDITING MODE: Intense/Dramatic. Make bold changes to the requested areas (hair, outfit, background), but strictly keep the facial center masked and unchanged.");
  } else {
    parts.push("EDITING MODE: Balanced. Create a realistic transformation. Ensure the new elements look like they physically belong in the scene with the original person.");
  }

  // Hair - Text instruction only if no reference
  if (!options.hairReference) {
    if (options.hairColor !== 'No Change' || options.hairStyle !== 'No Change') {
      const color = options.hairColor !== 'No Change' ? options.hairColor : '';
      const style = options.hairStyle !== 'No Change' ? options.hairStyle : '';
      parts.push(`ACTION: Change the hair to ${color} ${style}. Ensure the hairline remains natural and realistic.`);
    }
  }

  // Makeup - Text instruction only if no reference
  if (!options.makeupReference) {
    if (options.makeupLook !== 'No Change') {
      parts.push(`ACTION: Apply a ${options.makeupLook} makeup style. Keep skin texture realistic.`);
    }
  }

  // Outfit - Text instruction only if no reference
  if (!options.outfitReference) {
    if (options.outfit !== 'No Change') {
      parts.push(`ACTION: Change the outfit to strictly match a ${options.outfit}. Ensure the clothing fits the pose naturally.`);
    }
  }

  if (options.background !== 'No Change') {
    parts.push(`ACTION: Change the background to ${options.background}. Update the lighting on the subject to match the new environment naturally.`);
  }

  if (options.customPrompt.trim()) {
    parts.push(`CUSTOM INSTRUCTIONS: ${options.customPrompt}`);
  }

  parts.push("OUTPUT: High-quality, photorealistic image.");

  return parts.join(" ");
};

export const generateEditedImage = async (
  imageFile: File,
  options: EditOptions
): Promise<string> => {
  // Initialize client here to ensure we capture the latest API key if it changed
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    // 1. Prepare Parts Array (Base Image + References)
    const parts: any[] = [];
    
    // Part 0: Base Image
    parts.push({ inlineData: await fileToGenerativePart(imageFile) });
    
    // Initialize Prompt
    let prompt = "ROLE: Photo Editor. \nSOURCE IMAGE: The first image is the 'Selfie' of the user. \nTASK: Modify the Selfie according to the instructions below. \n";
    
    // 2. Handle Reference Images
    // We start counting from the "2nd" image because the 1st is the base image.
    let imageIndex = 2; 

    // Hair Reference
    if (options.hairReference) {
      parts.push({ inlineData: await fileToGenerativePart(options.hairReference) });
      const ordinal = getOrdinal(imageIndex);
      prompt += `REFERENCE ${imageIndex - 1}: Use the ${ordinal} image as the 'Hair Reference'. Extract ONLY the hairstyle, texture, and color. Do NOT copy the face from this reference. Apply this hair to the person in the Selfie. `;
      imageIndex++;
    }

    // Makeup Reference
    if (options.makeupReference) {
      parts.push({ inlineData: await fileToGenerativePart(options.makeupReference) });
      const ordinal = getOrdinal(imageIndex);
      prompt += `REFERENCE ${imageIndex - 1}: Use the ${ordinal} image as the 'Makeup Reference'. Extract the makeup style/colors. Do NOT copy the face. Apply this makeup to the person in the Selfie. `;
      imageIndex++;
    }

    // Outfit Reference
    if (options.outfitReference) {
      parts.push({ inlineData: await fileToGenerativePart(options.outfitReference) });
      const ordinal = getOrdinal(imageIndex);
      prompt += `REFERENCE ${imageIndex - 1}: Use the ${ordinal} image as the 'Outfit Reference'. Extract the clothing items. Do NOT copy the person or body shape if it differs significantly. Dress the person in the Selfie in this outfit. `;
      imageIndex++;
    }

    // 3. Add Text Instructions (buildPrompt handles skipping text logic if refs exist)
    prompt += buildPrompt(options);

    console.log("Sending prompt to Gemini:", prompt);
    console.log(`Total images sent: ${parts.length}`);

    // Append the full text prompt to parts
    parts.push({ text: prompt });

    // Determine model and configuration based on resolution
    const isHighRes = options.resolution === 'High (Pro)';
    const model = isHighRes ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    
    // Config for image generation parameters
    const config: any = {};
    if (isHighRes) {
       // Gemini 3 Pro supports explicit image size configuration
       config.imageConfig = { imageSize: '2K' };
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: parts
      },
      config: Object.keys(config).length > 0 ? config : undefined
    });

    return extractImageFromResponse(response);

  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

// Helper for natural language indexing
const getOrdinal = (n: number): string => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

/**
 * Generates a preview image of an outfit based on a text description.
 */
export const generateOutfitPreview = async (description: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const prompt = `Generate a high-quality, photorealistic fashion photography shot of a mannequin or model wearing the following outfit: "${description}". The image should focus on the clothing details. Use a neutral studio background.`;
    
    console.log("Generating outfit preview for:", description);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      }
    });

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Error generating outfit preview:", error);
    throw error;
  }
};

import { fal } from "@fal-ai/client";

/**
 * Generates an image using fal.ai (Flux or similar high-quality model)
 * based on the generated image prompt.
 */
export async function generateFalImage(prompt: string): Promise<string | null> {
  if (!process.env.FAL_KEY) {
    console.error("[Fal AI] FAL_KEY is missing in environment variables.");
    return null;
  }

  try {
    console.log(`[Fal AI] Generating image for prompt: ${prompt.substring(0, 50)}...`);
    
    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: prompt,
        image_size: "landscape_4_3",
        num_inference_steps: 4,
        enable_safety_checker: true
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    if (result.data && (result.data as any).images && (result.data as any).images.length > 0) {
      return (result.data as any).images[0].url;
    }

    return null;
  } catch (error) {
    console.error("[Fal AI] Image generation failed:", error);
    return null;
  }
}

import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";

// next-cloudinary calls this to get a signature + timestamp
export async function GET() {
  // You can whitelist specific params; here we sign an empty preset-less upload
  const timestamp = Math.round(Date.now() / 1000);

  // If you want to force a folder, add it here and sign it too, e.g.: { timestamp, folder: "naijamingles" }
  const paramsToSign = { timestamp };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET as string
  );

  return NextResponse.json({
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY, // safe to share to client
  });
}

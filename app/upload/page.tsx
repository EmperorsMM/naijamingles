"use client";

import { CldUploadWidget, CldImage } from "next-cloudinary";
import { useState } from "react";

export default function UploadPage() {
  const [unsignedId, setUnsignedId] = useState<string | null>(null);
  const [signedId, setSignedId] = useState<string | null>(null);

  const unsignedPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET; // from your .env.local

  return (
    <main className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Cloudinary Upload Test</h1>

      {/* UNSIGNED (quick & easy) */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium">Unsigned Upload</h2>
        <CldUploadWidget
          uploadPreset={unsignedPreset}
          onUpload={(result) => {
            // @ts-ignore
            const pid = result?.info?.public_id as string | undefined;
            if (pid) setUnsignedId(pid);
          }}
        >
          {({ open }) => (
            <button
              className="px-4 py-2 rounded bg-black text-white"
              onClick={() => open?.()}
              type="button"
            >
              Upload (Unsigned)
            </button>
          )}
        </CldUploadWidget>

        {unsignedId && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">public_id: {unsignedId}</p>
            <CldImage src={unsignedId} width="600" height="400" alt="Unsigned upload" className="rounded-lg" />
          </div>
        )}
      </section>

      {/* SIGNED (secure; uses our /api/cloudinary/sign) */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium">Signed Upload</h2>
        <CldUploadWidget
          signatureEndpoint="/api/cloudinary/sign"
          onUpload={(result) => {
            // @ts-ignore
            const pid = result?.info?.public_id as string | undefined;
            if (pid) setSignedId(pid);
          }}
          options={{
            // Example of passing extra options for signed uploads:
            // folder: "naijamingles",
          }}
        >
          {({ open }) => (
            <button
              className="px-4 py-2 rounded bg-emerald-600 text-white"
              onClick={() => open?.()}
              type="button"
            >
              Upload (Signed)
            </button>
          )}
        </CldUploadWidget>

        {signedId && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">public_id: {signedId}</p>
            <CldImage src={signedId} width="600" height="400" alt="Signed upload" className="rounded-lg" />
          </div>
        )}
      </section>
    </main>
  );
}
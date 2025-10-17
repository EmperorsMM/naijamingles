"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { CldUploadWidget, CldImage } from "next-cloudinary";

const Schema = z.object({
  display_name: z.string().min(2, "Too short").max(60, "Too long"),
  city: z.string().max(80).optional().or(z.literal("")),
  bio: z.string().max(500, "Max 500 chars").optional().or(z.literal("")),
  avatar_public_id: z.string().optional().or(z.literal("")),
});
type FormValues = z.infer<typeof Schema>;

export default function ProfilePage() {
  const supabase = createClientComponentClient();

  const [previewId, setPreviewId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [legalName, setLegalName] = useState<string | null>(null);
  const [legalDob, setLegalDob] = useState<string | null>(null);
  const [legalGender, setLegalGender] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      display_name: "",
      city: "",
      bio: "",
      avatar_public_id: "",
    },
  });

  // Load session + profile
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const user = u.user;
      setUserEmail(user?.email ?? null);
      if (!user) {
        setLoading(false);
        return;
      }

      // Try schema with id; fallback to user_id
      const sel = "display_name, avatar_url, city, bio, legal_full_name, legal_birthdate, legal_gender";
      let { data, error } = await supabase.from("profiles").select(sel).eq("id", user.id).maybeSingle();
      if ((!data || error) && !data) {
        const alt = await supabase.from("profiles").select(sel).eq("user_id", user.id).maybeSingle();
        data = alt.data || null;
      }

      if (data) {
        reset({
          display_name: data.display_name ?? "",
          city: data.city ?? "",
          bio: data.bio ?? "",
          avatar_public_id: data.avatar_url ?? "",
        });
        setPreviewId(data.avatar_url ?? null);
        setLegalName(data.legal_full_name ?? null);
        setLegalDob(data.legal_birthdate ?? null);
        setLegalGender(data.legal_gender ?? null);
      }

      setLoading(false);
    })();
  }, [reset, supabase]);

  const onSubmit = async (values: FormValues) => {
    const { data: u } = await supabase.auth.getUser();
    const user = u.user;
    if (!user) return alert("Please sign in");

    setSaving(true);
    const payload = {
      display_name: values.display_name,
      city: values.city || null,
      bio: values.bio || null,
      avatar_url: values.avatar_public_id || null, // store Cloudinary public_id
    };

    // Try updating by id first, then fallback to user_id
    let { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
    if (error) {
      const second = await supabase.from("profiles").update(payload).eq("user_id", user.id);
      error = second.error || null;
    }

    setSaving(false);
    if (error) alert(`Save failed: ${error.message}`);
    else alert("Saved!");
  };

  if (loading) {
    return (
      <main className="p-6">
        <p className="text-sm text-gray-600">Loading profile…</p>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold">Your Profile</h1>

      {/* signed-in banner */}
      {userEmail ? (
        <div className="rounded border border-emerald-200 bg-emerald-50 text-emerald-800 p-3 text-sm">
          Signed in as <span className="font-medium">{userEmail}</span>
        </div>
      ) : (
        <div className="rounded border border-yellow-200 bg-yellow-50 text-yellow-800 p-3 text-sm">
          You’re not signed in. <a href="/login" className="underline">Sign in</a> to edit your profile.
        </div>
      )}

      {/* Read-only identity from NIN */}
      <section className="rounded border p-4">
        <h2 className="font-medium mb-3">Verified identity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-gray-600">Full name</div>
            <div className="font-medium">{legalName ?? "—"}</div>
          </div>
          <div>
            <div className="text-gray-600">Date of birth</div>
            <div className="font-medium">{legalDob ?? "—"}</div>
          </div>
          <div>
            <div className="text-gray-600">Gender</div>
            <div className="font-medium">{legalGender ?? "—"}</div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">These fields are locked for your safety and come from your NIN verification.</p>
      </section>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Display name */}
        <label className="block">
          <span className="text-sm text-gray-700">Display name</span>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            placeholder="e.g. Abiola"
            {...register("display_name")}
          />
          {errors.display_name && (
            <p className="text-red-600 text-sm mt-1">{errors.display_name.message}</p>
          )}
        </label>

        {/* City */}
        <label className="block">
          <span className="text-sm text-gray-700">City</span>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            placeholder="e.g. Lagos"
            {...register("city")}
          />
          {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city.message as string}</p>}
        </label>

        {/* Bio */}
        <label className="block">
          <span className="text-sm text-gray-700">Bio</span>
          <textarea
            rows={4}
            className="mt-1 w-full rounded-lg border px-3 py-2"
            placeholder="Say something about yourself (max 500 chars)…"
            {...register("bio")}
          />
          {errors.bio && <p className="text-red-600 text-sm mt-1">{errors.bio.message as string}</p>}
        </label>

        {/* Avatar */}
        <div className="space-y-2">
          <span className="text-sm text-gray-700 block">Avatar</span>

          <CldUploadWidget
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
            onUpload={(r) => {
              // @ts-ignore
              const id = r?.info?.public_id as string | undefined;
              if (id) {
                setValue("avatar_public_id", id, { shouldDirty: true, shouldValidate: true });
                setPreviewId(id);
              }
            }}
          >
            {({ open }) => (
              <button
                type="button"
                onClick={() => open?.()}
                className="px-3 py-2 bg-black text-white rounded"
              >
                Upload avatar
              </button>
            )}
          </CldUploadWidget>

          {previewId ? (
            <CldImage src={previewId} width="160" height="160" alt="Avatar" className="rounded-full" />
          ) : (
            <div className="w-40 h-40 rounded-full bg-gray-200" />
          )}
        </div>

        <button
          className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
          disabled={saving || !userEmail}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </main>
  );
}

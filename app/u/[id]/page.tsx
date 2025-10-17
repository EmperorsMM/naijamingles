import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import ActionsClient from "./ActionsClient";

type Row = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  legal_birthdate: string | null;
  legal_full_name: string | null;
  legal_gender: string | null;
  bio: string | null;
};

function ageFrom(birthdate: string | null) {
  if (!birthdate) return null;
  const d = new Date(birthdate);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export default async function ProfileView({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return <main className="p-6">Please <a href="/login" className="underline">sign in</a>.</main>;
  }

  // RLS: only verified users can view verified, and blocks are respected by policy.
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, city, legal_birthdate, legal_full_name, legal_gender, bio")
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    return <main className="p-6">Error loading profile.</main>;
  }
  if (!data) {
    return <main className="p-6">Profile not found or not visible.</main>;
  }
  if (data.id === user.id) {
    return (
      <main className="p-6">
        <p className="mb-4 text-sm"><a className="underline" href="/discover">← Back to Discover</a></p>
        <h1 className="text-2xl font-semibold mb-2">This is your profile</h1>
        <p className="text-sm text-gray-600">Edit it on <a className="underline" href="/profile">/profile</a>.</p>
      </main>
    );
  }

  const age = ageFrom(data.legal_birthdate);

  return (
    <main className="p-6 space-y-6">
      <p className="text-sm"><a className="underline" href="/discover">← Back to Discover</a></p>

      <section className="flex gap-4 items-center">
        {data.avatar_url ? (
          <img
            src={`https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_128,h_128,g_face,r_max/${data.avatar_url}.jpg`}
            alt={data.display_name ?? "avatar"}
            className="w-28 h-28 rounded-full object-cover"
          />
        ) : (
          <div className="w-28 h-28 rounded-full bg-gray-200" />
        )}
        <div>
          <h1 className="text-2xl font-semibold">{data.display_name ?? "—"}</h1>
          <div className="text-sm text-gray-600">
            {age ? `${age} • ` : ""}{data.city ?? "—"}
          </div>
        </div>
      </section>

      {data.bio && (
        <section>
          <h2 className="font-medium mb-1">About</h2>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{data.bio}</p>
        </section>
      )}

      {/* Safety actions */}
      <ActionsClient targetUserId={data.id} />
    </main>
  );
}

import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { requireVerifiedUser } from "@/lib/verification";

type ProfileRow = {
  id?: string;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  legal_birthdate: string | null; // YYYY-MM-DD
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

export default async function Discover() {
  const { user, verified } = await requireVerifiedUser();

  if (!user) {
    return <main className="p-6">Please <a className="underline text-blue-600" href="/login">sign in</a>.</main>;
  }
  if (!verified) {
    return <main className="p-6">Complete <a className="underline text-blue-600" href="/verify">verification</a> to continue.</main>;
  }

  const supabase = createServerComponentClient({ cookies });
  const myId = user.id;

  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, city, legal_birthdate")
    .neq("id", myId)
    .limit(24);

  const rows = (data ?? []) as ProfileRow[];

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Discover verified members</h1>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-600">No profiles yet. Try again later.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {rows.map((p, i) => {
            const uid = p.id ?? `u-${i}`;
            const age = ageFrom(p.legal_birthdate);
            return (
              <a
                key={uid}
                href={`/u/${uid}`}
                className="border rounded-lg p-3 flex flex-col items-center text-center hover:shadow"
              >
                {p.avatar_url ? (
                  <img
                    src={`https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_160,h_160,g_face,r_max/${p.avatar_url}.jpg`}
                    alt={p.display_name ?? "avatar"}
                    className="w-24 h-24 rounded-full object-cover mb-2"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 mb-2" />
                )}
                <div className="font-medium truncate w-full">{p.display_name ?? "—"}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {age ? `${age} • ` : ""}{p.city ?? "—"}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </main>
  );
}

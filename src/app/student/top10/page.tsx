import { redirect } from "next/navigation";

/** Legacy URL — TopRank training hub lives at `/student/toprank`. */
export default function Top10LegacyRedirectPage() {
  redirect("/student/toprank");
}

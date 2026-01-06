import Link from "next/link";
import { notFound } from "next/navigation";
import { getTradieBySlugAsync } from "@/features/tradie/repo/tradieRepo";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export default async function LeadSuccessPage({ params }: Props) {
  const { slug } = await params;
  const tradie = await getTradieBySlugAsync(slug);
  if (!tradie) return notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-16 text-center">
        <div className="mx-auto h-14 w-14 rounded-full bg-blue-50 text-blue-600">
          <div className="flex h-full items-center justify-center text-2xl">✓</div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">Request received</h1>
          <p className="text-sm text-gray-600">
            Thanks for contacting {tradie.businessName}. We&apos;ll be in touch soon.
          </p>
        </div>
        <Link
          href={`/t/${tradie.slug}`}
          className="inline-flex items-center justify-center text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          Submit another request
        </Link>
      </div>
    </div>
  );
}

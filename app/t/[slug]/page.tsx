import { notFound } from "next/navigation";
import { createLeadActionAsync } from "@/features/leads/actions/leadActions";
import { getTradieBySlugAsync } from "@/features/tradie/repo/tradieRepo";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

type Testimonial = {
  name?: string;
  suburb?: string;
  text?: string;
};

type Project = {
  title?: string;
  suburb?: string;
  summary?: string;
};

const toStringList = (value: unknown) =>
  Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];

const toTestimonials = (value: unknown): Testimonial[] =>
  Array.isArray(value) ? (value as Testimonial[]) : [];

const toProjects = (value: unknown): Project[] =>
  Array.isArray(value) ? (value as Project[]) : [];

export default async function LeadCapturePage({ params }: Props) {
  const { slug } = await params;
  const tradie = await getTradieBySlugAsync(slug);
  if (!tradie) return notFound();

  const profileFallback =
    ((tradie.brandSettings as { profile?: Record<string, unknown> } | null)?.profile as
      | Record<string, unknown>
      | undefined) ?? {};
  const pickString = (column: string | null | undefined, key: string) =>
    column ?? (typeof profileFallback[key] === "string" ? (profileFallback[key] as string) : undefined);
  const pickList = (column: unknown, key: string) => {
    if (Array.isArray(column)) return column;
    const fallback = profileFallback[key];
    return Array.isArray(fallback) ? fallback : [];
  };

  const action = createLeadActionAsync.bind(null, tradie.slug);
  const services = toStringList(pickList(tradie.services, "services"));
  const serviceAreas = toStringList(pickList(tradie.serviceAreas, "serviceAreas"));
  const testimonials = toTestimonials(pickList(tradie.testimonials, "testimonials")).filter((item) => item.text);
  const projects = toProjects(pickList(tradie.projects, "projects")).filter((item) => item.title || item.summary);
  const hasShowcase = testimonials.length > 0 || projects.length > 0;
  const brandSettings =
    (tradie.brandSettings as { primaryColor?: string; footerText?: string } | null) ?? {};
  const primaryColor = brandSettings.primaryColor || "#2563eb";
  const location = [
    pickString(tradie.suburb, "suburb"),
    pickString(tradie.state, "state"),
    pickString(tradie.postcode, "postcode"),
  ]
    .filter(Boolean)
    .join(" ");
  const descriptionText =
    pickString(tradie.about, "about") ||
    "Tell us about your job and we'll get back to you shortly.";
  const logoUrl = tradie.logoUrl || undefined;
  const phoneText = tradie.phone || "Not provided";
  const emailText = tradie.email || "Not provided";
  const addressText = [pickString(tradie.addressLine1, "addressLine1"), pickString(tradie.addressLine2, "addressLine2"), location]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
        <section
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white text-slate-900 md:grid md:grid-cols-[240px_1fr] md:items-stretch"
          aria-labelledby="tradie-heading"
        >
          <div className="flex min-h-[168px] items-center justify-center border-b border-slate-200 bg-slate-50 md:border-b-0 md:border-r">
            <div className="h-[168px] w-full max-w-[240px]">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${tradie.businessName} logo`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                  Logo preview
                </div>
              )}
            </div>
          </div>
          <div className="px-6 py-8">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: primaryColor }}>
              {tradie.businessName}
            </p>
            <h1 id="tradie-heading" className="mt-2 text-3xl font-semibold" style={{ color: primaryColor }}>
              {pickString(tradie.tagline, "tagline") || "Request a quote"}
            </h1>
            <p className="mt-2 text-sm text-slate-600">Professional quote request form</p>
          </div>
        </section>

        <section
          aria-labelledby="description-heading"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2
            id="description-heading"
            className="text-sm font-semibold uppercase tracking-wide"
            style={{ color: primaryColor }}
          >
            Description
          </h2>
          <p className="mt-3 max-w-4xl text-base leading-7 text-slate-700">{descriptionText}</p>
        </section>

        <section aria-labelledby="services-heading" className="space-y-3">
          <h2
            id="services-heading"
            className="text-sm font-semibold uppercase tracking-wide"
            style={{ color: primaryColor }}
          >
            Services
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold" style={{ color: primaryColor }}>
                Services
              </h3>
              {services.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {services.map((service, index) => (
                    <li key={`service-${index}`}>{service}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-600">Not specified</p>
              )}
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold" style={{ color: primaryColor }}>
                Service Areas
              </h3>
              {serviceAreas.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {serviceAreas.map((area, index) => (
                    <li key={`area-${index}`}>{area}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-600">Not specified</p>
              )}
            </article>
          </div>
        </section>

        <section aria-labelledby="contact-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2
            id="contact-heading"
            className="text-sm font-semibold uppercase tracking-wide"
            style={{ color: primaryColor }}
          >
            Contact & Address
          </h2>
          <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <dt className="font-semibold" style={{ color: primaryColor }}>
                Phone
              </dt>
              <dd className="mt-1 text-slate-700">{phoneText}</dd>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <dt className="font-semibold" style={{ color: primaryColor }}>
                Email
              </dt>
              <dd className="mt-1 text-slate-700">{emailText}</dd>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 md:col-span-2">
              <dt className="font-semibold" style={{ color: primaryColor }}>
                Address
              </dt>
              <dd className="mt-1 text-slate-700">{addressText || "Not provided"}</dd>
            </div>
          </dl>
        </section>

        <div className={`grid gap-6 ${hasShowcase ? "lg:grid-cols-3" : ""}`}>
          <form
            action={action}
            className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${
              hasShowcase ? "lg:col-span-2" : "mx-auto w-full max-w-4xl"
            }`}
          >
            <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: primaryColor }}>Name</label>
                <input
                  name="customerName"
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Jane Smith"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: primaryColor }}>Email</label>
                <input
                  type="email"
                  name="customerEmail"
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: primaryColor }}>Phone</label>
                <input
                  type="tel"
                  name="customerPhone"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: primaryColor }}>Suburb</label>
                <input
                  name="suburb"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Richmond"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: primaryColor }}>Site address</label>
              <input
                name="siteAddress"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Street and number"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: primaryColor }}>Job category</label>
              <input
                name="jobCategory"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. Electrical, Plumbing"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: primaryColor }}>Job description</label>
              <textarea
                name="jobDescription"
                required
                rows={5}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Describe the work needed"
              />
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: primaryColor }}
            >
              Submit request
            </button>
            </div>
          </form>

          {hasShowcase && (
            <aside className="space-y-4">
              {projects.length > 0 && (
                <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <h2 className="text-sm font-semibold text-gray-900">Previous Projects</h2>
                  <div className="mt-3 space-y-3 text-sm">
                    {projects.slice(0, 4).map((project, index) => (
                      <div key={`${project.title ?? "project"}-${index}`} className="rounded-lg bg-gray-50 p-3">
                        <p className="font-semibold text-gray-800">{project.title || "Project"}</p>
                        {project.suburb && <p className="text-xs text-gray-500">{project.suburb}</p>}
                        {project.summary && <p className="mt-1 text-gray-600">{project.summary}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {testimonials.length > 0 && (
                <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <h2 className="text-sm font-semibold text-gray-900">Testimonials</h2>
                  <div className="mt-3 space-y-3 text-sm">
                    {testimonials.slice(0, 4).map((testimonial, index) => (
                      <blockquote key={`${testimonial.name ?? "testimonial"}-${index}`} className="rounded-lg bg-gray-50 p-3">
                        <p className="text-gray-700">&quot;{testimonial.text}&quot;</p>
                        <footer className="mt-2 text-xs font-semibold text-gray-500">
                          {testimonial.name}
                          {testimonial.suburb ? ` · ${testimonial.suburb}` : ""}
                        </footer>
                      </blockquote>
                    ))}
                  </div>
                </section>
              )}
            </aside>
          )}
        </div>

        {(brandSettings.footerText || pickString(tradie.website, "website")) && (
          <footer className="text-center text-xs text-gray-500">
            {brandSettings.footerText}
            {brandSettings.footerText && pickString(tradie.website, "website") ? " · " : ""}
            {pickString(tradie.website, "website")}
          </footer>
        )}
      </div>
    </div>
  );
}

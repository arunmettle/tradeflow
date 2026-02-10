import { upsertDefaultTradieActionAsync } from "@/features/tradie/actions/tradieActions";
import { getCurrentTradieAsync } from "@/features/tradie/repo/tradieRepo";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";

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

export default async function TradiePage() {
  const tradie = await getCurrentTradieAsync();
  const profileFallback =
    ((tradie.brandSettings as { profile?: Record<string, unknown> } | null)?.profile as
      | Record<string, unknown>
      | undefined) ?? {};

  const pickString = (column: string | null | undefined, key: string) =>
    column ?? (typeof profileFallback[key] === "string" ? (profileFallback[key] as string) : "");

  const pickList = (column: unknown, key: string) => {
    if (Array.isArray(column)) return column;
    const fallback = profileFallback[key];
    return Array.isArray(fallback) ? fallback : [];
  };

  const servicesText = toStringList(tradie.services).join(", ");
  const serviceAreasText = toStringList(tradie.serviceAreas).join(", ");
  const testimonialsText = toTestimonials(tradie.testimonials)
    .map((item) => `${item.name ?? ""} | ${item.suburb ?? ""} | ${item.text ?? ""}`)
    .join("\n");
  const projectsText = toProjects(tradie.projects)
    .map((item) => `${item.title ?? ""} | ${item.suburb ?? ""} | ${item.summary ?? ""}`)
    .join("\n");
  const servicesFallbackText = toStringList(pickList(tradie.services, "services")).join(", ");
  const serviceAreasFallbackText = toStringList(pickList(tradie.serviceAreas, "serviceAreas")).join(", ");
  const testimonialsFallbackText = toTestimonials(pickList(tradie.testimonials, "testimonials"))
    .map((item) => `${item.name ?? ""} | ${item.suburb ?? ""} | ${item.text ?? ""}`)
    .join("\n");
  const projectsFallbackText = toProjects(pickList(tradie.projects, "projects"))
    .map((item) => `${item.title ?? ""} | ${item.suburb ?? ""} | ${item.summary ?? ""}`)
    .join("\n");
  const brandSettings =
    (tradie.brandSettings as { primaryColor?: string; footerText?: string } | null) ?? {};

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="rounded-xl border border-gray-200 bg-white p-5">
          <h1 className="text-2xl font-semibold text-gray-900">Tradie Profile</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your public profile, branding, testimonials, and previous projects.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            No auth yet: this is single-tradie mode. Your public lead page is <strong>/t/{tradie.slug}</strong>.
          </p>
        </header>

        <form action={upsertDefaultTradieActionAsync} className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-800">Identity</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Slug</label>
                <input
                  name="slug"
                  defaultValue={tradie.slug ?? "demo"}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Business name</label>
                <input
                  name="businessName"
                  defaultValue={tradie.businessName ?? ""}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tagline</label>
                <input
                  name="tagline"
                  defaultValue={pickString(tradie.tagline, "tagline")}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Reliable local concreting specialists"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Plan</label>
                <select
                  name="plan"
                  defaultValue={tradie.plan ?? "FREE"}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="FREE">FREE</option>
                  <option value="PAID">PAID</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">About</label>
              <textarea
                name="about"
                rows={3}
                defaultValue={pickString(tradie.about, "about")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Tell customers about your experience and quality standards."
              />
            </div>
          </section>

          <section className="space-y-3 border-t border-gray-100 pt-4">
            <h2 className="text-sm font-semibold text-gray-800">Contact & Address</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input name="email" defaultValue={tradie.email ?? ""} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input name="phone" defaultValue={tradie.phone ?? ""} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Website</label>
                <input name="website" defaultValue={pickString(tradie.website, "website")} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Logo URL</label>
                <input name="logoUrl" defaultValue={tradie.logoUrl ?? ""} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="https://.../logo.png" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address line 1</label>
                <input name="addressLine1" defaultValue={pickString(tradie.addressLine1, "addressLine1")} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address line 2</label>
                <input name="addressLine2" defaultValue={pickString(tradie.addressLine2, "addressLine2")} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Suburb</label>
                <input name="suburb" defaultValue={pickString(tradie.suburb, "suburb")} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <input name="state" defaultValue={pickString(tradie.state, "state")} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Postcode</label>
                  <input name="postcode" defaultValue={pickString(tradie.postcode, "postcode")} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3 border-t border-gray-100 pt-4">
            <h2 className="text-sm font-semibold text-gray-800">Service Coverage</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Services</label>
                <input
                  name="services"
                  defaultValue={servicesText || servicesFallbackText}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Concreting, Driveways, Slabs"
                />
                <p className="mt-1 text-xs text-gray-500">Comma separated.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Service areas</label>
                <input
                  name="serviceAreas"
                  defaultValue={serviceAreasText || serviceAreasFallbackText}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Richmond, Hawthorn, Kew"
                />
                <p className="mt-1 text-xs text-gray-500">Comma separated suburbs/areas.</p>
              </div>
            </div>
          </section>

          <section className="space-y-3 border-t border-gray-100 pt-4">
            <h2 className="text-sm font-semibold text-gray-800">Brand Settings</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Primary color</label>
                <input
                  name="brandPrimaryColor"
                  defaultValue={brandSettings.primaryColor ?? ""}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="#2563eb"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Footer text</label>
                <input
                  name="brandFooterText"
                  defaultValue={brandSettings.footerText ?? ""}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Licensed & insured"
                />
              </div>
            </div>
          </section>

          <section className="space-y-3 border-t border-gray-100 pt-4">
            <h2 className="text-sm font-semibold text-gray-800">Testimonials</h2>
            <textarea
              name="testimonials"
              rows={5}
              defaultValue={testimonialsText || testimonialsFallbackText}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Jane Smith | Richmond | Great communication and quality finish."
            />
            <p className="text-xs text-gray-500">One per line: Name | Suburb | Testimonial</p>
          </section>

          <section className="space-y-3 border-t border-gray-100 pt-4">
            <h2 className="text-sm font-semibold text-gray-800">Previous Projects</h2>
            <textarea
              name="projects"
              rows={5}
              defaultValue={projectsText || projectsFallbackText}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Driveway replacement | Kew | 72m2 exposed aggregate driveway."
            />
            <p className="text-xs text-gray-500">One per line: Project title | Suburb | Summary</p>
          </section>

          <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
            <PendingSubmitButton
              label="Save profile"
              pendingLabel="Saving..."
              className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
            />
          </div>
        </form>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-800">Public Page Preview URL</h2>
          <p className="mt-2 text-sm text-gray-700">/t/{tradie.slug}</p>
        </div>
      </div>
    </div>
  );
}

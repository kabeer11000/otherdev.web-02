import type { Metadata } from "next";
import Script from "next/script";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { projects } from "@/lib/projects";
import { ProjectCard } from "@/components/project-card";

export const metadata: Metadata = {
  title: "Work | Other Dev",
  description:
    "Explore our premium web design and development projects. We engineer digital solutions for pioneering brands across real estate, e-commerce, SaaS, and more.",
  keywords: [
    "web design",
    "web development",
    "portfolio",
    "project showcase",
    "digital solutions",
    "Other Dev",
  ],
  alternates: {
    canonical: "https://otherdev.com/work",
  },
  openGraph: {
    title: "Work | Other Dev",
    description:
      "Explore our premium web design and development projects. We engineer digital solutions for pioneering brands across real estate, e-commerce, SaaS, and more.",
    type: "website",
    url: "https://otherdev.com/work",
  },
  twitter: {
    card: "summary_large_image",
    title: "Work | Other Dev",
    description:
      "Explore our premium web design and development projects. We engineer digital solutions for pioneering brands across real estate, e-commerce, SaaS, and more.",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Other Dev - We engineer digital solutions for pioneering brands.",
  url: "https://otherdev.com",
  logo: "https://otherdev.com/TheOtherDevLogo.svg",
  description: "Digital platforms for pioneering creatives",
  sameAs: ["https://otherdev.com"],
};

const portfolioSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Our Work",
  url: "https://otherdev.com/work",
  description:
    "Explore our premium web design and development projects. We engineer digital solutions for pioneering brands.",
  creator: {
    "@type": "Organization",
    name: "Other Dev",
    url: "https://otherdev.com",
  },
};

export default function WorkPage() {

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="container -mx-auto px-3 pr-3 md:pr-[8%] lg:pr-[15%] pt-[60px] pb-12">
        <div className="grid grid-cols-12 mb-8">
          <p className="text-[#686868] text-[11px] leading-[14px] font-normal col-span-7 sm:col-span-8 md:col-span-7 lg:col-span-6">
            We work closely with our collaborators to engineer premium web and
            design solutions. Below is a selection showcasing some of our most
            recent work.
          </p>
        </div>

        <div className="mt-[30px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[13px] gap-y-10">
          {projects
            .toSorted((a, b) => {
              if (b.year !== a.year) {
                return b.year - a.year;
              }
              return parseInt(b.id) - parseInt(a.id);
            })
            .map((project) => (
              <ProjectCard
                key={project.id}
                title={project.title}
                slug={project.slug}
                image={project.image}
                description={project.description}
                variant="work"
                showText={true}
              />
            ))}
        </div>
        <Footer />
      </main>

      {/* JSON-LD Structured Data */}
      <Script
        id="organization-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="portfolio-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(portfolioSchema) }}
      />
    </div>
  );
}

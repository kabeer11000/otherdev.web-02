import Hero from '@/components/sections/Hero'
import ProjectGrid from '@/components/ProjectGrid'

// Sample project data
const sampleProjects = [
  {
    id: "narkins-builders",
    title: "Narkins Builders",
    company: "Infrastructure Website",
    year: "2025",
    description: "Modern construction company website with project portfolio",
    imageSrc: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=450&fit=crop",
    url: "https://narkins.com"
  },
  {
    id: "finlit",
    title: "Finlit",
    company: "SaaS Platform",
    year: "2025",
    description: "Financial literacy platform with interactive learning",
    imageSrc: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop",
    url: "https://finlit.com"
  },
  {
    id: "project-3",
    title: "E-Commerce Platform",
    company: "Retail Tech",
    year: "2024",
    description: "Modern e-commerce solution with advanced analytics",
    imageSrc: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=450&fit=crop",
    url: "#"
  },
  {
    id: "project-4",
    title: "Mobile Banking App",
    company: "FinTech",
    year: "2024",
    description: "Secure banking application with biometric authentication",
    imageSrc: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=450&fit=crop",
    url: "#"
  }
];

export default function Home() {
  return (
    <main>
      <Hero />
      
      {/* Project Showcase Section */}
      <section style={{ padding: '120px 24px', background: 'var(--color-background)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 style={{ 
              fontSize: 'clamp(2rem, 4vw, 3rem)', 
              marginBottom: '2rem', 
              fontWeight: '600',
              fontFamily: 'var(--font-display)',
              color: 'var(--color-text)'
            }}>
              Featured Work
            </h2>
            <p style={{ 
              fontSize: '1.2rem', 
              lineHeight: '1.6', 
              color: 'var(--color-text-secondary)',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Discover our latest projects showcasing modern design and cutting-edge technology
            </p>
          </div>
          <ProjectGrid projects={sampleProjects} />
        </div>
      </section>

      <section style={{ padding: '120px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '2rem', fontWeight: '600' }}>
            More Content
          </h2>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#666' }}>
            Continue scrolling to see the full effect of the parallax background 
            and text transformations. The animations are optimized for performance 
            using only transform and opacity properties.
          </p>
        </div>
      </section>

      <section style={{ padding: '120px 24px', background: '#f8f9fa', height: '100vh' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '2rem', fontWeight: '600' }}>
            Test Section
          </h2>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#666' }}>
            This section provides additional content to test the full scroll range 
            and ensure all animations work smoothly throughout the experience.
          </p>
        </div>
      </section>
    </main>
  )
}
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { FrameImageConfig, ImageCropMetadata, PortfolioProject, SectionImageItem } from '../../types';
import { getSectionImageContainerProps } from '../../utils/imageDisplay';

interface PortfolioProps {
  projects: PortfolioProject[];
  portfolioFrame?: FrameImageConfig;
}

export const Portfolio: React.FC<PortfolioProps> = ({ projects, portfolioFrame }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeProject, setActiveProject] = useState<PortfolioProject | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Close lightbox on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveProject(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const categories = ['All', 'Runway', 'Editorial', 'Commercial', 'Campaign', 'Portrait'];

  const filteredProjects =
    selectedCategory === 'All'
      ? projects
      : projects.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase());

  const openProjectLightbox = (project: PortfolioProject) => {
    setActiveProject(project);
    setActiveSlideIndex(0);
  };

  // Build clean ordered slide list for lightbox
  const getProjectSlides = (
    project: PortfolioProject
  ): Array<{ url: string; meta?: Partial<ImageCropMetadata> | null; title?: string }> => {
    const slides: Array<{ url: string; meta?: Partial<ImageCropMetadata> | null; title?: string }> = [];
    if (project.coverImage) {
      slides.push({
        url: project.coverImage,
        meta: project.coverImageSettings,
        title: project.title,
      });
    }
    const items: SectionImageItem[] =
      project.galleryItems && project.galleryItems.length > 0
        ? project.galleryItems
        : (project.galleryImages || []).map((url, idx) => ({
            id: `${project.id}-${idx}`,
            url,
          }));
    items.forEach((item) => {
      if (item.url && item.url !== project.coverImage) {
        slides.push({
          url: item.url,
          meta: item.cropMetadata,
          title: item.title || project.title,
        });
      }
    });
    return slides;
  };

  return (
    <section
      id="portfolio"
      className="py-24 bg-[#080808] dark:bg-[#080808] light:bg-[#FAF9F6] border-b border-[#C9A45C]/20 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] font-semibold text-[#C9A45C] mb-3">
              Selected Works
            </div>
            <h2 className="text-3xl md:text-5xl font-editorial font-bold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212] tracking-tight">
              Modeling Portfolio
            </h2>
          </div>

          {/* Interactive Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#121212] dark:bg-[#121212] light:bg-[#EFECE6] border border-[#C9A45C]/20">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs uppercase tracking-wider font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#C9A45C] text-[#080808] font-semibold'
                    : 'text-[#A7A7A7] dark:text-[#A7A7A7] light:text-[#555] hover:text-[#F5F5F5] dark:hover:text-[#F5F5F5]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Portfolio Bento Grid */}
        {filteredProjects.length === 0 ? (
          <div className="py-16 text-center border border-[#C9A45C]/15 bg-[#0D0D0D]">
            <p className="text-sm text-[#A7A7A7]">No projects published in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
            {filteredProjects.map((project, idx) => {
              const effectiveSettings =
                project.coverImageSettings ||
                (idx === 0 && project.coverImage ? portfolioFrame?.imageSettings : null);
              const coverSrc = project.coverImage || '';
              const containerProps = getSectionImageContainerProps(
                'portfolio',
                effectiveSettings,
                '4 / 3'
              );

              return (
                <div
                  key={project.id}
                  onClick={() => openProjectLightbox(project)}
                  className="group cursor-pointer border border-[#C9A45C]/20 bg-[#121212] dark:bg-[#121212] light:bg-[#FAF9F6] overflow-hidden flex flex-col justify-between hover:border-[#C9A45C]/60 transition-all duration-300"
                >
                  {/* Visual Cover */}
                  {coverSrc ? (
                    <div className="relative bg-[#101010] flex items-center justify-center">
                      <div
                        className={containerProps.wrapperClass}
                        style={containerProps.wrapperStyle}
                      >
                        <img
                          src={coverSrc}
                          alt={project.title}
                          referrerPolicy="no-referrer"
                          style={containerProps.imgStyle}
                          className="group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/85 via-transparent to-transparent opacity-75 group-hover:opacity-55 transition-opacity pointer-events-none" />
                        <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-xs text-[#E5C98A]">
                          <span className="font-semibold uppercase tracking-wider">
                            {project.category}
                          </span>
                          <span className="tabular-nums">{project.year}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="px-6 pt-5 flex items-center justify-between text-xs text-[#E5C98A]">
                      <span className="font-semibold uppercase tracking-wider">
                        {project.category}
                      </span>
                      <span className="tabular-nums">{project.year}</span>
                    </div>
                  )}

                  {/* Metadata content */}
                  <div className="p-6">
                    <h3 className="text-lg font-editorial font-semibold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212] group-hover:text-[#C9A45C] transition-colors mb-2">
                      {project.title}
                    </h3>
                    <p className="text-xs text-[#A7A7A7] dark:text-[#A7A7A7] light:text-[#666] line-clamp-2 leading-relaxed mb-4">
                      {project.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-[#C9A45C]/15 text-xs text-[#A7A7A7]">
                      <span>{project.client || 'Haute Couture'}</span>
                      <span className="text-[#C9A45C] font-medium group-hover:translate-x-1 transition-transform">
                        View Story →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {activeProject && (() => {
        const slides = getProjectSlides(activeProject);
        const currentSlide = slides[activeSlideIndex] || slides[0];
        const slideContainer = currentSlide
          ? getSectionImageContainerProps('portfolio', currentSlide.meta, '4 / 3')
          : null;

        return (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 bg-[#080808]/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200"
          >
            <div className="relative max-w-5xl w-full max-h-[90vh] overflow-y-auto bg-[#101010] border border-[#C9A45C]/40 p-6 md:p-10 text-[#F5F5F5]">
              {/* Top Bar */}
              <div className="flex items-center justify-between pb-6 border-b border-[#C9A45C]/20 mb-8">
                <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-[#C9A45C]">
                  <span>{activeProject.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{activeProject.year}</span>
                </div>
                <button
                  onClick={() => setActiveProject(null)}
                  aria-label="Close project modal"
                  className="p-2 text-[#A7A7A7] hover:text-[#F5F5F5] hover:bg-[#C9A45C]/10 border border-[#C9A45C]/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Media viewer */}
                <div className="lg:col-span-7 space-y-4">
                  {currentSlide && slideContainer ? (
                    <div
                      className={`border border-[#C9A45C]/30 ${slideContainer.wrapperClass}`}
                      style={slideContainer.wrapperStyle}
                    >
                      <img
                        src={currentSlide.url}
                        alt={currentSlide.title || activeProject.title}
                        referrerPolicy="no-referrer"
                        style={slideContainer.imgStyle}
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] border border-[#C9A45C]/20 bg-[#141414] flex items-center justify-center text-xs text-[#777]">
                      No images attached to this campaign yet
                    </div>
                  )}

                  {slides.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {slides.map((slide, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setActiveSlideIndex(i)}
                          className={`aspect-square border overflow-hidden transition-all ${
                            activeSlideIndex === i
                              ? 'border-[#C9A45C] ring-1 ring-[#C9A45C]'
                              : 'border-[#C9A45C]/20 opacity-75 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={slide.url}
                            alt={slide.title || `Slide ${i + 1}`}
                            referrerPolicy="no-referrer"
                            style={{
                              objectFit: slide.meta?.fitMode || 'cover',
                              objectPosition: slide.meta?.objectPosition || '50% 50%',
                            }}
                            className="w-full h-full"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Story & Credits */}
                <div className="lg:col-span-5 space-y-6">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-editorial font-bold text-[#F5F5F5] mb-2">
                      {activeProject.title}
                    </h3>
                    <div className="text-xs uppercase tracking-wider text-[#C9A45C]">
                      {activeProject.subtitle}
                    </div>
                  </div>

                  <div className="text-sm text-[#A7A7A7] leading-relaxed">
                    {activeProject.description}
                  </div>

                  {activeProject.client && (
                    <div className="pt-4 border-t border-[#C9A45C]/20">
                      <div className="text-xs uppercase tracking-widest text-[#E5C98A] mb-1">
                        Client / Campaign
                      </div>
                      <div className="text-sm text-[#F5F5F5] font-medium">
                        {activeProject.client}
                      </div>
                    </div>
                  )}

                  {activeProject.credits && (
                    <div className="pt-4 border-t border-[#C9A45C]/20">
                      <div className="text-xs uppercase tracking-widest text-[#E5C98A] mb-1">
                        Production Credits
                      </div>
                      <div className="text-xs text-[#A7A7A7] leading-relaxed">
                        {activeProject.credits}
                      </div>
                    </div>
                  )}

                  <div className="pt-6">
                    <a
                      href="#collaborate"
                      onClick={() => setActiveProject(null)}
                      className="inline-flex items-center justify-center w-full px-6 py-3 text-xs uppercase tracking-widest font-semibold text-[#080808] bg-[#C9A45C] hover:bg-[#E5C98A] transition-colors"
                    >
                      Inquire About Similar Campaign
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
};

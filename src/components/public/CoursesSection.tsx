import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Check, ArrowRight } from 'lucide-react';
import { CurrencySettings, FrameImageConfig, ModelingCourse } from '../../types';
import { CourseRegistrationModal } from './CourseRegistrationModal';
import { formatBDT } from '../../utils/currency';
import { getSectionImageContainerProps } from '../../utils/imageDisplay';

interface CoursesSectionProps {
  courses: ModelingCourse[];
  currencySettings?: CurrencySettings | null;
  courseFrame?: FrameImageConfig;
}

export const CoursesSection: React.FC<CoursesSectionProps> = ({
  courses,
  currencySettings,
  courseFrame,
}) => {
  const [selectedCourse, setSelectedCourse] = useState<ModelingCourse | null>(null);

  if (!courses || courses.length === 0) return null;

  const digitStyle = currencySettings?.digitStyle || 'en';

  return (
    <section
      id="courses"
      className="py-24 bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-[#F3F1EC] border-b border-[#C9A45C]/20 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.3em] font-semibold text-[#C9A45C] mb-3">
              Academy & Mentorship
            </div>
            <h2 className="text-3xl md:text-5xl font-editorial font-bold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212] tracking-tight">
              Offline Modeling Courses
            </h2>
          </div>
          <p className="text-xs md:text-sm text-[#A7A7A7] dark:text-[#A7A7A7] light:text-[#666] max-w-md">
            Direct in-studio training with Sobur Ali Khan. Master high-fashion catwalk technique,
            camera presence, audition etiquette, and agency representation.
          </p>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {courses.map((course, idx) => {
            const feeDisplay =
              course.bdtConfirmed && course.feeAmount !== null && course.feeAmount !== undefined
                ? formatBDT(course.feeAmount, digitStyle)
                : 'Fee Pending Confirmation (৳ BDT)';

            // Respect per-course image settings independently; only use courseFrame if course has a cover image & no custom settings
            const effectiveSettings =
              course.coverImageSettings ||
              (idx === 0 && course.coverImage ? courseFrame?.imageSettings : null);
            const coverSrc = course.coverImage || '';
            const containerProps = getSectionImageContainerProps(
              'courses',
              effectiveSettings,
              '16 / 9'
            );

            return (
              <div
                key={course.id}
                className="border border-[#C9A45C]/25 bg-[#121212] dark:bg-[#121212] light:bg-[#FAF9F6] flex flex-col justify-between hover:border-[#C9A45C]/60 transition-all duration-300"
              >
                {coverSrc && (
                  <div className="w-full bg-[#101010] border-b border-[#C9A45C]/15 flex items-center justify-center p-0">
                    <div
                      className={containerProps.wrapperClass}
                      style={containerProps.wrapperStyle}
                    >
                      <img
                        src={coverSrc}
                        alt={course.title}
                        referrerPolicy="no-referrer"
                        style={containerProps.imgStyle}
                        className="transition-transform duration-500 hover:scale-[1.03]"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#E5C98A] mb-3">
                      <span className="uppercase tracking-widest font-semibold">{course.tier}</span>
                      <span
                        className={
                          course.bdtConfirmed && course.feeAmount !== null
                            ? 'text-lg font-editorial font-bold text-[#C9A45C] tabular-nums'
                            : 'text-[11px] font-semibold uppercase tracking-wider text-amber-400'
                        }
                      >
                        {feeDisplay}
                      </span>
                    </div>

                    <h3 className="text-xl font-editorial font-bold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212] mb-4">
                      {course.title}
                    </h3>

                    <p className="text-xs text-[#A7A7A7] dark:text-[#A7A7A7] light:text-[#666] leading-relaxed mb-6">
                      {course.description}
                    </p>

                    {/* Course Details strip */}
                    <div className="space-y-2 py-4 border-y border-[#C9A45C]/15 text-xs text-[#A7A7A7]">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#C9A45C] shrink-0" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#C9A45C] shrink-0" />
                        <span>{course.schedule}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#C9A45C] shrink-0" />
                        <span>{course.location}</span>
                      </div>
                    </div>

                    {/* Syllabus Points */}
                    {course.syllabus && course.syllabus.length > 0 && (
                      <div className="mt-6 mb-8 space-y-2.5">
                        <div className="text-[11px] uppercase tracking-wider text-[#E5C98A] font-semibold">
                          Core Curriculum:
                        </div>
                        {course.syllabus.map((item, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex items-start gap-2 text-xs text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#333]"
                          >
                            <Check className="w-3.5 h-3.5 text-[#C9A45C] shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedCourse(course)}
                    className="w-full py-3.5 text-xs uppercase tracking-widest font-semibold text-[#080808] bg-[#C9A45C] hover:bg-[#E5C98A] transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Apply For Enrollment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedCourse && (
        <CourseRegistrationModal
          course={selectedCourse}
          currencySettings={currencySettings}
          onClose={() => setSelectedCourse(null)}
        />
      )}
    </section>
  );
};

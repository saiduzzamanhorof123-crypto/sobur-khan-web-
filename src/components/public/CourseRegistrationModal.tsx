import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { CurrencySettings, ModelingCourse } from '../../types';
import { submitStudentRegistration } from '../../api/client';
import { formatBDT } from '../../utils/currency';

interface ModalProps {
  course: ModelingCourse;
  currencySettings?: CurrencySettings | null;
  onClose: () => void;
}

export const CourseRegistrationModal: React.FC<ModalProps> = ({
  course,
  currencySettings,
  onClose,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [previousExperience, setPreviousExperience] = useState('None');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const digitStyle = currencySettings?.digitStyle || 'en';
  const tuitionText =
    course.bdtConfirmed && course.feeAmount !== null && course.feeAmount !== undefined
      ? formatBDT(course.feeAmount, digitStyle)
      : 'Fee Pending Confirmation (৳ BDT)';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setError('Please provide your full name, email, and contact phone number.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitStudentRegistration({
        courseId: course.id,
        courseTitle: course.title,
        fullName,
        email,
        phone,
        age,
        height,
        previousExperience,
        message,
      });
      setReceiptNumber(res.registration?.receiptNumber || null);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#080808]/90 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="relative max-w-xl w-full bg-[#121212] border border-[#C9A45C]/40 p-6 md:p-8 text-[#F5F5F5] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#C9A45C]/20 mb-6">
          <div>
            <div className="text-xs uppercase tracking-widest text-[#C9A45C] font-semibold">
              Course Enrollment
            </div>
            <h3 className="text-xl font-editorial font-bold text-[#F5F5F5]">{course.title}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close registration modal"
            className="p-2 text-[#A7A7A7] hover:text-[#F5F5F5] hover:bg-[#C9A45C]/10 border border-[#C9A45C]/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8 space-y-4">
            <CheckCircle className="w-12 h-12 text-[#C9A45C] mx-auto" />
            <h4 className="text-xl font-editorial font-bold text-[#F5F5F5]">
              Enrollment Request Received
            </h4>
            <p className="text-sm text-[#A7A7A7] max-w-md mx-auto">
              Thank you, {fullName}. Sobur Ali Khan’s Academy admissions coordinator will review your
              application and reach out via phone ({phone}) with studio orientation instructions.
            </p>
            <div className="inline-block border border-[#C9A45C]/30 bg-[#0A0A0A] px-4 py-2.5 text-xs space-y-1">
              {receiptNumber && (
                <div className="text-[#E5C98A] font-semibold uppercase tracking-wider">
                  Reference: {receiptNumber}
                </div>
              )}
              <div className="text-[#A7A7A7]">
                Course Fee (BDT): <span className="text-[#F5F5F5] font-semibold">{tuitionText}</span>
              </div>
            </div>
            <div>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 text-xs uppercase tracking-widest font-semibold text-[#080808] bg-[#C9A45C] hover:bg-[#E5C98A]"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 border border-red-500/40 bg-red-950/20 text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block uppercase tracking-wider text-[#A7A7A7] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Tariq Rahman"
                  className="w-full bg-[#181818] border border-[#C9A45C]/30 px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#C9A45C]"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-[#A7A7A7] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tariq@example.com"
                  className="w-full bg-[#181818] border border-[#C9A45C]/30 px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#C9A45C]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block uppercase tracking-wider text-[#A7A7A7] mb-1">
                  Phone / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+880 1700-000000"
                  className="w-full bg-[#181818] border border-[#C9A45C]/30 px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#C9A45C]"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-[#A7A7A7] mb-1">Age</label>
                <input
                  type="number"
                  min="16"
                  max="45"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 21"
                  className="w-full bg-[#181818] border border-[#C9A45C]/30 px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#C9A45C]"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-[#A7A7A7] mb-1">Height</label>
                <input
                  type="text"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="e.g. 6'0''"
                  className="w-full bg-[#181818] border border-[#C9A45C]/30 px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#C9A45C]"
                />
              </div>
            </div>

            <div>
              <label className="block uppercase tracking-wider text-[#A7A7A7] mb-1">
                Previous Modeling Experience
              </label>
              <select
                value={previousExperience}
                onChange={(e) => setPreviousExperience(e.target.value)}
                className="w-full bg-[#181818] border border-[#C9A45C]/30 px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#C9A45C]"
              >
                <option value="None">None (Beginner)</option>
                <option value="School / College Shows">School / College Shows</option>
                <option value="Commercial / Print Shoots">Commercial / Print Shoots</option>
                <option value="Runway Fashion Shows">Runway Fashion Shows</option>
              </select>
            </div>

            <div>
              <label className="block uppercase tracking-wider text-[#A7A7A7] mb-1">
                Personal Goals / Notes
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your modeling aspirations or questions for Sobur..."
                className="w-full bg-[#181818] border border-[#C9A45C]/30 px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#C9A45C]"
              />
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#C9A45C]/20">
              <div className="text-[11px] text-[#A7A7A7]">
                Tuition (BDT): <span className="text-[#E5C98A] font-semibold">{tuitionText}</span>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-xs uppercase tracking-widest font-semibold text-[#080808] bg-[#C9A45C] hover:bg-[#E5C98A] disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Confirm Registration'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

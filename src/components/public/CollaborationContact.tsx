import React, { useEffect, useState } from 'react';
import { Mail, Phone, CheckCircle, AlertCircle, Send, Instagram, Facebook, Youtube, Video } from 'lucide-react';
import { CurrencySettings, ServicePackage, SocialLinks } from '../../types';
import { submitCollaborationInquiry, submitContactMessage } from '../../api/client';
import { formatBDT, localizeBDTString } from '../../utils/currency';

const DEFAULT_BDT_BUDGET_TIERS = [
  '৳ 50,000 – ৳ 1,50,000',
  '৳ 1,50,000 – ৳ 3,50,000',
  '৳ 3,50,000 – ৳ 7,50,000',
  '৳ 7,50,000+ (Global Campaign)',
];

interface CollabContactProps {
  socialLinks: SocialLinks | null;
  currencySettings?: CurrencySettings | null;
  packages?: ServicePackage[];
}

export const CollaborationContactSection: React.FC<CollabContactProps> = ({
  socialLinks,
  currencySettings,
  packages = [],
}) => {
  const digitStyle = currencySettings?.digitStyle || 'en';
  const budgetTiers =
    currencySettings?.budgetTiersBdt && currencySettings.budgetTiersBdt.length > 0
      ? currencySettings.budgetTiersBdt
      : DEFAULT_BDT_BUDGET_TIERS;

  // Brand collaboration form state
  const [collabCompany, setCollabCompany] = useState('');
  const [collabPerson, setCollabPerson] = useState('');
  const [collabEmail, setCollabEmail] = useState('');
  const [collabPhone, setCollabPhone] = useState('');
  const [collabType, setCollabType] = useState('Brand Ambassador');
  const [collabBudget, setCollabBudget] = useState(budgetTiers[0]);
  const [collabDetails, setCollabDetails] = useState('');
  const [collabSubmitting, setCollabSubmitting] = useState(false);
  const [collabSuccess, setCollabSuccess] = useState(false);
  const [collabError, setCollabError] = useState<string | null>(null);

  useEffect(() => {
    if (budgetTiers.length > 0 && !budgetTiers.includes(collabBudget)) {
      setCollabBudget(budgetTiers[0]);
    }
  }, [budgetTiers, collabBudget]);

  // General contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  const handleCollabSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCollabError(null);
    if (!collabCompany.trim() || !collabPerson.trim() || !collabEmail.trim() || !collabDetails.trim()) {
      setCollabError('Please provide company name, contact person, email, and campaign details.');
      return;
    }
    setCollabSubmitting(true);
    try {
      await submitCollaborationInquiry({
        companyName: collabCompany,
        contactPerson: collabPerson,
        email: collabEmail,
        phone: collabPhone,
        collaborationType: collabType,
        budgetRange: collabBudget,
        details: collabDetails,
      });
      setCollabSuccess(true);
      setCollabCompany('');
      setCollabPerson('');
      setCollabEmail('');
      setCollabDetails('');
    } catch (err: any) {
      setCollabError(err.message || 'Failed to submit proposal.');
    } finally {
      setCollabSubmitting(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      setContactError('Please provide your name, email, and inquiry message.');
      return;
    }
    setContactSubmitting(true);
    try {
      await submitContactMessage({
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        subject: contactSubject || 'General Inquiry',
        message: contactMessage,
      });
      setContactSuccess(true);
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    } catch (err: any) {
      setContactError(err.message || 'Failed to send message.');
    } finally {
      setContactSubmitting(false);
    }
  };

  const fbLink =
    socialLinks?.facebook || 'https://www.facebook.com/profile.php?id=61591172602793';
  const igLink =
    socialLinks?.instagram || 'https://www.instagram.com/isoburkhan?psln=NTdxOGx1OHBsNXky';
  const ytLink = socialLinks?.youtube || 'https://youtube.com/@isoburkhan';
  const ttLink = socialLinks?.tiktok || 'https://tiktok.com/@isoburkhan';
  const bEmail = socialLinks?.businessEmail || 'contact@soburkhan.com';
  const phone = socialLinks?.phone || '+880 1700-000000';

  return (
    <div className="bg-[#080808] dark:bg-[#080808] light:bg-[#FAF9F6] transition-colors">
      {/* BRAND COLLABORATION SECTION */}
      <section id="collaborate" className="py-24 border-b border-[#C9A45C]/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left Column: Scope & Opportunities */}
            <div className="lg:col-span-5 space-y-6">
              <div className="text-xs uppercase tracking-[0.3em] font-semibold text-[#C9A45C]">
                Partnership Opportunities
              </div>
              <h2 className="text-3xl md:text-5xl font-editorial font-bold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212] tracking-tight">
                Brand Collaborations
              </h2>
              <p className="text-sm text-[#A7A7A7] dark:text-[#A7A7A7] light:text-[#5A5A5A] leading-relaxed">
                Sobur Ali Khan partners with discerning international luxury houses, menswear ateliers,
                timepiece makers, and lifestyle brands seeking authoritative representation and digital influence.
              </p>

              <div className="space-y-3 pt-4">
                {[
                  'Brand Ambassador & Endorsement',
                  'Commercial & High-Fashion Runway',
                  'Sponsored Digital Content & Reels',
                  'Product Launch & Red Carpet Appearances',
                  'Lookbook & Global Campaign Features',
                ].map((tier, i) => (
                  <div
                    key={i}
                    className="p-3 border border-[#C9A45C]/20 bg-[#121212] dark:bg-[#121212] light:bg-[#FAF9F6] text-xs font-medium text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212] flex items-center justify-between"
                  >
                    <span>{tier}</span>
                    <span className="text-[#C9A45C]">·</span>
                  </div>
                ))}
              </div>

              {packages.length > 0 && (
                <div className="pt-4 space-y-3">
                  <div className="text-[11px] uppercase tracking-[0.25em] text-[#E5C98A] font-semibold">
                    Official Booking Packages (BDT ৳)
                  </div>
                  <div className="space-y-2.5">
                    {packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="p-3.5 border border-[#C9A45C]/25 bg-[#121212] dark:bg-[#121212] light:bg-[#FAF9F6] space-y-1"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212]">
                            {pkg.name}
                          </span>
                          <span className="text-xs font-editorial font-bold text-[#C9A45C] tabular-nums shrink-0">
                            {pkg.bdtConfirmed && pkg.priceBdt !== null
                              ? formatBDT(pkg.priceBdt, digitStyle)
                              : 'Rate Pending Confirmation (৳ BDT)'}
                          </span>
                        </div>
                        {pkg.deliverables && (
                          <div className="text-[11px] text-[#A7A7A7]">{pkg.deliverables}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Collaboration Proposal Form */}
            <div className="lg:col-span-7 border border-[#C9A45C]/30 bg-[#121212] dark:bg-[#121212] light:bg-[#FAF9F6] p-8 md:p-10 shadow-xl">
              <h3 className="text-xl font-editorial font-bold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212] mb-6">
                Submit Brand Proposal
              </h3>

              {collabSuccess ? (
                <div className="py-8 text-center space-y-4">
                  <CheckCircle className="w-12 h-12 text-[#C9A45C] mx-auto" />
                  <h4 className="text-xl font-editorial font-bold text-[#F5F5F5]">
                    Campaign Proposal Submitted
                  </h4>
                  <p className="text-xs text-[#A7A7A7] max-w-md mx-auto">
                    Your inquiry has been logged in Sobur Ali Khan’s management queue. We will review
                    your deliverables and reply with rate card (BDT ৳) and schedule availability within 48 hours.
                  </p>
                  <button
                    onClick={() => setCollabSuccess(false)}
                    className="mt-4 px-6 py-2 text-xs uppercase tracking-widest font-semibold text-[#080808] bg-[#C9A45C]"
                  >
                    Send Another Proposal
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCollabSubmit} className="space-y-4 text-xs">
                  {collabError && (
                    <div className="p-3 border border-red-500/40 bg-red-950/20 text-red-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{collabError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block uppercase tracking-wider text-[#A7A7A7] mb-1">
                        Brand / Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={collabCompany}
                        onChange={(e) => setCollabCompany(e.target.value)}
                        placeholder="e.g. Aureus Timepieces"
                        className="w-full bg-[#181818] border border-[#C9A45C]/30 px-3 py-2.5 text-[#F5F5F5] focus:outline-none focus:border-[#C9A45C]"
                      />
                    </div>
                    <div>
                      <label className="block uppercase tracking-wider text-[#A7A7A7] mb-1">
                        Representative / Contact Person *
                      </label>
                      <input
                        type="text"
                        required
                        value={collabPerson}
                        onChange={(e) => setCollabPerson(e.target.value)}
                        placeholder="e.g. Nusrat Jahan"
                        className="w-full bg-[#181818] border border-[#C9A45C]/30 px-3 py-2.5 text-[#F5F5F5] focus:outline-none focus:border-[#C9A45C]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block uppercase tracking-wider text-[#A7A7A7] mb-1">
                        Corporate Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={collabEmail}
                        onChange={(e) => setCollabEmail(e.target.value)}
                        placeholder="brand@company.com"
                        className="w-full bg-[#181818] border border-[#C9A45C]/30 px-3 py-2.5 text-[#F5F5F5] focus:outline-none focus:border-[#C9A45C]"
                      />
                    </div>
                    <div>
                      <label className="block uppercase tracking-wider text-[#A7A7A7] mb-1">
                        Phone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={collabPhone}
                        onChange={(e) => setCollabPhone(e.target.value)}
                        placeholder="+880 1700-000000"
                        className="w-full bg-[#181818] border border-[#C9A45C]/30 px-3 py-2.5 text-[#F5F5F5] focus:outline-none focus:border-[#C9A45C]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block uppercase tracking-wider text-[#A7A7A7] mb-1">
                        Collaboration Scope
                      </label>
                      <select
                        value={collabType}
                        onChange={(e) => setCollabType(e.target.value)}
                        className="w-full bg-[#181818] border border-[#C9A45C]/30 px-3 py-2.5 text-[#F5F5F5] focus:outline-none focus:border-[#C9A45C]"
                      >
                        <option value="Brand Ambassador">Brand Ambassador</option>
                        <option value="Commercial Modeling">Commercial Modeling</option>
                        <option value="Brand Promotion">Brand Promotion</option>
                        <option value="Sponsored Content">Sponsored Content</option>
                        <option value="Social Media Campaign">Social Media Campaign</option>
                        <option value="Event Promotion">Event Promotion</option>
                      </select>
                    </div>

                    <div>
                      <label className="block uppercase tracking-wider text-[#A7A7A7] mb-1">
                        Projected Budget Range (BDT ৳)
                      </label>
                      <select
                        value={collabBudget}
                        onChange={(e) => setCollabBudget(e.target.value)}
                        className="w-full bg-[#181818] border border-[#C9A45C]/30 px-3 py-2.5 text-[#F5F5F5] focus:outline-none focus:border-[#C9A45C]"
                      >
                        {budgetTiers.map((tier) => (
                          <option key={tier} value={tier}>
                            {localizeBDTString(tier, digitStyle)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block uppercase tracking-wider text-[#A7A7A7] mb-1">
                      Campaign Deliverables & Vision *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={collabDetails}
                      onChange={(e) => setCollabDetails(e.target.value)}
                      placeholder="Outline target shoot dates, commercial usage rights, platforms, and creative concept..."
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#C9A45C]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={collabSubmitting}
                    className="w-full py-3.5 text-xs uppercase tracking-widest font-semibold text-[#080808] bg-[#C9A45C] hover:bg-[#E5C98A] transition-colors disabled:opacity-50"
                  >
                    {collabSubmitting ? 'Transmitting Proposal...' : 'Transmit Collaboration Proposal'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT & SOCIAL MEDIA SECTION */}
      <section id="contact" className="py-24 border-b border-[#C9A45C]/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left Column: Direct Inquiries & Verified Socials */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] font-semibold text-[#C9A45C] mb-3">
                  Representation
                </div>
                <h2 className="text-3xl md:text-5xl font-editorial font-bold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212] tracking-tight mb-4">
                  Direct Inquiries
                </h2>
                <p className="text-sm text-[#A7A7A7] dark:text-[#A7A7A7] light:text-[#5A5A5A] leading-relaxed">
                  For press features, runway agency bookings, and private masterclasses, connect directly
                  with the official executive desk.
                </p>
              </div>

              {/* Verified Contact Details */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-4 p-4 border border-[#C9A45C]/20 bg-[#121212] dark:bg-[#121212] light:bg-[#FAF9F6]">
                  <Mail className="w-5 h-5 text-[#C9A45C] shrink-0" />
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-[#A7A7A7]">
                      Business Email
                    </div>
                    <a
                      href={`mailto:${bEmail}`}
                      className="text-sm font-medium text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212] hover:text-[#C9A45C]"
                    >
                      {bEmail}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 border border-[#C9A45C]/20 bg-[#121212] dark:bg-[#121212] light:bg-[#FAF9F6]">
                  <Phone className="w-5 h-5 text-[#C9A45C] shrink-0" />
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-[#A7A7A7]">
                      Official Hotline / WhatsApp
                    </div>
                    <div className="text-sm font-medium text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212]">
                      {phone}
                    </div>
                  </div>
                </div>
              </div>

              {/* Verified Social Media Channels */}
              <div className="pt-4 border-t border-[#C9A45C]/20">
                <div className="text-xs uppercase tracking-widest text-[#E5C98A] font-semibold mb-4">
                  Official Channels
                </div>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={igLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 border border-[#C9A45C]/30 bg-[#121212] text-xs text-[#F5F5F5] hover:text-[#C9A45C] hover:border-[#C9A45C] transition-colors"
                  >
                    <Instagram className="w-4 h-4 text-[#C9A45C]" />
                    <span>Instagram</span>
                  </a>

                  <a
                    href={fbLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 border border-[#C9A45C]/30 bg-[#121212] text-xs text-[#F5F5F5] hover:text-[#C9A45C] hover:border-[#C9A45C] transition-colors"
                  >
                    <Facebook className="w-4 h-4 text-[#C9A45C]" />
                    <span>Facebook</span>
                  </a>

                  {ytLink && (
                    <a
                      href={ytLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 border border-[#C9A45C]/30 bg-[#121212] text-xs text-[#F5F5F5] hover:text-[#C9A45C] hover:border-[#C9A45C] transition-colors"
                    >
                      <Youtube className="w-4 h-4 text-[#C9A45C]" />
                      <span>YouTube</span>
                    </a>
                  )}

                  {ttLink && (
                    <a
                      href={ttLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 border border-[#C9A45C]/30 bg-[#121212] text-xs text-[#F5F5F5] hover:text-[#C9A45C] hover:border-[#C9A45C] transition-colors"
                    >
                      <Video className="w-4 h-4 text-[#C9A45C]" />
                      <span>TikTok</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Contact Message Form */}
            <div className="lg:col-span-7 border border-[#C9A45C]/30 bg-[#121212] dark:bg-[#121212] light:bg-[#FAF9F6] p-8 md:p-10 shadow-xl">
              <h3 className="text-xl font-editorial font-bold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121212] mb-6">
                Send A Message
              </h3>

              {contactSuccess ? (
                <div className="py-8 text-center space-y-4">
                  <CheckCircle className="w-12 h-12 text-[#C9A45C] mx-auto" />
                  <h4 className="text-xl font-editorial font-bold text-[#F5F5F5]">
                    Message Transmitted
                  </h4>
                  <p className="text-xs text-[#A7A7A7] max-w-md mx-auto">
                    Thank you for reaching out. Sobur Ali Khan’s management desk will review your inquiry
                    and respond promptly.
                  </p>
                  <button
                    onClick={() => setContactSuccess(false)}
                    className="mt-4 px-6 py-2 text-xs uppercase tracking-widest font-semibold text-[#080808] bg-[#C9A45C]"
                  >
                    Send Another Note
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                  {contactError && (
                    <div className="p-3 border border-red-500/40 bg-red-950/20 text-red-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{contactError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block uppercase tracking-wider text-[#A7A7A7] mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. Adrian Vance"
                        className="w-full bg-[#181818] border border-[#C9A45C]/30 px-3 py-2.5 text-[#F5F5F5] focus:outline-none focus:border-[#C9A45C]"
                      />
                    </div>
                    <div>
                      <label className="block uppercase tracking-wider text-[#A7A7A7] mb-1">
                        Your Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="adrian@agency.com"
                        className="w-full bg-[#181818] border border-[#C9A45C]/30 px-3 py-2.5 text-[#F5F5F5] focus:outline-none focus:border-[#C9A45C]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block uppercase tracking-wider text-[#A7A7A7] mb-1">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+880 1700-000000"
                        className="w-full bg-[#181818] border border-[#C9A45C]/30 px-3 py-2.5 text-[#F5F5F5] focus:outline-none focus:border-[#C9A45C]"
                      />
                    </div>
                    <div>
                      <label className="block uppercase tracking-wider text-[#A7A7A7] mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        placeholder="Runway / Editorial / Press"
                        className="w-full bg-[#181818] border border-[#C9A45C]/30 px-3 py-2.5 text-[#F5F5F5] focus:outline-none focus:border-[#C9A45C]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block uppercase tracking-wider text-[#A7A7A7] mb-1">
                      Message *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Write your note here..."
                      className="w-full bg-[#181818] border border-[#C9A45C]/30 px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#C9A45C]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={contactSubmitting}
                    className="w-full py-3.5 text-xs uppercase tracking-widest font-semibold text-[#080808] bg-[#C9A45C] hover:bg-[#E5C98A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{contactSubmitting ? 'Sending...' : 'Send Message'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

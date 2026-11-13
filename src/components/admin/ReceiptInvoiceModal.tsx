import React from 'react';
import { X, Printer, CheckCircle, FileText } from 'lucide-react';
import { formatBDT } from '../../utils/currency';

export interface ReceiptDocumentData {
  type: 'registration_receipt' | 'collaboration_invoice';
  documentNumber: string;
  issuedDate: string;
  recipientName: string;
  recipientOrg?: string;
  recipientEmail: string;
  recipientPhone: string;
  lineItemTitle: string;
  lineItemDescription: string;
  amountBdt: number | null;
  statusLabel: string;
  digitStyle: 'en' | 'bn';
}

interface ReceiptInvoiceModalProps {
  document: ReceiptDocumentData | null;
  onClose: () => void;
}

export const ReceiptInvoiceModal: React.FC<ReceiptInvoiceModalProps> = ({
  document: doc,
  onClose,
}) => {
  if (!doc) return null;

  const isReceipt = doc.type === 'registration_receipt';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[80] bg-[#080808]/90 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="bg-[#121212] border border-[#C9A45C]/60 max-w-xl w-full p-6 sm:p-8 text-[#F5F5F5] shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#C9A45C]/25">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#C9A45C] font-semibold">
            <FileText className="w-4 h-4" />
            <span>{isReceipt ? 'Official Tuition Receipt (BDT)' : 'Brand Collaboration Invoice (BDT)'}</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close receipt modal"
            className="p-1.5 text-[#A7A7A7] hover:text-[#F5F5F5] border border-[#C9A45C]/25"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Document Area */}
        <div className="bg-[#0B0B0B] border border-[#C9A45C]/30 p-6 space-y-5 text-xs">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#C9A45C]/20">
            <div>
              <div className="text-lg font-editorial font-bold tracking-wider text-[#E5C98A]">
                SOBUR ALI KHAN
              </div>
              <div className="text-[10px] uppercase tracking-widest text-[#A7A7A7]">
                Influencer & Professional Model · Dhaka / International
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-[#A7A7A7]">
                {isReceipt ? 'Receipt No.' : 'Invoice No.'}
              </div>
              <div className="font-mono font-bold text-[#C9A45C] text-sm">
                {doc.documentNumber}
              </div>
              <div className="text-[10px] text-[#A7A7A7] mt-0.5">
                Date: {new Date(doc.issuedDate).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#A7A7A7] mb-1">
                {isReceipt ? 'Student / Applicant' : 'Client / Brand'}
              </div>
              <div className="font-semibold text-[#F5F5F5]">{doc.recipientName}</div>
              {doc.recipientOrg && <div className="text-[#E5C98A]">{doc.recipientOrg}</div>}
              <div className="text-[#A7A7A7]">{doc.recipientEmail}</div>
              <div className="text-[#A7A7A7]">{doc.recipientPhone}</div>
            </div>
            <div className="sm:text-right">
              <div className="text-[10px] uppercase tracking-wider text-[#A7A7A7] mb-1">
                Currency & Status
              </div>
              <div className="text-[#E5C98A] font-semibold">Bangladeshi Taka (BDT · ৳)</div>
              <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-[#C9A45C]/15 border border-[#C9A45C]/40 text-[#E5C98A] uppercase tracking-wider text-[10px]">
                <CheckCircle className="w-3 h-3" />
                <span>{doc.statusLabel}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-b border-[#C9A45C]/20 py-4 space-y-2">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#A7A7A7]">
              <span>Description</span>
              <span>Amount (BDT)</span>
            </div>
            <div className="flex items-start justify-between gap-4 pt-1">
              <div>
                <div className="font-semibold text-[#F5F5F5] text-sm">{doc.lineItemTitle}</div>
                <div className="text-[#A7A7A7] mt-0.5">{doc.lineItemDescription}</div>
              </div>
              <div className="text-base font-editorial font-bold text-[#E5C98A] whitespace-nowrap">
                {formatBDT(doc.amountBdt, doc.digitStyle, 'Pending BDT Confirmation')}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] uppercase tracking-wider text-[#A7A7A7]">
              Total Payable / Recorded (BDT)
            </span>
            <span className="text-xl font-editorial font-bold text-[#C9A45C]">
              {formatBDT(doc.amountBdt, doc.digitStyle, 'Pending BDT Confirmation')}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider font-semibold bg-[#C9A45C] text-[#080808] hover:bg-[#E5C98A]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt / Invoice</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs uppercase tracking-wider border border-[#C9A45C]/30 text-[#A7A7A7] hover:text-[#F5F5F5]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

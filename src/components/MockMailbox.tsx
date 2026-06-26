import React, { useState } from "react";
import { 
  Mail, 
  Trash2, 
  Clock, 
  Copy, 
  Check, 
  Eye, 
  X,
  MailOpen
} from "lucide-react";
import { MockEmail } from "../types";

interface MockMailboxProps {
  emails: MockEmail[];
  onClearEmails: () => void;
}

export default function MockMailbox({ emails, onClearEmails }: MockMailboxProps) {
  const [selectedEmail, setSelectedEmail] = useState<MockEmail | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyOtp = (otp: string, emailId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(otp);
    setCopiedId(emailId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div id="mock-mailbox-card" className="bg-[#141414] border border-white/10 p-6 rounded-none flex flex-col h-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
        <div className="flex items-center gap-2">
          <Mail className="w-4.5 h-4.5 text-white/60" />
          <div>
            <h3 className="font-display font-light text-md text-white tracking-wide">
              Mock Delivery Sandbox
            </h3>
            <p className="text-[9px] font-mono text-white/40 uppercase tracking-widest mt-0.5">
              Simulated inbox for safe local testing
            </p>
          </div>
        </div>
        <button
          onClick={onClearEmails}
          disabled={emails.length === 0}
          className="p-1.5 hover:bg-rose-950/20 border border-white/10 hover:border-rose-500/30 text-white/40 hover:text-rose-400 rounded-none cursor-pointer transition-all disabled:opacity-30 disabled:hover:bg-transparent"
          title="Clear Sandbox Inbox"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {emails.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-4 border border-dashed border-white/5 bg-black/25">
            <Mail className="w-8 h-8 text-white/15 mb-3" />
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest text-center">
              Inbox Empty
            </span>
            <p className="text-[10px] text-white/30 text-center max-w-xs mt-1 font-sans">
              Request an OTP on the device emulator to see your security emails arrive here immediately.
            </p>
          </div>
        ) : (
          emails.map((email) => (
            <div
              key={email.id}
              onClick={() => setSelectedEmail(email)}
              className="bg-black/50 hover:bg-white/5 border border-white/5 hover:border-white/15 p-3.5 flex items-start gap-3 cursor-pointer transition-all"
            >
              <div className="p-2 border border-white/10 bg-white/2 rounded-none text-white/60">
                <MailOpen className="w-4.5 h-4.5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[11px] font-mono font-bold text-white truncate">
                    {email.to}
                  </span>
                  <span className="text-[9px] font-mono text-white/40 shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {email.timestamp}
                  </span>
                </div>

                <p className="text-[10.5px] font-sans text-white/60 font-medium truncate mt-0.5">
                  {email.subject}
                </p>

                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/[0.03]">
                  <span className="text-[9px] font-mono text-white/30 truncate">
                    From: {email.from}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => handleCopyOtp(email.otp, email.id, e)}
                      className={`px-2 py-1 border text-[9px] font-mono font-bold uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-all ${
                        copiedId === email.id
                          ? "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                          : "border-white/10 text-white/60 hover:text-white hover:border-white/30"
                      }`}
                    >
                      {copiedId === email.id ? (
                        <>
                          <Check className="w-2.5 h-2.5" />
                          COPIED
                        </>
                      ) : (
                        <>
                          <Copy className="w-2.5 h-2.5" />
                          COPY OTP: {email.otp}
                        </>
                      )}
                    </button>
                    <span className="p-1 border border-white/10 text-white/40 hover:text-white rounded-none">
                      <Eye className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Render selected email HTML modal overlay */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#141414] border border-white/10 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div>
                <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest">
                  Secure SMTP HTML Payload
                </span>
                <h4 className="font-display text-sm font-medium text-white truncate">
                  {selectedEmail.subject}
                </h4>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="p-1.5 hover:bg-white/5 border border-white/10 text-white/60 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Details bar */}
            <div className="bg-black/40 p-3 border-b border-white/5 font-mono text-[10px] text-white/60 space-y-1">
              <div>Sender: <span className="text-white/80">{selectedEmail.from}</span></div>
              <div>Recipient: <span className="text-white/80">{selectedEmail.to}</span></div>
              <div>Received: <span className="text-white/80">{selectedEmail.timestamp}</span></div>
            </div>

            {/* Email Body Iframe/Div sandbox */}
            <div className="flex-1 overflow-y-auto p-4 bg-black/60">
              <div 
                className="rounded-none border border-white/5 overflow-hidden shadow-2xl selection:bg-white selection:text-black"
                dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
              />
            </div>

            {/* Modal Footer actions */}
            <div className="p-4 border-t border-white/10 bg-black/40 flex justify-between items-center">
              <span className="text-[10px] font-mono text-white/40">
                OTP: <span className="text-white font-bold select-all">{selectedEmail.otp}</span>
              </span>
              <button
                onClick={(e) => {
                  navigator.clipboard.writeText(selectedEmail.otp);
                  setSelectedEmail(null);
                }}
                className="px-4 py-2 bg-white text-black text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-white/90 cursor-pointer"
              >
                Copy Code & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

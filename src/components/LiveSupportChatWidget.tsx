import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { SupportTicket, TicketReply } from '../types';
import { api } from '../lib/api';
import {
  MessageSquare,
  X,
  Send,
  User,
  ShieldCheck,
  Headphones,
  Clock,
  Sparkles,
  RefreshCw,
  Mail,
  ChevronDown,
  Minimize2,
  CheckCheck,
  HelpCircle,
  Globe,
} from 'lucide-react';
import { SUPPORT_LANGUAGES } from '../pages/CustomerSupportPage';

export const LiveSupportChatWidget: React.FC = () => {
  const { user, activePage } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Guest State (when not logged in)
  const [guestName, setGuestName] = useState(() => localStorage.getItem('netbybit_guest_name') || '');
  const [guestEmail, setGuestEmail] = useState(() => localStorage.getItem('netbybit_guest_email') || '');
  const [activeGuestTicketId, setActiveGuestTicketId] = useState<string | null>(
    () => localStorage.getItem('netbybit_guest_ticket_id') || null
  );

  // Support Ticket Data State
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [userTickets, setUserTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Form Inputs
  const [messageText, setMessageText] = useState('');
  const [category, setCategory] = useState('General Inquiry');
  const [guestInitialMessage, setGuestInitialMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Multilingual State
  const [userPreferredLang, setUserPreferredLang] = useState<string>(
    () => localStorage.getItem('netbybit_user_lang') || 'English'
  );
  const [showOriginals, setShowOriginals] = useState<{ [msgId: string]: boolean }>({});

  const toggleShowOriginal = (id: string) => {
    setShowOriginals((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpdateLanguage = async (lang: string) => {
    setUserPreferredLang(lang);
    localStorage.setItem('netbybit_user_lang', lang);
    if (activeTicket) {
      try {
        const updatedTicket = await api.updateTicketLanguage(activeTicket.id, lang);
        if (updatedTicket) {
          setActiveTicket(updatedTicket);
        }
      } catch (err) {
        console.error('Error updating language:', err);
      }
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch ticket for logged-in user
  const fetchUserSupport = async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    try {
      const tickets = await api.getSupportTickets();
      setUserTickets(tickets);
      if (tickets.length > 0) {
        setActiveTicket(tickets[0]);
      }
    } catch (err) {
      console.error('Error fetching user support tickets:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Fetch active guest ticket
  const fetchGuestSupport = async (silent = false) => {
    if (user || !activeGuestTicketId) return;
    if (!silent) setLoading(true);
    try {
      const ticket = await api.getGuestSupportTicket(activeGuestTicketId, guestEmail);
      setActiveTicket(ticket);
    } catch (err) {
      console.error('Error fetching guest ticket:', err);
      // If ticket not found, reset local state
      setActiveGuestTicketId(null);
      localStorage.removeItem('netbybit_guest_ticket_id');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (user) {
      fetchUserSupport();
    } else if (activeGuestTicketId) {
      fetchGuestSupport();
    }
  }, [user, activeGuestTicketId]);

  // Real-time chat polling every 3 seconds when chat popup is open
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      if (user) {
        fetchUserSupport(true);
      } else if (activeGuestTicketId) {
        fetchGuestSupport(true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, user, activeGuestTicketId]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, activeTicket?.replies?.length, activeTicket?.message]);

  // Start Guest Support Chat
  const handleStartGuestChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestEmail.trim() || !guestInitialMessage.trim()) {
      setErrorMessage('Please enter your email address and initial message.');
      return;
    }

    setSending(true);
    setErrorMessage(null);

    try {
      // Save info in local storage
      localStorage.setItem('netbybit_guest_name', guestName.trim());
      localStorage.setItem('netbybit_guest_email', guestEmail.trim());

      const ticket = await api.createGuestSupportTicket({
        name: guestName.trim(),
        email: guestEmail.trim(),
        category,
        message: guestInitialMessage.trim(),
        userLanguage: userPreferredLang,
      });

      setActiveTicket(ticket);
      setActiveGuestTicketId(ticket.id);
      localStorage.setItem('netbybit_guest_ticket_id', ticket.id);
      setGuestInitialMessage('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to start support chat. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Start Logged-In User Support Chat
  const handleStartUserChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestInitialMessage.trim()) return;

    setSending(true);
    setErrorMessage(null);

    try {
      const ticket = await api.createSupportTicket({
        subject: `${category} Inquiry`,
        category,
        message: guestInitialMessage.trim(),
        userLanguage: userPreferredLang,
      });

      setUserTickets((prev) => [ticket, ...prev]);
      setActiveTicket(ticket);
      setGuestInitialMessage('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  // Send Reply in active chat
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeTicket) return;

    setSending(true);
    const content = messageText.trim();
    setMessageText('');

    try {
      if (user) {
        const updatedTicket = await api.replySupportTicket(activeTicket.id, content);
        setActiveTicket(updatedTicket);
        setUserTickets((prev) =>
          prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t))
        );
      } else {
        const updatedTicket = await api.replyGuestSupportTicket(activeTicket.id, {
          message: content,
          email: guestEmail,
        });
        setActiveTicket(updatedTicket);
      }
      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Failed to send reply. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Quick preset questions click handler
  const handlePresetQuestion = (question: string) => {
    setGuestInitialMessage(question);
  };

  // If user is currently on the full support page, hide floating widget to avoid duplicate UI
  if (activePage === 'support' && !isMinimized) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {/* 1. CLOSED / FLOATING BUBBLE BUTTON */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center space-x-2.5 px-4 py-3 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-neutral-950 font-black rounded-full shadow-2xl hover:shadow-amber-500/40 hover:scale-105 transition-all duration-300 border border-amber-300/40"
          title="Open 24/7 Customer Support Live Chat"
        >
          <div className="relative">
            <Headphones className="w-5 h-5 text-neutral-950" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-neutral-950"></span>
            </span>
          </div>
          <span className="text-xs font-black tracking-wide uppercase">Support Chat</span>
          <span className="text-[10px] bg-neutral-950/20 px-2 py-0.5 rounded-full font-mono font-bold">24/7</span>
        </button>
      )}

      {/* 2. CHAT WINDOW POPUP */}
      {isOpen && (
        <div className="bg-neutral-900 border border-amber-500/30 rounded-3xl w-80 sm:w-96 shadow-2xl overflow-hidden flex flex-col h-[520px] max-h-[85vh] animate-fadeIn transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-neutral-950 via-amber-950/40 to-neutral-950 p-4 border-b border-amber-500/20 flex justify-between items-center shrink-0">
            <div className="flex items-center space-x-3">
              <div className="relative w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Headphones className="w-5 h-5" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-neutral-900 rounded-full" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    NETBYBIT Live Support
                  </h3>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="text-[10px] text-emerald-400 font-mono flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online • Instant Help</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {/* Language Selector Dropdown */}
              <div className="flex items-center space-x-1 bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-[11px] shadow-inner">
                <Globe className="w-3 h-3 text-amber-400 shrink-0" />
                <select
                  value={activeTicket?.userLanguage || userPreferredLang}
                  onChange={(e) => handleUpdateLanguage(e.target.value)}
                  className="bg-transparent text-neutral-200 text-[10px] font-bold focus:outline-none cursor-pointer max-w-[85px] truncate"
                  title="Select preferred chat language"
                >
                  {SUPPORT_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-neutral-900 text-white">
                      {lang.code}
                    </option>
                  ))}
                </select>
              </div>

              {activeTicket && (
                <button
                  onClick={() => {
                    if (user) fetchUserSupport(false);
                    else fetchGuestSupport(false);
                  }}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                  title="Refresh Chat"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                title="Close Support Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CHAT BODY CONTENT AREA */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-950/60 text-xs">
            {/* VIEW A: GUEST UNAUTHENTICATED WELCOME FORM */}
            {!user && !activeTicket && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/30 rounded-2xl p-4 text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-amber-300">
                    Welcome to 24/7 Live Support
                  </h4>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    Chat with support agents instantly — <strong className="text-white">no login or account required</strong>.
                  </p>
                </div>

                {errorMessage && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-2.5 text-[11px] text-rose-300">
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleStartGuestChat} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                      Your Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Alex Rivera"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2 text-white text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                      Your Email Address <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2 text-white text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                      Inquiry Topic
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2 text-white text-xs outline-none"
                    >
                      <option value="General Inquiry">General Inquiry / Help</option>
                      <option value="Deposit Help">Deposit & Crypto Address</option>
                      <option value="Withdrawal Issue">Withdrawal Status</option>
                      <option value="Account / Login">Account & Password Help</option>
                      <option value="Wallet Connection">Web3 Wallet Connection</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                      How can we help you? <span className="text-amber-400">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Type your message or question here..."
                      value={guestInitialMessage}
                      onChange={(e) => setGuestInitialMessage(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-xl p-3 text-white text-xs outline-none resize-none"
                    />
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handlePresetQuestion('How do I make a crypto deposit?')}
                      className="text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2 py-1 rounded-lg border border-neutral-700 transition-colors"
                    >
                      💳 Deposit Help
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetQuestion('I need help connecting my wallet.')}
                      className="text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2 py-1 rounded-lg border border-neutral-700 transition-colors"
                    >
                      🔗 Wallet Help
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetQuestion('How long do withdrawals take?')}
                      className="text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2 py-1 rounded-lg border border-neutral-700 transition-colors"
                    >
                      ⏳ Withdrawal Info
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {sending ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-neutral-950" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-neutral-950" />
                        <span>Start Support Chat</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* VIEW B: LOGGED IN USER NO ACTIVE TICKET YET */}
            {user && !activeTicket && (
              <div className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center space-y-2">
                  <Headphones className="w-6 h-6 text-amber-400 mx-auto" />
                  <h4 className="text-xs font-bold text-amber-300">
                    Hello, {user.name}!
                  </h4>
                  <p className="text-[11px] text-neutral-300">
                    Send a message directly to Customer Support staff. We are online 24/7.
                  </p>
                </div>

                <form onSubmit={handleStartUserChat} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                      Inquiry Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2 text-white text-xs outline-none"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Deposit Help">Deposit & Addresses</option>
                      <option value="Withdrawal Issue">Withdrawal Status</option>
                      <option value="Swap Inquiry">Token Swap</option>
                      <option value="Account / Profile">Account & Security</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                      Message
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Type your message..."
                      value={guestInitialMessage}
                      onChange={(e) => setGuestInitialMessage(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-xl p-3 text-white text-xs outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-transform flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {sending ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-neutral-950" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-neutral-950" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* VIEW C: ACTIVE CHAT THREAD (FOR GUEST OR USER) */}
            {activeTicket && (
              <div className="space-y-3">
                {/* Active Chat Info Badge */}
                <div className="bg-neutral-900 p-2.5 rounded-xl border border-neutral-800 flex justify-between items-center text-[10px]">
                  <div className="flex items-center space-x-2">
                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                      #{activeTicket.id}
                    </span>
                    <span className="text-neutral-300 font-semibold truncate max-w-[150px]">
                      {activeTicket.subject}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                        activeTicket.status === 'Open'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : activeTicket.status === 'In Progress'
                          ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {activeTicket.status}
                    </span>
                    {!user && (
                      <button
                        onClick={() => {
                          setActiveTicket(null);
                          setActiveGuestTicketId(null);
                          localStorage.removeItem('netbybit_guest_ticket_id');
                        }}
                        className="text-neutral-400 hover:text-rose-400 text-[9px] underline"
                      >
                        New Chat
                      </button>
                    )}
                  </div>
                </div>

                {/* Original Inquiry Message */}
                <div className="flex flex-col items-end space-y-1">
                  <div className="bg-amber-500/20 border border-amber-500/40 text-amber-100 p-3 rounded-2xl rounded-tr-none max-w-[85%] leading-relaxed shadow-sm">
                    {activeTicket.message}
                  </div>
                  <span className="text-[9px] text-neutral-400 font-mono">
                    {new Date(activeTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Replies Thread */}
                {activeTicket.replies?.map((reply) => {
                  const isStaff = reply.sender === 'admin';
                  const isShowingOriginal = showOriginals[reply.id];
                  const hasTranslation = reply.isTranslated || (reply.translatedMessage && reply.translatedMessage.trim().toLowerCase() !== reply.message.trim().toLowerCase());
                  const displayText = isShowingOriginal ? reply.message : (reply.translatedMessage || reply.message);

                  return (
                    <div
                      key={reply.id}
                      className={`flex flex-col ${isStaff ? 'items-start' : 'items-end'} space-y-1`}
                    >
                      <div className="flex items-center space-x-1.5 mb-0.5">
                        <span className={`text-[9px] font-bold ${isStaff ? 'text-amber-400' : 'text-neutral-400'}`}>
                          {isStaff ? 'NETBYBIT Support Staff' : reply.senderName || 'You'}
                        </span>
                        {isStaff && (
                          <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.2 text-[8px] rounded font-mono font-bold">
                            OFFICIAL
                          </span>
                        )}
                      </div>
                      <div
                        className={`p-3 rounded-2xl max-w-[85%] leading-relaxed shadow-sm space-y-1 ${
                          isStaff
                            ? 'bg-neutral-800 border border-neutral-700 text-white rounded-tl-none'
                            : 'bg-amber-500/20 border border-amber-500/40 text-amber-100 rounded-tr-none'
                        }`}
                      >
                        <div>{displayText}</div>

                        {/* Translation Badge & Toggle */}
                        {hasTranslation && (
                          <div className="pt-1 border-t border-neutral-700/60 flex flex-wrap items-center justify-between gap-1 text-[9px] text-neutral-400">
                            <span className="inline-flex items-center space-x-1 text-amber-400 font-medium">
                              <Globe className="w-2.5 h-2.5 text-amber-400" />
                              <span>
                                {isShowingOriginal
                                  ? 'Original'
                                  : `Translated (${reply.targetLanguage || activeTicket.userLanguage || userPreferredLang})`}
                              </span>
                            </span>
                            <button
                              onClick={() => toggleShowOriginal(reply.id)}
                              className="text-amber-400/90 hover:text-amber-300 underline font-mono cursor-pointer"
                            >
                              {isShowingOriginal ? 'Translation' : 'View Original'}
                            </button>
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-neutral-400 font-mono flex items-center space-x-1">
                        <span>
                          {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <CheckCheck className="w-3 h-3 text-amber-400" />
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* FOOTER INPUT AREA (when active ticket is open) */}
          {activeTicket && (
            <div className="p-3 bg-neutral-950 border-t border-neutral-800 shrink-0">
              <form onSubmit={handleSendReply} className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Type a message to Support..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2 text-white text-xs outline-none"
                />
                <button
                  type="submit"
                  disabled={sending || !messageText.trim()}
                  className="p-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 rounded-xl shadow-md transition-all disabled:opacity-40"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <div className="flex justify-between items-center text-[9px] text-neutral-400 mt-1.5 font-mono px-1">
                <span>⚡ Live 24/7 Agent Connected</span>
                <span>netbybitsupport@gmail.com</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

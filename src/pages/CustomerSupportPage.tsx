import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { SupportTicket, TicketReply } from '../types';
import { api } from '../lib/api';
import {
  LifeBuoy,
  Plus,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Search,
  User as UserIcon,
  CheckCheck,
  X,
  Filter,
  Lock,
  Mail,
  RefreshCw,
  Sparkles,
  HelpCircle,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';

export const CustomerSupportPage: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [adminTickets, setAdminTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // Active mode for admins/staff: 'user' or 'staff_console'
  const [viewMode, setViewMode] = useState<'user' | 'staff_console'>(
    user?.role === 'admin' ? 'staff_console' : 'user'
  );

  // User View State
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);

  // New Ticket Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('General Inquiry');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [initialMessage, setInitialMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Chat reply state
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  // Staff Console Search & Filters
  const [staffEmailSearch, setStaffEmailSearch] = useState('');
  const [staffStatusFilter, setStaffStatusFilter] = useState<'all' | 'Open' | 'In Progress' | 'Closed'>('all');
  const [staffSelectedTicketId, setStaffSelectedTicketId] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat to bottom
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const fetchUserTickets = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.getSupportTickets();
      setTickets(data);
      if (data.length > 0 && !selectedTicketId) {
        setSelectedTicketId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchAdminTickets = async (silent = false) => {
    if (user?.role !== 'admin') return;
    if (!silent) setLoading(true);
    try {
      const data = await api.getAdminTickets();
      setAdminTickets(data);
      if (data.length > 0 && !staffSelectedTicketId) {
        setStaffSelectedTicketId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserTickets();
    if (user?.role === 'admin') {
      fetchAdminTickets();
    }
  }, [user]);

  // Real-time polling every 4 seconds to fetch new support replies dynamically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUserTickets(true);
      if (user?.role === 'admin') {
        fetchAdminTickets(true);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [user, selectedTicketId, staffSelectedTicketId]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedTicketId, staffSelectedTicketId, tickets, adminTickets]);

  // Open New Support Chat Room
  const handleCreateSupportChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !initialMessage.trim()) {
      setNotification({ type: 'error', text: 'Subject and message are required' });
      return;
    }

    setSubmitting(true);
    setNotification(null);

    try {
      const newTicket = await api.createSupportTicket({
        subject: subject.trim(),
        category,
        priority,
        message: initialMessage.trim(),
      });
      
      setTickets((prev) => [newTicket, ...prev]);
      setSelectedTicketId(newTicket.id);
      setNotification({ type: 'success', text: 'Support Chat Room created. Support team notified via email.' });
      setSubject('');
      setInitialMessage('');
      setNewChatModalOpen(false);

      if (user?.role === 'admin') {
        await fetchAdminTickets(true);
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Failed to start support chat' });
    } finally {
      setSubmitting(false);
    }
  };

  // Send Reply in active chat
  const handleSendReply = async (e: React.FormEvent, ticketId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setReplying(true);
    try {
      const updated = await api.replySupportTicket(ticketId, replyText.trim());
      setReplyText('');
      
      // Update local state
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setAdminTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setReplying(false);
    }
  };

  // Toggle/Close Ticket Status
  const handleUpdateStatus = async (ticketId: string, newStatus: 'Open' | 'In Progress' | 'Closed') => {
    try {
      const res = await api.updateTicketStatus(ticketId, newStatus);
      if (res.success && res.ticket) {
        setTickets((prev) => prev.map((t) => (t.id === ticketId ? res.ticket : t)));
        setAdminTickets((prev) => prev.map((t) => (t.id === ticketId ? res.ticket : t)));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update conversation status');
    }
  };

  // Quick suggestion pills for user chat
  const quickPills = [
    'I need help with a deposit confirmation',
    'Question regarding my withdrawal request',
    'Wallet linking & verification help',
    'Security & 2FA assistance',
  ];

  // Currently selected user ticket
  const currentTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];
  // Currently selected admin staff ticket
  const currentStaffTicket = adminTickets.find((t) => t.id === staffSelectedTicketId) || adminTickets[0];

  // Filter user tickets by search
  const filteredUserTickets = tickets.filter(
    (t) =>
      t.subject.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      t.message.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  // Filter staff tickets by user email or subject or status
  const filteredStaffTickets = adminTickets.filter((t) => {
    const matchesEmail =
      !staffEmailSearch ||
      t.userEmail.toLowerCase().includes(staffEmailSearch.toLowerCase()) ||
      t.userName.toLowerCase().includes(staffEmailSearch.toLowerCase()) ||
      t.subject.toLowerCase().includes(staffEmailSearch.toLowerCase()) ||
      t.id.toLowerCase().includes(staffEmailSearch.toLowerCase());
    
    const matchesStatus = staffStatusFilter === 'all' || t.status === staffStatusFilter;
    return matchesEmail && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/40 border border-amber-500/30 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-inner">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-extrabold text-neutral-100">Customer Support Desk</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" />
                  Live 24/7 Desk
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5 flex items-center space-x-2">
                <span>Official Concierge Email: <strong className="text-amber-300 font-mono">netbybitsupport@gmail.com</strong></span>
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle for Admin / Support Staff */}
        <div className="flex items-center space-x-2">
          {user?.role === 'admin' && (
            <div className="bg-neutral-950 p-1 rounded-xl border border-neutral-800 flex space-x-1">
              <button
                onClick={() => setViewMode('user')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                  viewMode === 'user'
                    ? 'bg-amber-500 text-neutral-950 shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>My User View</span>
              </button>
              <button
                onClick={() => setViewMode('staff_console')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                  viewMode === 'staff_console'
                    ? 'bg-amber-500 text-neutral-950 shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Support Staff Dashboard ({adminTickets.length})</span>
              </button>
            </div>
          )}

          {viewMode === 'user' && (
            <button
              onClick={() => setNewChatModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all flex items-center space-x-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Support Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* --- MODE 1: USER PRIVATE SUPPORT CHAT VIEW --- */}
      {viewMode === 'user' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: User Conversations List */}
          <div className="lg:col-span-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <h2 className="font-bold text-sm text-neutral-100">Your Conversations</h2>
              </div>
              <span className="text-[10px] font-mono bg-neutral-950 px-2 py-0.5 rounded text-neutral-400 border border-neutral-800">
                {tickets.length} total
              </span>
            </div>

            {/* Search conversations */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {loading ? (
              <div className="py-8 text-center text-neutral-500 text-xs flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                <span>Loading support threads...</span>
              </div>
            ) : filteredUserTickets.length === 0 ? (
              <div className="py-8 text-center text-neutral-500 text-xs space-y-3">
                <HelpCircle className="w-8 h-8 text-neutral-700 mx-auto" />
                <p>No support conversations found.</p>
                <button
                  onClick={() => setNewChatModalOpen(true)}
                  className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg font-semibold text-xs transition-all"
                >
                  Start a Support Chat
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {filteredUserTickets.map((t) => {
                  const isSelected = selectedTicketId === t.id;
                  const lastReply = t.replies && t.replies.length > 0 ? t.replies[t.replies.length - 1] : null;

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-2 ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/50 shadow-md'
                          : 'bg-neutral-950 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900/60'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-xs text-neutral-100 truncate max-w-[180px]">
                          {t.subject}
                        </span>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                            t.status === 'Closed'
                              ? 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                              : t.status === 'In Progress'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>

                      <p className="text-[11px] text-neutral-400 line-clamp-1">
                        {lastReply ? `${lastReply.senderName}: ${lastReply.message}` : t.message}
                      </p>

                      <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono pt-1 border-t border-neutral-900">
                        <span>#{t.id}</span>
                        <span>{new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Private Real-time Chat Room */}
          <div className="lg:col-span-8 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col h-[650px] overflow-hidden">
            {currentTicket ? (
              <>
                {/* Chat Header */}
                <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
                        <Shield className="w-5 h-5 text-amber-400" />
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-neutral-950 rounded-full" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-sm text-neutral-100">{currentTicket.subject}</h3>
                        <span className="text-[10px] font-mono bg-neutral-900 text-amber-400 px-2 py-0.5 rounded border border-neutral-800">
                          #{currentTicket.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 flex items-center space-x-2">
                        <span>NETBYBIT Support Desk</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-medium">Official Agent Online</span>
                        <span>•</span>
                        <span className="font-mono text-neutral-500">netbybitsupport@gmail.com</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {currentTicket.status !== 'Closed' ? (
                      <button
                        onClick={() => handleUpdateStatus(currentTicket.id, 'Closed')}
                        className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 rounded-xl text-xs font-semibold flex items-center space-x-1"
                        title="Mark conversation as resolved"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Resolve Chat</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(currentTicket.id, 'Open')}
                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                        <span>Reopen Chat</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Privacy Banner */}
                <div className="bg-amber-500/5 border-b border-amber-500/10 px-4 py-2 text-[11px] text-amber-300/80 flex items-center justify-between font-mono">
                  <div className="flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Private Support Room • All updates dispatched to netbybitsupport@gmail.com</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">Category: {currentTicket.category}</span>
                </div>

                {/* Messages Body Scroll Container */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-950/60">
                  {/* Opening Ticket Statement */}
                  <div className="flex items-start space-x-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 flex items-center justify-center font-bold text-xs shrink-0">
                      {currentTicket.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-2xl space-y-1.5 shadow-md">
                      <div className="flex items-center justify-between space-x-4">
                        <span className="font-bold text-xs text-amber-400">{currentTicket.userName}</span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {new Date(currentTicket.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-200 leading-relaxed">{currentTicket.message}</p>
                      <div className="flex items-center justify-end space-x-1 text-[10px] text-emerald-400 font-mono">
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Delivered</span>
                      </div>
                    </div>
                  </div>

                  {/* Reply Thread */}
                  {currentTicket.replies?.map((rep) => {
                    const isAdmin = rep.sender === 'admin';
                    return (
                      <div
                        key={rep.id}
                        className={`flex items-start space-x-3 ${isAdmin ? 'flex-row' : 'flex-row-reverse space-x-reverse'} max-w-[85%] ${
                          isAdmin ? 'mr-auto' : 'ml-auto'
                        }`}
                      >
                        {/* Avatar */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isAdmin
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                          }`}
                        >
                          {isAdmin ? <Shield className="w-4 h-4 text-amber-400" /> : rep.senderName.charAt(0).toUpperCase()}
                        </div>

                        {/* Bubble */}
                        <div
                          className={`p-3.5 rounded-2xl space-y-1 shadow-md ${
                            isAdmin
                              ? 'bg-neutral-900 border border-amber-500/30 text-neutral-100'
                              : 'bg-gradient-to-r from-amber-600/20 to-amber-500/20 border border-amber-500/40 text-neutral-100'
                          }`}
                        >
                          <div className="flex items-center justify-between space-x-4">
                            <span className={`font-bold text-xs ${isAdmin ? 'text-amber-400' : 'text-amber-300'}`}>
                              {rep.senderName} {isAdmin && '(Support Staff)'}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              {new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed">{rep.message}</p>
                          <div className="flex items-center justify-end space-x-1 text-[10px] text-emerald-400 font-mono">
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>{rep.status || 'Delivered'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Suggestion Pills */}
                <div className="px-4 py-2 bg-neutral-950 border-t border-neutral-800 flex items-center space-x-2 overflow-x-auto text-[11px]">
                  <span className="text-neutral-500 font-medium shrink-0">Quick Topics:</span>
                  {quickPills.map((pill, i) => (
                    <button
                      key={i}
                      onClick={() => setReplyText(pill)}
                      className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-800 rounded-lg shrink-0 transition-colors"
                    >
                      {pill}
                    </button>
                  ))}
                </div>

                {/* Chat Input */}
                <form
                  onSubmit={(e) => handleSendReply(e, currentTicket.id)}
                  className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center space-x-2"
                >
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a message to Customer Support..."
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500/50"
                  />
                  <button
                    type="submit"
                    disabled={replying || !replyText.trim()}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{replying ? 'Sending...' : 'Send'}</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 text-neutral-400">
                <LifeBuoy className="w-12 h-12 text-neutral-700" />
                <div>
                  <h3 className="text-base font-bold text-neutral-200">No Support Thread Selected</h3>
                  <p className="text-xs text-neutral-500 max-w-sm mt-1">
                    Select an existing conversation from the left or start a new support chat to connect with our team.
                  </p>
                </div>
                <button
                  onClick={() => setNewChatModalOpen(true)}
                  className="px-4 py-2 bg-amber-500 text-neutral-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20"
                >
                  Start New Support Chat
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODE 2: DEDICATED SUPPORT DASHBOARD FOR STAFF / ADMIN --- */}
      {viewMode === 'staff_console' && user?.role === 'admin' && (
        <div className="space-y-6">
          {/* Staff Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-neutral-100 space-y-1">
              <span className="text-neutral-500 text-xs">Total Conversations</span>
              <p className="text-2xl font-extrabold font-mono text-amber-400">{adminTickets.length}</p>
            </div>
            <div className="bg-neutral-900 border border-amber-500/30 p-4 rounded-xl text-neutral-100 space-y-1">
              <span className="text-neutral-500 text-xs">Open / Active</span>
              <p className="text-2xl font-extrabold font-mono text-amber-300">
                {adminTickets.filter((t) => t.status === 'Open').length}
              </p>
            </div>
            <div className="bg-neutral-900 border border-blue-500/30 p-4 rounded-xl text-neutral-100 space-y-1">
              <span className="text-neutral-500 text-xs">In Progress</span>
              <p className="text-2xl font-extrabold font-mono text-blue-400">
                {adminTickets.filter((t) => t.status === 'In Progress').length}
              </p>
            </div>
            <div className="bg-neutral-900 border border-emerald-500/30 p-4 rounded-xl text-neutral-100 space-y-1">
              <span className="text-neutral-500 text-xs">Closed / Resolved</span>
              <p className="text-2xl font-extrabold font-mono text-emerald-400">
                {adminTickets.filter((t) => t.status === 'Closed').length}
              </p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search by User Email */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={staffEmailSearch}
                onChange={(e) => setStaffEmailSearch(e.target.value)}
                placeholder="Search conversations by User Email..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Status Filters */}
            <div className="flex items-center space-x-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-neutral-500" />
              <span className="text-neutral-400">Status:</span>
              {(['all', 'Open', 'In Progress', 'Closed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStaffStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all ${
                    staffStatusFilter === st
                      ? 'bg-amber-500 text-neutral-950 shadow'
                      : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Staff Console Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: All User Conversations */}
            <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl space-y-3">
              <h3 className="font-bold text-xs text-neutral-400 uppercase tracking-wider border-b border-neutral-800 pb-2">
                User Support Queue ({filteredStaffTickets.length})
              </h3>

              {filteredStaffTickets.length === 0 ? (
                <p className="text-xs text-neutral-500 py-8 text-center">No user support chats matching query.</p>
              ) : (
                <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                  {filteredStaffTickets.map((t) => {
                    const isSelected = staffSelectedTicketId === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setStaffSelectedTicketId(t.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-2 ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500/50 shadow-md'
                            : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-xs text-neutral-100 block">{t.subject}</span>
                            <span className="text-[11px] text-amber-400 font-mono font-bold block">{t.userEmail}</span>
                          </div>
                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                              t.status === 'Closed'
                                ? 'bg-neutral-800 text-neutral-400'
                                : t.status === 'In Progress'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>

                        <p className="text-[11px] text-neutral-400 line-clamp-1">{t.message}</p>

                        <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono pt-1 border-t border-neutral-900">
                          <span>User: {t.userName}</span>
                          <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Staff Real-time Reply Console */}
            <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col h-[650px] overflow-hidden">
              {currentStaffTicket ? (
                <>
                  {/* Staff Chat Room Header */}
                  <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex justify-between items-center">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-sm text-neutral-100">{currentStaffTicket.subject}</h3>
                        <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                          #{currentStaffTicket.id}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5 font-mono">
                        User Email: <strong className="text-amber-400">{currentStaffTicket.userEmail}</strong> ({currentStaffTicket.userName})
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {currentStaffTicket.status !== 'Closed' ? (
                        <button
                          onClick={() => handleUpdateStatus(currentStaffTicket.id, 'Closed')}
                          className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-semibold flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Close Conversation</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(currentStaffTicket.id, 'In Progress')}
                          className="px-3 py-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Reopen Ticket</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Staff Thread Body */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-950/60">
                    <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-1">
                      <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                        <span className="font-bold text-amber-400">{currentStaffTicket.userName} ({currentStaffTicket.userEmail})</span>
                        <span>{new Date(currentStaffTicket.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-neutral-200">{currentStaffTicket.message}</p>
                    </div>

                    {currentStaffTicket.replies?.map((rep) => {
                      const isAdmin = rep.sender === 'admin';
                      return (
                        <div
                          key={rep.id}
                          className={`p-3.5 rounded-2xl space-y-1 max-w-[85%] ${
                            isAdmin
                              ? 'ml-auto bg-amber-500/10 border border-amber-500/30 text-neutral-100'
                              : 'mr-auto bg-neutral-900 border border-neutral-800 text-neutral-100'
                          }`}
                        >
                          <div className="flex justify-between text-[10px] space-x-4">
                            <span className={`font-bold ${isAdmin ? 'text-amber-400' : 'text-neutral-300'}`}>
                              {rep.senderName} {isAdmin ? '(You / Staff)' : ''}
                            </span>
                            <span className="text-neutral-500 font-mono">
                              {new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-200 whitespace-pre-wrap">{rep.message}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Staff Reply Form */}
                  <form
                    onSubmit={(e) => handleSendReply(e, currentStaffTicket.id)}
                    className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center space-x-2"
                  >
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${currentStaffTicket.userEmail} (Sends email & in-app notification)...`}
                      className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500/50"
                    />
                    <button
                      type="submit"
                      disabled={replying || !replyText.trim()}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{replying ? 'Sending...' : 'Reply User'}</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 text-neutral-500 text-xs">
                  Select a user conversation from the queue to view and reply.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- NEW CHAT ROOM MODAL --- */}
      {newChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-neutral-100">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800 bg-neutral-950">
              <div className="flex items-center space-x-2">
                <LifeBuoy className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-amber-400 text-sm">Open Private Support Chat Room</h3>
              </div>
              <button onClick={() => setNewChatModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupportChat} className="p-6 space-y-4 text-xs">
              {notification && (
                <div
                  className={`p-3 rounded-xl flex items-center space-x-2 ${
                    notification.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/10 text-red-400 border border-red-500/30'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{notification.text}</span>
                </div>
              )}

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Subject / Issue Summary</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Deposit confirmation or wallet connection inquiry"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Deposit / Withdrawal">Deposit / Withdrawal</option>
                    <option value="Wallet Connection">Wallet Connection</option>
                    <option value="Security & Verification">Security & Verification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50 capitalize"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High / Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Detailed Message</label>
                <textarea
                  rows={4}
                  required
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder="Describe your issue or question in detail. Customer support will be notified instantly..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-100 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setNewChatModalOpen(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 font-bold rounded-xl shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300"
                >
                  {submitting ? 'Creating Chat...' : 'Start Support Chat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

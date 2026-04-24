import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  blockUser,
  deleteConversation,
  getConversations,
  getMessages,
  leaveConversation,
  sendMessage,
  unblockUser,
} from '../api/chatApi';
import { createUserReport } from '../api/moderationApi';
import { useAuth } from '../context/useAuth';

const REPORT_OPTIONS = [
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'spam', label: 'Spam' },
  { value: 'hate_speech', label: 'Hate speech' },
  { value: 'scam', label: 'Scam or fraud' },
  { value: 'threat', label: 'Threatening behavior' },
  { value: 'sexual_content', label: 'Sexual content' },
  { value: 'other', label: 'Other' },
];

const ACTION_CONFIRMATIONS = {
  leave: {
    title: 'Leave this chat?',
    body: 'You will stay matched, but you will no longer be able to send new messages in this conversation.',
    confirmLabel: 'Yes, leave chat',
    tone: 'slate',
  },
  delete: {
    title: 'Delete this chat?',
    body: 'This only removes the conversation for you. The other person will still keep their copy.',
    confirmLabel: 'Yes, delete chat',
    tone: 'red',
  },
};

const formatTime = (date) =>
  date
    ? new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(date))
    : '';

const ChatPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isModerating, setIsModerating] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportForm, setReportForm] = useState({ category: 'harassment', details: '' });
  const [pendingAction, setPendingAction] = useState(null);

  const requestedConversationId = searchParams.get('conversation');

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation._id === selectedId),
    [conversations, selectedId]
  );

  const loadConversations = async () => {
    const { data } = await getConversations();
    setConversations(data);
    setSelectedId((current) => current || requestedConversationId || data[0]?._id || '');
    return data;
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setNotice('');

      try {
        await loadConversations();
      } catch (apiError) {
        setNotice(apiError.response?.data?.message || 'Could not load chats.');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!requestedConversationId) {
      return;
    }

    if (conversations.some((conversation) => conversation._id === requestedConversationId)) {
      setSelectedId(requestedConversationId);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('conversation');
      setSearchParams(nextParams);
    }
  }, [conversations, requestedConversationId, searchParams, setSearchParams]);

  useEffect(() => {
    if (!selectedId) {
      return undefined;
    }

    let isActive = true;

    const loadMessages = async () => {
      try {
        const { data } = await getMessages(selectedId);
        if (isActive) {
          setMessages(data.messages);
        }
      } catch (apiError) {
        if (isActive) {
          setNotice(apiError.response?.data?.message || 'Could not load messages.');
        }
      }
    };

    loadMessages();
    const intervalId = window.setInterval(loadMessages, 5000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [selectedId]);

  useEffect(() => {
    setShowReportForm(false);
    setReportForm({ category: 'harassment', details: '' });
    setPendingAction(null);
  }, [selectedId]);

  const handleSend = async (event) => {
    event.preventDefault();
    const cleanDraft = draft.trim();

    if (!cleanDraft || !selectedId) {
      return;
    }

    setIsSending(true);
    setNotice('');

    try {
      const { data } = await sendMessage(selectedId, cleanDraft);
      setMessages((current) => [...current, data]);
      setDraft('');
      await loadConversations();
    } catch (apiError) {
      setNotice(apiError.response?.data?.message || 'Could not send message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleLeave = async () => {
    if (!selectedId) {
      return;
    }

    try {
      await leaveConversation(selectedId);
      setNotice('You left this chat. Sending is now disabled.');
      setPendingAction(null);
      await loadConversations();
    } catch (apiError) {
      setNotice(apiError.response?.data?.message || 'Could not leave chat.');
    }
  };

  const handleDelete = async () => {
    if (!selectedId) {
      return;
    }

    try {
      await deleteConversation(selectedId);
      setConversations((current) => current.filter((conversation) => conversation._id !== selectedId));
      setSelectedId('');
      setMessages([]);
      setPendingAction(null);
      setNotice('Chat deleted for you.');
    } catch (apiError) {
      setNotice(apiError.response?.data?.message || 'Could not delete chat.');
    }
  };

  const handleBlockToggle = async () => {
    if (!selectedConversation?.otherUser?._id) {
      return;
    }

    setIsModerating(true);
    setNotice('');

    try {
      if (selectedConversation.blockedByCurrentUser) {
        const { data } = await unblockUser(selectedConversation.otherUser._id);
        setNotice(data.message || `You unblocked ${selectedConversation.otherUser.name}.`);
      } else {
        const { data } = await blockUser(selectedConversation.otherUser._id);
        setNotice(data.message || `You blocked ${selectedConversation.otherUser.name}.`);
      }

      await loadConversations();
    } catch (apiError) {
      setNotice(apiError.response?.data?.message || 'Could not update block status.');
    } finally {
      setIsModerating(false);
    }
  };

  const handleReportSubmit = async (event) => {
    event.preventDefault();

    if (!selectedConversation?.otherUser?._id) {
      return;
    }

    setIsModerating(true);
    setNotice('');

    try {
      await createUserReport({
        conversationId: selectedConversation._id,
        reportedUserId: selectedConversation.otherUser._id,
        category: reportForm.category,
        details: reportForm.details,
      });
      setShowReportForm(false);
      setReportForm({ category: 'harassment', details: '' });
      setNotice(
        `Report sent. Our team can now review this chat and decide whether ${selectedConversation.otherUser.name} should be banned from the platform.`
      );
    } catch (apiError) {
      setNotice(apiError.response?.data?.message || 'Could not submit report.');
    } finally {
      setIsModerating(false);
    }
  };

  const chatDisabled =
    selectedConversation?.leftByCurrentUser ||
    selectedConversation?.isBlocked ||
    selectedConversation?.blockedCurrentUser;
  const confirmationConfig = pendingAction ? ACTION_CONFIRMATIONS[pendingAction] : null;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col px-4 py-6">
      <div className="mb-5">
        <h1 className="text-3xl font-black text-ink">Chats</h1>
        <p className="mt-1 text-sm text-slate-600">Chat with people after you both like each other.</p>
      </div>

      {notice && <p className="mb-4 rounded bg-white p-3 text-sm font-semibold text-slate-700 shadow-sm">{notice}</p>}

      <section className="grid min-h-[640px] flex-1 overflow-hidden rounded-lg bg-white shadow-soft lg:grid-cols-[320px_1fr]">
        <aside className="border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 p-4">
            <h2 className="font-black text-ink">Matched chats</h2>
          </div>

          {isLoading ? (
            <div className="p-4 text-sm font-semibold text-slate-600">Loading chats...</div>
          ) : conversations.length ? (
            <div className="max-h-[580px] overflow-y-auto">
              {conversations.map((conversation) => (
                <button
                  key={conversation._id}
                  type="button"
                  onClick={() => setSelectedId(conversation._id)}
                  className={`block w-full border-b border-slate-100 p-4 text-left transition ${
                    selectedId === conversation._id ? 'bg-slate-100' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded bg-ink text-lg font-black text-white">
                      {conversation.otherUser?.name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-black text-ink">{conversation.otherUser?.name}</p>
                      <p className="truncate text-sm text-slate-500">
                        {conversation.isBlocked
                          ? 'Chat blocked'
                          : conversation.latestMessage?.text || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-sm text-slate-600">No chats yet. Mutual matches will appear here.</div>
          )}
        </aside>

        <section className="flex min-h-0 flex-col">
          {selectedConversation ? (
            <>
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
                <div>
                  <h2 className="text-xl font-black text-ink">{selectedConversation.otherUser?.name}</h2>
                  <p className="text-sm text-slate-500">
                    {[selectedConversation.otherUser?.city, selectedConversation.otherUser?.state].filter(Boolean).join(', ')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleBlockToggle}
                    disabled={isModerating || selectedConversation.blockedCurrentUser}
                    className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800 disabled:opacity-50"
                  >
                    {selectedConversation.blockedByCurrentUser ? 'Unblock' : 'Block'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReportForm((current) => !current)}
                    className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700"
                  >
                    Report
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingAction('leave')}
                    className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:text-ink"
                  >
                    Leave
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingAction('delete')}
                    className="rounded bg-red-50 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </header>

              {confirmationConfig && (
                <div
                  className={`border-b px-4 py-4 ${
                    confirmationConfig.tone === 'red'
                      ? 'border-red-200 bg-red-50'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p
                        className={`text-sm font-black ${
                          confirmationConfig.tone === 'red' ? 'text-red-900' : 'text-ink'
                        }`}
                      >
                        {confirmationConfig.title}
                      </p>
                      <p
                        className={`mt-1 text-sm ${
                          confirmationConfig.tone === 'red' ? 'text-red-800' : 'text-slate-600'
                        }`}
                      >
                        {confirmationConfig.body}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPendingAction(null)}
                        className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={pendingAction === 'leave' ? handleLeave : handleDelete}
                        className={`rounded px-4 py-2 text-sm font-black text-white ${
                          confirmationConfig.tone === 'red' ? 'bg-red-600' : 'bg-ink'
                        }`}
                      >
                        {confirmationConfig.confirmLabel}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {(selectedConversation.blockedByCurrentUser || selectedConversation.blockedCurrentUser) && (
                <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                  {selectedConversation.blockedByCurrentUser
                    ? `You blocked ${selectedConversation.otherUser?.name}. Messaging is disabled until you unblock them.`
                    : `${selectedConversation.otherUser?.name} has blocked you. Messaging is disabled.`}
                </div>
              )}

              {showReportForm && (
                <form onSubmit={handleReportSubmit} className="border-b border-red-100 bg-red-50 p-4">
                  <p className="text-sm font-black text-red-900">Report {selectedConversation.otherUser?.name}</p>
                  <p className="mt-1 text-sm text-red-800">
                    This sends the chat history to the dev team so they can review it and decide whether a platform ban
                    is necessary.
                  </p>
                  <div className="mt-3 grid gap-3 lg:grid-cols-[220px_1fr]">
                    <label className="block">
                      <span className="text-sm font-semibold text-red-900">Reason</span>
                      <select
                        className="mt-1 w-full rounded border border-red-200 bg-white px-3 py-2"
                        value={reportForm.category}
                        onChange={(event) =>
                          setReportForm((current) => ({ ...current, category: event.target.value }))
                        }
                      >
                        {REPORT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-red-900">Details</span>
                      <textarea
                        rows="3"
                        className="mt-1 w-full rounded border border-red-200 bg-white px-3 py-2"
                        placeholder="Add context for the moderation team."
                        value={reportForm.details}
                        onChange={(event) =>
                          setReportForm((current) => ({ ...current, details: event.target.value }))
                        }
                      />
                    </label>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="submit"
                      disabled={isModerating}
                      className="rounded bg-red-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50"
                    >
                      Submit report
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReportForm(false)}
                      className="rounded border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
                {messages.length ? (
                  messages.map((message) => {
                    const isMine = (message.sender?._id || message.sender) === user?.id;

                    return (
                      <div key={message._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[78%] rounded-lg px-4 py-3 ${
                            isMine ? 'chat-bubble chat-bubble-mine' : 'chat-bubble chat-bubble-theirs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words text-sm">{message.text}</p>
                          <p className={`mt-1 text-xs ${isMine ? 'chat-bubble-time-mine' : 'chat-bubble-time-theirs'}`}>
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="grid h-full place-items-center text-center text-sm text-slate-500">
                    Start the conversation and make a plan to meet up.
                  </div>
                )}
              </div>

              <form onSubmit={handleSend} className="flex gap-2 border-t border-slate-200 p-4">
                <input
                  className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-3 outline-none focus:border-ink"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={
                    selectedConversation.blockedByCurrentUser
                      ? 'You blocked this user'
                      : selectedConversation.blockedCurrentUser
                        ? 'This user blocked you'
                        : selectedConversation.leftByCurrentUser
                          ? 'You left this chat'
                          : 'Write a message'
                  }
                  disabled={chatDisabled}
                />
                <button
                  type="submit"
                  disabled={isSending || chatDisabled}
                  className="rounded bg-ink px-5 py-3 font-black text-white disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-6 text-center text-slate-600">
              Select a matched chat.
            </div>
          )}
        </section>
      </section>
    </main>
  );
};

export default ChatPage;

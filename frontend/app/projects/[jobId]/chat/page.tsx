'use client';

import { use, useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, selectUser, selectUserRole } from '@/store/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DashboardLayout } from '@/app/freelancer/dashboard/DashboardLayout';
import { chatService, jobService, type ChatMessage, type Job } from '@/lib/api/services';
import { formatDistanceToNow } from 'date-fns';

export default function ChatPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const router = useRouter();
  const user = useAuthStore(selectUser);
  const role = useAuthStore(selectUserRole);

  const [job, setJob] = useState<Job | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastMessageId, setLastMessageId] = useState<number>(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [jobRes, messagesRes] = await Promise.all([
          jobService.getById(Number(jobId)),
          chatService.getMessages(Number(jobId), { limit: 50 }).catch(() => null),
        ]);

        if (jobRes.success && jobRes.data) {
          setJob(jobRes.data);
        }

        if (messagesRes?.success && messagesRes.data?.messages) {
          setMessages(messagesRes.data.messages);
          const maxId = Math.max(...messagesRes.data.messages.map(m => m.message_id), 0);
          setLastMessageId(maxId);
        }
      } catch (err) {
        console.error('Failed to load chat:', err);
        setError('Failed to load chat');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up polling for new messages
    pollIntervalRef.current = setInterval(async () => {
      if (lastMessageId > 0) {
        try {
          const res = await chatService.getNewMessages(Number(jobId), lastMessageId);
          if (res.success && res.data?.messages && res.data.messages.length > 0) {
            setMessages(prev => [...prev, ...res.data!.messages]);
            const maxId = Math.max(...res.data.messages.map(m => m.message_id));
            setLastMessageId(maxId);
          }
        } catch (err) {
          // Silently fail polling
        }
      }
    }, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [user, router, jobId, lastMessageId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const content = input.trim();
    setInput('');
    setSending(true);

    try {
      const response = await chatService.sendMessage(Number(jobId), { content });

      if (response.success && response.data) {
        // Add the user's message
        const newMessage: ChatMessage = {
          message_id: response.data.message_id,
          channel_id: 0,
          sender_id: user?.id ? Number(user.id) : undefined,
          sender_type: role === 'employer' ? 'employer' : 'freelancer',
          sender_name: user?.name || 'You',
          content: content,
          is_ai_generated: false,
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, newMessage]);
        setLastMessageId(response.data.message_id);

        // If Bro responded, add that message too
        if (response.data.bro_response) {
          const broMessage: ChatMessage = {
            message_id: response.data.bro_response.message_id,
            channel_id: 0,
            sender_type: 'ai_mediator',
            sender_name: 'AI Mediator',
            content: response.data.bro_response.content,
            is_ai_generated: true,
            ai_intervention_type: response.data.bro_response.intervention_type,
            created_at: new Date().toISOString(),
          };
          setMessages(prev => [...prev, broMessage]);
          setLastMessageId(response.data.bro_response.message_id);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send message');
      setInput(content); // Restore input on error
    } finally {
      setSending(false);
    }
  };

  const getSenderStyle = (senderType: string) => {
    switch (senderType) {
      case 'employer':
        return 'bg-info/20 text-info';
      case 'freelancer':
        return 'bg-success/20 text-success';
      case 'ai_mediator':
        return 'bg-primary/20 text-primary';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const isOwnMessage = (msg: ChatMessage) => {
    if (!user) return false;
    return msg.sender_id === Number(user.id);
  };

  if (!user) return null;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon="💬"
            title="Chat not found"
            description="This job may have been removed or you don't have access."
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-card border-b border-border px-6 py-4 flex items-center gap-4 shrink-0">
          <Link
            href={role === 'freelancer' ? `/freelancer/projects/${jobId}` : `/employer/jobs/${jobId}`}
            className="text-muted-foreground hover:text-foreground"
          >
            &larr;
          </Link>
          <div className="flex-1">
            <div className="font-semibold text-foreground">{job.title}</div>
            <div className="text-xs text-muted-foreground">
              {job.employer_name} • {job.assigned_freelancer_name || 'Unassigned'} • AI Mediator
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/projects/${jobId}/spec`}>
              <Button variant="secondary" size="sm">View Spec</Button>
            </Link>
            <Badge variant={job.status === 'IN_PROGRESS' ? 'success' : 'muted'}>
              {job.status.replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>

        {/* Spec warning banner */}
        <div className="bg-warning/10 border-b border-warning/20 px-6 py-2 text-xs text-warning font-medium shrink-0 flex items-center gap-2">
          <span>&#9888;&#65039;</span>
          This chat cannot override the agreed spec. Any changes require a formal Change Request.
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-error/10 border-b border-error/20 px-6 py-2 text-xs text-error font-medium shrink-0">
            {error}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <EmptyState
                icon="💬"
                title="No messages yet"
                description="Start the conversation!"
              />
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.message_id}
                className={`flex ${isOwnMessage(msg) ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] ${
                    msg.is_ai_generated
                      ? 'bg-primary/10 border border-primary/30 rounded-xl'
                      : isOwnMessage(msg)
                      ? 'bg-primary text-white rounded-2xl rounded-br-md'
                      : 'bg-card border border-border rounded-2xl rounded-bl-md'
                  } px-4 py-3`}
                >
                  {/* Sender info for non-own messages */}
                  {!isOwnMessage(msg) && (
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${getSenderStyle(
                          msg.sender_type
                        )}`}
                      >
                        {msg.sender_name}
                      </span>
                      {msg.is_ai_generated && msg.ai_intervention_type && (
                        <Badge variant="muted" className="text-[10px]">
                          {msg.ai_intervention_type.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Message content */}
                  <p
                    className={`text-sm whitespace-pre-wrap ${
                      isOwnMessage(msg) && !msg.is_ai_generated ? 'text-white' : 'text-foreground'
                    }`}
                  >
                    {msg.content}
                  </p>

                  {/* Timestamp */}
                  <div
                    className={`text-[10px] mt-1 ${
                      isOwnMessage(msg) && !msg.is_ai_generated
                        ? 'text-white/70'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSend}
          className="bg-card border-t border-border px-6 py-4 flex gap-3 shrink-0"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-primary transition-colors disabled:opacity-50"
          />
          <Button type="submit" variant="primary" disabled={!input.trim() || sending}>
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Sparkles, ChevronLeft } from 'lucide-react'
import { apiErrorMessage } from '@/lib/api'
import { useWorkflowStore } from '@/store/workflowStore'
import {
  useStartAiSession,
  useSendAiMessage,
  useDeleteAiSession,
} from '@/hooks/useAiChat'

interface ChatMsg {
  role: 'user' | 'assistant'
  text: string
}

export function AIChatPanel({
  onSessionChange,
  collapsed,
  onToggle,
}: {
  onSessionChange?: (id: string | null) => void
  collapsed: boolean
  onToggle: () => void
}) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const definition = useWorkflowStore((s) => s.definition)
  const setDefinition = useWorkflowStore((s) => s.setDefinition)

  const start = useStartAiSession()
  const send = useSendAiMessage(sessionId)
  const del = useDeleteAiSession()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { sessionId: id } = await start.mutateAsync()
        if (cancelled) return
        setSessionId(id)
        onSessionChange?.(id)
        setMessages([
          {
            role: 'assistant',
            text: 'Hi! Describe the workflow you want to build and I’ll draft it on the canvas.',
          },
        ])
      } catch (e) {
        if (!cancelled) setErr(apiErrorMessage(e))
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      if (sessionId) {
        del.mutate(sessionId)
        onSessionChange?.(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, send.isPending])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || !sessionId || send.isPending) return
    setErr(null)
    setInput('')
    setMessages((m) => [...m, { role: 'user', text }])
    try {
      const res = await send.mutateAsync({
        message: text,
        currentWorkflow: definition.steps.length ? definition : undefined,
      })
      setMessages((m) => [...m, { role: 'assistant', text: res.chatText || '(done)' }])
      if (res.workflowDraft) {
        setDefinition(res.workflowDraft, true)
      }
    } catch (e) {
      setErr(apiErrorMessage(e))
    }
  }

  if (collapsed) {
    return (
      <div className="h-full w-full lg:w-12 flex flex-col items-center py-4 bg-[color:var(--surface)] border-l border-[color:var(--border)]">
        <button
          onClick={onToggle}
          className="h-9 w-9 grid place-items-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          title="Expand AI assistant"
        >
          <Sparkles className="h-4 w-4 text-white" />
        </button>
        <div className="mt-3 text-[10px] uppercase tracking-wider text-[color:var(--muted-2)] [writing-mode:vertical-rl] rotate-180">
          AI assistant
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[color:var(--surface)] border-l border-[color:var(--border)]">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-[color:var(--border)]">
        <div className="h-9 w-9 rounded-xl bg-white/10 grid place-items-center">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold">AI assistant</h3>
          <div className="text-[11px] text-[color:var(--muted-2)]">Draft automations with prompts</div>
        </div>
        <button
          onClick={onToggle}
          className="h-8 w-8 grid place-items-center rounded-lg bg-[color:var(--surface-2)] border border-[color:var(--border)] text-[color:var(--muted)] hover:text-white transition-colors"
          title="Collapse"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === 'user'
                ? 'ml-8 bg-white text-[color:var(--accent-fg)] rounded-2xl rounded-tr-md px-4 py-2.5'
                : 'mr-8 bg-[color:var(--surface-2)] border border-[color:var(--border)] rounded-2xl rounded-tl-md px-4 py-2.5'
            }
          >
            {m.text}
          </div>
        ))}
        {send.isPending && (
          <div className="mr-8 inline-flex items-center gap-2 text-[color:var(--muted)] text-xs px-4 py-2 bg-[color:var(--surface-2)] border border-[color:var(--border)] rounded-2xl">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--muted)] animate-pulse" />
            Thinking…
          </div>
        )}
        {err && (
          <div className="text-xs text-[color:var(--danger)] px-3 py-2 rounded-xl border border-[color:var(--danger)]/30 bg-[color:var(--danger)]/10">
            {err}
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="p-4 border-t border-[color:var(--border)]">
        <div className="flex items-center gap-2 rounded-2xl bg-[color:var(--surface-2)] border border-[color:var(--border)] focus-within:border-[color:var(--border-strong)] focus-within:ring-4 focus-within:ring-[color:var(--ring)] transition-all px-3 py-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!sessionId || send.isPending}
            placeholder={sessionId ? 'Describe what should happen…' : 'Starting session…'}
            className="flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-[color:var(--muted-2)]"
          />
          <button
            type="submit"
            disabled={!sessionId || send.isPending || !input.trim()}
            className="h-8 w-8 grid place-items-center rounded-lg bg-[color:var(--accent)] text-[color:var(--accent-fg)] hover:opacity-90 disabled:opacity-40 transition-opacity"
            title="Send"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  )
}

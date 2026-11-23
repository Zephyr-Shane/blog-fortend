'use client';

import { useState } from 'react';
import { ChevronDown, MessageCircle, Heart } from 'lucide-react';
import type { Interview } from '@/types/api';
import { cn } from '@/lib/utils';

const DIFFICULTY_LABEL: Record<string, string> = { easy: '易', medium: '中', hard: '难' };

export function QuestionItem({ item }: { item: Interview }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-card border border-line bg-surface">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 p-5 text-left"
        aria-expanded={open}
      >
        <span className="flex-1">
          <span className="block font-medium text-ink">{item.title}</span>
          <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
            {item.company && <span>{item.company}</span>}
            {item.knowledgePoint && <span>· {item.knowledgePoint}</span>}
            {item.difficulty && (
              <span className="rounded-full bg-surface-container px-1.5 py-0.5 text-[10px]">难度 {DIFFICULTY_LABEL[item.difficulty]}</span>
            )}
          </span>
        </span>
        <ChevronDown
          size={18}
          strokeWidth={1.6}
          className={cn('shrink-0 text-ink-soft transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="border-t border-line px-5 py-4">
          <div
            className="article-body text-sm"
            dangerouslySetInnerHTML={{ __html: item.content }}
          />
          <div className="mt-4 flex items-center gap-4 text-xs text-ink-soft">
            <span className="flex items-center gap-1.5"><MessageCircle size={14} />{item.commentCount}</span>
            <span className="flex items-center gap-1.5"><Heart size={14} />{item.likeCount}</span>
          </div>
        </div>
      )}
    </div>
  );
}

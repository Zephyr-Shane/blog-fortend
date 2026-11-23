'use client';

import { useCallback, useRef, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

// 脏状态检测：比较当前值与基准值，判断用户是否做出了未保存的修改。
// 用法：const { isDirty, markClean } = useDirty(currentValue)
//   - 数据加载完成后调用 markClean(value) 设定基准
//   - 保存成功后再调用 markClean() 清除脏标记
export function useDirty<T>(current: T) {
  const [baseline, setBaseline] = useState<string | null>(null);
  const currentRef = useRef(current);
  currentRef.current = current;

  const markClean = useCallback((value?: T) => {
    setBaseline(JSON.stringify(value === undefined ? currentRef.current : value));
  }, []);

  const reset = useCallback(() => {
    setBaseline(null);
  }, []);

  const isDirty = baseline !== null && JSON.stringify(current) !== baseline;
  return { isDirty, markClean, reset };
}

// 带脏状态提示的保存按钮：
// - 无修改：灰色、禁用、提示"暂无修改"
// - 有修改：高亮主色、提示"有未保存的修改"
export function DirtySaveButton({
  isDirty,
  saving,
  onClick,
  label = '保存',
}: {
  isDirty: boolean;
  saving: boolean;
  onClick: (e: React.FormEvent) => void;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        onClick={onClick}
        disabled={!isDirty || saving}
        className={cn(
          'inline-flex items-center gap-2 rounded-control px-5 py-2.5 text-sm font-medium transition-colors',
          isDirty
            ? 'bg-primary text-white hover:bg-primary-hover'
            : 'cursor-not-allowed border border-line bg-canvas text-ink-soft opacity-70',
        )}
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {saving ? '保存中…' : label}
      </button>
      <span className={cn('flex items-center gap-1.5 text-xs', isDirty ? 'text-accent' : 'text-ink-soft')}>
        <span className={cn('h-1.5 w-1.5 rounded-full', isDirty ? 'bg-accent' : 'bg-line-strong')} />
        {isDirty ? '有未保存的修改，记得点击保存' : '暂无修改'}
      </span>
    </div>
  );
}

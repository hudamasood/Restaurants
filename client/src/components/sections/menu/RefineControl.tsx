import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { DUR, EASE } from '@/motion/constants';
import { useCanAnimate, useMotionState } from '@/motion/guards';
import { useEscape, useScrollLock } from '@/app/overlay';
import { useOutsideDismiss } from '@/lib/useDismiss';
import {
  DIETARY_FILTERS,
  REFINE_COURSES,
  activeRefineCount,
} from '@/lib/menuFilter';
import type { DietaryId, MenuQuery } from '@/lib/menuFilter';
import type { CourseId } from '@/types';

/**
 * The secondary refine control — Course and Dietary, collapsed behind a single
 * button rather than laid out as a permanent row of chips.
 *
 * Selecting an option applies it immediately on top of the active category and
 * closes the panel; a pointer-down outside, or Escape, closes it without
 * changing anything. Desktop gets an anchored dropdown, mobile a bottom sheet,
 * and both apply on selection so the two behave identically.
 */
export function RefineControl({
  query,
  availableCourses,
  onToggleCourse,
  onToggleDiet,
  onClear,
}: {
  query: MenuQuery;
  availableCourses: Set<CourseId>;
  onToggleCourse: (id: CourseId) => void;
  onToggleDiet: (id: DietaryId) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useMotionState();

  const close = useCallback(() => setOpen(false), []);
  useOutsideDismiss(open && !isMobile, anchorRef, close);
  useEscape(open, close);

  const count = activeRefineCount(query);
  const courses = REFINE_COURSES.filter((c) => availableCourses.has(c.id));

  return (
    <div ref={anchorRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="menu-refine-panel"
        className="u-mono flex items-center gap-2 px-4 py-2"
        style={{
          border: `1px solid ${count > 0 ? 'var(--color-bone-ghost)' : 'var(--color-smoke)'}`,
          color: count > 0 ? 'var(--color-bone)' : 'var(--color-bone-dim)',
          background: 'transparent',
          transition: `color ${DUR.short}s var(--ease-house), border-color ${DUR.short}s var(--ease-house)`,
        }}
      >
        Filter
        {count > 0 && <span className="u-num">({count})</span>}
        <span
          aria-hidden="true"
          style={{
            fontSize: '0.5rem',
            lineHeight: 1,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: `transform ${DUR.short}s var(--ease-house)`,
          }}
        >
          ▾
        </span>
      </button>

      {isMobile ? (
        <RefineSheet
          open={open}
          onClose={close}
          query={query}
          courses={courses}
          onToggleCourse={onToggleCourse}
          onToggleDiet={onToggleDiet}
          onClear={onClear}
        />
      ) : (
        <AnimatePresence>
          {open && (
            <RefinePanel
              query={query}
              courses={courses}
              onToggleCourse={onToggleCourse}
              onToggleDiet={onToggleDiet}
              onClear={onClear}
              onClose={close}
            />
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

type CourseOption = { id: CourseId; label: string };

interface PanelBody {
  query: MenuQuery;
  courses: CourseOption[];
  onToggleCourse: (id: CourseId) => void;
  onToggleDiet: (id: DietaryId) => void;
  onClear: () => void;
  onClose: () => void;
}

function RefinePanel(props: PanelBody) {
  const canAnimate = useCanAnimate();

  return (
    <motion.div
      id="menu-refine-panel"
      role="dialog"
      aria-label="Refine the menu"
      className="absolute right-0 top-full z-20 mt-2 w-[22rem] max-w-[calc(100vw-2.5rem)]"
      style={{
        background: 'var(--color-ash)',
        border: '1px solid var(--color-smoke)',
      }}
      initial={canAnimate ? { opacity: 0, y: -6 } : { opacity: 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={canAnimate ? { opacity: 0, y: -6 } : { opacity: 0 }}
      transition={{ duration: DUR.short, ease: EASE.house }}
    >
      <RefineGroups {...props} />
    </motion.div>
  );
}

function RefineSheet({
  open,
  onClose,
  ...rest
}: Omit<PanelBody, 'onClose'> & { open: boolean; onClose: () => void }) {
  useScrollLock(open, 'filters');
  const canAnimate = useCanAnimate();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-end">
          <motion.button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0"
            style={{ background: 'rgb(11 11 12 / 0.8)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUR.micro }}
            onClick={onClose}
          />

          <motion.div
            id="menu-refine-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Refine the menu"
            className="relative max-h-[86svh] w-full overflow-y-auto"
            style={{
              background: 'var(--color-ash)',
              borderTop: '1px solid var(--color-smoke)',
            }}
            initial={canAnimate ? { y: '100%' } : { opacity: 0 }}
            animate={canAnimate ? { y: 0 } : { opacity: 1 }}
            exit={canAnimate ? { y: '100%' } : { opacity: 0 }}
            transition={{ duration: DUR.short, ease: EASE.house }}
          >
            <RefineGroups {...rest} onClose={onClose} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function RefineGroups({
  query,
  courses,
  onToggleCourse,
  onToggleDiet,
  onClear,
  onClose,
}: PanelBody) {
  const count = activeRefineCount(query);

  return (
    <div className="px-6 py-6">
      {courses.length > 0 && (
        <div className="mb-7">
          <p className="u-mono mb-4" style={{ color: 'var(--color-bone-ghost)' }}>
            Course
          </p>
          <div className="flex flex-wrap gap-2">
            {courses.map((c) => (
              <RefineOption
                key={c.id}
                label={c.label}
                active={query.courses.includes(c.id)}
                onClick={() => {
                  onToggleCourse(c.id);
                  onClose();
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="u-mono mb-4" style={{ color: 'var(--color-bone-ghost)' }}>
          Dietary
        </p>
        <div className="flex flex-wrap gap-2">
          {DIETARY_FILTERS.map((d) => (
            <RefineOption
              key={d.id}
              label={d.label}
              active={query.diets.includes(d.id)}
              onClick={() => {
                onToggleDiet(d.id);
                onClose();
              }}
            />
          ))}
        </div>
      </div>

      {count > 0 && (
        <button
          type="button"
          onClick={() => {
            onClear();
            onClose();
          }}
          className="u-mono mt-7"
          style={{ color: 'var(--color-bone-faint)' }}
        >
          Clear refinements
        </button>
      )}
    </div>
  );
}

function RefineOption({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="u-mono px-3.5 py-2"
      style={{
        border: `1px solid ${active ? 'var(--color-bone)' : 'var(--color-smoke)'}`,
        color: active ? 'var(--color-bone)' : 'var(--color-bone-dim)',
        background: active ? 'var(--color-ash-3)' : 'transparent',
        transition: `color ${DUR.short}s var(--ease-house), border-color ${DUR.short}s var(--ease-house), background ${DUR.short}s var(--ease-house)`,
      }}
    >
      {label}
    </button>
  );
}

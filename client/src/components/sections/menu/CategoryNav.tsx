import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { DUR, EASE } from '@/motion/constants';
import { useCanAnimate } from '@/motion/guards';
import { useEscape } from '@/app/overlay';
import { useOutsideDismiss } from '@/lib/useDismiss';
import { MENU_CATEGORIES } from '@/lib/menuFilter';
import type { CategoryId, MenuCategory } from '@/lib/menuFilter';
import type { CourseId } from '@/types';

/**
 * Primary navigation for the menu — the kitchens, read as a category menu
 * rather than a row of filter chips. A category with sub-groups opens a small
 * dropdown listing them; selecting one goes straight to that sub-group.
 *
 * The dropdown is a sibling of the horizontal scroller rather than a child of
 * it, because an absolutely positioned panel inside an `overflow-x: auto`
 * container is clipped by that container on narrow viewports.
 */
export function CategoryNav({
  category,
  subGroup,
  onSelect,
}: {
  category: CategoryId;
  subGroup: CourseId | null;
  onSelect: (category: CategoryId, subGroup: CourseId | null) => void;
}) {
  const [openMenu, setOpenMenu] = useState<CategoryId | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpenMenu(null), []);
  useOutsideDismiss(openMenu !== null, containerRef, close);
  useEscape(openMenu !== null, close);

  const open = openMenu ? MENU_CATEGORIES.find((c) => c.id === openMenu) : undefined;

  return (
    <div ref={containerRef} className="relative">
      <nav aria-label="Menu categories">
        <ul
          className="-mx-1 flex items-center gap-x-7 overflow-x-auto px-1 py-4 sm:gap-x-9 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', scrollSnapType: 'x proximity' }}
        >
          {MENU_CATEGORIES.map((cat) => (
            <li key={cat.id} className="shrink-0" style={{ scrollSnapAlign: 'start' }}>
              {cat.subGroups ? (
                <CategoryWithSubGroups
                  cat={cat}
                  active={category === cat.id}
                  activeSubGroup={category === cat.id ? subGroup : null}
                  expanded={openMenu === cat.id}
                  onToggle={() => setOpenMenu(openMenu === cat.id ? null : cat.id)}
                />
              ) : (
                <CategoryLink
                  label={cat.label}
                  active={category === cat.id}
                  onClick={() => {
                    close();
                    onSelect(cat.id, null);
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      </nav>

      <SubGroupMenu
        cat={open}
        activeSubGroup={subGroup}
        activeCategory={category}
        onSelect={(id, sub) => {
          close();
          onSelect(id, sub);
        }}
      />
    </div>
  );
}

function CategoryLink({
  label,
  active,
  onClick,
  id,
  expanded,
  controls,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  id?: string;
  expanded?: boolean;
  controls?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      aria-expanded={expanded}
      aria-haspopup={controls ? 'true' : undefined}
      aria-controls={controls}
      className="u-mono whitespace-nowrap"
      style={{
        color: active ? 'var(--color-bone)' : 'var(--color-bone-dim)',
        transition: `color ${DUR.short}s var(--ease-house)`,
      }}
    >
      <span className="link-rule" data-active={active}>
        {label}
      </span>
    </button>
  );
}

function CategoryWithSubGroups({
  cat,
  active,
  activeSubGroup,
  expanded,
  onToggle,
}: {
  cat: MenuCategory;
  active: boolean;
  activeSubGroup: CourseId | null;
  expanded: boolean;
  onToggle: () => void;
}) {
  const sub = activeSubGroup
    ? cat.subGroups?.find((s) => s.id === activeSubGroup)
    : undefined;

  return (
    <span className="flex items-center gap-2">
      <CategoryLink
        id={`cat-${cat.id}`}
        controls={`submenu-${cat.id}`}
        expanded={expanded}
        label={sub ? `${cat.label} · ${sub.label}` : cat.label}
        active={active}
        onClick={onToggle}
      />
      <span
        aria-hidden="true"
        className="u-mono"
        style={{
          color: active ? 'var(--color-bone)' : 'var(--color-bone-faint)',
          transform: expanded ? 'rotate(180deg)' : 'none',
          transition: `transform ${DUR.short}s var(--ease-house)`,
          fontSize: '0.5rem',
          lineHeight: 1,
        }}
      >
        ▾
      </span>
    </span>
  );
}

function SubGroupMenu({
  cat,
  activeCategory,
  activeSubGroup,
  onSelect,
}: {
  cat: MenuCategory | undefined;
  activeCategory: CategoryId;
  activeSubGroup: CourseId | null;
  onSelect: (category: CategoryId, subGroup: CourseId | null) => void;
}) {
  const canAnimate = useCanAnimate();

  return (
    <AnimatePresence>
      {cat && (
        <motion.div
          id={`submenu-${cat.id}`}
          role="group"
          aria-label={`${cat.label} sub-groups`}
          className="absolute left-0 top-full z-10 min-w-[15rem]"
          style={{
            background: 'var(--color-ash)',
            border: '1px solid var(--color-smoke)',
          }}
          initial={canAnimate ? { opacity: 0, y: -6 } : { opacity: 0 }}
          animate={{ opacity: 1, y: 0 }}
          exit={canAnimate ? { opacity: 0, y: -6 } : { opacity: 0 }}
          transition={{ duration: DUR.short, ease: EASE.house }}
        >
          <ul className="py-2">
            <li>
              <SubGroupItem
                label={`All ${cat.label}`}
                active={activeCategory === cat.id && activeSubGroup === null}
                onClick={() => onSelect(cat.id, null)}
              />
            </li>
            {cat.subGroups?.map((sub) => (
              <li key={sub.id}>
                <SubGroupItem
                  label={sub.label}
                  active={activeCategory === cat.id && activeSubGroup === sub.id}
                  onClick={() => onSelect(cat.id, sub.id)}
                />
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SubGroupItem({
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
      aria-current={active ? 'true' : undefined}
      className="u-mono block w-full px-5 py-3 text-left"
      style={{
        color: active ? 'var(--color-bone)' : 'var(--color-bone-dim)',
        background: active ? 'var(--color-ash-3)' : 'transparent',
        transition: `color ${DUR.micro}s var(--ease-house), background ${DUR.micro}s var(--ease-house)`,
      }}
    >
      {label}
    </button>
  );
}

import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore, ThemeMode } from '../../store/themeStore';

const OPTIONS: { id: ThemeMode; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'light', label: 'Light mode', Icon: Sun },
  { id: 'dark', label: 'Dark mode', Icon: Moon },
  { id: 'system', label: 'System theme', Icon: Monitor },
];

export const ThemeToggle: React.FC = () => {
  const { mode, resolvedTheme, setMode } = useThemeStore();

  return (
    <div
      role="radiogroup"
      aria-label="Theme preference"
      className="inline-flex items-center p-0.5 rounded-md bg-black/20 border border-white/10"
    >
      {OPTIONS.map(({ id, label, Icon }) => {
        const isActive = mode === id;
        const tooltip =
          id === 'system'
            ? `System theme (${resolvedTheme === 'dark' ? 'Dark' : 'Light'})`
            : label;

        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={tooltip}
            title={tooltip}
            onClick={() => setMode(id)}
            className={`flex items-center justify-center w-[26px] h-[24px] rounded-[4px] transition-all cursor-pointer ${
              isActive
                ? 'bg-white/22 text-white shadow-2xs'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon size={13} />
          </button>
        );
      })}
    </div>
  );
};

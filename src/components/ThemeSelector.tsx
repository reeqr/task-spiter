import { Tooltip } from 'antd';
import { ALL_THEMES } from '../themes';

interface ThemeSelectorProps {
  currentThemeId: string;
  onThemeChange: (id: string) => void;
}

export function ThemeSelector({ currentThemeId, onThemeChange }: ThemeSelectorProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {ALL_THEMES.map(theme => {
        const isActive = theme.id === currentThemeId;
        return (
          <Tooltip key={theme.id} title={`${theme.emoji} ${theme.name}`} placement="bottom">
            <button
              onClick={() => onThemeChange(theme.id)}
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: theme.colorPrimary,
                border: isActive
                  ? `2.5px solid ${theme.colorPrimary}`
                  : '2.5px solid transparent',
                outline: isActive ? `2px solid ${theme.colorPrimary}` : 'none',
                outlineOffset: 2,
                cursor: 'pointer',
                padding: 0,
                transform: isActive ? 'scale(1.25)' : 'scale(1)',
                transition: 'all 0.2s ease',
                boxShadow: isActive
                  ? `0 2px 8px ${theme.colorPrimary}60`
                  : '0 1px 3px rgba(0,0,0,0.15)',
              }}
              aria-label={theme.name}
              aria-pressed={isActive}
            />
          </Tooltip>
        );
      })}
    </div>
  );
}

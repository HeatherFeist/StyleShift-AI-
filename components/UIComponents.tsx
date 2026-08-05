import React, { ReactNode } from 'react';

// ============================================================================
// StyleShift — small, reusable UI building blocks
// ============================================================================

/** Primary / secondary / ghost button. */
export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost';
    fullWidth?: boolean;
  }
> = ({ variant = 'primary', fullWidth, className = '', children, ...props }) => {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold px-5 py-2.5 text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed';
  const variants: Record<string, string> = {
    primary:
      'text-white bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:from-rose-600 hover:to-fuchsia-700 shadow-lg shadow-fuchsia-500/20 active:scale-[0.98]',
    secondary:
      'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-100',
    ghost: 'text-gray-600 hover:bg-gray-100',
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

/** Simple animated loading spinner. */
export const Spinner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={`animate-spin ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-90"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
);

/** Dismissable inline alert. */
export const Alert: React.FC<{
  type: 'error' | 'info' | 'success';
  children: ReactNode;
  onClose?: () => void;
}> = ({ type, children, onClose }) => {
  const styles: Record<string, string> = {
    error: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${styles[type]}`}
    >
      <span className="flex-1">{children}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="opacity-60 hover:opacity-100"
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
};

/** Centered modal dialog. */
export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}> = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

/** A pre-made look card in the templates gallery. */
export const TemplateCard: React.FC<{
  emoji: string;
  name: string;
  blurb: string;
  onClick: () => void;
  disabled?: boolean;
}> = ({ emoji, name, blurb, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="group flex flex-col items-start rounded-2xl border border-gray-100 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md disabled:opacity-40 disabled:hover:translate-y-0"
  >
    <span className="text-2xl">{emoji}</span>
    <span className="mt-2 font-semibold text-gray-900">{name}</span>
    <span className="text-xs text-gray-500">{blurb}</span>
  </button>
);

/** A saved outfit or look in the closet grid. */
export const ClosetCard: React.FC<{
  image: string;
  name: string;
  type: 'outfit' | 'look';
  onPrimary: () => void;
  primaryLabel: string;
  onDelete: () => void;
}> = ({ image, name, type, onPrimary, primaryLabel, onDelete }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
    <div className="aspect-[3/4] w-full overflow-hidden bg-gray-50">
      <img
        src={image}
        alt={name}
        className="h-full w-full object-cover transition-transform group-hover:scale-105"
      />
    </div>
    <span
      className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white ${
        type === 'outfit' ? 'bg-fuchsia-500' : 'bg-rose-500'
      }`}
    >
      {type}
    </span>
    <button
      onClick={onDelete}
      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-xs text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
      aria-label={`Delete ${name}`}
    >
      🗑
    </button>
    <div className="p-3">
      <p className="truncate text-sm font-medium text-gray-800">{name}</p>
      <Button
        variant="secondary"
        fullWidth
        className="mt-2 !py-1.5 !text-xs"
        onClick={onPrimary}
      >
        {primaryLabel}
      </Button>
    </div>
  </div>
);

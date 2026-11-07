"use client";

export default function ShareIconButton({
  onClick,
  alwaysVisible = false,
}: {
  onClick: () => void;
  alwaysVisible?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title="Share"
      className={`flex-shrink-0 rounded-full p-1 text-neutral-400 transition hover:bg-neutral-200 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-100 ${
        // :hover never fires on touch devices, so the icon must default to
        // visible below the sm breakpoint and only hide-until-hover on
        // pointer-fine (desktop) screens.
        alwaysVisible ? "opacity-100" : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.6" y1="10.6" x2="15.4" y2="6.4" />
        <line x1="8.6" y1="13.4" x2="15.4" y2="17.6" />
      </svg>
    </button>
  );
}

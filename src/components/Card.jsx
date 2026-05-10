export default function Card({ children, className = '', title, action, onClick }) {
  const clickableProps = onClick
    ? {
        role: 'button',
        tabIndex: 0,
        onClick,
        onKeyDown: (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick(event);
          }
        },
      }
    : {};

  return (
    <section
      className={`relative rounded-[8px] border border-white/8 bg-panel/82 p-5 shadow-card backdrop-blur ${onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-ion/55' : ''} ${className}`}
      {...clickableProps}
    >
      <div className="relative z-10">
        {(title || action) && (
          <div className="mb-4 flex items-center justify-between gap-3">
            {title && <h2 className="text-sm font-medium text-starlight">{title}</h2>}
            {action}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

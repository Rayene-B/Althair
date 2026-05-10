export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-nebula text-white shadow-glow hover:bg-[#6157b4]',
    ghost: 'bg-white/5 text-white hover:bg-white/10',
    active: 'bg-ion/18 text-ion ring-1 ring-ion/35',
  };

  return (
    <button
      className={`rounded-[8px] px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-ion/60 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default function TextInput({ className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-[8px] border border-white/10 bg-void/65 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-ion/55 focus:ring-2 focus:ring-ion/10 ${className}`}
      {...props}
    />
  );
}

export default function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium text-white/62">{label}</span>
      {children}
    </label>
  );
}

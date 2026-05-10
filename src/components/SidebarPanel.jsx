import Card from './Card';

export default function SidebarPanel({ title, children, className = '' }) {
  return (
    <Card title={title} className={`bg-panel/88 ${className}`}>
      {children}
    </Card>
  );
}

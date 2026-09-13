export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
      {Icon && <Icon size={32} className="mb-3 text-gray-300" />}
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

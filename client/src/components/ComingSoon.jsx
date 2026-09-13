// Honest placeholder for sections not yet implemented in this incremental build.
// Replaced with real functionality phase by phase - never silently fakes data.
export default function ComingSoon({ title, phase }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
        This section will be built in {phase}. It is not implemented yet.
      </div>
    </div>
  );
}

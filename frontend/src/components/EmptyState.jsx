function EmptyState({
  title = "조건에 맞는 차량이 없습니다.",
  description = "검색 조건을 바꾸거나 초기화해 다시 확인해보세요.",
  action,
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-14 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <svg
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M3 13.5l1.8-5.1A3 3 0 017.63 6.4h8.74a3 3 0 012.83 2l1.8 5.1M5 13.5h14M6.5 17.5h.01M17.5 17.5h.01M5.5 13.5v4a1.5 1.5 0 001.5 1.5h10a1.5 1.5 0 001.5-1.5v-4"
          />
        </svg>
      </div>
      <p className="mt-5 text-base font-bold text-slate-800">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default EmptyState;

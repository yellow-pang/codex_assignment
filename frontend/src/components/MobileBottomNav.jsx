function MobileBottomNav({
  currentView,
  isAdmin,
  isDealer,
  onGoAdmin,
  onGoChats,
  onGoDealer,
  onGoList,
  userProfile,
}) {
  const items = [
    {
      key: "list",
      label: "검색",
      onClick: onGoList,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.9}
          d="M3 10.5L12 4l9 6.5M5 10v9h14v-9"
        />
      ),
    },
  ];

  if (userProfile) {
    items.push({
      key: "chat",
      label: "상담",
      onClick: onGoChats,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.9}
          d="M7 8h10M7 12h6m-8 8l3-3h9a4 4 0 004-4V8a4 4 0 00-4-4H7a4 4 0 00-4 4v5a4 4 0 004 4"
        />
      ),
    });
  }

  if (isDealer) {
    items.push({
      key: "dealer",
      label: "내 차량",
      onClick: onGoDealer,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.9}
          d="M4 14l1.5-4A3 3 0 018.3 8h7.4a3 3 0 012.8 2l1.5 4M5 14h14M7 17h.01M17 17h.01"
        />
      ),
    });
  }

  if (isAdmin) {
    items.push({
      key: "admin",
      label: "관리",
      onClick: onGoAdmin,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.9}
          d="M5 7h14M5 12h14M5 17h14"
        />
      ),
    });
  }

  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 rounded-3xl border border-white/70 bg-white/95 px-2 py-2 shadow-2xl shadow-slate-300/70 backdrop-blur md:hidden">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const isActive = currentView === item.key;

          return (
            <button
              key={item.key}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-black transition-colors ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                  : "text-slate-500 hover:bg-blue-50 hover:text-blue-700"
              }`}
              onClick={item.onClick}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                {item.icon}
              </svg>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileBottomNav;

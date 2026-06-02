function Header({ currentView, onGoList, onGoCreate }) {
  return (
    <header className="navbar border-b border-base-200 bg-base-100 px-4 shadow-sm sm:px-8">
      <div className="flex-1">
        <button className="btn btn-ghost text-lg font-bold sm:text-xl" onClick={onGoList}>
          자동차 관리
        </button>
      </div>
      <nav className="flex gap-2">
        <button
          className={`btn btn-sm ${currentView === "list" ? "btn-primary" : "btn-ghost"}`}
          onClick={onGoList}
        >
          목록
        </button>
        <button className="btn btn-sm btn-outline btn-primary" onClick={onGoCreate}>
          등록
        </button>
      </nav>
    </header>
  );
}

export default Header;

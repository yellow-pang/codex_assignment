function Header({
  currentView,
  isDealer,
  onGoList,
  onGoCreate,
  onGoLogin,
  onGoRegister,
  onLogout,
  userProfile,
}) {
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
        {isDealer && (
          <button className="btn btn-sm btn-outline btn-primary" onClick={onGoCreate}>
            등록
          </button>
        )}
        {userProfile ? (
          <>
            <span className="hidden items-center text-sm text-base-content/70 sm:flex">
              {userProfile.displayName} · {userProfile.role}
            </span>
            <button className="btn btn-sm btn-ghost" onClick={onLogout}>
              로그아웃
            </button>
          </>
        ) : (
          <>
            <button
              className={`btn btn-sm ${currentView === "login" ? "btn-primary" : "btn-ghost"}`}
              onClick={onGoLogin}
            >
              로그인
            </button>
            <button className="btn btn-sm btn-outline" onClick={onGoRegister}>
              회원가입
            </button>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;

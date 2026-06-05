function Header({
  currentView,
  isAdmin,
  isDealer,
  onGoAdmin,
  onGoList,
  onGoCreate,
  onGoLogin,
  onGoRegister,
  onRequestDealer,
  onLogout,
  userProfile,
}) {
  const canRequestDealer =
    userProfile?.role === "buyer" &&
    (!userProfile.dealerStatus || userProfile.dealerStatus === "none");
  const isDealerPending =
    userProfile?.role === "buyer" && userProfile.dealerStatus === "pending";
  const isDealerRejected =
    userProfile?.role === "buyer" && userProfile.dealerStatus === "rejected";

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
        {isAdmin && (
          <button
            className={`btn btn-sm ${currentView === "admin" ? "btn-primary" : "btn-outline"}`}
            onClick={onGoAdmin}
          >
            관리자
          </button>
        )}
        {userProfile ? (
          <>
            {canRequestDealer && (
              <button className="btn btn-sm btn-outline" onClick={onRequestDealer}>
                딜러 신청
              </button>
            )}
            {isDealerPending && (
              <span className="hidden items-center text-sm text-warning sm:flex">
                딜러 승인 대기
              </span>
            )}
            {isDealerRejected && (
              <span className="hidden items-center text-sm text-error sm:flex">
                딜러 신청 거절
              </span>
            )}
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

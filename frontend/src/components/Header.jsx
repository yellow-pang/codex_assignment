import { useState } from "react";

function Header({
  currentView,
  isAdmin,
  isDealer,
  onGoAdmin,
  onGoDealer,
  onGoList,
  onGoCreate,
  onGoLogin,
  onGoRegister,
  onGoChats,
  onRequestDealer,
  isDealerRequesting = false,
  onLogout,
  userProfile,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const canRequestDealer =
    userProfile?.role === "buyer" &&
    (!userProfile.dealerStatus || userProfile.dealerStatus === "none");
  const isDealerPending =
    userProfile?.role === "buyer" && userProfile.dealerStatus === "pending";
  const isDealerRejected =
    userProfile?.role === "buyer" && userProfile.dealerStatus === "rejected";

  function toggleMobileMenu() {
    setIsMobileMenuOpen((prev) => !prev);
  }

  function handleMobileNav(action) {
    setIsMobileMenuOpen(false);
    action();
  }

  const navLinkClass = (active) =>
    `rounded-full px-3.5 py-2 text-sm font-bold transition-colors ${
      active
        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-white/70 bg-white/85 shadow-sm shadow-slate-200/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* 로고 */}
        <button
          className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-950"
          onClick={onGoList}
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M3.5 14l1.7-4.6A3 3 0 018 7.5h8a3 3 0 012.8 1.9l1.7 4.6M5 14h14M6.5 17.5h.01M17.5 17.5h.01"
              />
            </svg>
          </span>
          <span>CAR MARKET</span>
        </button>

        {/* 데스크톱 내비게이션 */}
        <nav className="hidden items-center gap-1 md:flex">
          <button
            className={navLinkClass(currentView === "list")}
            onClick={onGoList}
          >
            차량 검색
          </button>
          {userProfile && (
            <button
              className={navLinkClass(currentView === "chat")}
              onClick={onGoChats}
            >
              내 상담
            </button>
          )}
          {isDealer && (
            <button
              className={navLinkClass(currentView === "dealer")}
              onClick={onGoDealer}
            >
              내 차량
            </button>
          )}
          {isDealer && (
            <button
              className={navLinkClass(currentView === "create")}
              onClick={onGoCreate}
            >
              차량 등록
            </button>
          )}
          {isAdmin && (
            <button
              className={navLinkClass(currentView === "admin")}
              onClick={onGoAdmin}
            >
              관리자
            </button>
          )}
        </nav>

        {/* 데스크톱 인증 영역 */}
        <div className="hidden items-center gap-2 md:flex">
          {userProfile ? (
            <>
              {canRequestDealer && (
                <button
                  className="c-btn-outline px-3 py-1.5 text-xs"
                  disabled={isDealerRequesting}
                  onClick={onRequestDealer}
                >
                  {isDealerRequesting ? "신청 중..." : "딜러 신청"}
                </button>
              )}
              {isDealerPending && (
                <span className="c-badge-yellow">딜러 승인 대기</span>
              )}
              {isDealerRejected && (
                <span className="c-badge-red">딜러 신청 거절</span>
              )}
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600">
                {userProfile.displayName}
              </span>
              <button
                className="c-btn-ghost px-3 py-1.5 text-xs"
                onClick={onLogout}
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button
                className="c-btn-ghost px-3 py-1.5 text-xs"
                onClick={onGoLogin}
              >
                로그인
              </button>
              <button
                className="c-btn-primary px-3 py-1.5 text-xs"
                onClick={onGoRegister}
              >
                회원가입
              </button>
            </>
          )}
        </div>

        {/* 모바일 햄버거 버튼 */}
        <button
          aria-label="메뉴 열기"
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50 md:hidden"
          onClick={toggleMobileMenu}
        >
          {isMobileMenuOpen ? (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* 모바일 메뉴 */}
      {isMobileMenuOpen && (
        <div className="border-t border-slate-100 bg-white/95 px-4 py-4 shadow-xl shadow-slate-200/70 backdrop-blur md:hidden">
          <div className="flex flex-col gap-1.5">
            <button
              className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
              onClick={() => handleMobileNav(onGoList)}
            >
              차량 검색
            </button>
            {userProfile && (
              <button
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                onClick={() => handleMobileNav(onGoChats)}
              >
                내 상담
              </button>
            )}
            {isDealer && (
              <button
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                onClick={() => handleMobileNav(onGoDealer)}
              >
                내 차량 관리
              </button>
            )}
            {isDealer && (
              <button
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                onClick={() => handleMobileNav(onGoCreate)}
              >
                차량 등록
              </button>
            )}
            {isAdmin && (
              <button
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                onClick={() => handleMobileNav(onGoAdmin)}
              >
                관리자
              </button>
            )}
            <hr className="my-2 border-slate-100" />
            {userProfile ? (
              <>
                <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                  {userProfile.displayName} · {userProfile.role}
                </div>
                {canRequestDealer && (
                  <button
                    className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    disabled={isDealerRequesting}
                    onClick={() => handleMobileNav(onRequestDealer)}
                  >
                    {isDealerRequesting ? "신청 중..." : "딜러 신청"}
                  </button>
                )}
                <button
                  className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-red-600 hover:bg-red-50"
                  onClick={() => handleMobileNav(onLogout)}
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <button
                  className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
                  onClick={() => handleMobileNav(onGoLogin)}
                >
                  로그인
                </button>
                <button
                  className="w-full rounded-xl bg-blue-600 px-3 py-2.5 text-left text-sm font-bold text-white shadow-sm shadow-blue-600/25"
                  onClick={() => handleMobileNav(onGoRegister)}
                >
                  회원가입
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;

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
        ? "bg-white/16 text-white ring-1 ring-white/28"
        : "text-slate-200 hover:bg-white/12 hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-white/14 bg-[#0b1320]/90 shadow-[0_12px_28px_rgba(11,19,32,0.5)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* 로고 */}
        <button
          className="flex items-center gap-2 text-lg font-black tracking-tight text-white"
          onClick={onGoList}
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#3f6ea6] text-white shadow-lg shadow-[#3f6ea6]/30">
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
                  className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-white/20"
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
              <span className="rounded-full bg-white/12 px-3 py-1.5 text-sm font-semibold text-slate-100 ring-1 ring-white/20">
                {userProfile.displayName}
              </span>
              <button
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                onClick={onLogout}
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                onClick={onGoLogin}
              >
                로그인
              </button>
              <button
                className="rounded-full bg-[#3f6ea6] px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-[#3f6ea6]/35 transition hover:bg-[#355d8e]"
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
          className="rounded-xl border border-white/30 bg-white/10 p-2 text-slate-100 shadow-sm hover:bg-white/20 md:hidden"
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
        <div className="border-t border-white/15 bg-[#111b2c]/95 px-4 py-4 shadow-xl shadow-black/35 backdrop-blur md:hidden">
          <div className="flex flex-col gap-1.5">
            <button
              className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-100 hover:bg-white/10"
              onClick={() => handleMobileNav(onGoList)}
            >
              차량 검색
            </button>
            {userProfile && (
              <button
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-100 hover:bg-white/10"
                onClick={() => handleMobileNav(onGoChats)}
              >
                내 상담
              </button>
            )}
            {isDealer && (
              <button
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-100 hover:bg-white/10"
                onClick={() => handleMobileNav(onGoDealer)}
              >
                내 차량 관리
              </button>
            )}
            {isDealer && (
              <button
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-100 hover:bg-white/10"
                onClick={() => handleMobileNav(onGoCreate)}
              >
                차량 등록
              </button>
            )}
            {isAdmin && (
              <button
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-100 hover:bg-white/10"
                onClick={() => handleMobileNav(onGoAdmin)}
              >
                관리자
              </button>
            )}
            <hr className="my-2 border-white/15" />
            {userProfile ? (
              <>
                <div className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-slate-200">
                  {userProfile.displayName} · {userProfile.role}
                </div>
                {canRequestDealer && (
                  <button
                    className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-100 hover:bg-white/10"
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
                  className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-100 hover:bg-white/10"
                  onClick={() => handleMobileNav(onGoLogin)}
                >
                  로그인
                </button>
                <button
                  className="w-full rounded-xl bg-[#3f6ea6] px-3 py-2.5 text-left text-sm font-bold text-white shadow-sm shadow-[#3f6ea6]/30"
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

import { useState } from "react";

function Header({
  currentView,
  isAdmin,
  isDealer,
  onGoAdmin,
  onGoList,
  onGoCreate,
  onGoLogin,
  onGoRegister,
  onGoChats,
  onRequestDealer,
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
    `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? "bg-blue-50 text-blue-700"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* 로고 */}
        <button
          className="flex items-center gap-0.5 text-xl font-extrabold tracking-tight"
          onClick={onGoList}
        >
          <span className="text-blue-600">CAR</span>
          <span className="text-gray-900"> MARKET</span>
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
                  onClick={onRequestDealer}
                >
                  딜러 신청
                </button>
              )}
              {isDealerPending && (
                <span className="c-badge-yellow">딜러 승인 대기</span>
              )}
              {isDealerRejected && (
                <span className="c-badge-red">딜러 신청 거절</span>
              )}
              <span className="text-sm text-gray-500">
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
          className="rounded-md p-2 text-gray-600 hover:bg-gray-100 md:hidden"
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
        <div className="border-t border-gray-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            <button
              className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
              onClick={() => handleMobileNav(onGoList)}
            >
              차량 검색
            </button>
            {userProfile && (
              <button
                className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => handleMobileNav(onGoChats)}
              >
                내 상담
              </button>
            )}
            {isDealer && (
              <button
                className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => handleMobileNav(onGoCreate)}
              >
                차량 등록
              </button>
            )}
            {isAdmin && (
              <button
                className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => handleMobileNav(onGoAdmin)}
              >
                관리자
              </button>
            )}
            <hr className="my-1 border-gray-200" />
            {userProfile ? (
              <>
                <div className="px-3 py-1 text-xs text-gray-400">
                  {userProfile.displayName} · {userProfile.role}
                </div>
                {canRequestDealer && (
                  <button
                    className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() => handleMobileNav(onRequestDealer)}
                  >
                    딜러 신청
                  </button>
                )}
                <button
                  className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                  onClick={() => handleMobileNav(onLogout)}
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <button
                  className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => handleMobileNav(onGoLogin)}
                >
                  로그인
                </button>
                <button
                  className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-blue-600 hover:bg-blue-50"
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

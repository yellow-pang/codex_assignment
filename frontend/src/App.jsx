import { useEffect, useMemo, useRef, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import AdminUserPanel from "./components/AdminUserPanel.jsx";
import AlertMessage from "./components/AlertMessage.jsx";
import CarCardGrid from "./components/CarCardGrid.jsx";
import CarDetail from "./components/CarDetail.jsx";
import CarForm from "./components/CarForm.jsx";
import ChatRoom from "./components/ChatRoom.jsx";
import ChatRoomList from "./components/ChatRoomList.jsx";
import DealerDashboard from "./components/DealerDashboard.jsx";
import DeleteConfirmModal from "./components/DeleteConfirmModal.jsx";
import Header from "./components/Header.jsx";
import LoginForm from "./components/LoginForm.jsx";
import MobileBottomNav from "./components/MobileBottomNav.jsx";
import RegisterForm from "./components/RegisterForm.jsx";
import { authenticatedFetch } from "./api/authenticatedFetch.js";
import { useAuth } from "./contexts/AuthContext.jsx";

function App() {
  const {
    authError,
    isAdmin,
    isAuthLoading,
    isDealer,
    logout,
    refreshUserProfile,
    requestDealerApproval,
    userProfile,
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const previousPathRef = useRef(location.pathname);
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentView, setCurrentView] = useState("list");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isAuthErrorDismissed, setIsAuthErrorDismissed] = useState(false);
  const [pendingAction, setPendingAction] = useState("");
  const [filters, setFilters] = useState({
    keyword: "",
    company: "",
    minPrice: "",
    maxPrice: "",
    minYear: "",
    maxYear: "",
  });
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [carFormSettings, setCarFormSettings] = useState({
    yearStep: 1,
    priceStep: 100,
    mileageStep: 1000,
    maxImageCount: 8,
  });

  const activeView = useMemo(() => {
    if (location.pathname === "/") {
      return currentView;
    }
    if (location.pathname.startsWith("/cars/")) {
      return "detail";
    }
    if (location.pathname.startsWith("/chats/")) {
      return "chat";
    }
    if (location.pathname === "/login") {
      return "login";
    }
    if (location.pathname === "/register") {
      return "register";
    }
    if (location.pathname === "/admin") {
      return "admin";
    }
    if (location.pathname === "/dealer") {
      return "dealer";
    }
    return currentView;
  }, [currentView, location.pathname]);

  const displayMessage = message.text
    ? message
    : authError && !isAuthErrorDismissed
      ? { type: "error", text: authError }
      : message;

  useEffect(() => {
    loadCars();
    loadCarFormSettings();
  }, []);

  useEffect(() => {
    setIsAuthErrorDismissed(false);
  }, [authError]);

  useEffect(() => {
    if (previousPathRef.current !== location.pathname) {
      previousPathRef.current = location.pathname;
      setMessage({ type: "", text: "" });
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!message.text || message.type === "error") return undefined;

    const timeoutId = window.setTimeout(() => {
      setMessage({ type: "", text: "" });
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [message.text, message.type]);

  async function requestApi(url, options = {}) {
    const { authenticated = false, ...fetchOptions } = options;
    const response = authenticated
      ? await authenticatedFetch(url, fetchOptions)
      : await fetch(url, fetchOptions);

    if (!response.ok) {
      let errorMessage = "요청을 처리하지 못했습니다.";

      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (error) {
        // JSON 오류 응답이 아닌 경우에는 기본 메시지를 사용합니다.
      }

      throw new Error(errorMessage);
    }

    return response.json();
  }

  async function loadCars(successMessage = "") {
    setIsLoading(true);
    if (!successMessage) {
      setMessage({ type: "", text: "" });
    }

    try {
      const data = await requestApi("/api/cars");
      setCars(data);
      setCurrentView("list");
      setIsSearchMode(false);
      if (successMessage) {
        setMessage({ type: "success", text: successMessage });
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  async function loadCarFormSettings() {
    try {
      const data = await requestApi("/api/settings/car-form");
      setCarFormSettings((prevSettings) => ({ ...prevSettings, ...data }));
    } catch (error) {
      setMessage({
        type: "error",
        text: `차량 입력 설정을 불러오지 못했습니다. 기본값을 사용합니다. (${error.message})`,
      });
    }
  }

  function normalizeNumericFilter(value) {
    return String(value || "").replace(/\s+/g, "");
  }

  function validateNumericFilters() {
    const numericFilterLabels = {
      minPrice: "최소 가격",
      maxPrice: "최대 가격",
      minYear: "최소 연식",
      maxYear: "최대 연식",
    };

    for (const [fieldName, label] of Object.entries(numericFilterLabels)) {
      const value = normalizeNumericFilter(filters[fieldName]);

      if (value && !Number.isFinite(Number(value))) {
        return `${label}은 숫자로 입력해주세요.`;
      }
    }

    return "";
  }

  async function searchCars() {
    if (pendingAction) return;

    const validationMessage = validateNumericFilters();

    if (validationMessage) {
      setMessage({ type: "error", text: validationMessage });
      return;
    }

    const params = new URLSearchParams();
    const keyword = filters.keyword.trim();
    const company = filters.company.trim().toUpperCase();

    if (keyword) params.set("keyword", keyword);
    if (company) params.set("company", company);

    ["minPrice", "maxPrice", "minYear", "maxYear"].forEach((fieldName) => {
      const value = normalizeNumericFilter(filters[fieldName]);
      if (value) params.set(fieldName, value);
    });

    if (!params.toString()) {
      setPendingAction("search");
      try {
        await loadCars("전체 목록을 조회했습니다.");
        return;
      } finally {
        setPendingAction("");
      }
    }

    setPendingAction("search");
    try {
      await loadFilteredCars(
        `/api/cars/search?${params.toString()}`,
        "차량 검색 결과입니다.",
      );
    } finally {
      setPendingAction("");
    }
  }

  async function resetSearchFilters() {
    if (pendingAction) return;

    setFilters({
      keyword: "",
      company: "",
      minPrice: "",
      maxPrice: "",
      minYear: "",
      maxYear: "",
    });
    setPendingAction("reset-search");
    try {
      await loadCars("검색 조건을 초기화했습니다.");
    } finally {
      setPendingAction("");
    }
  }

  async function loadFilteredCars(url, successMessage) {
    setIsLoading(true);

    try {
      const data = await requestApi(url);
      setCars(data);
      setCurrentView("list");
      setIsSearchMode(true);
      setMessage({ type: "success", text: successMessage });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateCar(carInput) {
    if (pendingAction) return;

    if (!isDealer || !userProfile) {
      setMessage({
        type: "error",
        text: "딜러만 자동차를 등록할 수 있습니다.",
      });
      handleGoList();
      return;
    }

    setPendingAction("create-car");
    try {
      await requestApi("/api/cars", {
        authenticated: true,
        method: "POST",
        body: createCarFormData(carInput),
      });

      await loadCars("자동차가 등록되었습니다.");
      navigate("/");
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setPendingAction("");
    }
  }

  async function handleUpdateCar(carInput) {
    if (pendingAction) return;

    if (!selectedCar) return;

    if (!canManageCar(selectedCar)) {
      setMessage({
        type: "error",
        text: "차량을 등록한 딜러만 수정할 수 있습니다.",
      });
      handleGoList();
      return;
    }

    setPendingAction("update-car");
    try {
      const updatedCar = await requestApi(`/api/cars/${selectedCar._id}`, {
        authenticated: true,
        method: "PUT",
        body: createCarFormData(carInput),
      });

      setSelectedCar(updatedCar);
      await loadCars("자동차 정보가 수정되었습니다.");
      navigate(`/cars/${updatedCar._id}`);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setPendingAction("");
    }
  }

  async function handleDeleteCar() {
    if (pendingAction) return;

    if (!deleteTarget) return;

    if (!canManageCar(deleteTarget)) {
      setMessage({
        type: "error",
        text: "차량을 등록한 딜러만 삭제할 수 있습니다.",
      });
      setDeleteTarget(null);
      return;
    }

    setPendingAction("delete-car");
    try {
      await requestApi(`/api/cars/${deleteTarget._id}`, {
        authenticated: true,
        method: "DELETE",
      });
      setDeleteTarget(null);
      setSelectedCar(null);
      await loadCars("자동차가 삭제되었습니다.");
      navigate("/");
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setPendingAction("");
    }
  }

  function handleViewCar(car) {
    if (!userProfile) {
      setMessage({
        type: "error",
        text: "차량 상세 정보는 로그인 후 확인할 수 있습니다.",
      });
      navigate("/login");
      return;
    }

    setSelectedCar(car);
    setCurrentView("list");
    navigate(`/cars/${car._id}`);
  }

  function handleEditCar(car) {
    if (!canManageCar(car)) {
      setMessage({
        type: "error",
        text: "차량을 등록한 딜러만 수정할 수 있습니다.",
      });
      return;
    }

    setSelectedCar(car);
    setCurrentView("edit");
    navigate("/");
  }

  function handleGoList() {
    setSelectedCar(null);
    setCurrentView("list");
    navigate("/");
  }

  function handleGoCreate() {
    if (!userProfile) {
      setMessage({
        type: "error",
        text: "로그인 후 자동차를 등록할 수 있습니다.",
      });
      navigate("/login");
      return;
    }

    if (!isDealer) {
      setMessage({
        type: "error",
        text: "딜러만 자동차를 등록할 수 있습니다.",
      });
      return;
    }

    setCurrentView("create");
    navigate("/");
  }

  function handleGoAdmin() {
    if (!isAdmin) {
      setMessage({ type: "error", text: "관리자만 접근할 수 있습니다." });
      return;
    }

    setCurrentView("list");
    navigate("/admin");
  }

  function handleGoDealer() {
    if (!isDealer) {
      setMessage({ type: "error", text: "승인된 딜러만 접근할 수 있습니다." });
      return;
    }

    setCurrentView("list");
    navigate("/dealer");
  }

  async function handleRequestDealer() {
    if (pendingAction) return;

    setPendingAction("dealer-request");
    try {
      await requestDealerApproval();
      setMessage({
        type: "success",
        text: "딜러 신청이 접수되었습니다. 관리자 승인을 기다려주세요.",
      });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setPendingAction("");
    }
  }

  async function handleStartChat(car) {
    if (pendingAction) return;

    if (!userProfile) {
      setMessage({
        type: "error",
        text: "로그인 후 상담을 시작할 수 있습니다.",
      });
      navigate("/login");
      return;
    }

    setPendingAction(`start-chat:${car._id}`);
    try {
      const chatRoom = await requestApi("/api/chats/rooms", {
        authenticated: true,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId: String(car._id),
        }),
      });

      setMessage({
        type: "success",
        text: "상담방이 준비되었습니다.",
      });
      navigate(`/chats/${encodeURIComponent(chatRoom.roomId)}`, {
        state: { chatRoom },
      });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setPendingAction("");
    }
  }

  async function handleLogout() {
    await logout();
    setSelectedCar(null);
    setDeleteTarget(null);
    setCurrentView("list");
    navigate("/");
    setMessage({ type: "success", text: "로그아웃되었습니다." });
  }

  function handleGoChats() {
    navigate("/chats");
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
  }

  function createCarFormData(carInput) {
    const formData = new FormData();

    Object.entries(carInput).forEach(([key, value]) => {
      if (key === "image") {
        if (value) {
          formData.append(key, value);
        }
        return;
      }

      if (key === "images") {
        if (Array.isArray(value)) {
          value.forEach((file) => formData.append("images", file));
        }
        return;
      }

      formData.append(key, value ?? "");
    });

    return formData;
  }

  function canManageCar(car) {
    return Boolean(
      isDealer &&
      userProfile?.uid &&
      car?.dealerId &&
      String(car.dealerId) === String(userProfile.uid),
    );
  }

  function renderListRoute() {
    if (currentView === "create") {
      return (
        <CarForm
          mode="create"
          formSettings={carFormSettings}
          isSubmitting={pendingAction === "create-car"}
          onCancel={handleGoList}
          onSubmit={handleCreateCar}
        />
      );
    }

    if (currentView === "edit" && selectedCar) {
      return (
        <CarForm
          mode="edit"
          formSettings={carFormSettings}
          initialCar={selectedCar}
          isSubmitting={pendingAction === "update-car"}
          onCancel={handleGoList}
          onSubmit={handleUpdateCar}
        />
      );
    }

    return (
      <div className="space-y-10">
        <section className="relative overflow-hidden rounded-[2.25rem] border border-white/16 bg-[linear-gradient(118deg,_#0b1320_0%,_#122b43_52%,_#2a4d6f_100%)] px-5 py-6 shadow-[0_32px_80px_rgba(11,19,32,0.45)] sm:px-8 sm:py-10 lg:px-10">
          <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-blue-300/18 blur-3xl" />
          <div className="absolute left-1/3 top-10 h-40 w-40 rounded-full bg-sky-300/14 blur-3xl" />
          <div className="absolute -bottom-16 left-8 h-48 w-48 rounded-full bg-slate-200/10 blur-3xl" />

          <div className="relative grid items-center gap-8 lg:grid-cols-[1.12fr_0.88fr]">
            <div>
              <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-100 ring-1 ring-white/20">
                Premium Dealer Marketplace
              </p>
              <h1 className="mt-5 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.35rem]">
                오늘의 드라이브를 바꿀
                <span className="block text-sky-300">프리미엄 인증 중고차</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                인기 사이트처럼 빠르게 탐색하고, 가격과 상태를 비교한 뒤 딜러와
                바로 상담까지 연결하세요.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                <button
                  className="c-btn-primary px-5 py-2.5 text-sm"
                  disabled={Boolean(pendingAction)}
                  onClick={searchCars}
                >
                  지금 매물 탐색
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-xl border border-white/28 bg-white/12 px-5 py-2.5 text-sm font-semibold text-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/22"
                  disabled={Boolean(pendingAction)}
                  onClick={resetSearchFilters}
                >
                  조건 초기화
                </button>
              </div>
              <div className="mt-6 grid max-w-lg grid-cols-3 gap-3">
                <HeroMetric label="추천 매물" value={cars.length} />
                <HeroMetric label="실시간 상담" value="LIVE" />
                <HeroMetric label="빠른 비교" value="FAST" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="relative overflow-hidden rounded-[1.4rem] border border-white/28 bg-white/8 p-3 backdrop-blur-xl">
                <img
                  alt="Car Market 대표 차량 이미지"
                  className="h-56 w-full rounded-[1rem] object-cover sm:h-72"
                  src="/uploads/pre-default-car.png"
                />
                <div className="absolute bottom-5 left-5 right-5 rounded-xl bg-white/90 p-3 shadow-lg">
                  <p className="text-sm font-extrabold text-[#0b1320]">
                    탑딜러 인증 매물
                  </p>
                  <p className="mt-1 text-xs text-[#5d6b7c]">
                    사진, 이력, 상담 가능 상태를 한 번에 확인
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                <QuickBadge text="무사고 우선" />
                <QuickBadge text="딜러 인증" />
                <QuickBadge text="당일 상담" />
                <QuickBadge text="가격 비교" />
                <QuickBadge text="연식 필터" />
                <QuickBadge text="지역 탐색" />
              </div>
            </div>
          </div>
        </section>

        <section className="grid items-start gap-6 lg:grid-cols-[18.5rem_minmax(0,1fr)]">
          <aside className="c-surface p-5 sm:p-6 lg:sticky lg:top-24">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#3f6ea6]">
                Search Filter
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-[#0b1320]">
                차량 조건 검색
              </h2>
              <p className="mt-1 text-sm text-[#5d6b7c]">
                원하는 조건을 조합해 실시간으로 결과를 확인하세요.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <SearchField label="차량명">
                <input
                  className="c-input"
                  name="keyword"
                  value={filters.keyword}
                  onChange={handleFilterChange}
                  placeholder="예: Sonata, K5"
                />
              </SearchField>
              <SearchField label="제조사">
                <select
                  className="c-select"
                  name="company"
                  value={filters.company}
                  onChange={handleFilterChange}
                >
                  <option value="">전체</option>
                  <option value="HYUNDAI">HYUNDAI</option>
                  <option value="KIA">KIA</option>
                  <option value="RENAULT">RENAULT</option>
                  <option value="GENESIS">GENESIS</option>
                  <option value="CHEVROLET">CHEVROLET</option>
                </select>
              </SearchField>
              <div className="grid grid-cols-2 gap-2">
                <SearchField label="최소 가격">
                  <input
                    className="c-input"
                    name="minPrice"
                    type="number"
                    min="0"
                    value={filters.minPrice}
                    onChange={handleFilterChange}
                    placeholder="만원"
                    step={carFormSettings.priceStep}
                  />
                </SearchField>
                <SearchField label="최대 가격">
                  <input
                    className="c-input"
                    name="maxPrice"
                    type="number"
                    min="0"
                    value={filters.maxPrice}
                    onChange={handleFilterChange}
                    placeholder="만원"
                    step={carFormSettings.priceStep}
                  />
                </SearchField>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <SearchField label="최소 연식">
                  <input
                    className="c-input"
                    name="minYear"
                    type="number"
                    min="1900"
                    value={filters.minYear}
                    onChange={handleFilterChange}
                    placeholder="최소"
                    step={carFormSettings.yearStep}
                  />
                </SearchField>
                <SearchField label="최대 연식">
                  <input
                    className="c-input"
                    name="maxYear"
                    type="number"
                    min="1900"
                    value={filters.maxYear}
                    onChange={handleFilterChange}
                    placeholder="최대"
                    step={carFormSettings.yearStep}
                  />
                </SearchField>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                className="c-btn-outline w-full px-3 py-2"
                disabled={Boolean(pendingAction)}
                onClick={resetSearchFilters}
              >
                {pendingAction === "reset-search" ? "초기화 중" : "초기화"}
              </button>
              <button
                className="c-btn-primary w-full px-3 py-2"
                disabled={Boolean(pendingAction)}
                onClick={searchCars}
              >
                {pendingAction === "search" ? "검색 중" : "검색"}
              </button>
            </div>
          </aside>

          <div className="space-y-5">
            <div className="c-card p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#3f6ea6]">
                    Vehicle Inventory
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold text-[#0b1320]">
                    {isSearchMode ? "검색 결과" : "추천 매물"}
                    <span className="ml-2 text-[#3f6ea6]">{cars.length}</span>
                  </h2>
                  <p className="mt-1 text-sm text-[#5d6b7c]">
                    가격, 연식, 상태를 비교하고 딜러와 바로 연결하세요.
                  </p>
                </div>
                {isDealer && (
                  <button
                    className="c-btn-primary px-4 py-2 text-xs"
                    onClick={handleGoCreate}
                  >
                    + 차량 등록
                  </button>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <ResultChip label="무사고 우선" />
                <ResultChip label="상담 가능한 차량" />
                <ResultChip label="최근 등록순" />
                <ResultChip label="가격 비교형" />
              </div>
            </div>

            {isLoading ? (
              <div className="c-card flex min-h-64 items-center justify-center p-8">
                <svg
                  className="h-9 w-9 animate-spin text-[#3f6ea6]"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
              </div>
            ) : (
              <CarCardGrid
                canManageCar={canManageCar}
                cars={cars}
                emptyMessage={
                  isSearchMode
                    ? "조건에 맞는 차량이 없습니다."
                    : "아직 등록된 차량이 없습니다."
                }
                emptyDescription={
                  isSearchMode
                    ? "검색 조건을 바꾸거나 초기화해 전체 목록을 다시 확인해보세요."
                    : "딜러가 차량을 등록하면 이곳에 추천 매물이 표시됩니다."
                }
                onView={handleViewCar}
                onEdit={handleEditCar}
                onDelete={setDeleteTarget}
                onStartChat={handleStartChat}
                pendingAction={pendingAction}
              />
            )}
          </div>
        </section>
      </div>
    );
  }

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa]">
        <svg
          className="h-10 w-10 animate-spin text-[#3f6ea6]"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(47,174,155,0.1),_transparent_30rem),linear-gradient(180deg,_#f5f7fa_0%,_#ffffff_45%,_#f5f7fa_100%)]">
      <Header
        currentView={activeView}
        isAdmin={isAdmin}
        isDealer={isDealer}
        onGoAdmin={handleGoAdmin}
        onGoDealer={handleGoDealer}
        onGoList={handleGoList}
        onGoCreate={handleGoCreate}
        onGoLogin={() => navigate("/login")}
        onGoRegister={() => navigate("/register")}
        onGoChats={handleGoChats}
        onRequestDealer={handleRequestDealer}
        isDealerRequesting={pendingAction === "dealer-request"}
        onLogout={handleLogout}
        userProfile={userProfile}
      />

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-6 lg:px-8">
        {displayMessage.text && (
          <div className="mb-5">
            <AlertMessage
              type={displayMessage.type}
              message={displayMessage.text}
              onClose={() => {
                if (message.text) {
                  setMessage({ type: "", text: "" });
                  return;
                }

                setIsAuthErrorDismissed(true);
              }}
            />
          </div>
        )}

        <Routes>
          <Route path="/" element={renderListRoute()} />
          <Route
            path="/cars/:id"
            element={
              <CarDetailRoute
                canManageCar={canManageCar}
                onBack={handleGoList}
                onDelete={setDeleteTarget}
                onEdit={handleEditCar}
                onStartChat={handleStartChat}
                pendingAction={pendingAction}
                requestApi={requestApi}
                selectedCar={selectedCar}
                setMessage={setMessage}
                setSelectedCar={setSelectedCar}
                userProfile={userProfile}
              />
            }
          />
          <Route
            path="/chats"
            element={
              userProfile ? (
                <ChatRoomList
                  onGoList={handleGoList}
                  userProfile={userProfile}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/chats/:roomId"
            element={
              <ChatReadyRoute onBack={handleGoList} userProfile={userProfile} />
            }
          />
          <Route
            path="/login"
            element={
              <LoginForm
                onGoRegister={() => navigate("/register")}
                onLoginSuccess={() => {
                  navigate("/");
                  setMessage({ type: "success", text: "로그인되었습니다." });
                }}
              />
            }
          />
          <Route
            path="/register"
            element={
              <RegisterForm
                onGoLogin={() => navigate("/login")}
                onRegisterSuccess={() => {
                  navigate("/");
                  setMessage({
                    type: "success",
                    text: "회원가입이 완료되었습니다.",
                  });
                }}
              />
            }
          />
          <Route
            path="/admin"
            element={
              isAdmin ? (
                <AdminUserPanel
                  currentUserProfile={userProfile}
                  formSettings={carFormSettings}
                  onBack={handleGoList}
                  onFormSettingsChanged={setCarFormSettings}
                  onProfileChanged={refreshUserProfile}
                />
              ) : (
                <div className="c-card p-8">
                  <h1 className="text-2xl font-bold text-gray-900">
                    접근할 수 없습니다
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    관리자만 접근할 수 있는 화면입니다.
                  </p>
                  <div className="mt-5 flex justify-end">
                    <button className="c-btn-primary" onClick={handleGoList}>
                      목록으로
                    </button>
                  </div>
                </div>
              )
            }
          />
          <Route
            path="/dealer"
            element={
              isDealer ? (
                <DealerDashboard
                  cars={cars}
                  onBack={handleGoList}
                  onCreate={handleGoCreate}
                  onDelete={setDeleteTarget}
                  onEdit={handleEditCar}
                  onView={handleViewCar}
                  userProfile={userProfile}
                />
              ) : (
                <div className="c-card p-8">
                  <h1 className="text-2xl font-bold text-gray-900">
                    접근할 수 없습니다
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    승인된 딜러만 접근할 수 있는 화면입니다.
                  </p>
                  <div className="mt-5 flex justify-end">
                    <button className="c-btn-primary" onClick={handleGoList}>
                      목록으로
                    </button>
                  </div>
                </div>
              )
            }
          />
          <Route
            path="*"
            element={
              <div className="c-card p-8">
                <h1 className="text-2xl font-bold text-gray-900">
                  페이지를 찾을 수 없습니다
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  요청한 화면이 없거나 아직 구현되지 않았습니다.
                </p>
                <div className="mt-5 flex justify-end">
                  <button className="c-btn-primary" onClick={handleGoList}>
                    목록으로
                  </button>
                </div>
              </div>
            }
          />
        </Routes>
      </main>

      <DeleteConfirmModal
        car={deleteTarget}
        isDeleting={pendingAction === "delete-car"}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteCar}
      />
      <MobileBottomNav
        currentView={activeView}
        isAdmin={isAdmin}
        isDealer={isDealer}
        onGoAdmin={handleGoAdmin}
        onGoChats={handleGoChats}
        onGoDealer={handleGoDealer}
        onGoList={handleGoList}
        userProfile={userProfile}
      />
    </div>
  );
}

function HeroMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/25 bg-white/10 px-3 py-3 shadow-sm backdrop-blur">
      <p className="text-lg font-black text-white">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-slate-200">{label}</p>
    </div>
  );
}

function QuickBadge({ text }) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-center text-xs font-semibold text-slate-100 backdrop-blur">
      {text}
    </div>
  );
}

function ResultChip({ label }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#d4dde8] bg-[#eef3f8] px-3 py-1 text-xs font-semibold text-[#36567a]">
      {label}
    </span>
  );
}

function SearchField({ label, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-bold text-[#415162]">
        {label}
      </span>
      {children}
    </label>
  );
}

function CarDetailRoute({
  canManageCar,
  onBack,
  onDelete,
  onEdit,
  onStartChat,
  pendingAction,
  requestApi,
  selectedCar,
  setMessage,
  setSelectedCar,
  userProfile,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detailCar, setDetailCar] = useState(selectedCar);
  const [isDetailLoading, setIsDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    if (!userProfile) {
      setMessage({
        type: "error",
        text: "차량 상세 정보는 로그인 후 확인할 수 있습니다.",
      });
      navigate("/login", { replace: true });
      return;
    }

    let isMounted = true;

    async function loadCarDetail() {
      setIsDetailLoading(true);
      setDetailError("");

      try {
        const data = await requestApi(`/api/cars/${encodeURIComponent(id)}`, {
          authenticated: true,
        });

        if (!isMounted) return;

        setDetailCar(data);
        setSelectedCar(data);
      } catch (error) {
        if (!isMounted) return;

        setDetailError(error.message);
      } finally {
        if (isMounted) {
          setIsDetailLoading(false);
        }
      }
    }

    loadCarDetail();

    return () => {
      isMounted = false;
    };
  }, [id, userProfile?.uid]);

  if (!userProfile || isDetailLoading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <svg
          className="h-8 w-8 animate-spin text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      </div>
    );
  }

  if (detailError) {
    return (
      <div className="c-card p-8">
        <h1 className="text-2xl font-bold text-gray-900">
          차량을 찾을 수 없습니다
        </h1>
        <p className="mt-2 text-sm text-gray-500">{detailError}</p>
        <div className="mt-5 flex justify-end">
          <button className="c-btn-primary" onClick={onBack}>
            목록으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <CarDetail
      canManage={canManageCar(detailCar)}
      car={detailCar}
      onBack={onBack}
      onDelete={onDelete}
      onEdit={onEdit}
      isStartingChat={pendingAction === `start-chat:${detailCar._id}`}
      onStartChat={onStartChat}
    />
  );
}

function ChatReadyRoute({ onBack, userProfile }) {
  const { roomId } = useParams();
  const routeLocation = useLocation();
  const chatRoom = routeLocation.state?.chatRoom;

  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ChatRoom
      roomId={roomId}
      chatRoom={chatRoom}
      userProfile={userProfile}
      onBack={onBack}
    />
  );
}

export default App;

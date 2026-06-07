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
      <div className="space-y-8">
        {/* Hero 섹션 */}
        <section className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-white via-sky-50 to-blue-100 px-5 py-6 shadow-2xl shadow-blue-100/60 sm:px-8 sm:py-10">
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-sky-200/40 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-44 w-44 rounded-full bg-blue-200/40 blur-3xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
                실시간 상담이 가능한 중고차 마켓
              </p>
              <h1 className="mt-5 max-w-xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
                내 조건에 맞는
                <span className="block text-blue-600">중고차를 찾아보세요</span>
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">
                예산, 연식, 제조사 조건으로 빠르게 비교하고 마음에 드는
                딜러와 바로 상담하세요.
              </p>
              <div className="mt-6 grid max-w-md grid-cols-3 gap-3">
                <HeroMetric label="추천 매물" value={cars.length} />
                <HeroMetric label="실시간 상담" value="LIVE" />
                <HeroMetric label="간편 검색" value="FAST" />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-x-10 bottom-2 h-10 rounded-full bg-blue-950/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/70 p-3 shadow-2xl shadow-blue-200/60 backdrop-blur">
                <img
                  alt="Car Market 대표 차량 이미지"
                  className="h-64 w-full rounded-[1.2rem] object-cover sm:h-80"
                  src="/uploads/pre-default-car.png"
                />
                <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/90 p-4 shadow-lg backdrop-blur">
                  <p className="text-sm font-black text-slate-950">
                    조건에 맞는 차량을 빠르게 비교하세요
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    검색부터 딜러 상담까지 한 화면에서 이어집니다
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 검색 패널 */}
        <section className="c-surface -mt-12 p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">차량 검색</h2>
              <p className="text-sm text-slate-500">
                원하는 조건을 입력하고 추천 매물을 확인하세요.
              </p>
            </div>
            <div className="flex gap-2 pt-2 sm:pt-0">
              <button
                className="c-btn-outline px-4 py-2"
                disabled={Boolean(pendingAction)}
                onClick={resetSearchFilters}
              >
                {pendingAction === "reset-search" ? "초기화 중..." : "초기화"}
              </button>
              <button
                className="c-btn-primary px-5 py-2"
                disabled={Boolean(pendingAction)}
                onClick={searchCars}
              >
                {pendingAction === "search" ? "검색 중..." : "검색하기"}
              </button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <SearchField label="차량명" className="lg:col-span-2">
              <input
                className="c-input"
                name="keyword"
                value={filters.keyword}
                onChange={handleFilterChange}
                placeholder="차량명을 입력하세요"
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
            <SearchField label="연식">
              <div className="grid grid-cols-2 gap-2">
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
              </div>
            </SearchField>
          </div>
        </section>

        {/* 차량 목록 */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="c-section-title">
                {isSearchMode ? "검색 결과" : "추천 매물"}{" "}
                <span className="text-blue-600">{cars.length}</span>
              </h2>
              <p className="c-section-desc">
                조건에 맞는 매물을 비교하고 딜러와 바로 상담해보세요.
              </p>
            </div>
            {isDealer && (
              <button
                className="c-btn-primary hidden px-4 py-2 text-xs sm:inline-flex"
                onClick={handleGoCreate}
              >
                + 차량 등록
              </button>
            )}
          </div>

          {isLoading ? (
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
        </section>
      </div>
    );
  }

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <svg
          className="h-10 w-10 animate-spin text-blue-600"
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#eff6ff,_transparent_32rem),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_45%,_#f8fafc_100%)]">
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
                <ChatRoomList onGoList={handleGoList} userProfile={userProfile} />
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
    <div className="rounded-2xl border border-white/80 bg-white/70 px-3 py-3 shadow-sm backdrop-blur">
      <p className="text-lg font-black text-slate-950">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

function SearchField({ label, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-bold text-slate-600">
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

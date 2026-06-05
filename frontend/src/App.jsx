import { useEffect, useMemo, useState } from "react";
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
import DeleteConfirmModal from "./components/DeleteConfirmModal.jsx";
import Header from "./components/Header.jsx";
import LoginForm from "./components/LoginForm.jsx";
import RegisterForm from "./components/RegisterForm.jsx";
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
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentView, setCurrentView] = useState("list");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [filters, setFilters] = useState({
    keyword: "",
    company: "",
    minPrice: "",
    maxPrice: "",
    minYear: "",
    maxYear: "",
  });
  const [isSearchMode, setIsSearchMode] = useState(false);

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
    return currentView;
  }, [currentView, location.pathname]);

  const displayMessage = message.text
    ? message
    : authError
      ? { type: "error", text: authError }
      : message;

  useEffect(() => {
    loadCars();
  }, []);

  async function requestApi(url, options) {
    const response = await fetch(url, options);

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
      await loadCars("전체 목록을 조회했습니다.");
      return;
    }

    await loadFilteredCars(
      `/api/cars/search?${params.toString()}`,
      "차량 검색 결과입니다.",
    );
  }

  async function resetSearchFilters() {
    setFilters({
      keyword: "",
      company: "",
      minPrice: "",
      maxPrice: "",
      minYear: "",
      maxYear: "",
    });
    await loadCars("검색 조건을 초기화했습니다.");
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
    if (!isDealer || !userProfile) {
      setMessage({
        type: "error",
        text: "딜러만 자동차를 등록할 수 있습니다.",
      });
      handleGoList();
      return;
    }

    try {
      await requestApi("/api/cars", {
        method: "POST",
        body: createCarFormData(addDealerFields(carInput)),
      });

      await loadCars("자동차가 등록되었습니다.");
      navigate("/");
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  }

  async function handleUpdateCar(carInput) {
    if (!selectedCar) return;

    if (!canManageCar(selectedCar)) {
      setMessage({
        type: "error",
        text: "차량을 등록한 딜러만 수정할 수 있습니다.",
      });
      handleGoList();
      return;
    }

    try {
      const updatedCar = await requestApi(`/api/cars/${selectedCar._id}`, {
        method: "PUT",
        body: createCarFormData(addDealerFields(carInput)),
      });

      setSelectedCar(updatedCar);
      await loadCars("자동차 정보가 수정되었습니다.");
      navigate(`/cars/${updatedCar._id}`);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  }

  async function handleDeleteCar() {
    if (!deleteTarget) return;

    if (!canManageCar(deleteTarget)) {
      setMessage({
        type: "error",
        text: "차량을 등록한 딜러만 삭제할 수 있습니다.",
      });
      setDeleteTarget(null);
      return;
    }

    try {
      const dealerId = encodeURIComponent(userProfile.uid);
      await requestApi(`/api/cars/${deleteTarget._id}?dealerId=${dealerId}`, {
        method: "DELETE",
      });
      setDeleteTarget(null);
      setSelectedCar(null);
      await loadCars("자동차가 삭제되었습니다.");
      navigate("/");
    } catch (error) {
      setMessage({ type: "error", text: error.message });
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

  async function handleRequestDealer() {
    try {
      await requestDealerApproval();
      setMessage({
        type: "success",
        text: "딜러 신청이 접수되었습니다. 관리자 승인을 기다려주세요.",
      });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  }

  async function handleStartChat(car) {
    if (!userProfile) {
      setMessage({
        type: "error",
        text: "로그인 후 상담을 시작할 수 있습니다.",
      });
      navigate("/login");
      return;
    }

    try {
      const chatRoom = await requestApi("/api/chats/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId: String(car._id),
          buyerId: userProfile.uid,
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

      formData.append(key, value ?? "");
    });

    return formData;
  }

  function addDealerFields(carInput) {
    return {
      ...carInput,
      dealerId: userProfile.uid,
      dealerName: userProfile.displayName,
      dealerRole: userProfile.role,
    };
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
          onCancel={handleGoList}
          onSubmit={handleCreateCar}
        />
      );
    }

    if (currentView === "edit" && selectedCar) {
      return (
        <CarForm
          mode="edit"
          initialCar={selectedCar}
          onCancel={handleGoList}
          onSubmit={handleUpdateCar}
        />
      );
    }

    return (
      <div className="space-y-6">
        {/* Hero 섹션 */}
        <section className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 px-6 py-10 text-white">
          <h1 className="text-2xl font-extrabold sm:text-3xl">
            내 조건에 맞는 중고차를 찾아보세요
          </h1>
          <p className="mt-2 text-blue-100">
            검색하고, 비교하고, 마음에 드는 딜러와 바로 상담하세요
          </p>
        </section>

        {/* 검색 패널 */}
        <div className="c-card p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input
              className="c-input"
              name="keyword"
              value={filters.keyword}
              onChange={handleFilterChange}
              placeholder="차량명: Sonata"
            />
            <select
              className="c-select"
              name="company"
              value={filters.company}
              onChange={handleFilterChange}
            >
              <option value="">제조사 전체</option>
              <option value="HYUNDAI">HYUNDAI</option>
              <option value="KIA">KIA</option>
              <option value="RENAULT">RENAULT</option>
              <option value="GENESIS">GENESIS</option>
              <option value="CHEVROLET">CHEVROLET</option>
            </select>
            <input
              className="c-input"
              name="minPrice"
              type="number"
              min="0"
              value={filters.minPrice}
              onChange={handleFilterChange}
              placeholder="최소 가격 (만원)"
            />
            <input
              className="c-input"
              name="maxPrice"
              type="number"
              min="0"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              placeholder="최대 가격 (만원)"
            />
            <input
              className="c-input"
              name="minYear"
              type="number"
              min="1900"
              value={filters.minYear}
              onChange={handleFilterChange}
              placeholder="최소 연식"
            />
            <input
              className="c-input"
              name="maxYear"
              type="number"
              min="1900"
              value={filters.maxYear}
              onChange={handleFilterChange}
              placeholder="최대 연식"
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button className="c-btn-outline" onClick={resetSearchFilters}>
              초기화
            </button>
            <button className="c-btn-primary" onClick={searchCars}>
              검색하기
            </button>
          </div>
        </div>

        {/* 차량 목록 */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              {isSearchMode ? "검색 결과" : "추천 매물"}{" "}
              <span className="text-gray-400">({cars.length})</span>
            </h2>
            {isDealer && (
              <button
                className="c-btn-primary px-3 py-1.5 text-xs"
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
                  ? "검색 결과가 없습니다."
                  : "등록된 자동차가 없습니다."
              }
              emptyDescription={
                isSearchMode
                  ? "검색 조건을 바꾸거나 초기화해 전체 목록을 다시 확인해보세요."
                  : "등록 버튼을 눌러 첫 자동차를 추가해보세요."
              }
              onView={handleViewCar}
              onEdit={handleEditCar}
              onDelete={setDeleteTarget}
            />
          )}
        </div>
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
    <div className="min-h-screen bg-gray-50">
      <Header
        currentView={activeView}
        isAdmin={isAdmin}
        isDealer={isDealer}
        onGoAdmin={handleGoAdmin}
        onGoList={handleGoList}
        onGoCreate={handleGoCreate}
        onGoLogin={() => navigate("/login")}
        onGoRegister={() => navigate("/register")}
        onGoChats={handleGoChats}
        onRequestDealer={handleRequestDealer}
        onLogout={handleLogout}
        userProfile={userProfile}
      />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {displayMessage.text && (
          <div className="mb-5">
            <AlertMessage
              type={displayMessage.type}
              message={displayMessage.text}
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
                <ChatRoomList userProfile={userProfile} />
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
                  onBack={handleGoList}
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
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteCar}
      />
    </div>
  );
}

function CarDetailRoute({
  canManageCar,
  onBack,
  onDelete,
  onEdit,
  onStartChat,
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
        const data = await requestApi(`/api/cars/${encodeURIComponent(id)}`);

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

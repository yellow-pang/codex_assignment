import { useEffect, useMemo, useState } from "react";
import AdminUserPanel from "./components/AdminUserPanel.jsx";
import AlertMessage from "./components/AlertMessage.jsx";
import CarDetail from "./components/CarDetail.jsx";
import CarForm from "./components/CarForm.jsx";
import CarTable from "./components/CarTable.jsx";
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

  const totalPrice = useMemo(
    () => cars.reduce((sum, car) => sum + Number(car.price || 0), 0),
    [cars],
  );

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
      // Vite 프록시 설정 덕분에 /api/cars 요청이 Express 서버로 전달됩니다.
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
      setMessage({ type: "error", text: "딜러만 자동차를 등록할 수 있습니다." });
      setCurrentView("list");
      return;
    }

    try {
      await requestApi("/api/cars", {
        method: "POST",
        body: createCarFormData(addDealerFields(carInput)),
      });

      await loadCars("자동차가 등록되었습니다.");
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
      setCurrentView("list");
      return;
    }

    try {
      const updatedCar = await requestApi(`/api/cars/${selectedCar._id}`, {
        method: "PUT",
        body: createCarFormData(addDealerFields(carInput)),
      });

      setSelectedCar(updatedCar);
      await loadCars("자동차 정보가 수정되었습니다.");
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
      setCurrentView("login");
      return;
    }

    setSelectedCar(car);
    setCurrentView("detail");
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
  }

  function handleGoList() {
    setSelectedCar(null);
    setCurrentView("list");
  }

  function handleGoCreate() {
    if (!userProfile) {
      setMessage({ type: "error", text: "로그인 후 자동차를 등록할 수 있습니다." });
      setCurrentView("login");
      return;
    }

    if (!isDealer) {
      setMessage({ type: "error", text: "딜러만 자동차를 등록할 수 있습니다." });
      return;
    }

    setCurrentView("create");
  }

  function handleGoAdmin() {
    if (!isAdmin) {
      setMessage({ type: "error", text: "관리자만 접근할 수 있습니다." });
      return;
    }

    setCurrentView("admin");
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

  async function handleLogout() {
    await logout();
    setSelectedCar(null);
    setDeleteTarget(null);
    setCurrentView("list");
    setMessage({ type: "success", text: "로그아웃되었습니다." });
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

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <Header
        currentView={currentView}
        isAdmin={isAdmin}
        isDealer={isDealer}
        onGoAdmin={handleGoAdmin}
        onGoList={handleGoList}
        onGoCreate={handleGoCreate}
        onGoLogin={() => setCurrentView("login")}
        onGoRegister={() => setCurrentView("register")}
        onRequestDealer={handleRequestDealer}
        onLogout={handleLogout}
        userProfile={userProfile}
      />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="stats bg-base-100 shadow">
            <div className="stat">
              <div className="stat-title">등록 자동차</div>
              <div className="stat-value text-primary">{cars.length}</div>
              <div className="stat-desc">현재 화면 기준</div>
            </div>
          </div>
          <div className="stats bg-base-100 shadow sm:col-span-2">
            <div className="stat">
              <div className="stat-title">총 가격</div>
              <div className="stat-value text-2xl">
                {totalPrice.toLocaleString()}만원
              </div>
              <div className="stat-desc">조회된 목록의 합계</div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <AlertMessage type={displayMessage.type} message={displayMessage.text} />
        </div>

        {currentView === "list" && (
          <section className="card bg-base-100 shadow">
            <div className="card-body">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="card-title text-2xl">자동차 목록</h1>
                  <p className="mt-1 text-sm text-base-content/60">
                    자동차 REST API에서 조회한 데이터를 관리합니다.
                  </p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleGoCreate}
                  disabled={!isDealer}
                >
                  등록하기
                </button>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-6">
                <input
                  className="input input-bordered"
                  name="keyword"
                  value={filters.keyword}
                  onChange={handleFilterChange}
                  placeholder="차량명: Sonata"
                />
                <input
                  className="input input-bordered"
                  name="company"
                  value={filters.company}
                  onChange={handleFilterChange}
                  placeholder="제조사 검색: HYUNDAI"
                />
                <input
                  className="input input-bordered"
                  name="minPrice"
                  type="number"
                  min="0"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  placeholder="최소 가격"
                />
                <input
                  className="input input-bordered"
                  name="maxPrice"
                  type="number"
                  min="0"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  placeholder="최대 가격"
                />
                <input
                  className="input input-bordered"
                  name="minYear"
                  type="number"
                  min="1900"
                  value={filters.minYear}
                  onChange={handleFilterChange}
                  placeholder="최소 연식"
                />
                <input
                  className="input input-bordered"
                  name="maxYear"
                  type="number"
                  min="1900"
                  value={filters.maxYear}
                  onChange={handleFilterChange}
                  placeholder="최대 연식"
                />
                <div className="flex flex-col gap-3 sm:flex-row lg:col-span-6 lg:justify-end">
                  <button className="btn btn-primary" onClick={searchCars}>
                    검색
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={resetSearchFilters}
                  >
                    초기화
                  </button>
                </div>
              </div>

              <div className="mt-4">
                {isLoading ? (
                  <div className="flex min-h-40 items-center justify-center">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                  </div>
                ) : (
                  <CarTable
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
          </section>
        )}

        {currentView === "create" && (
          <CarForm
            mode="create"
            onCancel={handleGoList}
            onSubmit={handleCreateCar}
          />
        )}

        {currentView === "edit" && selectedCar && (
          <CarForm
            mode="edit"
            initialCar={selectedCar}
            onCancel={handleGoList}
            onSubmit={handleUpdateCar}
          />
        )}

        {currentView === "detail" && (
          <CarDetail
            canManage={canManageCar(selectedCar)}
            car={selectedCar}
            onBack={handleGoList}
            onEdit={handleEditCar}
            onDelete={setDeleteTarget}
          />
        )}

        {currentView === "login" && (
          <LoginForm
            onGoRegister={() => setCurrentView("register")}
            onLoginSuccess={() => {
              setCurrentView("list");
              setMessage({ type: "success", text: "로그인되었습니다." });
            }}
          />
        )}

        {currentView === "register" && (
          <RegisterForm
            onGoLogin={() => setCurrentView("login")}
            onRegisterSuccess={() => {
              setCurrentView("list");
              setMessage({ type: "success", text: "회원가입이 완료되었습니다." });
            }}
          />
        )}

        {currentView === "admin" && isAdmin && (
          <AdminUserPanel
            currentUserProfile={userProfile}
            onBack={handleGoList}
            onProfileChanged={refreshUserProfile}
          />
        )}
      </main>

      <DeleteConfirmModal
        car={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteCar}
      />
    </div>
  );
}

export default App;

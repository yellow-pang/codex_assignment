import { useEffect, useMemo, useState } from "react";
import AlertMessage from "./components/AlertMessage.jsx";
import CarDetail from "./components/CarDetail.jsx";
import CarForm from "./components/CarForm.jsx";
import CarTable from "./components/CarTable.jsx";
import DeleteConfirmModal from "./components/DeleteConfirmModal.jsx";
import Header from "./components/Header.jsx";

function App() {
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentView, setCurrentView] = useState("list");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [filters, setFilters] = useState({ company: "", minPrice: "", maxPrice: "" });

  const totalPrice = useMemo(
    () => cars.reduce((sum, car) => sum + Number(car.price || 0), 0),
    [cars]
  );

  useEffect(() => {
    loadCars();
  }, []);

  async function requestApi(url, options) {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error("요청을 처리하지 못했습니다.");
    }

    return response.json();
  }

  async function loadCars(successMessage = "") {
    setIsLoading(true);
    if (!successMessage) {
      setMessage({ type: "", text: "" });
    }

    try {
      // Vite 프록시 설정 덕분에 /api/cars 요청이 Express의 /cars API로 전달됩니다.
      const data = await requestApi("/api/cars");
      setCars(data);
      setCurrentView("list");
      if (successMessage) {
        setMessage({ type: "success", text: successMessage });
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  async function searchByCompany() {
    const company = filters.company.trim().toUpperCase();
    const url = company ? `/api/cars/search?company=${encodeURIComponent(company)}` : "/api/cars";

    await loadFilteredCars(url, company ? "제조사 검색 결과입니다." : "전체 목록을 조회했습니다.");
  }

  async function filterByPrice() {
    const params = new URLSearchParams();
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);

    const url = params.toString() ? `/api/cars/filter?${params.toString()}` : "/api/cars/filter";
    await loadFilteredCars(url, "가격 필터 결과입니다.");
  }

  async function loadFilteredCars(url, successMessage) {
    setIsLoading(true);

    try {
      const data = await requestApi(url);
      setCars(data);
      setCurrentView("list");
      setMessage({ type: "success", text: successMessage });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateCar(carInput) {
    const nextId = cars.length > 0 ? Math.max(...cars.map((car) => Number(car._id))) + 1 : 1;

    try {
      await requestApi("/api/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: nextId, ...carInput }),
      });

      await loadCars("자동차가 등록되었습니다.");
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  }

  async function handleUpdateCar(carInput) {
    if (!selectedCar) return;

    try {
      const updatedCar = await requestApi(`/api/cars/${selectedCar._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(carInput),
      });

      setSelectedCar(updatedCar);
      await loadCars("자동차 정보가 수정되었습니다.");
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  }

  async function handleDeleteCar() {
    if (!deleteTarget) return;

    try {
      await requestApi(`/api/cars/${deleteTarget._id}`, { method: "DELETE" });
      setDeleteTarget(null);
      setSelectedCar(null);
      await loadCars("자동차가 삭제되었습니다.");
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  }

  function handleViewCar(car) {
    setSelectedCar(car);
    setCurrentView("detail");
  }

  function handleEditCar(car) {
    setSelectedCar(car);
    setCurrentView("edit");
  }

  function handleGoList() {
    setSelectedCar(null);
    setCurrentView("list");
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
  }

  return (
    <div className="min-h-screen bg-base-200">
      <Header currentView={currentView} onGoList={handleGoList} onGoCreate={() => setCurrentView("create")} />

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
              <div className="stat-value text-2xl">{totalPrice.toLocaleString()}만원</div>
              <div className="stat-desc">조회된 목록의 합계</div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <AlertMessage type={message.type} message={message.text} />
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
                <button className="btn btn-primary" onClick={() => setCurrentView("create")}>
                  등록하기
                </button>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto]">
                <input
                  className="input input-bordered"
                  name="company"
                  value={filters.company}
                  onChange={handleFilterChange}
                  placeholder="제조사 검색: HYUNDAI"
                />
                <button className="btn btn-outline" onClick={searchByCompany}>
                  검색
                </button>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="input input-bordered"
                    name="minPrice"
                    type="number"
                    value={filters.minPrice}
                    onChange={handleFilterChange}
                    placeholder="최소 가격"
                  />
                  <input
                    className="input input-bordered"
                    name="maxPrice"
                    type="number"
                    value={filters.maxPrice}
                    onChange={handleFilterChange}
                    placeholder="최대 가격"
                  />
                </div>
                <button className="btn btn-outline" onClick={filterByPrice}>
                  필터
                </button>
              </div>

              <div className="mt-4">
                {isLoading ? (
                  <div className="flex min-h-40 items-center justify-center">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                  </div>
                ) : (
                  <CarTable cars={cars} onView={handleViewCar} onEdit={handleEditCar} onDelete={setDeleteTarget} />
                )}
              </div>
            </div>
          </section>
        )}

        {currentView === "create" && (
          <CarForm mode="create" onCancel={handleGoList} onSubmit={handleCreateCar} />
        )}

        {currentView === "edit" && selectedCar && (
          <CarForm mode="edit" initialCar={selectedCar} onCancel={handleGoList} onSubmit={handleUpdateCar} />
        )}

        {currentView === "detail" && (
          <CarDetail car={selectedCar} onBack={handleGoList} onEdit={handleEditCar} onDelete={setDeleteTarget} />
        )}
      </main>

      <DeleteConfirmModal car={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDeleteCar} />
    </div>
  );
}

export default App;

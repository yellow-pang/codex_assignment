function DealerDashboard({
  cars,
  onBack,
  onCreate,
  onDelete,
  onEdit,
  onView,
  userProfile,
}) {
  const defaultCarImageUrl = "/uploads/default-car.png";
  const dealerCars = cars.filter(
    (car) => String(car.dealerId || "") === String(userProfile?.uid || ""),
  );
  const totalPrice = dealerCars.reduce(
    (sum, car) => sum + (Number(car.price) || 0),
    0,
  );
  const visibleLocations = new Set(
    dealerCars.map((car) => car.location).filter(Boolean),
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[17rem_1fr]">
      <aside className="rounded-3xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-300/40">
        <button
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
          onClick={onBack}
        >
          <span aria-hidden="true">←</span>
          차량 검색으로
        </button>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
          Dealer Workspace
        </p>
        <h1 className="mt-3 text-2xl font-black tracking-tight">내 차량 관리</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          등록한 차량을 한 곳에서 확인하고 수정, 삭제, 상세 확인으로 바로
          이동합니다.
        </p>
        <div className="mt-6 rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
          <p className="text-xs text-slate-400">딜러 계정</p>
          <p className="mt-1 truncate text-sm font-bold">{userProfile?.displayName}</p>
          <p className="mt-1 truncate text-xs text-slate-400">{userProfile?.email}</p>
        </div>
        <button className="mt-5 w-full c-btn-primary" onClick={onCreate}>
          차량 등록하기
        </button>
      </aside>

      <section className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <DealerMetric label="등록 차량" value={`${dealerCars.length}대`} />
          <DealerMetric
            label="총 판매가"
            value={`${totalPrice.toLocaleString()}만원`}
          />
          <DealerMetric label="판매 지역" value={`${visibleLocations.size}곳`} />
        </div>

        <div className="c-card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">등록 차량 목록</h2>
              <p className="mt-1 text-sm text-slate-500">
                승인된 딜러 본인이 등록한 차량만 표시됩니다.
              </p>
            </div>
            <button className="c-btn-outline px-4 py-2 text-xs" onClick={onCreate}>
              + 새 차량
            </button>
          </div>

          {dealerCars.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="text-base font-bold text-slate-600">
                아직 등록한 차량이 없습니다.
              </p>
              <p className="mt-2 text-sm text-slate-400">
                첫 차량을 등록하면 딜러 관리 화면에서 바로 관리할 수 있습니다.
              </p>
              <button className="mt-5 c-btn-primary" onClick={onCreate}>
                차량 등록 시작
              </button>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-slate-100 bg-white">
                  <thead className="bg-slate-50">
                    <tr>
                      {["차량", "제조사", "연식", "가격", "지역", "관리"].map(
                        (header, index) => (
                          <th
                            key={header}
                            className={`px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 ${
                              index === 5 ? "text-right" : "text-left"
                            }`}
                          >
                            {header}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dealerCars.map((car) => (
                      <tr key={car._id} className="hover:bg-blue-50/40">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              alt={`${car.name} 차량 사진`}
                              className="h-14 w-20 rounded-xl object-cover"
                              src={car.imageUrl || defaultCarImageUrl}
                            />
                            <div>
                              <p className="font-bold text-slate-950">{car.name}</p>
                              <p className="text-xs text-slate-400">
                                {car.mileage
                                  ? `${Number(car.mileage).toLocaleString()}km`
                                  : "주행거리 미입력"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="c-badge-blue">{car.company}</span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {car.year}
                        </td>
                        <td className="px-5 py-4 text-sm font-black text-blue-600">
                          {Number(car.price).toLocaleString()}만원
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {car.location || "-"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              className="c-btn-outline px-3 py-1.5 text-xs"
                              onClick={() => onView(car)}
                            >
                              상세
                            </button>
                            <button
                              className="c-btn-warning px-3 py-1.5 text-xs"
                              onClick={() => onEdit(car)}
                            >
                              수정
                            </button>
                            <button
                              className="c-btn-danger px-3 py-1.5 text-xs"
                              onClick={() => onDelete(car)}
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 md:hidden">
                {dealerCars.map((car) => (
                  <div key={car._id} className="p-4">
                    <div className="flex gap-3">
                      <img
                        alt={`${car.name} 차량 사진`}
                        className="h-20 w-24 rounded-2xl object-cover"
                        src={car.imageUrl || defaultCarImageUrl}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-black text-slate-950">
                          {car.name}
                        </p>
                        <p className="mt-1 text-sm font-bold text-blue-600">
                          {Number(car.price).toLocaleString()}만원
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {car.company} · {car.year} · {car.location || "-"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <button
                        className="c-btn-outline px-2 py-2 text-xs"
                        onClick={() => onView(car)}
                      >
                        상세
                      </button>
                      <button
                        className="c-btn-warning px-2 py-2 text-xs"
                        onClick={() => onEdit(car)}
                      >
                        수정
                      </button>
                      <button
                        className="c-btn-danger px-2 py-2 text-xs"
                        onClick={() => onDelete(car)}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function DealerMetric({ label, value }) {
  return (
    <div className="c-card p-5">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

export default DealerDashboard;

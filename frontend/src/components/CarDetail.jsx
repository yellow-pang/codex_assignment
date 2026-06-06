function CarDetail({ canManage, car, onBack, onEdit, onDelete, onStartChat }) {
  const defaultCarImageUrl = "/uploads/default-car.png";

  if (!car) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 브레드크럼 */}
      <nav className="flex items-center gap-2 text-sm font-medium text-slate-500">
        <button className="hover:text-blue-600" onClick={onBack}>
          홈
        </button>
        <span>/</span>
        <button className="hover:text-blue-600" onClick={onBack}>
          차량 검색
        </button>
        <span>/</span>
        <span className="font-semibold text-slate-900">{car.name}</span>
      </nav>

      {/* 메인 2열 레이아웃 */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* 좌: 차량 이미지 */}
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-100 shadow-xl shadow-slate-200/70">
            <img
              alt={`${car.name} 차량 사진`}
              className="h-[26rem] w-full object-cover"
              src={car.imageUrl || defaultCarImageUrl}
            />
            <span className="absolute right-5 top-5 c-badge-green">
              상담 가능
            </span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-sm"
              >
                <img
                  alt={`${car.name} 썸네일`}
                  className="h-20 w-full rounded-xl object-cover"
                  src={car.imageUrl || defaultCarImageUrl}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 우: 차량 정보 */}
        <div className="flex flex-col gap-4">
          {/* 헤더 정보 */}
          <div className="c-card p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="c-badge-blue">{car.company}</span>
              {car.fuel && <span className="c-badge-gray">{car.fuel}</span>}
              {car.type && <span className="c-badge-gray">{car.type}</span>}
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
              {car.name}
            </h1>
            <p className="mt-2 text-4xl font-black tracking-tight text-blue-600">
              {Number(car.price).toLocaleString()}만원
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              차량 상태와 딜러 정보를 확인한 뒤 실시간 상담으로 바로
              문의할 수 있습니다.
            </p>
          </div>

          {/* 스펙 그리드 */}
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <SpecItem label="연식" value={`${car.year}년`} />
            <SpecItem
              label="주행거리"
              value={
                car.mileage !== undefined
                  ? `${Number(car.mileage).toLocaleString()}km`
                  : "-"
              }
            />
            <SpecItem label="차종" value={car.type || "-"} />
            <SpecItem label="연료" value={car.fuel || "-"} />
            <SpecItem label="지역" value={car.location || "-"} />
          </div>

          {/* 딜러 CTA */}
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                딜러
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500">담당 딜러</p>
                <p className="mt-0.5 text-lg font-black text-slate-950">
                  {car.dealerName || "딜러 정보 없음"}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              실시간 상담 가능
            </div>
            <button
              className="c-btn-primary mt-4 w-full"
              disabled={!car.dealerId}
              onClick={() => onStartChat(car)}
            >
              딜러와 상담하기
            </button>
          </div>

          {/* 관리 버튼 */}
          <div className="flex gap-2">
            <button className="c-btn-outline flex-1" onClick={onBack}>
              목록으로
            </button>
            {canManage && (
              <>
                <button className="c-btn-warning" onClick={() => onEdit(car)}>
                  수정
                </button>
                <button className="c-btn-danger" onClick={() => onDelete(car)}>
                  삭제
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 차량 설명 */}
      <div className="c-card p-6">
        <h2 className="text-lg font-black text-slate-950">차량 설명</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
          {car.description || "등록된 설명이 없습니다."}
        </p>
      </div>
    </div>
  );
}

function SpecItem({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-800">{value}</p>
    </div>
  );
}

export default CarDetail;

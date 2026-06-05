function CarDetail({ canManage, car, onBack, onEdit, onDelete, onStartChat }) {
  const defaultCarImageUrl = "/uploads/default-car.png";

  if (!car) {
    return null;
  }

  return (
    <div className="space-y-5">
      {/* 브레드크럼 */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <button className="hover:text-blue-600" onClick={onBack}>
          홈
        </button>
        <span>/</span>
        <button className="hover:text-blue-600" onClick={onBack}>
          차량 검색
        </button>
        <span>/</span>
        <span className="font-medium text-gray-900">{car.name}</span>
      </nav>

      {/* 메인 2열 레이아웃 */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* 좌: 차량 이미지 */}
        <div className="lg:col-span-3">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
            <img
              alt={`${car.name} 차량 사진`}
              className="h-80 w-full object-cover"
              src={car.imageUrl || defaultCarImageUrl}
            />
          </div>
        </div>

        {/* 우: 차량 정보 */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* 헤더 정보 */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="c-badge-blue">{car.company}</span>
              {car.fuel && <span className="c-badge-gray">{car.fuel}</span>}
              {car.type && <span className="c-badge-gray">{car.type}</span>}
            </div>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">
              {car.name}
            </h1>
            <p className="mt-1 text-3xl font-extrabold text-blue-600">
              {Number(car.price).toLocaleString()}만원
            </p>
          </div>

          {/* 스펙 그리드 */}
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
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
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">담당 딜러</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {car.dealerName || "딜러 정보 없음"}
            </p>
            <button
              className="c-btn-primary mt-3 w-full"
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
      <div className="c-card p-5">
        <h2 className="mb-3 font-semibold text-gray-900">차량 설명</h2>
        <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
          {car.description || "등록된 설명이 없습니다."}
        </p>
      </div>
    </div>
  );
}

function SpecItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-800">{value}</p>
    </div>
  );
}

export default CarDetail;

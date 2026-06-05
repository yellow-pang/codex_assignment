function CarDetail({ canManage, car, onBack, onEdit, onDelete, onStartChat }) {
  const defaultCarImageUrl = "/uploads/default-car.png";

  if (!car) {
    return null;
  }

  return (
    <section className="card bg-base-100 shadow">
      <div className="card-body">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="card-title text-2xl">{car.name}</h1>
            <p className="mt-1 text-sm text-base-content/60">선택한 자동차의 상세 정보입니다.</p>
          </div>
          <span className="badge badge-info badge-outline">{car.company}</span>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl bg-base-200">
          <img
            alt={`${car.name} 차량 사진`}
            className="h-72 w-full object-cover"
            src={car.imageUrl || defaultCarImageUrl}
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-base-200 p-4">
            <p className="text-xs text-base-content/60">ID</p>
            <p className="mt-1 font-semibold">{car._id}</p>
          </div>
          <div className="rounded-lg bg-base-200 p-4">
            <p className="text-xs text-base-content/60">연식</p>
            <p className="mt-1 font-semibold">{car.year}</p>
          </div>
          <div className="rounded-lg bg-base-200 p-4">
            <p className="text-xs text-base-content/60">가격</p>
            <p className="mt-1 font-semibold">{Number(car.price).toLocaleString()}만원</p>
          </div>
          <div className="rounded-lg bg-base-200 p-4">
            <p className="text-xs text-base-content/60">차종</p>
            <p className="mt-1 font-semibold">{car.type || "-"}</p>
          </div>
          <div className="rounded-lg bg-base-200 p-4">
            <p className="text-xs text-base-content/60">연료</p>
            <p className="mt-1 font-semibold">{car.fuel || "-"}</p>
          </div>
          <div className="rounded-lg bg-base-200 p-4">
            <p className="text-xs text-base-content/60">주행거리</p>
            <p className="mt-1 font-semibold">
              {car.mileage !== undefined
                ? `${Number(car.mileage).toLocaleString()}km`
                : "-"}
            </p>
          </div>
          <div className="rounded-lg bg-base-200 p-4">
            <p className="text-xs text-base-content/60">지역</p>
            <p className="mt-1 font-semibold">{car.location || "-"}</p>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-base-200 p-4">
          <p className="text-xs text-base-content/60">차량 설명</p>
          <p className="mt-2 whitespace-pre-wrap leading-7">
            {car.description || "등록된 설명이 없습니다."}
          </p>
        </div>

        <div className="mt-4 rounded-lg border border-base-300 bg-base-100 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-base-content/60">담당 딜러</p>
              <p className="mt-1 text-lg font-semibold">
                {car.dealerName || "딜러 정보 없음"}
              </p>
            </div>
            <button
              className="btn btn-primary"
              disabled={!car.dealerId}
              onClick={() => onStartChat(car)}
            >
              딜러와 상담하기
            </button>
          </div>
        </div>

        <div className="card-actions mt-4 justify-end">
          <button className="btn btn-outline" onClick={onBack}>
            목록으로
          </button>
          {canManage && (
            <>
              <button className="btn btn-warning" onClick={() => onEdit(car)}>
                수정
              </button>
              <button className="btn btn-error" onClick={() => onDelete(car)}>
                삭제
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default CarDetail;

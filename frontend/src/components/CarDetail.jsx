function CarDetail({ car, onBack, onEdit, onDelete }) {
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
        </div>

        <div className="card-actions mt-4 justify-end">
          <button className="btn btn-outline" onClick={onBack}>
            목록으로
          </button>
          <button className="btn btn-warning" onClick={() => onEdit(car)}>
            수정
          </button>
          <button className="btn btn-error" onClick={() => onDelete(car)}>
            삭제
          </button>
        </div>
      </div>
    </section>
  );
}

export default CarDetail;

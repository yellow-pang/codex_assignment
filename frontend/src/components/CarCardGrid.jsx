function CarCardGrid({
  cars,
  emptyMessage = "등록된 자동차가 없습니다.",
  emptyDescription = "등록 버튼을 눌러 첫 자동차를 추가해보세요.",
  canManageCar = () => false,
  onView,
  onEdit,
  onDelete,
}) {
  const defaultCarImageUrl = "/uploads/default-car.png";

  if (cars.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 py-20 text-center">
        <p className="font-semibold text-gray-500">{emptyMessage}</p>
        <p className="mt-1 text-sm text-gray-400">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {cars.map((car) => (
        <article
          key={car._id}
          className="c-card flex flex-col overflow-hidden transition-shadow hover:shadow-md"
        >
          {/* 차량 이미지 */}
          <div className="relative">
            <img
              alt={`${car.name} 차량 사진`}
              className="h-48 w-full object-cover"
              src={car.imageUrl || defaultCarImageUrl}
            />
            <span className="absolute left-3 top-3 c-badge-blue">
              {car.company}
            </span>
          </div>

          {/* 차량 정보 */}
          <div className="flex flex-1 flex-col p-4">
            <h3 className="font-semibold text-gray-900">{car.name}</h3>
            <p className="mt-1 text-xl font-bold text-blue-600">
              {Number(car.price).toLocaleString()}만원
            </p>

            {/* 기본 스펙 */}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
              <span>{car.year}년</span>
              {car.mileage !== undefined && (
                <span>{Number(car.mileage).toLocaleString()}km</span>
              )}
              {car.location && <span>{car.location}</span>}
            </div>

            {/* 배지 */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {car.fuel && <span className="c-badge-gray">{car.fuel}</span>}
              {car.type && <span className="c-badge-gray">{car.type}</span>}
            </div>

            {/* 액션 버튼 */}
            <div className="mt-4 flex gap-2">
              <button
                className="c-btn-primary flex-1"
                onClick={() => onView(car)}
              >
                상세 보기
              </button>
              {canManageCar(car) && (
                <>
                  <button
                    className="c-btn-outline px-3 py-1.5 text-xs"
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
                </>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default CarCardGrid;

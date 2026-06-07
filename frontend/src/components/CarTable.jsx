import {
  getPrimaryCarImageUrl,
  handleCarImageError,
} from "../utils/carImages.js";

function CarTable({
  cars,
  emptyMessage = "등록된 자동차가 없습니다.",
  emptyDescription = "등록 버튼을 눌러 첫 자동차를 추가해보세요.",
  canManageCar = () => false,
  onView,
  onEdit,
  onDelete,
}) {
  if (cars.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
        <p className="font-semibold text-gray-500">{emptyMessage}</p>
        <p className="mt-2 text-sm text-gray-400">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              사진
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              이름
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              제조사
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              연식
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              가격
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              주행거리
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              지역
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
              관리
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {cars.map((car) => (
            <tr key={car._id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <img
                  alt={`${car.name} 차량 사진`}
                  className="h-14 w-20 rounded-md object-cover"
                  src={getPrimaryCarImageUrl(car)}
                  onError={handleCarImageError}
                />
              </td>
              <td className="px-4 py-3 font-semibold text-gray-900">
                {car.name}
              </td>
              <td className="px-4 py-3">
                <span className="c-badge-blue">{car.company}</span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">{car.year}</td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                {Number(car.price).toLocaleString()}만원
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                {car.mileage !== undefined
                  ? `${Number(car.mileage).toLocaleString()}km`
                  : "-"}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                {car.location || "-"}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    className="c-btn-outline px-2.5 py-1 text-xs"
                    onClick={() => onView(car)}
                  >
                    상세
                  </button>
                  {canManageCar(car) && (
                    <>
                      <button
                        className="c-btn-warning px-2.5 py-1 text-xs"
                        onClick={() => onEdit(car)}
                      >
                        수정
                      </button>
                      <button
                        className="c-btn-danger px-2.5 py-1 text-xs"
                        onClick={() => onDelete(car)}
                      >
                        삭제
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CarTable;

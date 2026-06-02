function CarTable({ cars, onView, onEdit, onDelete }) {
  if (cars.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-base-300 bg-base-100 p-8 text-center">
        <p className="font-semibold">등록된 자동차가 없습니다.</p>
        <p className="mt-2 text-sm text-base-content/60">등록 버튼을 눌러 첫 자동차를 추가해보세요.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra">
        <thead>
          <tr>
            <th>ID</th>
            <th>이름</th>
            <th>제조사</th>
            <th>연식</th>
            <th>가격</th>
            <th className="text-right">관리</th>
          </tr>
        </thead>
        <tbody>
          {cars.map((car) => (
            <tr key={car._id}>
              <td>{car._id}</td>
              <td className="font-semibold">{car.name}</td>
              <td>
                <span className="badge badge-info badge-outline">{car.company}</span>
              </td>
              <td>{car.year}</td>
              <td>{Number(car.price).toLocaleString()}만원</td>
              <td>
                <div className="flex flex-wrap justify-end gap-2">
                  <button className="btn btn-xs btn-outline" onClick={() => onView(car)}>
                    상세
                  </button>
                  <button className="btn btn-xs btn-warning" onClick={() => onEdit(car)}>
                    수정
                  </button>
                  <button className="btn btn-xs btn-error" onClick={() => onDelete(car)}>
                    삭제
                  </button>
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

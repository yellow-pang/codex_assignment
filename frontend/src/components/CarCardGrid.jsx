import EmptyState from "./EmptyState.jsx";
import {
  getPrimaryCarImageUrl,
  handleCarImageError,
} from "../utils/carImages.js";

function CarCardGrid({
  cars,
  emptyMessage = "등록된 자동차가 없습니다.",
  emptyDescription = "등록 버튼을 눌러 첫 자동차를 추가해보세요.",
  canManageCar = () => false,
  onView,
  onEdit,
  onDelete,
  onStartChat,
  pendingAction = "",
}) {
  if (cars.length === 0) {
    return (
      <EmptyState title={emptyMessage} description={emptyDescription} />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {cars.map((car) => {
        const isStartingChat = pendingAction === `start-chat:${car._id}`;

        return (
          <article
            key={car._id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-[#d6dee8] bg-white shadow-sm shadow-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#1c4e6d]/15"
          >
            {/* 차량 이미지 */}
            <div className="relative overflow-hidden bg-slate-100">
              <img
                alt={`${car.name} 차량 사진`}
                className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                src={getPrimaryCarImageUrl(car)}
                onError={handleCarImageError}
              />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/45 to-transparent" />
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-[#1c4e6d] shadow-sm backdrop-blur">
                {car.company}
              </span>
              <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-[#2fae9b] shadow-sm backdrop-blur">
                딜러 상담
              </span>
            </div>

          {/* 차량 정보 */}
          <div className="flex flex-1 flex-col p-4">
            <h3 className="line-clamp-1 text-base font-black text-slate-950">
              {car.name}
            </h3>
            <p className="mt-1 text-2xl font-black tracking-tight text-[#d98a3a]">
              {Number(car.price).toLocaleString()}만원
            </p>

            {/* 기본 스펙 */}
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-500">
              <SpecPill label="연식" value={`${car.year}년`} />
              {car.mileage !== undefined && (
                <SpecPill
                  label="주행"
                  value={`${Number(car.mileage).toLocaleString()}km`}
                />
              )}
              {car.location && <SpecPill label="지역" value={car.location} />}
            </div>

            {/* 배지 */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {car.fuel && <span className="c-badge-gray">{car.fuel}</span>}
              {car.type && <span className="c-badge-gray">{car.type}</span>}
            </div>

            {/* 액션 버튼 */}
            <div className="mt-auto flex gap-2 pt-4">
              <button
                className="c-btn-outline flex-1 px-3 py-2 text-xs"
                onClick={() => onView(car)}
              >
                상세 보기
              </button>
              {onStartChat && (
                <button
                  className="c-btn-primary flex-1 px-3 py-2 text-xs"
                  disabled={Boolean(pendingAction)}
                  onClick={() => onStartChat(car)}
                >
                  {isStartingChat ? "준비 중..." : "상담하기"}
                </button>
              )}
              {canManageCar(car) && (
                <>
                  <button
                    className="c-btn-outline px-3 py-2 text-xs"
                    disabled={Boolean(pendingAction)}
                    onClick={() => onEdit(car)}
                  >
                    수정
                  </button>
                  <button
                    className="c-btn-danger px-3 py-1.5 text-xs"
                    disabled={Boolean(pendingAction)}
                    onClick={() => onDelete(car)}
                  >
                    삭제
                  </button>
                </>
              )}
            </div>
          </div>
          </article>
        );
      })}
    </div>
  );
}

function SpecPill({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-2.5 py-2 ring-1 ring-slate-100">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 truncate font-bold text-slate-700">{value}</p>
    </div>
  );
}

export default CarCardGrid;

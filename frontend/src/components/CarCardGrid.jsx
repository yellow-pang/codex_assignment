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
    return <EmptyState title={emptyMessage} description={emptyDescription} />;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {cars.map((car) => {
        const isStartingChat = pendingAction === `start-chat:${car._id}`;

        return (
          <article
            key={car._id}
            className="group flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-[#d6dee8] bg-white shadow-[0_10px_24px_rgba(11,19,32,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_42px_rgba(11,19,32,0.14)]"
          >
            <div className="relative overflow-hidden bg-slate-100">
              <img
                alt={`${car.name} 차량 사진`}
                className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                src={getPrimaryCarImageUrl(car)}
                onError={handleCarImageError}
              />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0e1420]/70 to-transparent" />
              <span className="absolute left-3 top-3 rounded-full bg-[#0e1420]/75 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/25 backdrop-blur">
                {car.company}
              </span>
              <span className="absolute right-3 top-3 rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-bold text-[#3f6ea6] shadow-sm">
                딜러 상담
              </span>
              <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-[#0e1420] shadow">
                {Number(car.price).toLocaleString()}만원
              </div>
            </div>

            <div className="flex flex-1 flex-col p-4">
              <h3 className="line-clamp-1 text-lg font-black tracking-tight text-[#0e1420]">
                {car.name}
              </h3>
              <p className="mt-1 text-sm font-semibold text-[#607084]">
                프리미엄 인증 딜러 매물
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-500">
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
    <div className="rounded-xl bg-[#f7fafb] px-2.5 py-2 ring-1 ring-[#e7eef5]">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#718196]">
        {label}
      </p>
      <p className="mt-0.5 truncate font-bold text-[#263547]">{value}</p>
    </div>
  );
}

export default CarCardGrid;

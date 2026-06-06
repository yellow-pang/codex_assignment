import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authenticatedFetch } from "../api/authenticatedFetch.js";

function ChatRoomList({ onGoList, userProfile }) {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    if (!userProfile?.uid) return;

    async function loadRooms() {
      setIsLoading(true);
      setError("");

      try {
        const res = await authenticatedFetch("/api/chats/rooms");
        if (!res.ok) throw new Error("상담방 목록을 불러오지 못했습니다.");
        const data = await res.json();
        setRooms(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadRooms();
  }, [userProfile?.uid]);

  if (!userProfile) {
    return (
      <div className="c-alert-info">
        <span>로그인 후 상담 내역을 확인할 수 있습니다.</span>
      </div>
    );
  }

  const filteredRooms = rooms.filter((room) => {
    const value = keyword.trim().toLowerCase();
    if (!value) return true;

    return [room.carName, room.buyerName, room.dealerName, room.lastMessage]
      .filter(Boolean)
      .some((item) => String(item).toLowerCase().includes(value));
  });

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-sky-50 to-blue-100 p-5 shadow-xl shadow-blue-100/50 sm:p-7">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
              Real-time Consultation
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              내 상담 목록
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              관심 차량 상담을 이어서 확인하고, 딜러 온라인 상태와 최근
              메시지를 빠르게 살펴보세요.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-64">
            <SummaryPill label="전체 상담" value={rooms.length} />
            <SummaryPill
              label="최근 대화"
              value={rooms.filter((room) => room.lastMessage).length}
            />
          </div>
        </div>
      </section>

      {error && (
        <div className="c-alert-error">
          <span>{error}</span>
        </div>
      )}

      <div className="c-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">상담방</h2>
            <p className="mt-1 text-sm text-slate-500">
              차량명, 상대방 이름, 메시지로 상담방을 찾을 수 있습니다.
            </p>
          </div>
          <div className="w-full sm:max-w-xs">
            <input
              className="c-input"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="상담방 검색"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-40 items-center justify-center">
          <svg
            className="h-8 w-8 animate-spin text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white/80 px-5 py-16 text-center">
          <p className="font-semibold text-slate-600">
            {rooms.length === 0
              ? "상담 내역이 없습니다."
              : "검색 조건에 맞는 상담방이 없습니다."}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            차량 상세 화면에서 딜러와 상담을 시작해보세요.
          </p>
          <button className="mt-5 c-btn-primary" onClick={onGoList}>
            차량 보러 가기
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredRooms.map((room) => (
            <RoomItem key={room.roomId} room={room} userProfile={userProfile} />
          ))}
        </div>
      )}
    </div>
  );
}

function RoomItem({ room, userProfile }) {
  const isDealer = userProfile?.role === "dealer";
  const otherPartyName = isDealer ? room.buyerName : room.dealerName;
  const defaultCarImageUrl = "/uploads/default-car.png";
  const lastMessage = room.lastMessage || "아직 주고받은 메시지가 없습니다.";
  const hasLastMessage = Boolean(room.lastMessage);
  const isDealerOnline = Boolean(room.dealerOnline);

  function formatTime(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  }

  return (
    <Link
      to={`/chats/${encodeURIComponent(room.roomId)}`}
      className="group flex gap-3 rounded-3xl border border-slate-200/80 bg-white p-3 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-100/60 sm:items-center sm:gap-4 sm:p-4"
    >
      <div className="h-20 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 sm:h-24 sm:w-32">
        <img
          alt={room.carName}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          src={room.imageUrl || defaultCarImageUrl}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-black text-slate-950">{room.carName}</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {isDealer ? "구매자" : "담당 딜러"} · {otherPartyName || "이름 없음"}
            </p>
          </div>
          <span className="flex-shrink-0 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-400">
            {formatTime(room.lastMessageAt || room.updatedAt)}
          </span>
        </div>
        <p
          className={`mt-3 line-clamp-2 text-sm ${
            hasLastMessage ? "text-slate-600" : "text-slate-400"
          }`}
        >
          {lastMessage}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="c-badge-blue">{isDealer ? "딜러 상담" : "차량 상담"}</span>
          {!isDealer && (
            <span className={isDealerOnline ? "c-badge-green" : "c-badge-gray"}>
              <span
                className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                  isDealerOnline ? "bg-emerald-500" : "bg-slate-400"
                }`}
              />
              {isDealerOnline ? "딜러 온라인" : "딜러 오프라인"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function SummaryPill({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3 shadow-sm backdrop-blur">
      <p className="text-xl font-black text-slate-950">{value}</p>
      <p className="mt-0.5 text-xs font-semibold text-slate-500">{label}</p>
    </div>
  );
}

export default ChatRoomList;

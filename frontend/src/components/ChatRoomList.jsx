import { useEffect, useState } from "react";

function ChatRoomList({ userProfile }) {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userProfile?.uid) return;

    async function loadRooms() {
      setIsLoading(true);
      setError("");

      try {
        const res = await fetch(
          `/api/chats/rooms?uid=${encodeURIComponent(userProfile.uid)}`,
        );
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

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">내 상담 목록</h1>

      {error && (
        <div className="c-alert-error">
          <span>{error}</span>
        </div>
      )}

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
      ) : rooms.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="font-semibold text-gray-500">상담 내역이 없습니다.</p>
          <p className="mt-1 text-sm text-gray-400">
            차량 상세 화면에서 딜러와 상담을 시작해보세요.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {rooms.map((room) => (
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
    <a
      href={`/chats/${encodeURIComponent(room.roomId)}`}
      className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-gray-50"
    >
      {/* 차량 썸네일 */}
      <div className="h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
        <img
          alt={room.carName}
          className="h-full w-full object-cover"
          src={room.imageUrl || defaultCarImageUrl}
        />
      </div>

      {/* 상담 정보 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-semibold text-gray-900">{room.carName}</p>
          <span className="flex-shrink-0 text-xs text-gray-400">
            {formatTime(room.updatedAt)}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-gray-500">{otherPartyName}</p>
      </div>
    </a>
  );
}

export default ChatRoomList;

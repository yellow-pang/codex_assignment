import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

function ChatRoom({ roomId, chatRoom, userProfile, onBack }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentRoom, setCurrentRoom] = useState(chatRoom || null);
  const [socketError, setSocketError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [dealerPresence, setDealerPresence] = useState({
    status: "checking",
    lastSeenAt: null,
  });
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    setCurrentRoom(chatRoom || null);
  }, [chatRoom]);

  useEffect(() => {
    if (!roomId) return;

    async function loadRoomAndMessages() {
      setIsLoading(true);

      try {
        const [roomRes, messagesRes] = await Promise.all([
          fetch(`/api/chats/rooms/${encodeURIComponent(roomId)}`),
          fetch(`/api/chats/rooms/${encodeURIComponent(roomId)}/messages`),
        ]);

        if (!roomRes.ok) throw new Error("상담방 정보를 불러오지 못했습니다.");
        if (!messagesRes.ok) throw new Error("메시지를 불러오지 못했습니다.");

        const roomData = await roomRes.json();
        const messageData = await messagesRes.json();
        setCurrentRoom((prevRoom) => ({ ...prevRoom, ...roomData }));
        setMessages(messageData);
        setDealerPresence({
          status: roomData.dealerOnline ? "online" : "offline",
          lastSeenAt: roomData.dealerLastSeenAt || null,
        });
      } catch (err) {
        setSocketError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadRoomAndMessages();
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !userProfile?.uid) return undefined;

    const socketUrl = import.meta.env.VITE_API_BASE_URL || undefined;
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      setSocketError("");
      socket.emit("join-room", {
        roomId,
        userId: userProfile.uid,
        userName: userProfile.displayName,
        role: userProfile.role,
      });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("receive-message", (message) => {
      setMessages((prevMessages) => {
        if (message._id && prevMessages.some((item) => item._id === message._id)) {
          return prevMessages;
        }

        return [...prevMessages, message];
      });
    });

    socket.on("dealer-online", () => {
      setDealerPresence({ status: "online", lastSeenAt: null });
    });

    socket.on("dealer-offline", (presence) => {
      setDealerPresence({
        status: "offline",
        lastSeenAt: presence?.lastSeenAt || null,
      });
    });

    socket.on("chat-error", (error) => {
      setSocketError(error?.message || "실시간 상담 처리 중 오류가 발생했습니다.");
    });

    return () => {
      socket.emit("leave-room", { roomId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    roomId,
    userProfile?.displayName,
    userProfile?.role,
    userProfile?.uid,
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(event) {
    event.preventDefault();
    const text = inputText.trim();

    if (!text) return;

    if (!socketRef.current || !isConnected) {
      setSocketError("실시간 상담 서버에 연결 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    socketRef.current.emit("send-message", {
      roomId,
      senderId: userProfile.uid,
      senderName: userProfile.displayName || "사용자",
      text,
    });
    setInputText("");
  }

  function formatTime(dateString) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const myUid = userProfile?.uid;
  const carName = currentRoom?.carName || "차량 상담";
  const dealerName = currentRoom?.dealerName || "딜러";
  const buyerName = currentRoom?.buyerName || "구매자";
  const carImageUrl = currentRoom?.imageUrl || "/uploads/default-car.png";
  const isDealer = userProfile?.role === "dealer";
  const presenceLabel =
    dealerPresence.status === "online"
      ? "온라인"
      : dealerPresence.status === "offline"
        ? "오프라인"
        : "상태 확인 중";
  const presenceDotClass =
    dealerPresence.status === "online" ? "bg-emerald-500" : "bg-gray-300";

  return (
    <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
      <aside className="hidden rounded-3xl border border-blue-100 bg-white/90 p-4 shadow-xl shadow-blue-100/50 lg:block">
        <div className="overflow-hidden rounded-2xl bg-slate-100">
          <img
            alt={`${carName} 차량 이미지`}
            className="h-44 w-full object-cover"
            src={carImageUrl}
          />
        </div>
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
            Consultation
          </p>
          <h1 className="mt-2 text-xl font-black leading-tight text-slate-950">
            {carName}
          </h1>
          <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4">
            <InfoRow label="담당 딜러" value={dealerName} />
            <InfoRow label="구매자" value={buyerName} />
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-500">상태</span>
              <span
                className={
                  dealerPresence.status === "online"
                    ? "c-badge-green"
                    : "c-badge-gray"
                }
              >
                <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${presenceDotClass}`} />
                {presenceLabel}
              </span>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            차량 정보와 상담 내용을 함께 보며 딜러와 실시간으로 대화할 수
            있습니다.
          </p>
        </div>
      </aside>

      <section className="flex h-[calc(100vh-12rem)] min-h-[34rem] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/70 md:h-[calc(100vh-9rem)]">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur">
          <button
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm hover:bg-blue-50 hover:text-blue-700"
            onClick={onBack}
            aria-label="뒤로 가기"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="h-12 w-14 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 lg:hidden">
            <img
              alt={`${carName} 차량 이미지`}
              className="h-full w-full object-cover"
              src={carImageUrl}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-black text-slate-950">{carName}</p>
            <p className="truncate text-xs text-slate-500">
              {isDealer ? `구매자: ${buyerName}` : `담당 딜러: ${dealerName}`}
            </p>
          </div>
          <span
            className={
              dealerPresence.status === "online" ? "c-badge-green" : "c-badge-gray"
            }
          >
            <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${presenceDotClass}`} />
            {presenceLabel}
          </span>
        </div>

        {socketError ? (
          <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
            {socketError}
          </div>
        ) : (
          <div className="border-b border-blue-100 bg-blue-50/80 px-4 py-2 text-xs font-semibold text-blue-700">
            {isConnected
              ? "실시간 상담 서버에 연결되었습니다."
              : "실시간 상담 서버에 연결 중입니다."}
          </div>
        )}

        <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,_#eff6ff,_transparent_26rem),#f8fafc] px-3 py-4 sm:px-5">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
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
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <p className="font-black text-slate-700">대화를 시작해보세요</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  메시지를 보내면 상대방에게 실시간으로 전달됩니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, index) => {
                const isMine = msg.senderId === myUid;
                return (
                  <div
                    key={msg._id || index}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-3xl px-4 py-3 text-sm shadow-sm sm:max-w-[68%] ${
                        isMine
                          ? "rounded-br-md bg-blue-600 text-white shadow-blue-200"
                          : "rounded-bl-md bg-slate-100 text-slate-900 shadow-slate-200"
                      }`}
                    >
                      {!isMine && (
                        <p className="mb-1 text-xs font-bold text-slate-500">
                          {msg.senderName || "상대방"}
                        </p>
                      )}
                      <p className="leading-6">{msg.text}</p>
                      <p
                        className={`mt-1 text-right text-xs ${
                          isMine ? "text-blue-100" : "text-slate-400"
                        }`}
                      >
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 bg-white px-3 py-3 sm:px-4">
          <form className="flex items-center gap-2 sm:gap-3" onSubmit={handleSend}>
            <input
              className="c-input flex-1"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="메시지를 입력하세요"
              maxLength={1000}
            />
            <button
              className="c-btn-primary px-4 py-2.5"
              type="submit"
              disabled={!inputText.trim() || !isConnected}
            >
              전송
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="truncate font-bold text-slate-800">{value || "-"}</span>
    </div>
  );
}

export default ChatRoom;

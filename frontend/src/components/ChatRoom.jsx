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
  const presenceLabel =
    dealerPresence.status === "online"
      ? "온라인"
      : dealerPresence.status === "offline"
        ? "오프라인"
        : "상태 확인 중";
  const presenceDotClass =
    dealerPresence.status === "online" ? "bg-emerald-500" : "bg-gray-300";

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* 상단 헤더 */}
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
        <button
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
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
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gray-900">{carName}</p>
          <p className="text-xs text-gray-500">
            담당 딜러: {dealerName}
            <span
              className={`ml-2 inline-flex h-2 w-2 rounded-full ${presenceDotClass}`}
            />
            <span className="ml-1 text-gray-500">{presenceLabel}</span>
          </p>
        </div>
      </div>

      {socketError && (
        <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
          {socketError}
        </div>
      )}

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
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
            <p className="font-semibold text-gray-500">대화를 시작해보세요</p>
            <p className="mt-1 text-sm text-gray-400">
              메시지를 보내면 상대방에게 실시간으로 전달됩니다.
            </p>
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
                    className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                      isMine
                        ? "rounded-br-sm bg-blue-600 text-white"
                        : "rounded-bl-sm bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p>{msg.text}</p>
                    <p
                      className={`mt-1 text-right text-xs ${isMine ? "text-blue-200" : "text-gray-400"}`}
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

      {/* 메시지 입력창 */}
      <div className="border-t border-gray-200 px-4 py-3">
        <form className="flex items-center gap-3" onSubmit={handleSend}>
          <input
            className="c-input flex-1"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="메시지를 입력하세요"
            maxLength={1000}
          />
          <button
            className="c-btn-primary px-4 py-2"
            type="submit"
            disabled={!inputText.trim() || !isConnected}
          >
            전송
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatRoom;

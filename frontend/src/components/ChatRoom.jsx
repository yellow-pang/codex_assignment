import { useEffect, useRef, useState } from "react";

function ChatRoom({ roomId, chatRoom, userProfile, onBack }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;

    async function loadMessages() {
      setIsLoading(true);

      try {
        const res = await fetch(
          `/api/chats/rooms/${encodeURIComponent(roomId)}/messages`,
        );
        if (!res.ok) throw new Error("메시지를 불러오지 못했습니다.");
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadMessages();
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(event) {
    event.preventDefault();
    if (!inputText.trim()) return;
    // Socket.io 연결은 8단계에서 구현합니다.
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
  const carName = chatRoom?.carName || "차량 상담";
  const dealerName = chatRoom?.dealerName || "딜러";

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
            <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-gray-300" />
            <span className="ml-1 text-gray-400">
              Socket.io 연결 전 (8단계)
            </span>
          </p>
        </div>
      </div>

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
              실시간 메시지는 8단계 Socket.io 연결 후 동작합니다.
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
            placeholder="메시지를 입력하세요 (Socket.io 연결 후 전송 가능)"
          />
          <button
            className="c-btn-primary px-4 py-2"
            type="submit"
            disabled={!inputText.trim()}
          >
            전송
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatRoom;

import { useEffect, useRef, useState } from "react";
import { authenticatedFetch } from "../api/authenticatedFetch.js";

function SiteChatbotWidget({ isHidden = false, onGoLogin, userProfile }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !userProfile?.uid) return;

    loadMessages();
  }, [isOpen, userProfile?.uid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  async function loadMessages() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await authenticatedFetch("/api/chats/site-bot/messages");

      if (!response.ok) {
        throw new Error("AI 상담 내역을 불러오지 못했습니다.");
      }

      setMessages(await response.json());
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const text = inputText.trim();

    if (!text || isSending) return;

    if (text.length > 1000) {
      setErrorMessage("메시지는 1000자 이하로 입력해주세요.");
      return;
    }

    setIsSending(true);
    setErrorMessage("");

    try {
      const response = await authenticatedFetch("/api/chats/site-bot/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "AI 상담 요청을 처리하지 못했습니다.");
      }

      const data = await response.json();
      setMessages((prevMessages) => [
        ...prevMessages,
        data.userMessage,
        data.agentMessage,
      ]);
      setInputText("");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSending(false);
    }
  }

  function formatTime(dateString) {
    if (!dateString) return "";

    return new Date(dateString).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (isHidden) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-40 sm:bottom-6 sm:right-6">
      {isOpen && (
        <section className="mb-3 flex h-[34rem] max-h-[calc(100vh-7rem)] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-3xl border border-[#b9e8df] bg-white shadow-2xl shadow-slate-900/20">
          <div className="flex items-start justify-between gap-3 bg-[linear-gradient(135deg,_#123f3a,_#2fae9b)] px-4 py-4 text-white">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/75">
                AI Assistant
              </p>
              <h2 className="mt-1 text-lg font-black">AI 차량 상담원</h2>
              <p className="mt-1 text-xs leading-5 text-white/80">
                사용법, 차량 추천, 상담 연결을 도와드립니다.
              </p>
            </div>
            <button
              className="rounded-full bg-white/14 px-3 py-1.5 text-sm font-black text-white transition hover:bg-white/24"
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="AI 챗봇 닫기"
            >
              닫기
            </button>
          </div>

          {!userProfile ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="rounded-3xl bg-[#e8fbf7] px-5 py-4 text-[#123f3a]">
                <p className="font-black">로그인이 필요합니다</p>
                <p className="mt-2 text-sm leading-6">
                  AI 상담은 사용량 제한과 상담 기록 관리를 위해 로그인 후 이용할
                  수 있습니다.
                </p>
              </div>
              <button
                className="c-btn-primary mt-5 px-5 py-2.5"
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onGoLogin?.();
                }}
              >
                로그인하러 가기
              </button>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs font-bold text-red-600">
                  {errorMessage}
                </div>
              )}

              <div className="flex-1 overflow-y-auto bg-[#f6f8fb] px-4 py-4">
                {isLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <svg
                      className="h-8 w-8 animate-spin text-[#2fae9b]"
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
                  <div className="space-y-3">
                    <GuideBubble text="안녕하세요. 차량 추천, 검색 방법, 딜러 상담 연결을 도와드릴게요." />
                    <GuideBubble text="예: 3000만원 이하 SUV 추천해줘 / 상담은 어떻게 시작해?" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message, index) => {
                      const isAgent =
                        message.isAgentMessage || message.senderType === "agent";

                      return (
                        <div
                          key={message._id || index}
                          className={`flex ${isAgent ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`min-w-0 max-w-[86%] overflow-hidden rounded-3xl px-4 py-3 text-sm shadow-sm ${
                              isAgent
                                ? "rounded-bl-md border border-[#8dd7ca] bg-[#e8fbf7] text-[#123f3a]"
                                : "rounded-br-md bg-[#1c4e6d] text-white"
                            }`}
                          >
                            {isAgent && (
                              <p className="mb-1 inline-flex rounded-full bg-[#2fae9b] px-2 py-0.5 text-[10px] font-black text-white">
                                AI 상담원
                              </p>
                            )}
                            <ChatbotText text={message.text} />
                            <p
                              className={`mt-1 text-right text-xs ${
                                isAgent ? "text-[#3e8e83]" : "text-blue-100"
                              }`}
                            >
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <form
                className="border-t border-slate-100 bg-white p-3"
                onSubmit={handleSubmit}
              >
                <div className="flex gap-2">
                  <input
                    className="c-input flex-1"
                    value={inputText}
                    onChange={(event) => setInputText(event.target.value)}
                    placeholder="AI 상담원에게 질문하세요"
                    maxLength={1000}
                  />
                  <button
                    className="rounded-xl bg-[#2fae9b] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#238f80] disabled:cursor-not-allowed disabled:opacity-60"
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                  >
                    {isSending ? "전송 중" : "전송"}
                  </button>
                </div>
                <p className="mt-2 text-[11px] leading-4 text-slate-400">
                  AI 답변은 참고용입니다. 계약, 결제, 보증 판단은 담당자에게
                  확인해주세요.
                </p>
              </form>
            </>
          )}
        </section>
      )}

      <button
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2fae9b] text-sm font-black text-white shadow-2xl shadow-[#2fae9b]/35 transition hover:-translate-y-0.5 hover:bg-[#238f80] focus:outline-none focus:ring-4 focus:ring-[#8dd7ca]/60"
        type="button"
        onClick={() => setIsOpen((prevValue) => !prevValue)}
        aria-label={isOpen ? "AI 챗봇 닫기" : "AI 챗봇 열기"}
      >
        AI
      </button>
    </div>
  );
}

function GuideBubble({ text }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-3xl rounded-bl-md border border-[#8dd7ca] bg-[#e8fbf7] px-4 py-3 text-sm leading-6 text-[#123f3a] shadow-sm">
      <p className="mb-1 inline-flex rounded-full bg-[#2fae9b] px-2 py-0.5 text-[10px] font-black text-white">
        AI 상담원
      </p>
      <ChatbotText text={text} />
    </div>
  );
}

function ChatbotText({ text }) {
  return (
    <p className="whitespace-pre-wrap break-words leading-6 [overflow-wrap:anywhere]">
      {renderInlineMarkdown(text)}
    </p>
  );
}

function renderInlineMarkdown(text) {
  const parts = String(text || "").split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={`${part}-${index}`} className="font-black">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return part;
  });
}

export default SiteChatbotWidget;

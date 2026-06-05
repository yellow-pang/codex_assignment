import { useEffect, useMemo, useState } from "react";

function AdminUserPanel({ currentUserProfile, onBack, onProfileChanged }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("users");

  const summary = useMemo(
    () => ({
      total: users.length,
      pending: users.filter((user) => user.dealerStatus === "pending").length,
      dealers: users.filter(
        (user) => user.role === "dealer" && user.dealerStatus === "approved",
      ).length,
      admins: users.filter((user) => user.role === "admin").length,
    }),
    [users],
  );

  useEffect(() => {
    loadUsers();
  }, []);

  async function requestAdminApi(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
      let errorMessage = "요청을 처리하지 못했습니다.";

      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (error) {
        // JSON 오류 응답이 아닌 경우 기본 메시지를 사용합니다.
      }

      throw new Error(errorMessage);
    }

    return response.json();
  }

  async function loadUsers(successMessage = "") {
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const requesterUid = encodeURIComponent(currentUserProfile.uid);
      const data = await requestAdminApi(
        `/api/users?requesterUid=${requesterUid}`,
      );
      setUsers(data);

      if (successMessage) {
        setMessage({ type: "success", text: successMessage });
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  async function updateUserRole(user, role, dealerStatus) {
    try {
      await requestAdminApi(`/api/users/${encodeURIComponent(user.uid)}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterUid: currentUserProfile.uid,
          role,
          dealerStatus,
        }),
      });

      await onProfileChanged();
      await loadUsers("사용자 권한을 변경했습니다.");
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  }

  return (
    <div className="space-y-5">
      {/* 페이지 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">관리자 화면</h1>
          <p className="mt-1 text-sm text-gray-500">
            사용자 역할과 딜러 승인 상태를 관리합니다.
          </p>
        </div>
        <button className="c-btn-outline" onClick={onBack}>
          목록으로
        </button>
      </div>

      {/* 상태 메시지 */}
      {message.text && (
        <div
          className={
            message.type === "error" ? "c-alert-error" : "c-alert-success"
          }
        >
          <span>{message.text}</span>
        </div>
      )}

      {/* 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-4">
        <SummaryCard label="전체 사용자" value={summary.total} color="blue" />
        <SummaryCard label="승인 대기" value={summary.pending} color="yellow" />
        <SummaryCard label="딜러" value={summary.dealers} color="green" />
        <SummaryCard label="관리자" value={summary.admins} color="gray" />
      </div>

      {/* 탭 */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <TabButton
            label="사용자 관리"
            isActive={activeTab === "users"}
            onClick={() => setActiveTab("users")}
          />
          <TabButton
            label="차량 관리"
            isActive={activeTab === "cars"}
            onClick={() => setActiveTab("cars")}
            disabled
          />
          <TabButton
            label="상담 현황"
            isActive={activeTab === "chats"}
            onClick={() => setActiveTab("chats")}
            disabled
          />
        </nav>
      </div>

      {/* 사용자 관리 테이블 */}
      {activeTab === "users" && (
        <>
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
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    {["이메일", "이름", "역할", "딜러 상태", "관리"].map(
                      (h, i) => (
                        <th
                          key={h}
                          className={`px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500 ${i === 4 ? "text-right" : "text-left"}`}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => {
                    const isSelf = user.uid === currentUserProfile.uid;
                    const isApprovedDealer =
                      user.role === "dealer" &&
                      user.dealerStatus === "approved";

                    return (
                      <tr key={user.uid} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {user.email}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {user.displayName}
                        </td>
                        <td className="px-4 py-3">
                          <span className="c-badge-blue">{user.role}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatDealerStatus(user.dealerStatus)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap justify-end gap-2">
                            {user.dealerStatus === "pending" && (
                              <>
                                <button
                                  className="c-btn-primary px-2.5 py-1 text-xs"
                                  onClick={() =>
                                    updateUserRole(user, "dealer", "approved")
                                  }
                                >
                                  승인
                                </button>
                                <button
                                  className="c-btn-outline px-2.5 py-1 text-xs"
                                  onClick={() =>
                                    updateUserRole(user, "buyer", "rejected")
                                  }
                                >
                                  거절
                                </button>
                              </>
                            )}
                            {isApprovedDealer && (
                              <button
                                className="c-btn-warning px-2.5 py-1 text-xs"
                                onClick={() =>
                                  updateUserRole(user, "buyer", "none")
                                }
                              >
                                딜러 회수
                              </button>
                            )}
                            {user.role === "buyer" &&
                              user.dealerStatus !== "pending" && (
                                <button
                                  className="c-btn-outline px-2.5 py-1 text-xs"
                                  onClick={() =>
                                    updateUserRole(user, "dealer", "approved")
                                  }
                                >
                                  딜러 지정
                                </button>
                              )}
                            {user.role !== "admin" && (
                              <button
                                className="c-btn-outline px-2.5 py-1 text-xs"
                                onClick={() =>
                                  updateUserRole(user, "admin", "none")
                                }
                              >
                                admin 지정
                              </button>
                            )}
                            {user.role === "admin" && !isSelf && (
                              <button
                                className="c-btn-danger px-2.5 py-1 text-xs"
                                onClick={() =>
                                  updateUserRole(user, "buyer", "none")
                                }
                              >
                                admin 해제
                              </button>
                            )}
                            {isSelf && (
                              <span className="text-xs text-gray-400">
                                본인 권한 보호
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-700",
    yellow: "bg-yellow-50 text-yellow-700",
    green: "bg-green-50 text-green-700",
    gray: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="c-card p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p
        className={`mt-2 inline-flex h-10 w-10 items-center justify-center rounded-lg text-xl font-bold ${colorMap[color] || colorMap.gray}`}
      >
        {value}
      </p>
    </div>
  );
}

function TabButton({ label, isActive, onClick, disabled = false }) {
  return (
    <button
      className={`pb-3 text-sm font-medium transition-colors ${
        isActive
          ? "border-b-2 border-blue-600 text-blue-600"
          : "text-gray-500 hover:text-gray-700"
      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

function formatDealerStatus(status) {
  const labels = {
    approved: "승인",
    none: "신청 없음",
    pending: "승인 대기",
    rejected: "거절",
  };

  return labels[status] || "신청 없음";
}

export default AdminUserPanel;

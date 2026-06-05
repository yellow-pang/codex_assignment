import { useEffect, useMemo, useState } from "react";

function AdminUserPanel({ currentUserProfile, onBack, onProfileChanged }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

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
    <section className="card bg-base-100 shadow">
      <div className="card-body">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="card-title text-2xl">관리자 화면</h1>
            <p className="mt-1 text-sm text-base-content/60">
              사용자 역할과 딜러 승인 상태를 관리합니다.
            </p>
          </div>
          <button className="btn btn-outline" onClick={onBack}>
            목록으로
          </button>
        </div>

        {message.text && (
          <div className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}>
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-4">
          <SummaryBox label="전체 사용자" value={summary.total} />
          <SummaryBox label="승인 대기" value={summary.pending} />
          <SummaryBox label="딜러" value={summary.dealers} />
          <SummaryBox label="관리자" value={summary.admins} />
        </div>

        <div className="tabs tabs-boxed mt-2">
          <button className="tab tab-active">사용자 관리</button>
          <button className="tab" disabled>
            차량 관리
          </button>
          <button className="tab" disabled>
            상담 현황
          </button>
        </div>

        {isLoading ? (
          <div className="flex min-h-40 items-center justify-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>이메일</th>
                  <th>이름</th>
                  <th>역할</th>
                  <th>딜러 상태</th>
                  <th className="text-right">관리</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelf = user.uid === currentUserProfile.uid;
                  const isApprovedDealer =
                    user.role === "dealer" &&
                    user.dealerStatus === "approved";

                  return (
                    <tr key={user.uid}>
                      <td>{user.email}</td>
                      <td>{user.displayName}</td>
                      <td>
                        <span className="badge badge-outline">{user.role}</span>
                      </td>
                      <td>{formatDealerStatus(user.dealerStatus)}</td>
                      <td>
                        <div className="flex flex-wrap justify-end gap-2">
                          {user.dealerStatus === "pending" && (
                            <>
                              <button
                                className="btn btn-xs btn-primary"
                                onClick={() =>
                                  updateUserRole(user, "dealer", "approved")
                                }
                              >
                                승인
                              </button>
                              <button
                                className="btn btn-xs btn-outline"
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
                              className="btn btn-xs btn-warning"
                              onClick={() =>
                                updateUserRole(user, "buyer", "none")
                              }
                            >
                              딜러 회수
                            </button>
                          )}
                          {user.role === "buyer" && user.dealerStatus !== "pending" && (
                            <button
                              className="btn btn-xs btn-outline"
                              onClick={() =>
                                updateUserRole(user, "dealer", "approved")
                              }
                            >
                              딜러 지정
                            </button>
                          )}
                          {user.role !== "admin" && (
                            <button
                              className="btn btn-xs btn-outline"
                              onClick={() =>
                                updateUserRole(user, "admin", "none")
                              }
                            >
                              admin 지정
                            </button>
                          )}
                          {user.role === "admin" && !isSelf && (
                            <button
                              className="btn btn-xs btn-error"
                              onClick={() =>
                                updateUserRole(user, "buyer", "none")
                              }
                            >
                              admin 해제
                            </button>
                          )}
                          {isSelf && (
                            <span className="text-xs text-base-content/50">
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
      </div>
    </section>
  );
}

function SummaryBox({ label, value }) {
  return (
    <div className="rounded-lg bg-base-200 p-4">
      <p className="text-sm text-base-content/60">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
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

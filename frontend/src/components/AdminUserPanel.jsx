import { useEffect, useMemo, useState } from "react";
import { authenticatedFetch } from "../api/authenticatedFetch.js";

function AdminUserPanel({
  currentUserProfile,
  formSettings,
  onBack,
  onFormSettingsChanged,
  onProfileChanged,
}) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("users");
  const [pendingUserUid, setPendingUserUid] = useState("");
  const [settingsForm, setSettingsForm] = useState({
    yearStep: 1,
    priceStep: 100,
    mileageStep: 1000,
    maxImageCount: 8,
  });
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);

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

  useEffect(() => {
    setSettingsForm({
      yearStep: formSettings?.yearStep || 1,
      priceStep: formSettings?.priceStep || 100,
      mileageStep: formSettings?.mileageStep || 1000,
      maxImageCount: formSettings?.maxImageCount || 8,
    });
  }, [formSettings]);

  async function requestAdminApi(url, options = {}) {
    const response = await authenticatedFetch(url, options);

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
      const data = await requestAdminApi("/api/users");
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
    if (pendingUserUid) return;

    setPendingUserUid(user.uid);
    try {
      await requestAdminApi(`/api/users/${encodeURIComponent(user.uid)}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          dealerStatus,
        }),
      });

      await onProfileChanged();
      await loadUsers("사용자 권한을 변경했습니다.");
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setPendingUserUid("");
    }
  }

  async function saveCarFormSettings(event) {
    event.preventDefault();

    if (isSettingsSaving) return;

    setIsSettingsSaving(true);
    try {
      const updatedSettings = await requestAdminApi("/api/settings/car-form", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      });

      onFormSettingsChanged?.(updatedSettings);
      setMessage({ type: "success", text: "차량 등록 설정을 저장했습니다." });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setIsSettingsSaving(false);
    }
  }

  function handleSettingsChange(event) {
    const { name, value } = event.target;
    setSettingsForm((prevSettings) => ({
      ...prevSettings,
      [name]: Number(value),
    }));
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[17rem_1fr]">
      <aside className="rounded-3xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-300/40">
        <button
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
          onClick={onBack}
        >
          <span aria-hidden="true">←</span>
          차량 검색으로
        </button>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
          Admin Console
        </p>
        <h1 className="mt-3 text-2xl font-black tracking-tight">
          관리자 대시보드
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          사용자 역할과 딜러 승인 상태를 관리하고, 이후 차량과 상담 현황
          확장을 이어갈 수 있는 업무 화면입니다.
        </p>

        <nav className="mt-7 space-y-2">
          <SideNavButton
            label="사용자 관리"
            isActive={activeTab === "users"}
            onClick={() => setActiveTab("users")}
          />
          <SideNavButton
            label="차량 관리"
            isActive={activeTab === "cars"}
            onClick={() => setActiveTab("cars")}
          />
          <SideNavButton
            label="차량 등록 설정"
            isActive={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
          />
          <SideNavButton
            label="상담 현황"
            isActive={activeTab === "chats"}
            onClick={() => setActiveTab("chats")}
          />
        </nav>

        <div className="mt-7 rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
          <p className="text-xs text-slate-400">현재 관리자</p>
          <p className="mt-1 truncate text-sm font-bold">
            {currentUserProfile.displayName}
          </p>
          <p className="mt-1 truncate text-xs text-slate-400">
            {currentUserProfile.email}
          </p>
        </div>
      </aside>

      <section className="space-y-5">
        {message.text && (
          <div
            className={
              message.type === "error" ? "c-alert-error" : "c-alert-success"
            }
          >
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="전체 사용자" value={summary.total} tone="blue" />
          <SummaryCard label="승인 대기" value={summary.pending} tone="amber" />
          <SummaryCard label="딜러" value={summary.dealers} tone="emerald" />
          <SummaryCard label="관리자" value={summary.admins} tone="slate" />
        </div>

        {activeTab === "users" && (
          <div className="c-card overflow-hidden">
            <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  사용자 관리
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  딜러 신청 승인, 역할 변경, 관리자 권한을 처리합니다.
                </p>
              </div>
              <span className="c-badge-blue">{users.length}명</span>
            </div>
            {renderUsersTable()}
          </div>
        )}

        {activeTab === "cars" && (
          <PreparedPanel
            title="차량 관리"
            description="전체 차량 관리 기능은 별도 관리자 API가 필요할 수 있어 이번 단계에서는 준비 중 영역으로 표시합니다."
            points={[
              "현재 차량 등록, 수정, 삭제는 승인된 딜러 본인 기준으로 제한됩니다.",
              "관리자 전체 차량 삭제나 강제 수정은 권한 정책 확정 후 별도 구현합니다.",
            ]}
          />
        )}

        {activeTab === "settings" && (
          <div className="c-card p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  차량 등록 설정
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  딜러가 차량을 등록할 때 사용하는 숫자 입력 단위와 사진
                  최대 개수를 관리합니다.
                </p>
              </div>
              <span className="c-badge-blue">Admin only</span>
            </div>

            <form className="mt-6 space-y-5" onSubmit={saveCarFormSettings}>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SettingsField
                  description="연식 입력의 증감 단위입니다."
                  label="연식 단위"
                >
                  <input
                    className="c-input"
                    name="yearStep"
                    type="number"
                    min="1"
                    max="10"
                    value={settingsForm.yearStep}
                    onChange={handleSettingsChange}
                  />
                </SettingsField>
                <SettingsField
                  description="가격은 만원 기준으로 저장됩니다."
                  label="가격 단위"
                >
                  <input
                    className="c-input"
                    name="priceStep"
                    type="number"
                    min="1"
                    max="10000"
                    value={settingsForm.priceStep}
                    onChange={handleSettingsChange}
                  />
                </SettingsField>
                <SettingsField
                  description="주행거리 km 입력의 증감 단위입니다."
                  label="주행거리 단위"
                >
                  <input
                    className="c-input"
                    name="mileageStep"
                    type="number"
                    min="1"
                    max="100000"
                    value={settingsForm.mileageStep}
                    onChange={handleSettingsChange}
                  />
                </SettingsField>
                <SettingsField
                  description="서버 제한보다 큰 값은 저장되지 않습니다."
                  label="최대 사진 개수"
                >
                  <input
                    className="c-input"
                    name="maxImageCount"
                    type="number"
                    min="1"
                    max="8"
                    value={settingsForm.maxImageCount}
                    onChange={handleSettingsChange}
                  />
                </SettingsField>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600 ring-1 ring-slate-100">
                현재 추천 기본값은 가격 100만원, 주행거리 1,000km, 연식 1년,
                사진 8장입니다. 설정은 새로 여는 차량 등록/수정 화면부터
                반영됩니다.
              </div>
              <div className="flex justify-end">
                <button
                  className="c-btn-primary"
                  type="submit"
                  disabled={isSettingsSaving}
                >
                  {isSettingsSaving ? "저장 중..." : "설정 저장"}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "chats" && (
          <PreparedPanel
            title="상담 현황"
            description="상담방 데이터는 이미 저장되고 있으나, 전체 상담 통계와 관리자 조회 범위는 추가 API 확정 후 연결합니다."
            points={[
              "사용자별 상담 목록과 실시간 채팅은 기존 화면에서 동작합니다.",
              "관리자 전체 상담 조회는 개인정보와 권한 범위를 정한 뒤 확장합니다.",
            ]}
          />
        )}
      </section>
    </div>
  );

  function renderUsersTable() {
    if (isLoading) {
      return (
        <div className="flex min-h-56 items-center justify-center">
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
      );
    }

    return (
      <>
        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full divide-y divide-slate-100 bg-white">
            <thead className="bg-slate-50">
              <tr>
                {["사용자", "역할", "딜러 상태", "가입일", "관리"].map(
                  (header, index) => (
                    <th
                      key={header}
                      className={`px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 ${
                        index === 4 ? "text-right" : "text-left"
                      }`}
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => renderUserRow(user))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-slate-100 lg:hidden">
          {users.map((user) => (
            <UserMobileCard
              key={user.uid}
              currentUserProfile={currentUserProfile}
              onUpdateRole={updateUserRole}
              pendingUserUid={pendingUserUid}
              user={user}
            />
          ))}
        </div>
      </>
    );
  }

  function renderUserRow(user) {
    const isSelf = user.uid === currentUserProfile.uid;

    return (
      <tr key={user.uid} className="hover:bg-blue-50/40">
        <td className="px-5 py-4">
          <div>
            <p className="font-bold text-slate-950">{user.displayName}</p>
            <p className="mt-1 text-xs text-slate-500">{user.email}</p>
          </div>
        </td>
        <td className="px-5 py-4">
          <RoleBadge role={user.role} />
        </td>
        <td className="px-5 py-4 text-sm font-semibold text-slate-600">
          {formatDealerStatus(user.dealerStatus)}
        </td>
        <td className="px-5 py-4 text-sm text-slate-500">
          {formatDate(user.createdAt)}
        </td>
        <td className="px-5 py-4">
          <UserActions
            isSelf={isSelf}
            onUpdateRole={updateUserRole}
            pendingUserUid={pendingUserUid}
            user={user}
          />
        </td>
      </tr>
    );
  }
}

function UserMobileCard({
  currentUserProfile,
  onUpdateRole,
  pendingUserUid = "",
  user,
}) {
  const isSelf = user.uid === currentUserProfile.uid;

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-black text-slate-950">{user.displayName}</p>
          <p className="mt-1 truncate text-xs text-slate-500">{user.email}</p>
        </div>
        <RoleBadge role={user.role} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
        <span className="rounded-full bg-slate-100 px-2.5 py-1">
          {formatDealerStatus(user.dealerStatus)}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1">
          {formatDate(user.createdAt)}
        </span>
      </div>
      <div className="mt-3">
        <UserActions
          isSelf={isSelf}
          onUpdateRole={onUpdateRole}
          pendingUserUid={pendingUserUid}
          user={user}
        />
      </div>
    </div>
  );
}

function UserActions({ isSelf, onUpdateRole, pendingUserUid = "", user }) {
  const isApprovedDealer =
    user.role === "dealer" && user.dealerStatus === "approved";
  const isPending = pendingUserUid === user.uid;
  const isDisabled = Boolean(pendingUserUid);

  if (isSelf) {
    return (
      <div className="flex justify-end">
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-400">
          본인 권한 보호
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {user.dealerStatus === "pending" && (
        <>
          <button
            className="c-btn-primary px-2.5 py-1.5 text-xs"
            disabled={isDisabled}
            onClick={() => onUpdateRole(user, "dealer", "approved")}
          >
            {isPending ? "처리 중..." : "승인"}
          </button>
          <button
            className="c-btn-outline px-2.5 py-1.5 text-xs"
            disabled={isDisabled}
            onClick={() => onUpdateRole(user, "buyer", "rejected")}
          >
            거절
          </button>
        </>
      )}
      {isApprovedDealer && (
        <button
          className="c-btn-warning px-2.5 py-1.5 text-xs"
          disabled={isDisabled}
          onClick={() => onUpdateRole(user, "buyer", "none")}
        >
          {isPending ? "처리 중..." : "딜러 회수"}
        </button>
      )}
      {user.role === "buyer" && user.dealerStatus !== "pending" && (
        <button
          className="c-btn-outline px-2.5 py-1.5 text-xs"
          disabled={isDisabled}
          onClick={() => onUpdateRole(user, "dealer", "approved")}
        >
          {isPending ? "처리 중..." : "딜러 지정"}
        </button>
      )}
      {user.role !== "admin" && (
        <button
          className="c-btn-outline px-2.5 py-1.5 text-xs"
          disabled={isDisabled}
          onClick={() => onUpdateRole(user, "admin", "none")}
        >
          {isPending ? "처리 중..." : "admin 지정"}
        </button>
      )}
      {user.role === "admin" && (
        <button
          className="c-btn-danger px-2.5 py-1.5 text-xs"
          disabled={isDisabled}
          onClick={() => onUpdateRole(user, "buyer", "none")}
        >
          {isPending ? "처리 중..." : "admin 해제"}
        </button>
      )}
    </div>
  );
}

function SideNavButton({ isActive, label, onClick }) {
  return (
    <button
      className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-bold transition-colors ${
        isActive
          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
          : "text-slate-300 hover:bg-white/10 hover:text-white"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function SummaryCard({ label, value, tone }) {
  const toneMap = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
  };

  return (
    <div className="c-card p-5">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p
        className={`mt-3 inline-flex h-12 min-w-12 items-center justify-center rounded-2xl px-3 text-2xl font-black ring-1 ${
          toneMap[tone] || toneMap.slate
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function PreparedPanel({ description, points, title }) {
  return (
    <div className="c-card p-8">
      <span className="c-badge-blue">준비 중</span>
      <h2 className="mt-4 text-2xl font-black text-slate-950">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
        {description}
      </p>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {points.map((point) => (
          <div
            key={point}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600"
          >
            {point}
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsField({ children, description, label }) {
  return (
    <label className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="text-sm font-black text-slate-800">{label}</span>
      <span className="mt-1 block text-xs leading-5 text-slate-500">
        {description}
      </span>
      <span className="mt-3 block">{children}</span>
    </label>
  );
}

function RoleBadge({ role }) {
  if (role === "admin") return <span className="c-badge-blue">admin</span>;
  if (role === "dealer") return <span className="c-badge-green">dealer</span>;
  return <span className="c-badge-gray">buyer</span>;
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

function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

export default AdminUserPanel;

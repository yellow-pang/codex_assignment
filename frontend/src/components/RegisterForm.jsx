import { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";

function RegisterForm({ onGoLogin, onRegisterSuccess }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
    displayName: "",
    role: "buyer",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  }

  function selectRole(role) {
    setForm((prevForm) => ({ ...prevForm, role }));
  }

  function validateForm() {
    if (!form.email.trim()) return "이메일을 입력해주세요.";
    if (form.password.length < 6)
      return "비밀번호는 6자 이상으로 입력해주세요.";
    if (!form.displayName.trim()) return "사용자 이름을 입력해주세요.";
    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await register({
        email: form.email.trim(),
        password: form.password,
        displayName: form.displayName.trim(),
        role: form.role,
      });
      onRegisterSuccess();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-8">
      <div className="c-card w-full max-w-md p-8">
        {/* 로고 */}
        <div className="mb-6 text-center">
          <p className="text-2xl font-extrabold tracking-tight">
            <span className="text-blue-600">CAR</span>
            <span className="text-gray-900"> MARKET</span>
          </p>
          <p className="mt-1 text-lg font-semibold text-gray-900">회원가입</p>
        </div>

        {errorMessage && (
          <div className="c-alert-error mb-4">
            <span>{errorMessage}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="c-label mb-1" htmlFor="register-email">
              이메일
            </label>
            <input
              className="c-input"
              id="register-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="user@test.com"
            />
          </div>

          <div>
            <label className="c-label mb-1" htmlFor="register-password">
              비밀번호{" "}
              <span className="text-xs font-normal text-gray-400">
                (6자 이상)
              </span>
            </label>
            <input
              className="c-input"
              id="register-password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="비밀번호"
            />
          </div>

          <div>
            <label className="c-label mb-1" htmlFor="register-displayName">
              사용자 이름
            </label>
            <input
              className="c-input"
              id="register-displayName"
              name="displayName"
              value={form.displayName}
              onChange={handleChange}
              placeholder="예: 김딜러"
            />
          </div>

          {/* 사용자 유형 선택 */}
          <div>
            <p className="c-label mb-2">사용자 유형</p>
            <div className="grid grid-cols-2 gap-3">
              <RoleCard
                isSelected={form.role === "buyer"}
                label="일반 사용자"
                description="차량 검색, 상세 조회, 딜러 상담"
                icon="🔍"
                onClick={() => selectRole("buyer")}
              />
              <RoleCard
                isSelected={form.role === "dealer"}
                label="딜러"
                description="차량 등록·관리 (관리자 승인 후 활성화)"
                icon="🚗"
                onClick={() => selectRole("dealer")}
              />
            </div>
          </div>

          <button
            className="c-btn-primary mt-2 w-full py-2.5"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{" "}
          <button
            className="font-medium text-blue-600 hover:underline"
            type="button"
            onClick={onGoLogin}
          >
            로그인
          </button>
        </p>
      </div>
    </div>
  );
}

function RoleCard({ isSelected, label, description, icon, onClick }) {
  return (
    <button
      type="button"
      className={`flex flex-col items-center rounded-xl border-2 p-4 text-center transition-colors ${
        isSelected
          ? "border-blue-500 bg-blue-50 text-blue-700"
          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
      }`}
      onClick={onClick}
    >
      <span className="text-2xl">{icon}</span>
      <span className="mt-1.5 text-sm font-semibold">{label}</span>
      <span className="mt-1 text-xs leading-tight text-gray-500">
        {description}
      </span>
    </button>
  );
}

export default RegisterForm;

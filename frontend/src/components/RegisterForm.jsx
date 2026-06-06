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
    <div className="flex min-h-[72vh] items-center justify-center px-0 py-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-200/80 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="p-6 sm:p-10">
          {/* 로고 */}
          <div className="mb-8">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">
              Car Market
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              회원가입
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              일반 사용자와 딜러 유형을 선택해 서비스를 시작하세요.
            </p>
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
                placeholder="이메일을 입력하세요"
              />
            </div>

            <div>
              <label className="c-label mb-1" htmlFor="register-password">
                비밀번호{" "}
                <span className="text-xs font-normal text-slate-400">
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
                placeholder="비밀번호를 입력하세요"
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
                placeholder="사용자 이름을 입력하세요"
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
                  type="buyer"
                  onClick={() => selectRole("buyer")}
                />
                <RoleCard
                  isSelected={form.role === "dealer"}
                  label="딜러"
                  description="차량 등록·관리 (관리자 승인 후 활성화)"
                  type="dealer"
                  onClick={() => selectRole("dealer")}
                />
              </div>
            </div>

            <button
              className="c-btn-primary mt-2 w-full py-3"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "가입 중..." : "회원가입"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            이미 계정이 있으신가요?{" "}
            <button
              className="font-bold text-blue-600 hover:underline"
              type="button"
              onClick={onGoLogin}
            >
              로그인
            </button>
          </p>
        </div>

        <div className="relative hidden overflow-hidden bg-gradient-to-br from-blue-50 via-white to-sky-100 p-10 lg:block">
          <div className="relative z-10">
            <p className="text-sm font-black text-blue-600">Join Car Market</p>
            <h2 className="mt-4 text-4xl font-black leading-tight text-slate-950">
              차량 탐색과 판매 관리를 더 쉽게.
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              구매자는 원하는 매물을 빠르게 찾고, 딜러는 승인 후 차량을
              등록하고 상담을 관리할 수 있습니다.
            </p>
          </div>
          <div className="absolute bottom-8 left-8 right-8 rounded-[1.5rem] border border-white/80 bg-white/80 p-3 shadow-2xl shadow-blue-100 backdrop-blur">
            <img
              alt="회원가입 화면 차량 이미지"
              className="h-56 w-full rounded-[1.2rem] object-cover"
              src="/uploads/auth-car-placeholder.png"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = "/uploads/pre-default-car.png";
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ isSelected, label, description, type, onClick }) {
  return (
    <button
      type="button"
      className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-all ${
        isSelected
          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm shadow-blue-100"
          : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/40"
      }`}
      onClick={onClick}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-600 ring-1 ring-blue-100">
        {type === "dealer" ? <DealerIcon /> : <BuyerIcon />}
      </span>
      <span className="mt-3 text-sm font-black">{label}</span>
      <span className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </span>
    </button>
  );
}

function BuyerIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 15.75L19.5 19.5M10.5 17a6.5 6.5 0 100-13 6.5 6.5 0 000 13z" />
    </svg>
  );
}

function DealerIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.5 14l1.7-4.6A3 3 0 018 7.5h8a3 3 0 012.8 1.9l1.7 4.6M5 14h14M6.5 17.5h.01M17.5 17.5h.01" />
    </svg>
  );
}

export default RegisterForm;

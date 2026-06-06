import { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";

function LoginForm({ onGoRegister, onLoginSuccess }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.email.trim()) {
      setErrorMessage("이메일을 입력해주세요.");
      return;
    }
    if (!form.password) {
      setErrorMessage("비밀번호를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await login(form.email.trim(), form.password);
      onLoginSuccess();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[72vh] items-center justify-center px-0 py-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-200/80 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="p-6 sm:p-10">
          {/* 로고 */}
          <div className="mb-8">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">
              Car Market
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              로그인
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              차량 상세 정보와 딜러 상담 기능은 로그인 후 사용할 수
              있습니다.
            </p>
          </div>

          {errorMessage && (
            <div className="c-alert-error mb-4">
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="c-label mb-1" htmlFor="login-email">
                이메일
              </label>
              <input
                className="c-input"
                id="login-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="이메일을 입력하세요"
              />
            </div>

            <div>
              <label className="c-label mb-1" htmlFor="login-password">
                비밀번호
              </label>
              <input
                className="c-input"
                id="login-password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="비밀번호를 입력하세요"
              />
            </div>

            <button
              className="c-btn-primary mt-2 w-full py-3"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            계정이 없으신가요?{" "}
            <button
              className="font-bold text-blue-600 hover:underline"
              type="button"
              onClick={onGoRegister}
            >
              회원가입
            </button>
          </p>
        </div>

        <AuthBrandPanel />
      </div>
    </div>
  );
}

function AuthBrandPanel() {
  return (
    <div className="relative hidden min-h-[34rem] overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-10 text-white lg:block">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.45),_transparent_24rem)]" />
      <div className="relative z-10">
        <p className="text-sm font-bold text-sky-200">Car Market</p>
        <h2 className="mt-4 max-w-sm text-4xl font-black leading-tight">
          조건 검색부터 실시간 상담까지 한 번에.
        </h2>
        <p className="mt-4 max-w-sm text-sm leading-6 text-blue-100">
          신뢰할 수 있는 딜러와 연결해 중고차 탐색 시간을 줄여보세요.
        </p>
      </div>
      <img
        alt="차량 등록 대기 중 placeholder"
        className="absolute bottom-8 right-8 z-10 h-56 w-[22rem] rounded-[1.5rem] object-cover shadow-2xl shadow-slate-950/40"
        src="/uploads/default-car.png"
      />
    </div>
  );
}

export default LoginForm;

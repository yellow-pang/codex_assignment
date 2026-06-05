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
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="c-card w-full max-w-md p-8">
        {/* 로고 */}
        <div className="mb-6 text-center">
          <p className="text-2xl font-extrabold tracking-tight">
            <span className="text-blue-600">CAR</span>
            <span className="text-gray-900"> MARKET</span>
          </p>
          <p className="mt-2 text-sm text-gray-500">
            차량 상세 정보와 딜러 기능은 로그인 후 사용할 수 있습니다.
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
              placeholder="user@test.com"
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
              placeholder="비밀번호"
            />
          </div>

          <button
            className="c-btn-primary mt-2 w-full py-2.5"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          계정이 없으신가요?{" "}
          <button
            className="font-medium text-blue-600 hover:underline"
            type="button"
            onClick={onGoRegister}
          >
            회원가입
          </button>
        </p>
      </div>
    </div>
  );
}

export default LoginForm;

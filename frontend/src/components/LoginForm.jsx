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
    <section className="card mx-auto max-w-xl bg-base-100 shadow">
      <div className="card-body">
        <div>
          <h1 className="card-title text-2xl">로그인</h1>
          <p className="mt-1 text-sm text-base-content/60">
            차량 상세 정보와 딜러 기능은 로그인 후 사용할 수 있습니다.
          </p>
        </div>

        {errorMessage && (
          <div className="alert alert-error">
            <span>{errorMessage}</span>
          </div>
        )}

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="form-control">
            <div className="label">
              <span className="label-text font-semibold">이메일</span>
            </div>
            <input
              className="input input-bordered"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="user@test.com"
            />
          </label>

          <label className="form-control">
            <div className="label">
              <span className="label-text font-semibold">비밀번호</span>
            </div>
            <input
              className="input input-bordered"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="비밀번호"
            />
          </label>

          <div className="card-actions justify-end">
            <button
              className="btn btn-ghost"
              type="button"
              onClick={onGoRegister}
            >
              회원가입
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "로그인 중..." : "로그인"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default LoginForm;

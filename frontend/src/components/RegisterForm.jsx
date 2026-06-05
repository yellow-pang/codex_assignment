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

  function validateForm() {
    if (!form.email.trim()) return "이메일을 입력해주세요.";
    if (form.password.length < 6) return "비밀번호는 6자 이상으로 입력해주세요.";
    if (!form.displayName.trim()) return "사용자 이름을 입력해주세요.";
    if (!["buyer", "dealer"].includes(form.role)) {
      return "사용자 유형을 선택해주세요.";
    }

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
    <section className="card mx-auto max-w-xl bg-base-100 shadow">
      <div className="card-body">
        <div>
          <h1 className="card-title text-2xl">회원가입</h1>
          <p className="mt-1 text-sm text-base-content/60">
            가입 후 선택한 사용자 유형에 따라 사용할 수 있는 기능이 달라집니다.
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
              <span className="label-text-alt">6자 이상</span>
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

          <label className="form-control">
            <div className="label">
              <span className="label-text font-semibold">사용자 이름</span>
            </div>
            <input
              className="input input-bordered"
              name="displayName"
              value={form.displayName}
              onChange={handleChange}
              placeholder="예: 김딜러"
            />
          </label>

          <div className="form-control">
            <div className="label">
              <span className="label-text font-semibold">사용자 유형</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="cursor-pointer rounded-lg border border-base-300 p-4">
                <input
                  className="radio radio-primary"
                  name="role"
                  type="radio"
                  value="buyer"
                  checked={form.role === "buyer"}
                  onChange={handleChange}
                />
                <span className="ml-3 font-semibold">일반 사용자</span>
                <p className="mt-2 text-sm text-base-content/60">
                  차량 검색과 상세 조회를 사용할 수 있습니다.
                </p>
              </label>
              <label className="cursor-pointer rounded-lg border border-base-300 p-4">
                <input
                  className="radio radio-primary"
                  name="role"
                  type="radio"
                  value="dealer"
                  checked={form.role === "dealer"}
                  onChange={handleChange}
                />
                <span className="ml-3 font-semibold">딜러</span>
                <p className="mt-2 text-sm text-base-content/60">
                  차량 등록과 본인 매물 관리를 사용할 수 있습니다.
                </p>
              </label>
            </div>
          </div>

          <div className="card-actions justify-end">
            <button className="btn btn-ghost" type="button" onClick={onGoLogin}>
              로그인
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "가입 중..." : "회원가입"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default RegisterForm;

import { useEffect, useState } from "react";

const emptyForm = {
  name: "",
  company: "",
  year: "",
  price: "",
};

function CarForm({ mode, initialCar, onCancel, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const [errorMessage, setErrorMessage] = useState("");
  const isEditMode = mode === "edit";

  useEffect(() => {
    if (initialCar) {
      setForm({
        name: initialCar.name,
        company: initialCar.company,
        year: String(initialCar.year),
        price: String(initialCar.price),
      });
      return;
    }

    setForm(emptyForm);
  }, [initialCar]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  }

  function validateForm() {
    const currentYear = new Date().getFullYear();
    const year = Number(form.year);
    const price = Number(form.price);

    if (!form.name.trim()) return "자동차 이름을 입력해주세요.";
    if (!form.company.trim()) return "제조사를 입력해주세요.";
    if (!Number.isInteger(year) || year < 1900 || year > currentYear) return "올바른 연식을 입력해주세요.";
    if (!Number.isFinite(price) || price <= 0) return "올바른 가격을 입력해주세요.";

    return "";
  }

  function handleSubmit(event) {
    event.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setErrorMessage("");
    onSubmit({
      name: form.name.trim(),
      company: form.company.trim().toUpperCase(),
      year: Number(form.year),
      price: Number(form.price),
    });
  }

  return (
    <section className="card bg-base-100 shadow">
      <div className="card-body">
        <div className="mb-2">
          <h1 className="card-title text-2xl">{isEditMode ? "자동차 수정" : "자동차 등록"}</h1>
          <p className="text-sm text-base-content/60">
            필수 정보를 입력한 뒤 저장 버튼을 눌러주세요.
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
              <span className="label-text font-semibold">이름 *</span>
            </div>
            <input
              className="input input-bordered"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="예: Sonata"
            />
          </label>

          <label className="form-control">
            <div className="label">
              <span className="label-text font-semibold">제조사 *</span>
            </div>
            <select className="select select-bordered" name="company" value={form.company} onChange={handleChange}>
              <option value="">제조사를 선택하세요</option>
              <option value="HYUNDAI">HYUNDAI</option>
              <option value="KIA">KIA</option>
              <option value="RENAULT">RENAULT</option>
              <option value="GENESIS">GENESIS</option>
              <option value="CHEVROLET">CHEVROLET</option>
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="form-control">
              <div className="label">
                <span className="label-text font-semibold">연식 *</span>
              </div>
              <input
                className="input input-bordered"
                name="year"
                type="number"
                value={form.year}
                onChange={handleChange}
                placeholder="예: 2024"
              />
            </label>

            <label className="form-control">
              <div className="label">
                <span className="label-text font-semibold">가격 *</span>
                <span className="label-text-alt">만원</span>
              </div>
              <input
                className="input input-bordered"
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                placeholder="예: 2500"
              />
            </label>
          </div>

          <div className="card-actions mt-2 justify-end">
            <button className="btn btn-outline" type="button" onClick={onCancel}>
              취소
            </button>
            <button className="btn btn-primary" type="submit">
              {isEditMode ? "수정 저장" : "등록"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default CarForm;

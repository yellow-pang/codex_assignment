import { useEffect, useState } from "react";

const emptyForm = {
  name: "",
  company: "",
  year: "",
  price: "",
  type: "",
  fuel: "",
  mileage: "",
  location: "",
  description: "",
  image: null,
};

function CarForm({ mode, initialCar, onCancel, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const [errorMessage, setErrorMessage] = useState("");
  const isEditMode = mode === "edit";

  useEffect(() => {
    if (initialCar) {
      setForm({
        name: initialCar.name || "",
        company: initialCar.company || "",
        year: String(initialCar.year || ""),
        price: String(initialCar.price || ""),
        type: initialCar.type || "",
        fuel: initialCar.fuel || "",
        mileage: String(initialCar.mileage || ""),
        location: initialCar.location || "",
        description: initialCar.description || "",
        image: null,
      });
      return;
    }

    setForm(emptyForm);
  }, [initialCar]);

  function handleChange(event) {
    const { files, name, value } = event.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: files ? files[0] || null : value,
    }));
  }

  function validateForm() {
    const currentYear = new Date().getFullYear();
    const year = Number(form.year);
    const price = Number(form.price);
    const mileage = Number(form.mileage);

    if (!form.name.trim()) return "자동차 이름을 입력해주세요.";
    if (!form.company.trim()) return "제조사를 입력해주세요.";
    if (!Number.isInteger(year) || year < 1900 || year > currentYear) return "올바른 연식을 입력해주세요.";
    if (!Number.isFinite(price) || price <= 0) return "올바른 가격을 입력해주세요.";
    if (!form.type.trim()) return "차종을 입력해주세요.";
    if (!form.fuel.trim()) return "연료를 입력해주세요.";
    if (!Number.isFinite(mileage) || mileage < 0) return "올바른 주행거리를 입력해주세요.";
    if (!form.location.trim()) return "지역을 입력해주세요.";
    if (!form.description.trim()) return "차량 설명을 입력해주세요.";

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
      type: form.type.trim(),
      fuel: form.fuel.trim(),
      mileage: Number(form.mileage),
      location: form.location.trim(),
      description: form.description.trim(),
      image: form.image,
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

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="form-control">
              <div className="label">
                <span className="label-text font-semibold">차종 *</span>
              </div>
              <select className="select select-bordered" name="type" value={form.type} onChange={handleChange}>
                <option value="">차종을 선택하세요</option>
                <option value="sedan">sedan</option>
                <option value="SUV">SUV</option>
                <option value="compact">compact</option>
                <option value="hatchback">hatchback</option>
                <option value="truck">truck</option>
              </select>
            </label>

            <label className="form-control">
              <div className="label">
                <span className="label-text font-semibold">연료 *</span>
              </div>
              <select className="select select-bordered" name="fuel" value={form.fuel} onChange={handleChange}>
                <option value="">연료를 선택하세요</option>
                <option value="gasoline">gasoline</option>
                <option value="diesel">diesel</option>
                <option value="hybrid">hybrid</option>
                <option value="electric">electric</option>
                <option value="LPG">LPG</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="form-control">
              <div className="label">
                <span className="label-text font-semibold">주행거리 *</span>
                <span className="label-text-alt">km</span>
              </div>
              <input
                className="input input-bordered"
                name="mileage"
                type="number"
                min="0"
                value={form.mileage}
                onChange={handleChange}
                placeholder="예: 35000"
              />
            </label>

            <label className="form-control">
              <div className="label">
                <span className="label-text font-semibold">지역 *</span>
              </div>
              <input
                className="input input-bordered"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="예: 서울"
              />
            </label>
          </div>

          <label className="form-control">
            <div className="label">
              <span className="label-text font-semibold">차량 설명 *</span>
            </div>
            <textarea
              className="textarea textarea-bordered min-h-28"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="차량 특징과 관리 상태를 입력해주세요."
            />
          </label>

          <label className="form-control">
            <div className="label">
              <span className="label-text font-semibold">차량 사진</span>
              <span className="label-text-alt">jpg, jpeg, png, webp / 최대 5MB</span>
            </div>
            {isEditMode && initialCar?.imageUrl && (
              <p className="mb-2 text-xs text-base-content/60">
                새 파일을 선택하지 않으면 기존 사진을 유지합니다.
              </p>
            )}
            <input
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              className="file-input file-input-bordered"
              name="image"
              type="file"
              onChange={handleChange}
            />
          </label>

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

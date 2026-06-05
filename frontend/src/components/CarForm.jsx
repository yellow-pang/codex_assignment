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
    if (!Number.isInteger(year) || year < 1900 || year > currentYear)
      return "올바른 연식을 입력해주세요.";
    if (!Number.isFinite(price) || price <= 0)
      return "올바른 가격을 입력해주세요.";
    if (!form.type.trim()) return "차종을 입력해주세요.";
    if (!form.fuel.trim()) return "연료를 입력해주세요.";
    if (!Number.isFinite(mileage) || mileage < 0)
      return "올바른 주행거리를 입력해주세요.";
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
    <div className="c-card p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? "차량 수정" : "차량 등록"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          필수 정보를 입력한 뒤 저장 버튼을 눌러주세요.
        </p>
      </div>

      {errorMessage && (
        <div className="c-alert-error mb-4">
          <span>{errorMessage}</span>
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* 섹션 1: 기본 정보 */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2 w-full">
            기본 정보
          </legend>
          <div>
            <label className="c-label mb-1" htmlFor="car-name">
              이름 *
            </label>
            <input
              className="c-input"
              id="car-name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="예: Sonata"
            />
          </div>
        </fieldset>

        {/* 섹션 2: 차량 스펙 */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2 w-full">
            차량 스펙
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="c-label mb-1" htmlFor="car-company">
                제조사 *
              </label>
              <select
                className="c-select"
                id="car-company"
                name="company"
                value={form.company}
                onChange={handleChange}
              >
                <option value="">제조사를 선택하세요</option>
                <option value="HYUNDAI">HYUNDAI</option>
                <option value="KIA">KIA</option>
                <option value="RENAULT">RENAULT</option>
                <option value="GENESIS">GENESIS</option>
                <option value="CHEVROLET">CHEVROLET</option>
              </select>
            </div>
            <div>
              <label className="c-label mb-1" htmlFor="car-year">
                연식 *
              </label>
              <input
                className="c-input"
                id="car-year"
                name="year"
                type="number"
                value={form.year}
                onChange={handleChange}
                placeholder="예: 2024"
              />
            </div>
            <div>
              <label className="c-label mb-1" htmlFor="car-type">
                차종 *
              </label>
              <select
                className="c-select"
                id="car-type"
                name="type"
                value={form.type}
                onChange={handleChange}
              >
                <option value="">차종을 선택하세요</option>
                <option value="sedan">sedan</option>
                <option value="SUV">SUV</option>
                <option value="compact">compact</option>
                <option value="hatchback">hatchback</option>
                <option value="truck">truck</option>
              </select>
            </div>
            <div>
              <label className="c-label mb-1" htmlFor="car-fuel">
                연료 *
              </label>
              <select
                className="c-select"
                id="car-fuel"
                name="fuel"
                value={form.fuel}
                onChange={handleChange}
              >
                <option value="">연료를 선택하세요</option>
                <option value="gasoline">gasoline</option>
                <option value="diesel">diesel</option>
                <option value="hybrid">hybrid</option>
                <option value="electric">electric</option>
                <option value="LPG">LPG</option>
              </select>
            </div>
          </div>
        </fieldset>

        {/* 섹션 3: 판매 정보 */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2 w-full">
            판매 정보
          </legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="c-label mb-1" htmlFor="car-price">
                가격 *{" "}
                <span className="text-xs font-normal text-gray-400">
                  (만원)
                </span>
              </label>
              <input
                className="c-input"
                id="car-price"
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                placeholder="예: 2500"
              />
            </div>
            <div>
              <label className="c-label mb-1" htmlFor="car-mileage">
                주행거리 *{" "}
                <span className="text-xs font-normal text-gray-400">(km)</span>
              </label>
              <input
                className="c-input"
                id="car-mileage"
                name="mileage"
                type="number"
                min="0"
                value={form.mileage}
                onChange={handleChange}
                placeholder="예: 35000"
              />
            </div>
            <div>
              <label className="c-label mb-1" htmlFor="car-location">
                지역 *
              </label>
              <input
                className="c-input"
                id="car-location"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="예: 서울"
              />
            </div>
          </div>
        </fieldset>

        {/* 섹션 4: 차량 사진 */}
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2 w-full">
            차량 사진{" "}
            <span className="text-xs font-normal text-gray-400">
              jpg, jpeg, png, webp / 최대 5MB
            </span>
          </legend>
          {isEditMode && initialCar?.imageUrl && (
            <p className="text-xs text-gray-500">
              새 파일을 선택하지 않으면 기존 사진을 유지합니다.
            </p>
          )}
          <input
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
            name="image"
            type="file"
            onChange={handleChange}
          />
        </fieldset>

        {/* 섹션 5: 차량 설명 */}
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2 w-full">
            차량 설명 *
          </legend>
          <textarea
            className="c-textarea min-h-28"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="차량 특징과 관리 상태를 입력해주세요."
          />
        </fieldset>

        {/* 버튼 */}
        <div className="flex justify-end gap-3 pt-2">
          <button className="c-btn-outline" type="button" onClick={onCancel}>
            취소
          </button>
          <button className="c-btn-primary" type="submit">
            {isEditMode ? "수정 저장" : "등록"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CarForm;

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
  const uploadPlaceholderUrl = "/uploads/car-upload-placeholder.png";
  const currentImageUrl = initialCar?.imageUrl || uploadPlaceholderUrl;

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
    <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
      <aside className="h-fit rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-300/50">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-300">
          Dealer
        </p>
        <h1 className="mt-3 text-2xl font-black">
          {isEditMode ? "차량 수정" : "차량 등록"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          사진과 핵심 정보를 잘 채울수록 구매자 상담 전환율이 높아집니다.
        </p>
        <div className="mt-6 space-y-2 text-sm">
          {["기본 정보", "차량 스펙", "판매 정보", "사진 업로드", "상세 설명"].map(
            (item, index) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2 text-slate-200"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                  {index + 1}
                </span>
                {item}
              </div>
            ),
          )}
        </div>
      </aside>

      <div className="c-card p-5 sm:p-7">
        <div className="mb-6">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            {isEditMode ? "등록된 차량 정보 수정" : "새 차량 정보 입력"}
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            필수 정보를 입력한 뒤 저장 버튼을 눌러주세요.
          </p>
        </div>

        {errorMessage && (
          <div className="c-alert-error mb-4">
            <span>{errorMessage}</span>
          </div>
        )}

      <form className="space-y-7" onSubmit={handleSubmit}>
        {/* 섹션 1: 기본 정보 */}
        <fieldset className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
          <legend className="px-2 text-sm font-black text-slate-800">
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
        <fieldset className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
          <legend className="px-2 text-sm font-black text-slate-800">
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
        <fieldset className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
          <legend className="px-2 text-sm font-black text-slate-800">
            판매 정보
          </legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="c-label mb-1" htmlFor="car-price">
                가격 *{" "}
                <span className="text-xs font-normal text-slate-400">
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
                <span className="text-xs font-normal text-slate-400">(km)</span>
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
        <fieldset className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
          <legend className="px-2 text-sm font-black text-slate-800">
            차량 사진
          </legend>
          <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              <img
                alt="차량 이미지 업로드 안내"
                className="h-44 w-full rounded-xl object-cover"
                src={currentImageUrl}
              />
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-sm font-bold text-slate-800">
                차량 이미지를 등록해주세요
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                jpg, jpeg, png, webp 형식을 지원하며 최대 5MB까지 업로드할
                수 있습니다. 이미지가 없으면 기본 placeholder가 목록과 상세에
                표시됩니다.
              </p>
          {isEditMode && initialCar?.imageUrl && (
                <p className="mt-2 text-xs font-medium text-blue-600">
              새 파일을 선택하지 않으면 기존 사진을 유지합니다.
            </p>
          )}
          <input
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                className="mt-4 block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-white hover:file:bg-blue-700"
            name="image"
            type="file"
            onChange={handleChange}
          />
              {form.image && (
                <p className="mt-2 text-xs font-medium text-slate-500">
                  선택한 파일: {form.image.name}
                </p>
              )}
            </div>
          </div>
        </fieldset>

        {/* 섹션 5: 차량 설명 */}
        <fieldset className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
          <legend className="px-2 text-sm font-black text-slate-800">
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
    </div>
  );
}

export default CarForm;

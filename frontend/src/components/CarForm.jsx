import { useEffect, useMemo, useState } from "react";
import { getCarImageUrls, handleCarImageError } from "../utils/carImages.js";

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
  images: [],
};

const recommendedCompanies = [
  "HYUNDAI",
  "KIA",
  "RENAULT",
  "GENESIS",
  "CHEVROLET",
  "BMW",
  "BENZ",
  "AUDI",
  "TESLA",
  "TOYOTA",
];

const defaultFormSettings = {
  yearStep: 1,
  priceStep: 100,
  mileageStep: 1000,
  maxImageCount: 8,
};

function CarForm({
  mode,
  initialCar,
  formSettings = defaultFormSettings,
  isSubmitting = false,
  onCancel,
  onSubmit,
}) {
  const [form, setForm] = useState(emptyForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [previewUrls, setPreviewUrls] = useState([]);
  const isEditMode = mode === "edit";
  const settings = { ...defaultFormSettings, ...formSettings };
  const existingImageUrls = useMemo(
    () => (initialCar ? getCarImageUrls(initialCar) : []),
    [initialCar],
  );
  const displayImageUrls = previewUrls.length > 0 ? previewUrls : existingImageUrls;

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
        images: [],
      });
      return;
    }

    setForm(emptyForm);
  }, [initialCar]);

  useEffect(() => {
    const urls = form.images.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [form.images]);

  function handleChange(event) {
    const { files, name, value } = event.target;

    if (files) {
      const selectedFiles = Array.from(files).slice(0, settings.maxImageCount);
      setForm((prevForm) => ({ ...prevForm, images: selectedFiles }));
      return;
    }

    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  }

  function validateForm() {
    const currentYear = new Date().getFullYear();
    const year = Number(form.year);
    const price = Number(form.price);
    const mileage = Number(form.mileage);
    const company = form.company.trim();

    if (!form.name.trim()) return "자동차 이름을 입력해주세요.";
    if (form.name.trim().length < 2 || form.name.trim().length > 80)
      return "자동차 이름은 2자 이상 80자 이하로 입력해주세요.";
    if (!company) return "제조사를 입력해주세요.";
    if (company.length < 2 || company.length > 40)
      return "제조사는 2자 이상 40자 이하로 입력해주세요.";
    if (!Number.isInteger(year) || year < 1900 || year > currentYear)
      return "올바른 연식을 입력해주세요.";
    if (!Number.isFinite(price) || price <= 0)
      return "올바른 가격을 입력해주세요.";
    if (!form.type.trim()) return "차종을 입력해주세요.";
    if (!form.fuel.trim()) return "연료를 입력해주세요.";
    if (!Number.isFinite(mileage) || mileage < 0)
      return "올바른 주행거리를 입력해주세요.";
    if (!form.location.trim()) return "지역을 입력해주세요.";
    if (form.location.trim().length < 2 || form.location.trim().length > 40)
      return "지역은 2자 이상 40자 이하로 입력해주세요.";
    if (!form.description.trim()) return "차량 설명을 입력해주세요.";
    if (
      form.description.trim().length < 10 ||
      form.description.trim().length > 1000
    )
      return "차량 설명은 10자 이상 1000자 이하로 입력해주세요.";
    if (form.images.length > settings.maxImageCount) {
      return `차량 사진은 최대 ${settings.maxImageCount}장까지 선택할 수 있습니다.`;
    }

    return "";
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;

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
      images: form.images,
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
          여러 각도의 사진과 핵심 정보를 함께 등록하면 구매자가 차량 상태를
          더 빠르게 판단할 수 있습니다.
        </p>
        <div className="mt-6 space-y-2 text-sm">
          {["기본 정보", "차량 스펙", "판매 정보", "사진 갤러리", "상세 설명"].map(
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
            제조사는 직접 입력할 수 있고, 사진은 최대 {settings.maxImageCount}
            장까지 등록할 수 있습니다.
          </p>
        </div>

        {errorMessage && (
          <div className="c-alert-error mb-4">
            <span>{errorMessage}</span>
          </div>
        )}

        <form className="space-y-7" onSubmit={handleSubmit}>
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

          <fieldset className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <legend className="px-2 text-sm font-black text-slate-800">
              차량 스펙
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="c-label mb-1" htmlFor="car-company">
                  제조사 *
                </label>
                <input
                  className="c-input"
                  id="car-company"
                  name="company"
                  list="car-company-options"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="예: GENESIS, BMW, TESLA"
                />
                <datalist id="car-company-options">
                  {recommendedCompanies.map((company) => (
                    <option key={company} value={company} />
                  ))}
                </datalist>
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
                  min="1900"
                  step={settings.yearStep}
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

          <fieldset className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <legend className="px-2 text-sm font-black text-slate-800">
              판매 정보
            </legend>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="c-label mb-1" htmlFor="car-price">
                  가격 *{" "}
                  <span className="text-xs font-normal text-slate-400">
                    (만원, {settings.priceStep} 단위)
                  </span>
                </label>
                <input
                  className="c-input"
                  id="car-price"
                  name="price"
                  type="number"
                  min="0"
                  step={settings.priceStep}
                  value={form.price}
                  onChange={handleChange}
                  placeholder="예: 2500"
                />
              </div>
              <div>
                <label className="c-label mb-1" htmlFor="car-mileage">
                  주행거리 *{" "}
                  <span className="text-xs font-normal text-slate-400">
                    (km, {settings.mileageStep.toLocaleString()} 단위)
                  </span>
                </label>
                <input
                  className="c-input"
                  id="car-mileage"
                  name="mileage"
                  type="number"
                  min="0"
                  step={settings.mileageStep}
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

          <fieldset className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <legend className="px-2 text-sm font-black text-slate-800">
              차량 사진
            </legend>
            <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
              <div className="space-y-3">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                  <img
                    alt="차량 이미지 미리보기"
                    className="h-44 w-full rounded-xl object-cover"
                    src={displayImageUrls[0] || "/uploads/car-upload-placeholder.png"}
                    onError={handleCarImageError}
                  />
                </div>
                {displayImageUrls.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {displayImageUrls.slice(0, 8).map((url, index) => (
                      <img
                        key={`${url}-${index}`}
                        alt={`차량 이미지 ${index + 1}`}
                        className="h-14 rounded-xl object-cover ring-1 ring-slate-200"
                        src={url}
                        onError={handleCarImageError}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-sm font-bold text-slate-800">
                  외관, 실내, 계기판 사진을 함께 등록해주세요
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  jpg, jpeg, png, webp 형식을 지원하며 파일당 최대 5MB,
                  최대 {settings.maxImageCount}장까지 업로드할 수 있습니다.
                  이미지가 없거나 사라지면 기본 placeholder가 표시됩니다.
                </p>
                {isEditMode && initialCar?.imageUrl && (
                  <p className="mt-2 text-xs font-medium text-blue-600">
                    새 파일을 선택하지 않으면 기존 사진 목록을 유지합니다.
                    새 파일을 선택하면 선택한 사진들로 전체 교체됩니다.
                  </p>
                )}
                <input
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  className="mt-4 block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-white hover:file:bg-blue-700"
                  name="images"
                  type="file"
                  multiple
                  onChange={handleChange}
                />
                {form.images.length > 0 && (
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    선택한 파일: {form.images.length}장
                  </p>
                )}
              </div>
            </div>
          </fieldset>

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

          <div className="flex justify-end gap-3 pt-2">
            <button
              className="c-btn-outline"
              type="button"
              disabled={isSubmitting}
              onClick={onCancel}
            >
              취소
            </button>
            <button className="c-btn-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEditMode
                  ? "수정 중..."
                  : "등록 중..."
                : isEditMode
                  ? "수정 저장"
                  : "등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CarForm;

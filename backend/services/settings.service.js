const { maxCarImageCount } = require("../config/upload");
const { getSettingsCollection } = require("./collections");

const carFormSettingsKey = "carForm";
const defaultCarFormSettings = {
  key: carFormSettingsKey,
  yearStep: 1,
  priceStep: 100,
  mileageStep: 1000,
  maxImageCount: maxCarImageCount,
};

function normalizeCarFormSettings(input = {}) {
  return {
    yearStep: normalizeStep(input.yearStep, defaultCarFormSettings.yearStep, 1, 10),
    priceStep: normalizeStep(input.priceStep, defaultCarFormSettings.priceStep, 1, 10000),
    mileageStep: normalizeStep(
      input.mileageStep,
      defaultCarFormSettings.mileageStep,
      1,
      100000,
    ),
    maxImageCount: normalizeStep(
      input.maxImageCount,
      defaultCarFormSettings.maxImageCount,
      1,
      maxCarImageCount,
    ),
  };
}

async function getCarFormSettings() {
  const settings = await getSettingsCollection().findOne({ key: carFormSettingsKey });

  return {
    ...defaultCarFormSettings,
    ...normalizeCarFormSettings(settings || defaultCarFormSettings),
    updatedAt: settings?.updatedAt || null,
    updatedBy: settings?.updatedBy || null,
  };
}

async function updateCarFormSettings(input, adminProfile) {
  const settings = normalizeCarFormSettings(input);
  const now = new Date();
  const update = {
    ...settings,
    updatedAt: now,
    updatedBy: adminProfile?.uid || "",
  };

  await getSettingsCollection().updateOne(
    { key: carFormSettingsKey },
    {
      $set: update,
      $setOnInsert: {
        key: carFormSettingsKey,
        createdAt: now,
      },
    },
    { upsert: true },
  );

  return {
    key: carFormSettingsKey,
    ...update,
  };
}

function normalizeStep(value, fallback, min, max) {
  const number = Number(value);

  if (!Number.isInteger(number) || number < min || number > max) {
    return fallback;
  }

  return number;
}

module.exports = {
  defaultCarFormSettings,
  getCarFormSettings,
  updateCarFormSettings,
};

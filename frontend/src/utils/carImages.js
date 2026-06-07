export const defaultCarImageUrl = "/uploads/default-car.png";

export function getCarImageUrls(car) {
  const urls = Array.isArray(car?.imageUrls)
    ? car.imageUrls.filter(Boolean)
    : [];

  if (car?.imageUrl && !urls.includes(car.imageUrl)) {
    urls.unshift(car.imageUrl);
  }

  return urls.length > 0 ? urls : [defaultCarImageUrl];
}

export function getPrimaryCarImageUrl(car) {
  return getCarImageUrls(car)[0];
}

export function handleCarImageError(event) {
  if (event.currentTarget.src.includes(defaultCarImageUrl)) {
    return;
  }

  event.currentTarget.src = defaultCarImageUrl;
}

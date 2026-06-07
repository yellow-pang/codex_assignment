function DeleteConfirmModal({ car, isDeleting = false, onCancel, onConfirm }) {
  if (!car) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={isDeleting ? undefined : onCancel}
      />
      {/* 다이얼로그 패널 */}
      <div className="c-card relative z-10 mx-4 w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900">차량 삭제</h2>
        <p className="mt-3 text-sm text-gray-600">
          <span className="font-semibold">{car?.name}</span> 차량을
          삭제하시겠습니까? 삭제한 데이터는 되돌릴 수 없습니다.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            className="c-btn-outline"
            disabled={isDeleting}
            onClick={onCancel}
          >
            취소
          </button>
          <button
            className="c-btn-danger"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? "삭제 중..." : "삭제"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;

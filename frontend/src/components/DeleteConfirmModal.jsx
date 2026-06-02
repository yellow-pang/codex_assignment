function DeleteConfirmModal({ car, onCancel, onConfirm }) {
  return (
    <dialog className={`modal ${car ? "modal-open" : ""}`}>
      <div className="modal-box">
        <h2 className="text-lg font-bold">자동차 삭제</h2>
        <p className="py-4">
          <span className="font-semibold">{car?.name}</span> 자동차를 삭제하시겠습니까?
          삭제한 데이터는 되돌릴 수 없습니다.
        </p>
        <div className="modal-action">
          <button className="btn btn-outline" onClick={onCancel}>
            취소
          </button>
          <button className="btn btn-error" onClick={onConfirm}>
            삭제
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default DeleteConfirmModal;

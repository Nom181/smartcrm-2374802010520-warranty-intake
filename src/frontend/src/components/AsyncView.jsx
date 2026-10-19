// AsyncView - nơi DUY NHẤT quyết định hiển thị ba trạng thái của một vùng dữ liệu:
//   1. đang tải      2. rỗng (hai loại: chưa có dữ liệu / bộ lọc không ra kết quả)      3. lỗi + nút "Thử lại"
// compact: dùng cho vùng phụ (ví dụ ô số liệu) để lỗi chỉ chiếm một dòng, không lặp lại khung lỗi lớn.
export default function AsyncView({ resource, isEmpty, renderEmpty, children, loadingText = 'Đang tải dữ liệu…', compact = false }) {
  const { status, data, error, reload } = resource;

  if (status === 'loading' && compact) {
    return <p className="state-inline" role="status" data-state="loading"><span className="spinner" aria-hidden="true" /> {loadingText}</p>;
  }
  if (status === 'loading') {
    return (
      <div className="state state-loading" role="status" aria-live="polite" data-state="loading">
        <span className="spinner" aria-hidden="true" /> {loadingText}
      </div>
    );
  }
  if (status === 'error' && compact) {
    return (
      <p className="state-inline" role="alert" data-state="error">
        {error.message} <button type="button" className="btn" onClick={reload}>Thử lại</button>
      </p>
    );
  }
  if (status === 'error') {
    return (
      <div className="state state-error" role="alert" data-state="error">
        <p><strong>Không tải được dữ liệu.</strong></p>
        <p>{error.message}</p>
        <button type="button" className="btn" onClick={reload}>Thử lại</button>
      </div>
    );
  }
  if (isEmpty && isEmpty(data)) {
    return <div className="state state-empty" data-state="empty">{renderEmpty()}</div>;
  }
  return children(data);
}

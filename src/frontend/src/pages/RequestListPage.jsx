import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useResource } from '../hooks/useResource';
import AsyncView from '../components/AsyncView';
import StatusBadge from '../components/StatusBadge';
import { PRIORITY_LABEL, STATUS_LABEL, formatDateTime, percent } from '../format';

// Ô số liệu luôn đi kèm MẪU SỐ (tổng số phiếu) làm mốc so sánh.
function SummaryTiles({ summary, activeStatus, onPick }) {
  const { total, byStatus, pastDeadline } = summary;
  return (
    <div className="tiles">
      {Object.keys(STATUS_LABEL).map((s) => (
        <button type="button" key={s} className={`tile ${activeStatus === s ? 'tile-active' : ''}`} onClick={() => onPick(activeStatus === s ? '' : s)}>
          <span className="tile-label">{STATUS_LABEL[s]}</span>
          <span className="tile-value">{byStatus[s]}</span>
          <span className="tile-ref">trên tổng {total} phiếu ({percent(byStatus[s], total)}%)</span>
        </button>
      ))}
      <div className="tile tile-static">
        <span className="tile-label">Quá hạn cam kết</span>
        <span className="tile-value">{pastDeadline}</span>
        <span className="tile-ref">trên {byStatus.RECEIVED} phiếu đã có hạn ({percent(pastDeadline, byStatus.RECEIVED)}%)</span>
      </div>
    </div>
  );
}

export default function RequestListPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const q = params.get('q') || '';
  const page = Number(params.get('page') || 1);
  const [search, setSearch] = useState(q);
  useEffect(() => { setSearch(q); }, [q]);

  const update = (next) => {
    const merged = { status, q, page: 1, ...next };
    const clean = Object.fromEntries(Object.entries(merged).filter(([k, v]) => v && !(k === 'page' && Number(v) === 1)));
    setParams(clean);
  };

  const summary = useResource(() => api.requestSummary(), []);
  const list = useResource(
    () => api.listRequests({ status, q, page, pageSize: 10 }),
    [status, q, page]
  );

  const filtering = Boolean(status || q);

  return (
    <>
      <div className="page-head">
        <h1>Danh sách phiếu bảo hành</h1>
        {user.role === 'STAFF' && <Link className="btn btn-primary" to="/requests/new">+ Tạo phiếu</Link>}
      </div>

      <AsyncView resource={summary} compact loadingText="Đang tải số liệu tổng hợp…">
        {(s) => <SummaryTiles summary={s} activeStatus={status} onPick={(v) => update({ status: v })} />}
      </AsyncView>

      <form className="filters" onSubmit={(e) => { e.preventDefault(); update({ q: search.trim() }); }}>
        <label>Trạng thái
          <select value={status} onChange={(e) => update({ status: e.target.value })}>
            <option value="">Tất cả</option>
            {Object.entries(STATUS_LABEL).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </select>
        </label>
        <label>Tìm theo số điện thoại, họ tên hoặc serial
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ví dụ: 0910000137" maxLength={50} />
        </label>
        <button className="btn">Tìm</button>
      </form>

      <AsyncView
        resource={list}
        isEmpty={(r) => r.data.length === 0}
        renderEmpty={() => (filtering ? (
          <>
            <p><strong>Không có phiếu nào khớp bộ lọc.</strong></p>
            <p className="muted">
              {status && <>Trạng thái: {STATUS_LABEL[status]}. </>}{q && <>Từ khoá: “{q}”.</>}
            </p>
            <button type="button" className="btn" onClick={() => setParams({})}>Xoá bộ lọc</button>
          </>
        ) : (
          <>
            <p><strong>Chưa có phiếu bảo hành nào.</strong></p>
            {user.role === 'STAFF'
              ? <Link className="btn btn-primary" to="/requests/new">Tạo phiếu đầu tiên</Link>
              : <p className="muted">Nhân viên tiếp nhận chưa tạo phiếu nào.</p>}
          </>
        ))}
      >
        {(r) => (
          <>
            <div className="table-wrap"><table className="table">
              <thead>
                <tr><th>Mã</th><th>Khách hàng</th><th>Thiết bị</th><th>Nhóm sự cố</th><th>Ưu tiên</th><th>Trạng thái</th><th>Hạn cam kết</th></tr>
              </thead>
              <tbody>
                {r.data.map((x) => (
                  <tr key={x.requestId}>
                    <td><Link to={`/requests/${x.requestId}`}>#{x.requestId}</Link></td>
                    <td>{x.customer.fullName}<br /><span className="muted">{x.customer.phone}</span></td>
                    <td>{x.device.modelName}<br /><span className="muted">{x.device.serialNo}</span></td>
                    <td>{x.category ? x.category.name : <span className="muted">Chưa phân loại</span>}</td>
                    <td>{x.priority ? PRIORITY_LABEL[x.priority] : <span className="muted">—</span>}</td>
                    <td><StatusBadge status={x.status} /></td>
                    <td>{formatDateTime(x.committedDeadline)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            <div className="pager">
              <span className="muted">Trang {r.meta.page}/{r.meta.totalPages} · {r.meta.total} phiếu{filtering ? ' khớp bộ lọc' : ''}</span>
              <button type="button" className="btn" disabled={page <= 1} onClick={() => update({ page: page - 1 })}>Trang trước</button>
              <button type="button" className="btn" disabled={page >= r.meta.totalPages} onClick={() => update({ page: page + 1 })}>Trang sau</button>
            </div>
          </>
        )}
      </AsyncView>
    </>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useResource } from '../hooks/useResource';
import AsyncView from '../components/AsyncView';
import StatusBadge from '../components/StatusBadge';
import { PRIORITIES, PRIORITY_LABEL, STATUS_LABEL, describeRemaining, formatDateTime } from '../format';

function ActionPanel({ request, onChanged }) {
  const navigate = useNavigate();
  const categories = useResource(() => api.listCategories(), []);
  const [categoryId, setCategoryId] = useState(request.categoryId || '');
  const [priority, setPriority] = useState(request.priority || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCategoryId(request.categoryId || '');
    setPriority(request.priority || '');
  }, [request.categoryId, request.priority]);

  async function run(action) {
    setBusy(true); setError(null);
    try { onChanged(await action()); } catch (err) { setError(err); } finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true); setError(null);
    try { await api.deleteRequest(request.requestId); navigate('/requests'); } catch (err) { setError(err); setBusy(false); }
  }

  const ready = Boolean(request.categoryId && request.priority);

  return (
    <section className="card">
      <h2>Phân loại và sinh hạn cam kết</h2>
      <AsyncView resource={categories} loadingText="Đang tải danh mục nhóm sự cố…">
        {(cats) => (
          <div className="actions">
            <div className="inline-form">
              <label>Nhóm sự cố
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">— Chọn —</option>
                  {cats.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
                </select>
              </label>
              <button type="button" className="btn" disabled={busy || !categoryId || Number(categoryId) === request.categoryId}
                onClick={() => run(() => api.setCategory(request.requestId, Number(categoryId)))}>Lưu nhóm sự cố</button>
            </div>
            <div className="inline-form">
              <label>Mức ưu tiên
                <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="">— Chọn —</option>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
                </select>
              </label>
              <button type="button" className="btn" disabled={busy || !priority || priority === request.priority}
                onClick={() => run(() => api.setPriority(request.requestId, priority))}>Lưu mức ưu tiên</button>
            </div>
            <div className="inline-form">
              <button type="button" className="btn btn-primary" disabled={busy || !ready}
                onClick={() => run(() => api.generateDeadline(request.requestId))}>Sinh hạn cam kết xử lý</button>
              {!ready && <span className="muted">Cần có đủ nhóm sự cố và mức ưu tiên đã lưu.</span>}
            </div>
          </div>
        )}
      </AsyncView>
      {error && (
        <div className="form-error" role="alert">
          <p>{error.message}</p>
          {Array.isArray(error.details) && <ul>{error.details.map((d) => <li key={d.truong}><code>{d.truong}</code>: {d.ly_do}</li>)}</ul>}
        </div>
      )}
      {request.status === 'NEW' && (
        <p><button type="button" className="btn btn-danger" disabled={busy}
          onClick={() => { if (window.confirm('Xoá phiếu này? Thao tác không hoàn tác được.')) remove(); }}>Xoá phiếu</button></p>
      )}
    </section>
  );
}

// Bảng SLA của nhóm: dòng đang áp dụng được tô đậm -> người đọc thấy hạn này nhanh/chậm so với mức khác.
function SlaComparison({ request }) {
  if (!request.slaOptions.length) return null;
  return (
    <table className="table table-compact">
      <caption>Quy tắc SLA của nhóm “{request.category.name}” (mốc so sánh)</caption>
      <thead><tr><th>Mức ưu tiên</th><th>Số giờ cam kết</th></tr></thead>
      <tbody>
        {request.slaOptions.map((o) => (
          <tr key={o.priority} className={o.priority === request.priority ? 'row-current' : ''}>
            <td>{PRIORITY_LABEL[o.priority]}{o.priority === request.priority ? ' (đang áp dụng)' : ''}</td>
            <td>{o.slaHours} giờ</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function RequestDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const resource = useResource(() => api.getRequest(id), [id]);
  const [override, setOverride] = useState(null);
  useEffect(() => { setOverride(null); }, [id]);

  return (
    <>
      <p><Link to="/requests">← Danh sách phiếu</Link></p>
      <AsyncView resource={resource} loadingText="Đang tải phiếu bảo hành…">
        {(loaded) => {
          const request = override || loaded;
          return (
            <>
              <div className="page-head">
                <h1>Phiếu bảo hành #{request.requestId}</h1>
                <StatusBadge status={request.status} />
              </div>
              <section className="card">
                <dl className="facts">
                  <dt>Khách hàng</dt><dd>{request.customer.fullName} · {request.customer.phone}</dd>
                  <dt>Thiết bị</dt><dd>{request.device.modelName} · {request.device.serialNo}</dd>
                  <dt>Mô tả lỗi</dt><dd className="pre">{request.issueDesc}</dd>
                  <dt>Nhóm sự cố</dt><dd>{request.category ? request.category.name : <span className="muted">Chưa phân loại</span>}</dd>
                  <dt>Mức ưu tiên</dt><dd>{request.priority ? PRIORITY_LABEL[request.priority] : <span className="muted">Chưa chọn</span>}</dd>
                  <dt>Tiếp nhận lúc</dt><dd>{formatDateTime(request.receivedAt)}</dd>
                  <dt>Hạn cam kết xử lý</dt>
                  <dd>
                    {request.committedDeadline
                      ? <><strong>{formatDateTime(request.committedDeadline)}</strong> <span className="muted">({describeRemaining(request.committedDeadline)})</span></>
                      : <span className="muted">Chưa sinh hạn</span>}
                  </dd>
                </dl>
                <SlaComparison request={request} />
              </section>

              {user.role === 'STAFF' && request.status !== 'RECEIVED' && (
                <ActionPanel request={request} onChanged={setOverride} />
              )}

              <section className="card">
                <h2>Lịch sử trạng thái</h2>
                <ol className="timeline">
                  {request.history.map((h, i) => (
                    <li key={i}><strong>{STATUS_LABEL[h.toStatus]}</strong> <span className="muted">{formatDateTime(h.changedAt)}</span></li>
                  ))}
                </ol>
              </section>
            </>
          );
        }}
      </AsyncView>
    </>
  );
}

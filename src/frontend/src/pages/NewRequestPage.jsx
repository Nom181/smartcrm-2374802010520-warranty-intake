import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

// Hiển thị lỗi từ API: thông báo chung + từng trường sai (nếu có).
function ErrorBox({ error }) {
  if (!error) return null;
  return (
    <div className="form-error" role="alert">
      <p>{error.message}</p>
      {Array.isArray(error.details) && (
        <ul>{error.details.map((d) => <li key={d.truong}><code>{d.truong}</code>: {d.ly_do}</li>)}</ul>
      )}
    </div>
  );
}

export default function NewRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Bước 1 - khách hàng
  const [phone, setPhone] = useState('');
  const [customer, setCustomer] = useState(null);
  const [customerMissing, setCustomerMissing] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [customerBusy, setCustomerBusy] = useState(false);
  const [customerError, setCustomerError] = useState(null);

  // Bước 2 - thiết bị
  const [serial, setSerial] = useState('');
  const [device, setDevice] = useState(null);
  const [deviceMissing, setDeviceMissing] = useState(false);
  const [model, setModel] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [deviceBusy, setDeviceBusy] = useState(false);
  const [deviceError, setDeviceError] = useState(null);

  // Bước 3 - mô tả lỗi
  const [issueDesc, setIssueDesc] = useState('');
  const [submitBusy, setSubmitBusy] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  if (user.role !== 'STAFF') return <Navigate to="/requests" replace />;

  async function lookupCustomer(e) {
    e.preventDefault();
    setCustomerBusy(true); setCustomerError(null); setCustomer(null); setCustomerMissing(false);
    try {
      setCustomer(await api.lookupCustomer(phone.trim()));
    } catch (err) {
      if (err.code === 'KHONG_TIM_THAY_KHACH_HANG') setCustomerMissing(true);
      else setCustomerError(err);
    } finally { setCustomerBusy(false); }
  }

  async function createCustomer(e) {
    e.preventDefault();
    setCustomerBusy(true); setCustomerError(null);
    try {
      setCustomer(await api.createCustomer({ phone: phone.trim(), fullName: newName, email: newEmail }));
      setCustomerMissing(false);
    } catch (err) { setCustomerError(err); } finally { setCustomerBusy(false); }
  }

  async function lookupDevice(e) {
    e.preventDefault();
    setDeviceBusy(true); setDeviceError(null); setDevice(null); setDeviceMissing(false);
    try {
      setDevice(await api.lookupDevice(serial.trim()));
    } catch (err) {
      if (err.code === 'KHONG_TIM_THAY_THIET_BI') setDeviceMissing(true);
      else setDeviceError(err);
    } finally { setDeviceBusy(false); }
  }

  async function createDevice(e) {
    e.preventDefault();
    setDeviceBusy(true); setDeviceError(null);
    try {
      setDevice(await api.createDevice({ serialNo: serial.trim(), modelName: model, purchaseDate }));
      setDeviceMissing(false);
    } catch (err) { setDeviceError(err); } finally { setDeviceBusy(false); }
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitBusy(true); setSubmitError(null);
    try {
      const created = await api.createRequest({ customerId: customer.customerId, deviceId: device.deviceId, issueDesc });
      navigate(`/requests/${created.requestId}`);
    } catch (err) { setSubmitError(err); setSubmitBusy(false); }
  }

  return (
    <>
      <div className="page-head"><h1>Tạo phiếu bảo hành</h1></div>

      <section className="card">
        <h2>1. Khách hàng</h2>
        <form className="inline-form" onSubmit={lookupCustomer}>
          <label>Số điện thoại (10 chữ số)
            <input value={phone} onChange={(e) => { setPhone(e.target.value); setCustomer(null); setCustomerMissing(false); }} inputMode="numeric" maxLength={10} placeholder="0912345678" />
          </label>
          <button className="btn" disabled={customerBusy || phone.length === 0}>{customerBusy ? 'Đang tra cứu…' : 'Tra cứu'}</button>
        </form>
        <ErrorBox error={customerError} />
        {customer && (
          <p className="found" data-testid="customer-found">✔ <strong>{customer.fullName}</strong> · {customer.phone}{customer.email ? ` · ${customer.email}` : ''}</p>
        )}
        {customerMissing && (
          <form className="subform" onSubmit={createCustomer}>
            <p className="notice">Không tìm thấy khách hàng với số {phone}. Nhập thông tin để tạo hồ sơ mới.</p>
            <label>Họ tên <input value={newName} onChange={(e) => setNewName(e.target.value)} /></label>
            <label>Email (không bắt buộc) <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} /></label>
            <button className="btn btn-primary" disabled={customerBusy}>Tạo hồ sơ khách hàng</button>
          </form>
        )}
      </section>

      <section className={`card ${customer ? '' : 'card-disabled'}`}>
        <h2>2. Thiết bị</h2>
        <form className="inline-form" onSubmit={lookupDevice}>
          <label>Số serial
            <input value={serial} disabled={!customer} onChange={(e) => { setSerial(e.target.value); setDevice(null); setDeviceMissing(false); }} placeholder="SN-100007" />
          </label>
          <button className="btn" disabled={!customer || deviceBusy || serial.length === 0}>{deviceBusy ? 'Đang kiểm tra…' : 'Kiểm tra serial'}</button>
        </form>
        <ErrorBox error={deviceError} />
        {device && (
          <p className="found">✔ <strong>{device.modelName}</strong> · {device.serialNo}{device.purchaseDate ? ` · mua ${device.purchaseDate}` : ''}</p>
        )}
        {deviceMissing && (
          <form className="subform" onSubmit={createDevice}>
            <p className="notice">Thiết bị chưa được ghi nhận. Nhập thông tin để thêm mới.</p>
            <label>Mẫu thiết bị <input value={model} onChange={(e) => setModel(e.target.value)} /></label>
            <label>Ngày mua (không bắt buộc) <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} /></label>
            <button className="btn btn-primary" disabled={deviceBusy}>Ghi nhận thiết bị</button>
          </form>
        )}
      </section>

      <section className={`card ${customer && device ? '' : 'card-disabled'}`}>
        <h2>3. Mô tả lỗi</h2>
        <form onSubmit={submit}>
          <label>Mô tả lỗi (tối đa 1000 ký tự)
            <textarea rows={4} value={issueDesc} maxLength={1000} disabled={!(customer && device)} onChange={(e) => setIssueDesc(e.target.value)} />
          </label>
          <p className="muted">{issueDesc.length}/1000 ký tự</p>
          <ErrorBox error={submitError} />
          <button className="btn btn-primary" disabled={!(customer && device) || submitBusy || issueDesc.trim() === ''}>
            {submitBusy ? 'Đang tạo phiếu…' : 'Tạo phiếu'}
          </button>
        </form>
      </section>
    </>
  );
}

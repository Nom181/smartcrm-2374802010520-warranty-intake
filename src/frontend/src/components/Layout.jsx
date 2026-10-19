import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const ROLE_LABEL = { STAFF: 'Nhân viên tiếp nhận', MANAGER: 'Quản lý trung tâm' };

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <strong className="brand">Tiếp nhận bảo hành</strong>
          <nav className="nav">
            <NavLink to="/requests" end>Danh sách phiếu</NavLink>
            {user.role === 'STAFF' && <NavLink to="/requests/new">Tạo phiếu</NavLink>}
          </nav>
          <div className="user">
            <span>{user.fullName} · {ROLE_LABEL[user.role] || user.role}</span>
            <button type="button" className="btn btn-ghost" onClick={logout}>Đăng xuất</button>
          </div>
        </div>
      </header>
      <main className="container"><Outlet /></main>
    </>
  );
}

import { useCallback, useEffect, useState } from 'react';

// Nạp dữ liệu qua `fetcher` và báo trạng thái: 'loading' | 'ready' | 'error'.
// reload() chạy lại (dùng cho nút "Thử lại"). deps: danh sách giá trị làm nạp lại khi đổi.
export function useResource(fetcher, deps = []) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', data: null, error: null });
    fetcher()
      .then((data) => { if (!cancelled) setState({ status: 'ready', data, error: null }); })
      .catch((error) => { if (!cancelled) setState({ status: 'error', data: null, error }); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

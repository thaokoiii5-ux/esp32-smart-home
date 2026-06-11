import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Wind, LogOut, Menu, X, Home, User,
  Check, AlertCircle, Wifi, WifiOff, RefreshCw, Power,
  ChevronRight, BarChart3, Thermometer, Droplets, Flame,
  Shield, ShieldAlert,
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart
} from 'recharts';

// ═══════════════════════════════════════════════════════════
// ⚙️ CẤU HÌNH HỆ THỐNG
// THAY ĐỔI TOKEN NẾU CẦN
// ═══════════════════════════════════════════════════════════
const CONFIG = { 
  // 🌐 ThingsBoard Cloud config 
   TB_URL: 'https://thingsboard.cloud', 
 // DEVICE TOKEN 
   TB_TOKEN: '8bh879qakyh4ev58tw7l', 
  // THINGSBOARD LOGIN 
   TB_USERNAME: 'anhdung.ptit999@gmail.com', 
   TB_PASSWORD: 'Nhom16@',
  // DEVICE ID 
   TB_DEVICE_ID: 'e61c5c50-5e7c-11f1-b18f-730fe01d1a05',
  // 📊 Cấu hình polling
  POLL_INTERVAL_MS: 5000,        // Lấy dữ liệu mỗi 5 giây
  MAX_CHART_POINTS: 60,          // Lưu tối đa 60 điểm biểu đồ
  
  // ⚠️ Ngưỡng cảnh báo
  THRESHOLDS: {
    temperature: 40,  // °C
    humidity: 70,     // %
    gas: 800,         // ppm
  },
  
  // 🔧 Debug mode
  DEBUG: true,
};

// ═══════════════════════════════════════════════════════════
// 🌐 THINGSBOARD API SERVICE
// ═══════════════════════════════════════════════════════════
const ThingsBoard = {

  async getLatestData() {

    try {

      console.log("📡 Fetching telemetry...");

      // LOGIN
      const loginRes = await fetch(
        `${CONFIG.TB_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: CONFIG.TB_USERNAME,
            password: CONFIG.TB_PASSWORD,
          }),
        }
      );

      const loginData = await loginRes.json();

      const jwt = loginData.token;

      // GET TELEMETRY
      const telemetryUrl =
        `${CONFIG.TB_URL}/api/plugins/telemetry/DEVICE/${CONFIG.TB_DEVICE_ID}/values/timeseries?keys=temperature,humidity,gas,fanRunning,buzzerRunning,danger`;

      const response = await fetch(telemetryUrl, {
        method: "GET",
        headers: {
          "X-Authorization": `Bearer ${jwt}`,
        },
      });

      const json = await response.json();

      console.log("✅ DATA:", json);

      const getValue = (key) => {
        if (!json[key] || !json[key][0]) return null;
        return json[key][0].value;
      };

      return {
        ok: true,
        temperature: parseFloat(getValue("temperature")) || 0,
        humidity: parseFloat(getValue("humidity")) || 0,
        gas: parseFloat(getValue("gas")) || 0,
        fanRunning: getValue("fanRunning") === "true",
        buzzerRunning: getValue("buzzerRunning") === "true",
        danger: getValue("danger") === "true",
      };

    } catch (error) {

      console.log("❌ ERROR:", error);

      return {
        ok: false,
        error: error.message,
      };
    }
  },

  async sendCommand(key, value) {

    try {
            // LOGIN lấy JWT
      const loginRes = await fetch(
        `${CONFIG.TB_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: CONFIG.TB_USERNAME,
            password: CONFIG.TB_PASSWORD,
          }),
        }
      );

      const loginData = await loginRes.json();

      const jwt = loginData.token;

      // GHI SHARED ATTRIBUTE
      const url =
        `${CONFIG.TB_URL}/api/plugins/telemetry/DEVICE/${CONFIG.TB_DEVICE_ID}/SHARED_SCOPE`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Authorization": `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          [key]: value,
        }),
      });
            return response.ok;

    } catch (error) {

      console.log(error);

      return false;

    }
  },

};
// ═══════════════════════════════════════════════════════════
// 💾 LOCAL STORAGE
// ═══════════════════════════════════════════════════════════
const LS = {
  get: (k, fb) => {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : fb;
    } catch {
      return fb;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {
      console.warn('localStorage error:', e);
    }
  },
  del: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {}
  },
};

// ═══════════════════════════════════════════════════════════
// 👥 DEFAULT USERS
// ═══════════════════════════════════════════════════════════
const DEFAULT_USERS = {
  admin: { password: 'admin123', role: 'admin', name: 'Administrator' },
  user: { password: 'user123', role: 'user', name: 'Người dùng' },
  guest: { password: 'guest123', role: 'guest', name: 'Khách' },
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pct = (v, mn, mx) => clamp(((v - mn) / (mx - mn)) * 100, 0, 100);

function useUsers() {
  const [users, setUsersRaw] = useState(() => LS.get('sh_users', DEFAULT_USERS));
  const setUsers = (u) => {
    setUsersRaw(u);
    LS.set('sh_users', u);
  };
  return [users, setUsers];
}

// ═══════════════════════════════════════════════════════════
// 🎨 DESIGN TOKENS
// ═══════════════════════════════════════════════════════════
const T = {
  bg: '#070d1a',
  bgCard: 'rgba(10,20,40,0.85)',
  border: 'rgba(56,100,180,0.18)',
  borderHi: 'rgba(56,165,255,0.35)',
  cyan: '#38bdf8',
  blue: '#3b82f6',
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
  muted: '#64748b',
  text: '#e2e8f0',
  textDim: '#94a3b8',
  font: '"Inter", "Segoe UI", system-ui, sans-serif',
};

const card = {
  background: T.bgCard,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: `1px solid ${T.border}`,
  borderRadius: '16px',
  padding: '1.5rem',
};

const input = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 14px',
  background: 'rgba(5,12,28,0.7)',
  border: `1px solid ${T.border}`,
  borderRadius: '10px',
  color: T.text,
  fontSize: '0.875rem',
  outline: 'none',
  fontFamily: T.font,
};

// ═══════════════════════════════════════════════════════════
// 🧩 COMPONENTS
// ═══════════════════════════════════════════════════════════

function Toggle({ on, onChange, disabled }) {
  return (
    <button onClick={onChange} disabled={disabled}
      style={{
        width: '52px', height: '28px', borderRadius: '14px', border: 'none',
        background: on ? `linear-gradient(90deg, ${T.cyan}, ${T.blue})` : 'rgba(30,41,59,0.8)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative', transition: 'background .3s', opacity: disabled ? 0.4 : 1,
      }}>
      <span style={{
        position: 'absolute', top: '3px', left: on ? '27px' : '3px',
        width: '22px', height: '22px', borderRadius: '50%',
        background: '#fff', transition: 'left .3s cubic-bezier(.4,0,.2,1)',
      }} />
    </button>
  );
}

function Badge({ on, label }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '20px', fontWeight: 700, fontSize: '.75rem',
      background: on ? 'rgba(34,197,94,.12)' : 'rgba(100,116,139,.12)',
      color: on ? T.green : T.muted,
      border: `1px solid ${on ? 'rgba(34,197,94,.3)' : 'rgba(100,116,139,.25)'}`,
      display: 'inline-flex', alignItems: 'center', gap: '5px',
    }}>
      <span style={{
        width: '6px', height: '6px', borderRadius: '50%',
        background: on ? T.green : T.muted,
      }} />
      {label}
    </span>
  );
}

function Gauge({ value, min, max, color, size = 72 }) {
  const p = pct(value, min, max);
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  const dash = (p / 100) * c * 0.75;
  const off = c * 0.125;
  return (
    <svg width={size} height={size * 0.72}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="6"
        strokeDasharray={`${c * 0.75} ${c * 0.25}`} strokeDashoffset={-off} strokeLinecap="round"
        transform={`rotate(135 ${size / 2} ${size / 2})`} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-off} strokeLinecap="round"
        transform={`rotate(135 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray .6s ease' }} />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════
// 📖 LOGIN PAGE
// ═══════════════════════════════════════════════════════════
function LoginPage({ onLogin }) {
  const [users, setUsers] = useUsers();
  const [tab, setTab] = useState('login');
  const [f, setF] = useState({ username: '', password: '', name: '', confirm: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));

    const u = users[f.username.trim()];
    if (u && u.password === f.password) {
      const data = { username: f.username.trim(), role: u.role, name: u.name };
      LS.set('sh_session', data);
      onLogin(data);
    } else {
      setErr('Sai tên đăng nhập hoặc mật khẩu.');
    }
    setLoading(false);
  };

  const register = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 250));

    const uname = f.username.trim();
    if (!uname || !f.password || !f.name) {
      setErr('Vui lòng điền đầy đủ.');
      setLoading(false);
      return;
    }
    if (f.password.length < 6) {
      setErr('Mật khẩu tối thiểu 6 ký tự.');
      setLoading(false);
      return;
    }
    if (f.password !== f.confirm) {
      setErr('Mật khẩu xác nhận không khớp.');
      setLoading(false);
      return;
    }
    if (users[uname]) {
      setErr('Tên đăng nhập đã tồn tại.');
      setLoading(false);
      return;
    }

    setUsers({ ...users, [uname]: { password: f.password, role: 'user', name: f.name } });
    setF({ username: '', password: '', name: '', confirm: '' });
    setTab('login');
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: T.font }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', background: `linear-gradient(135deg, ${T.cyan}, ${T.blue})`, padding: '12px', borderRadius: '14px', marginBottom: '1rem' }}>
            <Flame size={28} color="#fff" />
          </div>
          <h1 style={{ margin: '0 0 4px', fontWeight: 900, fontSize: '1.5rem', background: `linear-gradient(90deg, ${T.cyan}, ${T.blue})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Smart Home Gas Monitor
          </h1>
          <p style={{ color: T.muted, fontSize: '.8rem', margin: 0 }}>ESP32 + ThingsBoard Cloud</p>
        </div>

        <div style={{ ...card, boxShadow: '0 30px 60px rgba(0,0,0,.6)' }}>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,.4)', borderRadius: '10px', padding: '3px', marginBottom: '1.5rem', gap: '3px' }}>
            {[['login', '🔑 Đăng nhập'], ['register', '📝 Đăng ký']].map(([id, label]) => (
              <button key={id} type="button" onClick={() => { setTab(id); setErr(''); }}
                style={{
                  flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '.8rem',
                  background: tab === id ? `linear-gradient(135deg, ${T.cyan}, ${T.blue})` : 'transparent',
                  color: tab === id ? '#fff' : T.muted, transition: 'all .2s', fontFamily: T.font,
                }}>
                {label}
              </button>
            ))}
          </div>

          {err && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#fca5a5', borderRadius: '10px', padding: '10px 14px', fontSize: '0.83rem', marginBottom: '1rem', display: 'flex', gap: '8px', alignItems: 'center' }}><AlertCircle size={15} />{err}</div>}

          {tab === 'login' ? (
            <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', color: T.textDim, fontSize: '.78rem', fontWeight: 600, marginBottom: '5px' }}>Tên đăng nhập</label>
                <input value={f.username} onChange={e => setF(p => ({ ...p, username: e.target.value }))} placeholder="username" style={input} />
              </div>
              <div>
                <label style={{ display: 'block', color: T.textDim, fontSize: '.78rem', fontWeight: 600, marginBottom: '5px' }}>Mật khẩu</label>
                <input type="password" value={f.password} onChange={e => setF(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" style={input} />
              </div>
              <button type="submit" disabled={loading || !f.username || !f.password}
                style={{
                  padding: '11px', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '.9rem',
                  background: (loading || !f.username || !f.password) ? '#1e293b' : `linear-gradient(135deg, ${T.cyan}, ${T.blue})`,
                  color: (loading || !f.username || !f.password) ? T.muted : '#fff',
                  cursor: 'pointer', fontFamily: T.font,
                }}>
                {loading ? '⏳ Đang đăng nhập...' : '🔑 Đăng nhập'}
              </button>
            </form>
          ) : (
            <form onSubmit={register} style={{ display: 'flex', flexDirection: 'column', gap: '.9rem' }}>
              {[['username', 'Tên đăng nhập'], ['name', 'Tên hiển thị'], ['password', 'Mật khẩu'], ['confirm', 'Xác nhận']].map(([k, l]) => (
                <div key={k}>
                  <label style={{ display: 'block', color: T.textDim, fontSize: '.78rem', fontWeight: 600, marginBottom: '5px' }}>{l}</label>
                  <input type={k.includes('password') ? 'password' : 'text'} value={f[k]} onChange={e => setF(p => ({ ...p, [k]: e.target.value }))} style={input} />
                </div>
              ))}
              <button type="submit" disabled={loading}
                style={{
                  padding: '11px', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '.9rem',
                  background: loading ? '#1e293b' : `linear-gradient(135deg, ${T.cyan}, ${T.blue})`,
                  color: loading ? T.muted : '#fff',
                  cursor: 'pointer', fontFamily: T.font,
                }}>
                {loading ? '⏳ Đang tạo...' : '✅ Đăng ký'}
              </button>
            </form>
          )}

          {tab === 'login' && (
            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: `1px solid ${T.border}` }}>
              <p style={{ color: T.muted, fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '8px' }}>Tài khoản demo</p>
              {[['admin', 'admin123', '👨‍💼 Admin'], ['user', 'user123', '👤 User'], ['guest', 'guest123', '👁️ Guest']].map(([u, p, label]) => (
                <button key={u} type="button" onClick={() => setF(fv => ({ ...fv, username: u, password: p }))}
                  style={{ background: 'rgba(0,0,0,.3)', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: T.font, width: '100%', marginBottom: '5px' }}>
                  <span style={{ color: T.cyan, fontFamily: 'monospace', fontSize: '.8rem' }}>{u} / {p}</span>
                  <span style={{ color: T.muted, fontSize: '.75rem' }}>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 📊 DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════
function DashboardPage({ sensor, connected, loading, history }) {
  const { temperature: temp, humidity, gas, danger, fanRunning, buzzerRunning } = sensor;
  const THR = CONFIG.THRESHOLDS;

  const chartData = useMemo(() => {
    return history.map(h => ({
      time: new Date(h.ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      temperature: h.temperature ? parseFloat(h.temperature) : null,
      humidity: h.humidity ? parseFloat(h.humidity) : null,
      gas: h.gas ? parseFloat(h.gas) : null,
    })).reverse();
  }, [history]);

  const isDanger = danger || (temp && temp > THR.temperature) || (humidity && humidity > THR.humidity) || (gas && gas > THR.gas);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.6rem', background: `linear-gradient(90deg, ${T.cyan}, ${T.blue})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Dashboard
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {loading && <span style={{ color: T.muted, fontSize: '.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Cập nhật…</span>}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '20px', border: `1px solid ${connected ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)'}`, background: connected ? 'rgba(34,197,94,.08)' : 'rgba(239,68,68,.08)', fontSize: '.78rem', fontWeight: 600, color: connected ? T.green : T.red }}>
            {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
            {connected ? 'ThingsBoard kết nối' : 'Mất kết nối'}
          </div>
        </div>
      </div>

      {isDanger && (
        <div style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.4)', borderRadius: '14px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px', animation: 'pulse 1.5s infinite' }}>
          <ShieldAlert size={22} color={T.red} />
          <div>
            <div style={{ color: T.red, fontWeight: 800, fontSize: '.95rem' }}>⚠️ CẢNH BÁO NGUY HIỂM</div>
            <div style={{ color: '#fca5a5', fontSize: '.8rem', marginTop: '2px' }}>
              {temp > THR.temperature ? `Nhiệt độ: ${Number(temp).toFixed(1)}°C (ngưỡng ${THR.temperature}°C)  ` : ''}
              {humidity > THR.humidity ? `Độ ẩm: ${Number(humidity).toFixed(0)}% (ngưỡng ${THR.humidity}%)  ` : ''}
              {gas > THR.gas ? `Khí gas: ${Number(gas).toFixed(0)} ppm (ngưỡng ${THR.gas} ppm)` : ''}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{ ...card, border: `1px solid ${temp > THR.temperature ? 'rgba(245,158,11,.3)' : T.border}`, background: temp > THR.temperature ? 'rgba(245,158,11,.07)' : T.bgCard }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Thermometer size={20} color={T.amber} />
              <span style={{ color: T.textDim, fontSize: '.78rem', fontWeight: 600 }}>Nhiệt độ</span>
            </div>
            <Gauge value={Number(temp || 0)} min={0} max={60} color={temp > THR.temperature ? T.red : T.amber} size={54} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '.5rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: temp > THR.temperature ? T.red : T.text }}>{Number(temp || 0).toFixed(1)}</span>
            <span style={{ color: T.muted, fontSize: '.85rem' }}>°C</span>
          </div>
          <div style={{ fontSize: '.72rem', color: temp > THR.temperature ? '#fca5a5' : T.muted }}>
            {temp > THR.temperature ? `⚠️ Vượt ngưỡng ${THR.temperature}°C` : `✓ Bình thường`}
          </div>
        </div>

        <div style={{ ...card, border: `1px solid ${humidity > THR.humidity ? 'rgba(56,189,248,.3)' : T.border}`, background: humidity > THR.humidity ? 'rgba(56,189,248,.07)' : T.bgCard }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Droplets size={20} color={T.blue} />
              <span style={{ color: T.textDim, fontSize: '.78rem', fontWeight: 600 }}>Độ ẩm</span>
            </div>
            <Gauge value={Number(humidity || 0)} min={0} max={100} color={humidity > THR.humidity ? T.red : T.blue} size={54} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '.5rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: humidity > THR.humidity ? T.red : T.text }}>{Number(humidity || 0).toFixed(0)}</span>
            <span style={{ color: T.muted, fontSize: '.85rem' }}>%</span>
          </div>
          <div style={{ fontSize: '.72rem', color: humidity > THR.humidity ? '#fca5a5' : T.muted }}>
            {humidity > THR.humidity ? `⚠️ Vượt ngưỡng ${THR.humidity}%` : `✓ Bình thường`}
          </div>
        </div>

        <div style={{ ...card, border: `1px solid ${gas > THR.gas ? 'rgba(34,197,94,.3)' : T.border}`, background: gas > THR.gas ? 'rgba(239,68,68,.07)' : T.bgCard }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wind size={20} color={T.green} />
              <span style={{ color: T.textDim, fontSize: '.78rem', fontWeight: 600 }}>Khí gas</span>
            </div>
            <Gauge value={Number(gas || 0)} min={0} max={1200} color={gas > THR.gas ? T.red : T.green} size={54} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '.5rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: gas > THR.gas ? T.red : T.text }}>{Number(gas || 0).toFixed(0)}</span>
            <span style={{ color: T.muted, fontSize: '.85rem' }}>ppm</span>
          </div>
          <div style={{ fontSize: '.72rem', color: gas > THR.gas ? '#fca5a5' : T.muted }}>
            {gas > THR.gas ? `⚠️ Vượt ngưỡng ${THR.gas} ppm` : `✓ Bình thường`}
          </div>
        </div>

        <div style={{ ...card, border: `1px solid ${isDanger ? 'rgba(239,68,68,.35)' : 'rgba(34,197,94,.25)'}`, background: isDanger ? 'rgba(239,68,68,.07)' : 'rgba(34,197,94,.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ color: T.textDim, fontSize: '.78rem', fontWeight: 600, textTransform: 'uppercase' }}>TRẠNG THÁI</span>
            {isDanger ? <ShieldAlert size={20} color={T.red} /> : <Shield size={20} color={T.green} />}
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: isDanger ? T.red : T.green, marginBottom: '1rem' }}>
            {isDanger ? '⚠️ NGUY HIỂM' : '✅ AN TOÀN'}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Badge on={fanRunning} label={fanRunning ? 'Quạt ON' : 'Quạt OFF'} />
            <Badge on={buzzerRunning} label={buzzerRunning ? 'Còi ON' : 'Còi OFF'} />
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
          <BarChart3 size={16} color={T.cyan} />
          <span style={{ color: T.textDim, fontSize: '.82rem', fontWeight: 600 }}>Biểu đồ dữ liệu real-time</span>
          <span style={{ color: T.muted, fontSize: '.72rem' }}>({chartData.length} điểm)</span>
        </div>

        {chartData.length < 2 ? (
          <div style={{ ...card, textAlign: 'center', color: T.muted, padding: '2rem' }}>
            Đang chờ dữ liệu từ ThingsBoard…
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            <div style={card}>
              <p style={{ color: T.textDim, fontSize: '.78rem', fontWeight: 600, margin: '0 0 .75rem' }}>Nhiệt độ (°C)</p>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={T.amber} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={T.amber} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                  <XAxis dataKey="time" tick={{ fill: T.muted, fontSize: 11 }} />
                  <YAxis tick={{ fill: T.muted, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'rgba(5,12,28,.95)', border: `1px solid ${T.borderHi}`, borderRadius: '10px' }} />
                  <ReferenceLine y={THR.temperature} stroke={T.red} strokeDasharray="4 3" label={{ value: 'Ngưỡng', position: 'right', fill: T.red, fontSize: 10 }} />
                  <Area type="monotone" dataKey="temperature" stroke={T.amber} strokeWidth={2} fill="url(#colorTemp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={card}>
              <p style={{ color: T.textDim, fontSize: '.78rem', fontWeight: 600, margin: '0 0 .75rem' }}>Độ ẩm (%)</p>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorHumi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={T.blue} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={T.blue} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                  <XAxis dataKey="time" tick={{ fill: T.muted, fontSize: 11 }} />
                  <YAxis tick={{ fill: T.muted, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'rgba(5,12,28,.95)', border: `1px solid ${T.borderHi}`, borderRadius: '10px' }} />
                  <ReferenceLine y={THR.humidity} stroke={T.red} strokeDasharray="4 3" label={{ value: 'Ngưỡng', position: 'right', fill: T.red, fontSize: 10 }} />
                  <Area type="monotone" dataKey="humidity" stroke={T.blue} strokeWidth={2} fill="url(#colorHumi)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={card}>
              <p style={{ color: T.textDim, fontSize: '.78rem', fontWeight: 600, margin: '0 0 .75rem' }}>Khí gas (ppm)</p>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorGas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={T.green} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={T.green} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                  <XAxis dataKey="time" tick={{ fill: T.muted, fontSize: 11 }} />
                  <YAxis tick={{ fill: T.muted, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'rgba(5,12,28,.95)', border: `1px solid ${T.borderHi}`, borderRadius: '10px' }} />
                  <ReferenceLine y={THR.gas} stroke={T.red} strokeDasharray="4 3" label={{ value: 'Ngưỡng', position: 'right', fill: T.red, fontSize: 10 }} />
                  <Area type="monotone" dataKey="gas" stroke={T.green} strokeWidth={2} fill="url(#colorGas)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎮 CONTROL PAGE
// ═══════════════════════════════════════════════════════════
function ControlPage({ sensor, onControl, userRole }) {
  const [busy, setBusy] = useState({ fan: false, buzzer: false });
  const canControl = userRole !== 'guest';

  const toggle = async (dev) => {
    if (!canControl || busy[dev]) return;
    setBusy(p => ({ ...p, [dev]: true }));
    const newVal = dev === 'fan' ? !sensor.fanRunning : !sensor.buzzerRunning;
    await onControl(dev, newVal);
    setBusy(p => ({ ...p, [dev]: false }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.6rem', background: `linear-gradient(90deg, ${T.cyan}, ${T.blue})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Điều khiển từ xa
      </h2>

      {!canControl && <div style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.3)', borderRadius: '12px', padding: '12px 16px', color: '#fcd34d', fontSize: '.85rem', display: 'flex', gap: '8px', alignItems: 'center' }}><AlertCircle size={16} />Guest chỉ xem được. Đăng nhập Admin/User để điều khiển.</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
        {[
          { dev: 'fan', label: 'Quạt', icon: '🌀', color: T.cyan, desc: 'GPIO 26 relay' },
          { dev: 'buzzer', label: 'Còi báo động', icon: '🔔', color: T.amber, desc: 'GPIO 25 buzzer' },
        ].map(({ dev, label, icon, color, desc }) => (
          <div key={dev} style={{ ...card, border: `1px solid ${dev === 'fan' ? sensor.fanRunning : sensor.buzzerRunning ? (color === T.cyan ? 'rgba(56,189,248,.3)' : 'rgba(245,158,11,.3)') : T.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', color: T.text, fontWeight: 700 }}>{label}</h3>
                <p style={{ margin: 0, color: T.muted, fontSize: '.75rem' }}>{desc}</p>
              </div>
              <span style={{ fontSize: '2rem' }}>{icon}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: dev === 'fan' ? sensor.fanRunning ? T.green : '#334155' : sensor.buzzerRunning ? T.green : '#334155' }}>
                  {dev === 'fan' ? sensor.fanRunning ? 'ON' : 'OFF' : sensor.buzzerRunning ? 'ON' : 'OFF'}
                </div>
              </div>
              <Toggle on={dev === 'fan' ? sensor.fanRunning : sensor.buzzerRunning} onChange={() => toggle(dev)} disabled={!canControl || busy[dev]} />
            </div>
            <button onClick={() => toggle(dev)} disabled={!canControl || busy[dev]}
              style={{
                padding: '10px', borderRadius: '10px', border: `1px solid ${dev === 'fan' ? sensor.fanRunning ? 'rgba(239,68,68,.4)' : 'rgba(34,197,94,.4)' : sensor.buzzerRunning ? 'rgba(239,68,68,.4)' : 'rgba(34,197,94,.4)'}`,
                background: dev === 'fan' ? sensor.fanRunning ? 'rgba(239,68,68,.1)' : 'rgba(34,197,94,.1)' : sensor.buzzerRunning ? 'rgba(239,68,68,.1)' : 'rgba(34,197,94,.1)',
                color: dev === 'fan' ? sensor.fanRunning ? T.red : T.green : sensor.buzzerRunning ? T.red : T.green,
                fontWeight: 700, cursor: (!canControl || busy[dev]) ? 'not-allowed' : 'pointer', width: '100%', fontFamily: T.font, opacity: (!canControl || busy[dev]) ? 0.5 : 1,
              }}>
              {busy[dev] ? `⏳ Gửi lệnh...` : dev === 'fan' ? sensor.fanRunning ? '🔴 Tắt' : '🟢 Bật' : sensor.buzzerRunning ? '🔴 Tắt' : '🟢 Bật'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 👤 PROFILE PAGE
// ═══════════════════════════════════════════════════════════
function ProfilePage({ user, userRole }) {
  const perms = {
    admin: ['Xem Dashboard + Biểu đồ', 'Điều khiển thiết bị', 'Quản lý tài khoản'],
    user: ['Xem Dashboard + Biểu đồ', 'Điều khiển thiết bị'],
    guest: ['Xem Dashboard'],
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.6rem', background: `linear-gradient(90deg, ${T.cyan}, ${T.blue})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Hồ sơ
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        <div style={card}>
          <h3 style={{ margin: '0 0 1rem', color: T.text, fontWeight: 700 }}>Thông tin cá nhân</h3>
          {[['Tên đăng nhập', user.username, T.cyan], ['Tên hiển thị', user.name, T.text], ['Vai trò', user.role.toUpperCase(), T.blue]].map(([label, value, color]) => (
            <div key={label} style={{ marginBottom: '12px' }}>
              <div style={{ color: T.muted, fontSize: '.72rem', marginBottom: '3px' }}>{label}</div>
              <div style={{ color, fontWeight: 700, fontSize: '.95rem' }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={card}>
          <h3 style={{ margin: '0 0 1rem', color: T.text, fontWeight: 700 }}>Quyền hạn</h3>
          {(perms[user.role] || []).map(p => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'rgba(34,197,94,.05)', border: '1px solid rgba(34,197,94,.12)', borderRadius: '8px', marginBottom: '6px' }}>
              <Check size={14} color={T.green} />
              <span style={{ color: '#86efac', fontSize: '.82rem' }}>{p}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 📱 SIDEBAR
// ═══════════════════════════════════════════════════════════
function LogsPage({ history = [] }) {

  return (

    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>

      <h2 style={{
        margin: 0,
        fontWeight: 800,
        fontSize: '1.6rem',
        color: T.cyan
      }}>
        Lịch sử hoạt động
      </h2>

      {history.length === 0 ? (

        <div style={card}>
          Chưa có hoạt động nào
        </div>

      ) : (

        history.map((log, index) => (

          <div
            key={index}
            style={{
              ...card,
              padding: '12px'
            }}
          >

            <div style={{
              color: T.text,
              fontWeight: 700
            }}>
              {log.action}
            </div>

            <div style={{
              color: T.muted,
              fontSize: '.8rem',
              marginTop: '4px'
            }}>
              {log.user} ({log.role}) - {log.time}
            </div>

          </div>

        ))

      )}

    </div>

  );
}
function Sidebar({ page, setPage, role, open }) {
  const items = [
  {
    id: 'dashboard',
    icon: Home,
    label: 'Dashboard',
    roles: ['admin', 'user', 'guest']
  },

  {
    id: 'control',
    icon: Power,
    label: 'Điều khiển',
    roles: ['admin', 'user']
  },

  {
    id: 'logs',
    icon: BarChart3,
    label: 'Lịch sử',
    roles: ['admin']
  },

  {
    id: 'profile',
    icon: User,
    label: 'Hồ sơ',
    roles: ['admin', 'user', 'guest']
  },

].filter(i => i.roles.includes(role));
  return (
    <aside style={{ width: open ? '220px' : '0', minWidth: open ? '220px' : '0', overflow: 'hidden', transition: 'all .3s ease', background: 'rgba(5,12,28,.8)', backdropFilter: 'blur(20px)', borderRight: `1px solid ${T.border}`, flexShrink: 0 }}>
      <nav style={{ padding: '1rem .75rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {items.map(({ id, icon: Icon, label }) => {
          const active = page === id;
          return (
            <button key={id} onClick={() => setPage(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '10px',
                border: active ? `1px solid ${T.borderHi}` : '1px solid transparent',
                background: active ? 'rgba(56,189,248,.1)' : 'transparent',
                color: active ? T.cyan : T.muted,
                fontWeight: active ? 700 : 400, fontSize: '.875rem', cursor: 'pointer', width: '100%',
                textAlign: 'left', fontFamily: T.font, transition: 'all .2s',
              }}>
              <Icon size={16} />
              <span>{label}</span>
              {active && <ChevronRight size={13} style={{ marginLeft: 'auto' }} />}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎯 MAIN APP
// ═══════════════════════════════════════════════════════════
export default function App() {

  const [user, setUser] = useState(() => LS.get('sh_session', null));

  const [page, setPage] = useState('dashboard');

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [sensor, setSensor] = useState({
    temperature: null,
    humidity: null,
    gas: null,
    fanRunning: false,
    buzzerRunning: false,
    danger: false,
  });

  const sensorRef = useRef(sensor);

  sensorRef.current = sensor;

  const [connected, setConnected] = useState(false);

  const [polling, setPolling] = useState(false);

  const [history, setHistory] = useState(() => {
    return LS.get('sensor_history', []);
  });

 

useEffect(() => {
  LS.set('sensor_history', history);
}, [history]);

  const poll = useCallback(async () => {
    if (polling) return;
    setPolling(true);
    const result = await ThingsBoard.getLatestData();
    if (result.ok) {
      setSensor({
        temperature: result.temperature ?? sensorRef.current.temperature,
        humidity: result.humidity ?? sensorRef.current.humidity,
        gas: result.gas ?? sensorRef.current.gas,
        fanRunning: result.fanRunning ?? sensorRef.current.fanRunning,
        buzzerRunning: result.buzzerRunning ?? sensorRef.current.buzzerRunning,
        danger: result.danger ?? sensorRef.current.danger,
      });
      setConnected(true);
      setHistory(prev => [{ ...sensor, ts: Date.now() }, ...prev].slice(0, CONFIG.MAX_CHART_POINTS));
    } else {
      setConnected(false);
    }
    setPolling(false);
  }, [polling, sensor]);

  useEffect(() => {
    if (!user) return;
    poll();
    const iv = setInterval(poll, CONFIG.POLL_INTERVAL_MS);
    return () => clearInterval(iv);
  }, [user, poll]);

  const addLog = useCallback((action) => {

  const newLog = {
    user: user.name,
    role: user.role,
    action,
    time: new Date().toLocaleString(),
  };

  const updated = [newLog, ...history];

  setHistory(updated);

  LS.set('sensor_history', updated);

}, [history, user]);
  const handleControl = useCallback(async (dev, val) => {

  const key =
    dev === 'fan'
      ? 'fanRunning'
      : 'buzzerRunning';

  // Gửi lệnh xuống ThingsBoard trước
  const ok = await ThingsBoard.sendCommand(key, val);

  // Nếu thành công mới cập nhật giao diện
  if (ok) {

    setSensor(prev => ({
      ...prev,
      [key]: val
    }));

    addLog(`${val ? 'Bật' : 'Tắt'} ${dev}`);

    console.log("✅ Command success:", key, val);

  } else {

    console.log("❌ Command failed");

  }

  return ok;

}, [addLog]);

  const handleLogin = (d) => {
    setUser(d);
  };

  const handleLogout = () => {
    LS.del('sh_session');
    setUser(null);
    setPage('dashboard');
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: T.font, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }
        input:focus { border-color: ${T.cyan} !important; box-shadow: 0 0 0 2px rgba(56,189,248,.15); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,.2); }
        ::-webkit-scrollbar-thumb { background: rgba(56,189,248,.2); border-radius: 3px; }
      `}</style>

      <header style={{ background: 'rgba(5,12,28,.9)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${T.border}`, padding: '0 1.25rem', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => setSidebarOpen(o => !o)} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', lineHeight: 0, padding: '6px' }}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.blue})`, padding: '6px', borderRadius: '8px', lineHeight: 0 }}>
              <Flame size={18} color="#fff" />
            </div>
            <div>
              <div style={{ color: T.text, fontWeight: 800, fontSize: '.95rem' }}>Smart Home</div>
              <div style={{ color: T.muted, fontSize: '.65rem' }}>Gas Monitor</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: T.textDim, fontSize: '.8rem' }}>Xin chào, <span style={{ color: T.cyan, fontWeight: 700 }}>{user.name}</span></div>
            <div style={{ color: T.muted, fontSize: '.68rem' }}>{user.role.toUpperCase()}</div>
          </div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', color: T.red, padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '.8rem', fontFamily: T.font }}>
            <LogOut size={14} /> Thoát
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar page={page} setPage={setPage} role={user.role} open={sidebarOpen} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>

  {page === 'dashboard' && (
    <DashboardPage
      sensor={sensor}
      connected={connected}
      loading={polling}
      history={history}
    />
  )}

  {page === 'control' && user.role === 'admin' && (
    <ControlPage
      sensor={sensor}
      onControl={handleControl}
      userRole={user.role}
    />
  )}

  {page === 'control' && user.role !== 'admin' && (
    <div style={card}>
      Bạn không có quyền truy cập
    </div>
  )}

  {page === 'profile' && (
    <ProfilePage
      user={user}
      userRole={user.role}
    />
  )}

</main>cd
      </div>
    </div>
  );
}
import React, { useState, useEffect, useMemo } from 'react';
import './Student.css';

export default function Student() {
  const [status, setStatus] = useState('absent');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [markedTime, setMarkedTime] = useState(null);
  const [ringProgress, setRingProgress] = useState(0);

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [currentStudentName, setCurrentStudentName] = useState('Student');

  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    pending: 0,
    total: 0,
    percentage: 0,
    streak: 0,
    week: [],
    history: []
  });

  const handleLogoutClick = async () => {
    try {
      await fetch('http://localhost:5000/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      window.location.href = '/'; 
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  useEffect(() => {
    const prevMargin = document.body.style.margin;
    document.body.style.margin = '0';
    return () => { document.body.style.margin = prevMargin; };
  }, []);

  useEffect(() => {
    const fetchStudentStats = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/attendance/stats', {
          method: 'GET',
          credentials: 'include'
        });

        if (response.status === 400 || response.status === 401) {
          handleLogoutClick();
          return;
        }

        const data = await response.json();

        if (response.ok && data.success) {
          setStats(data.stats);

          if (data.studentName) {
            setCurrentStudentName(data.studentName);
          }

          const latestDay = data.stats.week[data.stats.week.length - 1];
          if (latestDay && latestDay.status !== 'absent' && latestDay.status !== 'no-session') {
            setStatus(latestDay.status);
            if (!markedTime && data.stats.history.length > 0) {
              setMarkedTime(data.stats.history[0].time);
            }
          }
        }
      } catch (err) {
        console.error("Stats Fetch Error:", err);
      }
    };

    fetchStudentStats();
    const intervalId = setInterval(fetchStudentStats, 5000);
    return () => clearInterval(intervalId);
  }, [markedTime]);

  useEffect(() => {
    const t = setTimeout(() => setRingProgress(stats.percentage), 300);
    return () => clearTimeout(t);
  }, [stats.percentage]);

  const today = useMemo(
    () => new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
    []
  );

  const initials = currentStudentName
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleMark = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (enteredOtp.length !== 4) {
      setErrorMessage("Please enter a valid 4-digit OTP.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/attendance/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: enteredOtp }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('pending');
        setMarkedTime(new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }));
        setEnteredOtp('');
      } else {
        setErrorMessage(data.msg || "Invalid OTP!");
      }
    } catch (err) {
      console.log(err);
      setErrorMessage("Server error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const statusEmoji = (s) => {
    if (s === 'present') return '🟢';
    if (s === 'pending') return '🟡';
    if (s === 'absent') return '🔴';
    return '⚪';
  };

  const r = 54;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (ringProgress / 100) * circumference;

  return (
    <div className="sd-root">
      <header className="sd-header smooth-enter-top">
        <div className="sd-brand">
          <div className="sd-stamp-mark">
            <svg viewBox="0 0 48 48" width="16" height="16" fill="none">
              <path d="M10 24L20 34L38 14" stroke="#12172B" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="sd-brand-name">Roll Call</span>
        </div>
        <div className="sd-header-right">
          <div className="sd-greeting">
            <p className="sd-greeting-hi">Welcome back</p>
            <p className="sd-greeting-name">{currentStudentName}</p>
          </div>
          <div className="sd-avatar">{initials}</div>
          
          <button
            onClick={handleLogoutClick}
            style={{
              padding: '8px 14px',
              background: 'transparent',
              border: '1px solid #7A7361',
              color: '#F3EFE6',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              marginLeft: '8px'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="sd-main">
        <section className="sd-hero smooth-enter-card">
          <p className="sd-date">{today}</p>

          {stats.streak > 0 && (
            <div className="sd-streak-badge">
              🔥 {stats.streak} day streak!
            </div>
          )}

          {status === 'absent' ? (
            <>
              <h1 className="sd-hero-title">Enter Today's Code</h1>
              <form onSubmit={handleMark} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="number"
                    placeholder="4-digit OTP"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    disabled={isLoading}
                    style={{ 
                      padding: '15px', 
                      borderRadius: '8px', 
                      border: '2px solid #ccc', 
                      fontSize: '18px', 
                      width: '150px',
                      backgroundColor: '#ffffff', 
                      color: '#000000',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{ padding: '15px 30px', borderRadius: '8px', background: isLoading ? '#555' : '#12172B', color: '#fff', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                    {isLoading ? 'Checking...' : 'Check In'}
                  </button>
                </div>
                {errorMessage && (
                  <p style={{ color: '#d9534f', fontWeight: 'bold', margin: '0', fontSize: '14px' }}>
                    ❌ {errorMessage}
                  </p>
                )}
              </form>
            </>
          ) : (
            <>
              <h1 className="sd-hero-title">
                {status === 'pending' ? 'Verification Pending...' : 'You are Present!'}
              </h1>
              <div style={{ padding: '20px', background: status === 'pending' ? '#fff3cd' : '#d4edda', borderRadius: '10px', margin: '20px 0', color: '#12172B', fontWeight: 'bold' }}>
                {status === 'pending'
                  ? 'Your attendance has been sent to the teacher. Waiting for approval.'
                  : 'Your teacher has approved your attendance!'}
              </div>
            </>
          )}

          <p className="sd-status-text">
            {status !== 'absent' ? `Action recorded at ${markedTime}` : "You haven't checked in yet today."}
          </p>

          <div className="sd-week-strip">
            {stats.week.map((d, index) => (
              <div className="sd-week-day" key={index}>
                <span className={`sd-week-box ${d.status}`} />
                <span className="sd-week-label">{d.day}</span>
              </div>
            ))}
          </div>
        </section>

        <aside className="sd-sidebar">
          <div className="sd-ring-card smooth-enter-card delay-1">
            <p className="sd-ring-title">Attendance rate</p>
            <svg className="sd-ring-svg" width="120" height="120" viewBox="0 0 120 120">
              <circle className="sd-ring-track" cx="60" cy="60" r={r} />
              <circle
                className="sd-ring-value"
                cx="60" cy="60" r={r}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
              <text x="60" y="65" textAnchor="middle" className="sd-ring-num">{stats.percentage}%</text>
            </svg>
            <p style={{ fontSize: '13px', color: '#7A7361', marginTop: '5px' }}>
              {stats.present} present / {stats.total} sessions
            </p>
          </div>

          <div className="sd-stats">
            <div className="sd-stat-card smooth-enter-card delay-2">
              <p className="sd-stat-num">{stats.present}</p>
              <p className="sd-stat-label">Days present</p>
            </div>
            <div className="sd-stat-card sd-stat-absent smooth-enter-card delay-2">
              <p className="sd-stat-num">{stats.absent}</p>
              <p className="sd-stat-label">Days absent</p>
            </div>
          </div>

          <div className="sd-history-card smooth-enter-card delay-2">
            <p className="sd-history-title">📅 Attendance History</p>

            {stats.history && stats.history.length > 0 ? (
              <div className="sd-history-list">
                {stats.history.slice(0, 10).map((h, i) => (
                  <div className="sd-history-item" key={i}>
                    <div className="sd-history-left">
                      <span className="sd-history-emoji">{statusEmoji(h.status)}</span>
                      <div className="sd-history-info">
                        <span className="sd-history-date">{h.fullDate}</span>
                        <span className="sd-history-time">{h.time}</span>
                      </div>
                    </div>
                    <span className={`sd-history-status sd-status-${h.status}`}>
                      {h.status.charAt(0).toUpperCase() + h.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#7A7361', textAlign: 'center', padding: '20px 0' }}>
                No attendance records yet.
              </p>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
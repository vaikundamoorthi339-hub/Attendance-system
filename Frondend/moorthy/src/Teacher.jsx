import React, { useState, useEffect, useMemo } from 'react';
import './Teacher.css';

export default function TeacherDashboard({ className = 'CSE - AI & ML' }) {
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState('');

  const [otp, setOtp] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const prevMargin = document.body.style.margin;
    document.body.style.margin = '0';
    return () => { document.body.style.margin = prevMargin; };
  }, []);

  useEffect(() => {
    const fetchLatestAttendance = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/attendance/latest`, {
          method: 'GET',
          credentials: 'include'
        });
        const data = await response.json();

        if (response.ok && data.success) {
          if (data.otp) {
            setOtp(data.otp);
          }

          if (data.students && data.students.length > 0) {
            const formattedStudents = data.students.map((s) => {
              const studentObj = s.studentId || {};
              return {
                id: studentObj._id || s.studentId || 'Unknown',
                name: studentObj.name || studentObj.user_name || 'Unknown User',
                userName: studentObj.user_name || '',
                status: s.status
              };
            });
            setStudents(formattedStudents);
          } else {
            setStudents([]);
          }
        }
      } catch (err) {
        console.error("Frontend Fetch Error:", err.message);
      }
    };

    fetchLatestAttendance();
    const intervalId = setInterval(fetchLatestAttendance, 3000);
    return () => clearInterval(intervalId);
  }, []);

  const today = useMemo(
    () => new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
    []
  );

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.userName.toLowerCase().includes(query.toLowerCase()) ||
    s.id.toLowerCase().includes(query.toLowerCase())
  );

  const presentCount = students.filter((s) => s.status === 'present').length;
  const pendingCount = students.filter((s) => s.status === 'pending').length;
  const absentCount = students.length - (presentCount + pendingCount);

  const generateOTP = async () => {
    setIsGenerating(true);
    setMessage('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/attendance/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setOtp(data.otp);
        setMessage('✅ OTP Generated Successfully!');
      } else {
        setMessage(`❌ Error: ${data.msg}`);
      }
    } catch (err) {
      console.error("Generate OTP error:", err);
      setMessage('❌ Server Error. Please check connection.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleStatus = async (id) => {
    const previousStatus = students.find((s) => s.id === id)?.status;

    if (previousStatus !== 'pending') return;

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return { ...s, status: 'present' }; // Intha line la strict ah present ku maathi
        }
        return s;
      })
    );

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/attendance/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: id }),
        credentials: 'include'
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setStudents((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: previousStatus } : s))
        );
        console.error('Failed to update in DB:', data.msg);
      }
    } catch (err) {
      setStudents((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: previousStatus } : s))
      );
      console.error('API call error:', err);
    }
  };

  return (
    <div className="td-root">
      <header className="td-header">
        <div className="td-brand">
          <div className="td-stamp-mark">
            <svg viewBox="0 0 48 48" width="16" height="16" fill="none">
              <path d="M10 24L20 34L38 14" stroke="#12172B" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="td-brand-text">
            <span className="td-brand-name">Roll Call Admin</span>
            <span className="td-class-name">{className}</span>
          </div>
        </div>
        <div className="td-header-right">
          <p className="td-header-date">{today}</p>
          <p className="td-header-teacher">Teacher Dashboard</p>
        </div>
      </header>

      <main className="td-main">
        <div className="td-otp-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              className="td-otp-btn"
              onClick={generateOTP}
              disabled={isGenerating}
              style={{ opacity: isGenerating ? 0.7 : 1, cursor: isGenerating ? 'not-allowed' : 'pointer' }}
            >
              {isGenerating ? 'Generating...' : "Generate Today's OTP"}
            </button>

            {otp && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>Share this code with students:</span>
                <span className="td-otp-display" style={{ fontWeight: 'bold', fontSize: '24px', letterSpacing: '2px', color: '#12172B' }}>
                  {otp}
                </span>
              </div>
            )}
          </div>

          {message && (
            <p style={{ color: message.includes('✅') ? 'green' : 'red', margin: 0, fontWeight: 'bold' }}>
              {message}
            </p>
          )}
        </div>

        <div className="td-toolbar">
          <div>
            <h1 className="td-heading" style={{ color: '#12172B' }}>Today's roll call</h1>
            <p className="td-subheading">
              <strong>{presentCount}</strong> Present, <strong>{pendingCount}</strong> Pending, <strong>{absentCount}</strong> Absent out of <strong>{students.length}</strong> students.
            </p>
          </div>
          <div className="td-search">
            <input
              type="text"
              placeholder="Search by name or ID"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="td-table-wrap">
          <table className="td-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Today's status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id} className="td-row-anim" style={{ animationDelay: `${i * 35}ms` }}>
                  <td className="td-student-id">{s.userName || s.id}</td>
                  <td className="td-student-name">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>{s.name}</span>
                      {s.userName && s.userName !== s.name && (
                        <span style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                          {s.userName}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`td-badge td-badge-${s.status}`}>
                      <span className="td-badge-dot" />
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    {s.status === 'pending' ? (
                      <button onClick={() => toggleStatus(s.id)} style={{ padding: '5px 10px', cursor: 'pointer', background: '#12172B', color: '#fff', borderRadius: '5px', border: 'none', fontWeight: 'bold' }}>
                        Approve
                      </button>
                    ) : (
                      <span style={{ color: '#28a745', fontWeight: 'bold', fontSize: '14px' }}>
                        ✔ Approved
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                    No students have submitted attendance yet today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
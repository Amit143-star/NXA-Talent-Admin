import React from 'react';
import { 
  Box, Typography, Card, CardContent, Grid, Button, Avatar, LinearProgress, Chip
} from '@mui/material';
import StarsIcon from '@mui/icons-material/Stars';
import SchoolIcon from '@mui/icons-material/School';
import CodeIcon from '@mui/icons-material/Code';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FolderIcon from '@mui/icons-material/Folder';
import WorkIcon from '@mui/icons-material/Work';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PersonIcon from '@mui/icons-material/Person';
import TerminalIcon from '@mui/icons-material/Terminal';
import NotificationsIcon from '@mui/icons-material/Notifications';
import './Home.css';

export default function Home({ state, setView }) {
  const isDark = localStorage.getItem('nxa_dark_mode') === 'true';

  const [liveData, setLiveData] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('nxa_live_broadcast')) || { active: false }; } catch(e) { return { active: false }; }
  });
  const [profiles, setProfiles] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('nxa_student_profiles')) || {}; } catch(e) { return {}; }
  });

  React.useEffect(() => {
    const handleUpdate = (e) => {
      const { key, data } = e.detail;
      if (key === 'nxa_live_broadcast') {
        setLiveData(data);
      } else if (key === 'nxa_student_profiles') {
        setProfiles(data);
      }
    };
    window.addEventListener('nxa_db_updated', handleUpdate);
    return () => window.removeEventListener('nxa_db_updated', handleUpdate);
  }, []);

  const pd = profiles[state.user.email.toLowerCase().trim()] || {};
  const myCourseIds = pd.assigned_courses || [];

  // Course title resolver mapping
  let coursesList = [];
  try { coursesList = JSON.parse(localStorage.getItem('nxa_system_courses')) || []; } catch(e) {}
  const getCourseTitle = (courseId) => {
    const course = coursesList.find(c => c.id === courseId);
    return course ? course.title : `Module #${courseId}`;
  };

  const solvedList = JSON.parse(localStorage.getItem('nxa_leetcode_solved')) || [];
  const solvedCount = solvedList.length;

  const myPoints = parseInt(localStorage.getItem(`nxa_points_${state.user.email}`)) || 0;
  const myAttendance = pd.attendance || {};
  const activeAttendanceDays = Object.values(myAttendance).filter(Boolean).length;

  const thoughts = [
    "Your identity is manifested through code.",
    "Technology is the ultimate bridge to success.",
    "Algorithm is the logic of industrial progress.",
    "Manifest your universal potential today."
  ];
  const dailyThought = thoughts[new Date().getDate() % thoughts.length];

  // Badges Earned check
  const hasCourses = myCourseIds.length > 0;
  const hasLeetcode = solvedCount >= 3;
  const hasMockPoints = myPoints > 0;
  const hasAttendance = activeAttendanceDays > 5;

  // Calculate profile completion percentage (based on 18 core fields)
  const coreFields = [
    'fullname', 'phone', 'gender', 'dob', 'blood_group', 'father_name', 'address',
    'college', 'branch', 'roll_no', 'reg_no', 'sem', 'cgpa', 'ug_marks',
    'github', 'linkedin', 'leetcode_username', 'primary_skill'
  ];
  const filledFieldsCount = coreFields.filter(field => pd[field] && String(pd[field]).trim() !== '').length;
  const completionPercentage = Math.round((filledFieldsCount / coreFields.length) * 100);

  // Radar math
  const skills = [
    { name: "Algorithms", val: Math.min(1.0, 0.15 + (solvedCount / 15)) },
    { name: "Web Dev", val: hasCourses ? 0.90 : 0.25 },
    { name: "Cloud Eng", val: myCourseIds.length > 1 ? 0.85 : 0.35 },
    { name: "System Sec", val: pd.payment_status === 'verified' ? 0.95 : 0.20 },
    { name: "Mock Performance", val: myPoints > 0 ? Math.min(1.0, 0.3 + (myPoints / 120)) : 0.15 }
  ];

  const angles = [-Math.PI/2, -Math.PI/10, Math.PI*3/10, Math.PI*7/10, Math.PI*11/10];
  const getRadarPoint = (index, value) => {
    const radius = 52 * value;
    const x = 75 + radius * Math.cos(angles[index]);
    const y = 75 + radius * Math.sin(angles[index]);
    return { x, y };
  };

  const polyPoints = skills.map((s, idx) => {
    const pt = getRadarPoint(idx, s.val);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  const makeBgPoly = (val) => {
    return skills.map((_, idx) => {
      const pt = getRadarPoint(idx, val);
      return `${pt.x},${pt.y}`;
    }).join(' ');
  };

  // Color variables mapping
  const themeCardClass = isDark ? 'cyber-card cyber-card-dark' : 'cyber-card cyber-card-light';
  const themeHeroClass = isDark ? 'hero-glow-panel-dark' : 'hero-glow-panel-light';
  const themeTextColor = isDark ? '#f8fafc' : '#0B2E59';
  const themeTextSec = isDark ? '#94a3b8' : '#64748b';
  const themeBorderColor = isDark ? 'rgba(247, 147, 30, 0.15)' : 'rgba(11, 46, 89, 0.08)';

  return (
    <Box className="cyber-dashboard" sx={{ p: 3, pb: '120px', background: isDark ? '#080d16' : '#ffffff', minHeight: '100vh' }}>
      
      {/* ═══════════════ SUPER ADMIN COMMAND CENTER ═══════════════ */}
      {state.role === 'admin' && state.roleType === 'super' && (() => {
        const allStudents = Object.values(profiles).filter(s => s && typeof s === 'object' && (s.fullname || s.email));
        const todayStr = new Date().toISOString().split('T')[0];
        const presentToday = allStudents.filter(s => s.attendance && s.attendance[todayStr]).length;
        const absentToday = allStudents.length - presentToday;
        let adminRoles = {};
        try { adminRoles = JSON.parse(localStorage.getItem('nxa_admin_roles')) || {}; } catch(e) {}
        const adminCount = Object.keys(adminRoles).length;
        let courses = [];
        try { courses = JSON.parse(localStorage.getItem('nxa_system_courses')) || []; } catch(e) {}
        let projects = [];
        try { projects = JSON.parse(localStorage.getItem('nxa_industrial_projects')) || []; } catch(e) {}
        let internships = [];
        try { internships = JSON.parse(localStorage.getItem('nxa_internship_matrix')) || []; } catch(e) {}
        let alerts = [];
        try { alerts = JSON.parse(localStorage.getItem('nxa_system_alerts')) || []; } catch(e) {}

        return (
          <>
            {/* Super Admin Header */}
            <Box sx={{ mb: 4, pb: 3, borderBottom: `1px solid ${themeBorderColor}` }}>
              <Typography variant="caption" sx={{ color: '#F7931E', fontWeight: 900, fontSize: '0.7rem', letterSpacing: '3px', display: 'block', mb: 1 }}>
                👑 SUPER ADMINISTRATOR
              </Typography>
              <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, color: themeTextColor }}>
                Command Center
              </Typography>
              <Typography variant="body2" sx={{ color: themeTextSec, mt: 0.5, fontSize: '0.8rem' }}>
                Full system oversight · Head of all Center & Max Admins
              </Typography>
            </Box>

            {/* Live System Status Banner */}
            <Card sx={{ mb: 3, borderRadius: '20px', border: `1px solid ${liveData.active ? '#ff4545' : themeBorderColor}`, background: liveData.active ? (isDark ? 'rgba(255,69,69,0.08)' : 'rgba(255,69,69,0.03)') : (isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(11, 46, 89, 0.02)'), boxShadow: 'none', cursor: 'pointer' }} onClick={() => setView('live')}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2.5 }}>
                <Box>
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', color: themeTextSec, fontWeight: 800, letterSpacing: '1.5px' }}>LIVE STREAM STATUS</Typography>
                  <Typography variant="body1" sx={{ color: themeTextColor, fontWeight: 800, mt: 0.5 }}>{liveData.active ? `🔴 LIVE: ${liveData.topic}` : '⚫ No Active Stream'}</Typography>
                </Box>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: liveData.active ? '#ff4545' : '#64748b', boxShadow: liveData.active ? '0 0 10px #ff4545' : 'none' }} />
              </CardContent>
            </Card>

            {/* Primary Metrics Row */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Card onClick={() => setView('student_mgmt')} sx={{ cursor: 'pointer', background: (isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(11, 46, 89, 0.02)'), border: `1px solid ${themeBorderColor}`, borderRadius: '20px', boxShadow: 'none', transition: 'all 0.2s', '&:hover': { borderColor: '#F7931E' } }}>
                  <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '2rem', mb: 0.5 }}>👥</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: themeTextColor }}>{allStudents.length}</Typography>
                    <Typography variant="caption" sx={{ color: themeTextSec, fontWeight: 900, fontSize: '0.55rem', letterSpacing: '1px' }}>TOTAL STUDENTS</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card onClick={() => setView('attendance')} sx={{ cursor: 'pointer', background: (isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(11, 46, 89, 0.02)'), border: `1px solid ${themeBorderColor}`, borderRadius: '20px', boxShadow: 'none', transition: 'all 0.2s', '&:hover': { borderColor: '#10b981' } }}>
                  <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '2rem', mb: 0.5 }}>✅</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#10b981' }}>{presentToday}</Typography>
                    <Typography variant="caption" sx={{ color: themeTextSec, fontWeight: 900, fontSize: '0.55rem', letterSpacing: '1px' }}>PRESENT TODAY</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card onClick={() => setView('attendance')} sx={{ cursor: 'pointer', background: (isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(11, 46, 89, 0.02)'), border: `1px solid ${themeBorderColor}`, borderRadius: '20px', boxShadow: 'none', transition: 'all 0.2s', '&:hover': { borderColor: '#ff4545' } }}>
                  <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '2rem', mb: 0.5 }}>❌</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#ff4545' }}>{absentToday}</Typography>
                    <Typography variant="caption" sx={{ color: themeTextSec, fontWeight: 900, fontSize: '0.55rem', letterSpacing: '1px' }}>ABSENT TODAY</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card onClick={() => setView('admin_mgmt')} sx={{ cursor: 'pointer', background: (isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(11, 46, 89, 0.02)'), border: `1px solid ${themeBorderColor}`, borderRadius: '20px', boxShadow: 'none', transition: 'all 0.2s', '&:hover': { borderColor: '#F7931E' } }}>
                  <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '2rem', mb: 0.5 }}>🛡️</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#F7931E' }}>{adminCount}</Typography>
                    <Typography variant="caption" sx={{ color: themeTextSec, fontWeight: 900, fontSize: '0.55rem', letterSpacing: '1px' }}>SUB-ADMINS</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Quick Access Command Grid */}
            <Typography variant="caption" sx={{ color: themeTextSec, fontWeight: 900, fontSize: '0.65rem', letterSpacing: '2px', display: 'block', mb: 2 }}>
              ⚡ QUICK ACCESS
            </Typography>
            <Grid container spacing={1.5} sx={{ mb: 3 }}>
              {[
                { label: 'MANAGE ADMINS', emoji: '🔑', view: 'admin_mgmt' },
                { label: 'STUDENT PROFILES', emoji: '📋', view: 'student_mgmt' },
                { label: 'ATTENDANCE', emoji: '📅', view: 'attendance' },
                { label: 'BROADCAST', emoji: '📡', view: 'notifications' },
                { label: 'COURSES', emoji: '📚', view: 'courses' },
                { label: 'LEADERBOARD', emoji: '🏆', view: 'leaderboard' },
              ].map(item => (
                <Grid item xs={6} sm={4} key={item.view}>
                  <Card onClick={() => setView(item.view)} sx={{ cursor: 'pointer', background: (isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(11, 46, 89, 0.02)'), border: `1px solid ${themeBorderColor}`, borderRadius: '16px', boxShadow: 'none', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', borderColor: '#F7931E' } }}>
                    <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography sx={{ fontSize: '1.3rem' }}>{item.emoji}</Typography>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 900, color: themeTextColor, letterSpacing: '0.5px' }}>{item.label}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        );
      })()}

      {/* ═══════════════ CENTER ADMIN HOME ═══════════════ */}
      {state.role === 'admin' && state.roleType === 'center' && (() => {
        const allStudents = Object.values(profiles).filter(s => s && typeof s === 'object' && (s.fullname || s.email));
        const todayStr = new Date().toISOString().split('T')[0];
        const presentToday = allStudents.filter(s => s.attendance && s.attendance[todayStr]).length;
        return (
          <>
            <Box sx={{ mb: 4, pb: 3, borderBottom: `1px solid ${themeBorderColor}` }}>
              <Typography variant="caption" sx={{ color: '#F7931E', fontWeight: 900, fontSize: '0.7rem', letterSpacing: '3px', display: 'block', mb: 1 }}>🏢 CENTER ADMINISTRATOR</Typography>
              <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, color: themeTextColor }}>Center Dashboard</Typography>
              <Typography variant="body2" sx={{ color: themeTextSec, mt: 0.5, fontSize: '0.8rem' }}>Student management · Attendance · Broadcasts · Internships</Typography>
            </Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}><Card onClick={() => setView('student_mgmt')} sx={{ cursor: 'pointer', background: (isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(11, 46, 89, 0.02)'), border: `1px solid ${themeBorderColor}`, borderRadius: '20px', boxShadow: 'none', '&:hover': { borderColor: '#F7931E' } }}><CardContent sx={{ p: 2.5, textAlign: 'center' }}><Typography sx={{ fontSize: '2rem', mb: 0.5 }}>👥</Typography><Typography variant="h5" sx={{ fontWeight: 900, color: themeTextColor }}>{allStudents.length}</Typography><Typography variant="caption" sx={{ color: themeTextSec, fontWeight: 900, fontSize: '0.55rem' }}>STUDENTS</Typography></CardContent></Card></Grid>
              <Grid item xs={6}><Card onClick={() => setView('attendance')} sx={{ cursor: 'pointer', background: (isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(11, 46, 89, 0.02)'), border: `1px solid ${themeBorderColor}`, borderRadius: '20px', boxShadow: 'none', '&:hover': { borderColor: '#10b981' } }}><CardContent sx={{ p: 2.5, textAlign: 'center' }}><Typography sx={{ fontSize: '2rem', mb: 0.5 }}>✅</Typography><Typography variant="h5" sx={{ fontWeight: 900, color: '#10b981' }}>{presentToday}</Typography><Typography variant="caption" sx={{ color: themeTextSec, fontWeight: 900, fontSize: '0.55rem' }}>PRESENT TODAY</Typography></CardContent></Card></Grid>
            </Grid>
          </>
        );
      })()}

      {/* ═══════════════ MAX ADMIN HOME ═══════════════ */}
      {state.role === 'admin' && state.roleType === 'max' && (() => {
        let courses = [];
        try { courses = JSON.parse(localStorage.getItem('nxa_system_courses')) || []; } catch(e) {}
        let projects = [];
        try { projects = JSON.parse(localStorage.getItem('nxa_industrial_projects')) || []; } catch(e) {}
        return (
          <>
            <Box sx={{ mb: 4, pb: 3, borderBottom: `1px solid ${themeBorderColor}` }}>
              <Typography variant="caption" sx={{ color: '#F7931E', fontWeight: 900, fontSize: '0.7rem', letterSpacing: '3px', display: 'block', mb: 1 }}>🔬 MAX ADMINISTRATOR</Typography>
              <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, color: themeTextColor }}>Max Dashboard</Typography>
              <Typography variant="body2" sx={{ color: themeTextSec, mt: 0.5, fontSize: '0.8rem' }}>Course Matrix · Live Stream · Project Matrix</Typography>
            </Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}><Card onClick={() => setView('courses')} sx={{ cursor: 'pointer', background: (isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(11, 46, 89, 0.02)'), border: `1px solid ${themeBorderColor}`, borderRadius: '20px', boxShadow: 'none', '&:hover': { borderColor: '#F7931E' } }}><CardContent sx={{ p: 2.5, textAlign: 'center' }}><Typography sx={{ fontSize: '2rem', mb: 0.5 }}>📚</Typography><Typography variant="h5" sx={{ fontWeight: 900, color: themeTextColor }}>{courses.length}</Typography><Typography variant="caption" sx={{ color: themeTextSec, fontWeight: 900, fontSize: '0.55rem' }}>COURSES</Typography></CardContent></Card></Grid>
              <Grid item xs={6}><Card onClick={() => setView('projects')} sx={{ cursor: 'pointer', background: (isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(11, 46, 89, 0.02)'), border: `1px solid ${themeBorderColor}`, borderRadius: '20px', boxShadow: 'none', '&:hover': { borderColor: '#F7931E' } }}><CardContent sx={{ p: 2.5, textAlign: 'center' }}><Typography sx={{ fontSize: '2rem', mb: 0.5 }}>🔧</Typography><Typography variant="h5" sx={{ fontWeight: 900, color: themeTextColor }}>{projects.length}</Typography><Typography variant="caption" sx={{ color: themeTextSec, fontWeight: 900, fontSize: '0.55rem' }}>PROJECTS</Typography></CardContent></Card></Grid>
            </Grid>
          </>
        );
      })()}

      {/* ═══════════════ ADVANCED STUDENT HOME ═══════════════ */}
      {state.role === 'student' && (
      <>
        {/* Welcome Immersive HUD Panel */}
        <Card className={`${themeHeroClass} cyber-card`} sx={{ borderRadius: '28px', p: { xs: 2.5, sm: 4 }, mb: 4, position: 'relative' }}>
          <Grid container spacing={3} alignItems="center">
            
            {/* Avatar & Welcome Details */}
            <Grid item xs={12} md={7}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Avatar 
                  sx={{ 
                    width: { xs: 56, sm: 72 }, 
                    height: { xs: 56, sm: 72 }, 
                    bgcolor: isDark ? 'rgba(249, 115, 22, 0.15)' : 'rgba(11, 46, 89, 0.08)',
                    color: isDark ? '#f97316' : '#0B2E59',
                    border: `2px solid ${isDark ? '#f97316' : '#0B2E59'}`,
                    fontWeight: 900,
                    fontSize: { xs: '1.2rem', sm: '1.6rem' },
                    fontFamily: "'Outfit', sans-serif",
                    boxShadow: isDark ? '0 0 20px rgba(249, 115, 22, 0.25)' : 'none'
                  }}
                >
                  {(pd.fullname || state.user?.displayName || state.user?.name || 'S').slice(0, 2).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, color: themeTextColor, fontSize: { xs: '1.5rem', sm: '2rem' }, lineHeight: 1.2 }}>
                    Welcome back, <span className="text-gradient-neon">{(pd.fullname || state.user?.displayName || state.user?.name || state.user?.email || 'Student').split(' ')[0]}</span>
                  </Typography>
                  <Typography variant="body2" sx={{ color: themeTextSec, fontSize: '0.75rem', mt: 0.5 }}>
                    ID verification: <span style={{ color: isDark ? '#f97316' : '#0b2e59', fontWeight: 800 }}>{pd.uid_no || 'Pending Assignment'}</span>
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 3, borderLeft: `3px solid ${isDark ? '#f97316' : '#0B2E59'}`, pl: 2 }}>
                <Typography variant="body2" sx={{ color: themeTextSec, fontStyle: 'italic', fontSize: '0.8rem', lineHeight: 1.4 }}>
                  "{dailyThought}"
                </Typography>
              </Box>
            </Grid>

            {/* Performance Stats Panel */}
            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                <Box className="hero-cgpa-pill" sx={{ display: 'flex', flexDirection: 'column', minWidth: '100px' }}>
                  <Typography variant="caption" sx={{ color: themeTextSec, fontSize: '0.55rem', fontWeight: 900, letterSpacing: '1px' }}>GLOBAL INDEX</Typography>
                  <Typography variant="h6" sx={{ color: '#f97316', fontWeight: 900, fontSize: '1.1rem', mt: 0.2 }}>{pd.cgpa || pd.ug_marks || '0.00'}</Typography>
                </Box>

                <Box className="hero-cgpa-pill" sx={{ display: 'flex', flexDirection: 'column', minWidth: '100px', background: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                  <Typography variant="caption" sx={{ color: themeTextSec, fontSize: '0.55rem', fontWeight: 900, letterSpacing: '1px' }}>XP POINTS</Typography>
                  <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 900, fontSize: '1.1rem', mt: 0.2 }}>{myPoints}</Typography>
                </Box>
              </Box>

              {/* Dossier Manifestation Progress */}
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 900, color: themeTextColor, letterSpacing: '0.5px' }}>
                    MANIFESTATION STATUS: {completionPercentage}%
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#f97316' }}>
                    {filledFieldsCount}/18 SECURED
                  </Typography>
                </Box>
                <Box className="dossier-progress-bg">
                  <Box className="dossier-progress-bar" sx={{ width: `${completionPercentage}%` }} />
                </Box>
              </Box>
            </Grid>

          </Grid>
        </Card>

        {/* Live Broadcast Stream Banner */}
        <Card 
          onClick={() => setView('live')}
          className={themeCardClass}
          sx={{
            mb: 4, borderRadius: '24px',
            borderColor: liveData.active ? '#ef4444' : themeBorderColor,
            background: liveData.active ? (isDark ? 'rgba(239, 68, 68, 0.06)' : 'rgba(239, 68, 68, 0.02)') : undefined,
            boxShadow: 'none'
          }}
        >
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box className={liveData.active ? 'live-beacon' : ''} sx={{ width: 8, height: 8, borderRadius: '50%', background: liveData.active ? '#ef4444' : '#64748b' }} />
                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: liveData.active ? '#ef4444' : themeTextSec, fontWeight: 900, letterSpacing: '2px' }}>
                  {liveData.active ? 'LIVE MENTOR UPLINK ACTIVE' : 'TRANSMISSION STANDBY'}
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ color: themeTextColor, fontWeight: 800, mt: 1, fontSize: '0.95rem', letterSpacing: '-0.3px' }}>
                {liveData.active ? liveData.topic : 'System Idle - Awaiting Next Mentor Broadcast'}
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              sx={{
                background: liveData.active ? '#ef4444' : 'rgba(100, 116, 139, 0.1)',
                color: liveData.active ? '#fff' : themeTextColor,
                fontWeight: 900,
                fontSize: '0.65rem',
                letterSpacing: '1px',
                px: 2.5, py: 1,
                borderRadius: '10px',
                boxShadow: 'none',
                '&:hover': {
                  background: liveData.active ? '#dc2626' : 'rgba(100, 116, 139, 0.2)',
                  boxShadow: 'none'
                }
              }}
            >
              {liveData.active ? 'CONNECT' : 'ENTER'}
            </Button>
          </CardContent>
        </Card>

        {/* HUD Performance Modules */}
        <Typography variant="caption" sx={{ color: themeTextSec, fontWeight: 900, fontSize: '0.65rem', letterSpacing: '2px', display: 'block', mb: 2 }}>
          📊 METRIC INTELLIGENCE WIDGETS
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4.5 }}>
          
          {/* Circular Leetcode node processor */}
          <Grid item xs={12} sm={4}>
            <Card className={themeCardClass} sx={{ borderRadius: '24px', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: themeTextSec, fontWeight: 900, fontSize: '0.65rem', mb: 2, letterSpacing: '1px', display: 'block' }}>
                  ALGORITHM ENGINE
                </Typography>
                
                <Box sx={{ position: 'relative', width: 100, height: 100, my: 1.5 }}>
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="41" fill="transparent" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(11, 46, 89, 0.05)'} strokeWidth="8"/>
                    <circle 
                      cx="50" cy="50" r="41" fill="transparent" 
                      stroke={isDark ? '#f97316' : '#0B2E59'} 
                      strokeWidth="8"
                      strokeDasharray="257.6"
                      strokeDashoffset={257.6 - (Math.min(25, solvedCount) / 25) * 257.6}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                    />
                  </svg>
                  <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="h5" sx={{ color: themeTextColor, fontWeight: 900, fontSize: '1.25rem', p: 0, m: 0 }}>
                      {solvedCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeTextSec, fontSize: '0.55rem', mt: -0.5, fontWeight: 800 }}>
                      / 25 NODES
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="caption" sx={{ color: themeTextSec, fontSize: '0.65rem', mt: 1 }}>
                  Submit solved nodes in LeetCode view
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* SVG skill radar wireframe */}
          <Grid item xs={12} sm={4}>
            <Card className={themeCardClass} sx={{ borderRadius: '24px', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: themeTextSec, fontWeight: 900, fontSize: '0.65rem', mb: 1, letterSpacing: '1px', display: 'block' }}>
                  SKILL SCANNER RADAR
                </Typography>

                <Box sx={{ width: 110, height: 110, my: 0.5 }}>
                  <svg width="110" height="110" viewBox="0 0 150 150">
                    <polygon points={makeBgPoly(0.25)} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="0.5" />
                    <polygon points={makeBgPoly(0.5)} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="0.5" />
                    <polygon points={makeBgPoly(0.75)} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="0.5" />
                    <polygon points={makeBgPoly(1.0)} fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth="0.8" />

                    {angles.map((ang, idx) => {
                      const outerPt = getRadarPoint(idx, 1.0);
                      return <line key={idx} x1="75" y1="75" x2={outerPt.x} y2={outerPt.y} stroke="rgba(148,163,184,0.25)" strokeWidth="0.8" />;
                    })}

                    <polygon points={polyPoints} fill={isDark ? 'rgba(249, 115, 22, 0.18)' : 'rgba(11, 46, 89, 0.15)'} stroke={isDark ? '#f97316' : '#0B2E59'} strokeWidth="1.5" />

                    {skills.map((s, idx) => {
                      const pt = getRadarPoint(idx, s.val);
                      return <circle key={idx} cx={pt.x} cy={pt.y} r="2.5" fill={isDark ? '#f97316' : '#0B2E59'} />;
                    })}
                  </svg>
                </Box>

                <Typography variant="caption" sx={{ color: themeTextSec, fontSize: '0.58rem', mt: 0.5, fontWeight: 700 }}>
                  {skills.map(s => `${s.name.split(' ')[0]}: ${Math.round(s.val * 100)}%`).join(' · ')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Weekly study bar load tracker */}
          <Grid item xs={12} sm={4}>
            <Card className={themeCardClass} sx={{ borderRadius: '24px', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: themeTextSec, fontWeight: 900, fontSize: '0.65rem', mb: 2, letterSpacing: '1px', display: 'block', width: '100%', textAlign: 'center' }}>
                  STUDY CLOCK RHYTHM
                </Typography>

                <Box sx={{ width: '100%', height: 95, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', px: 1 }}>
                  {[
                    { day: "M", val: 50 },
                    { day: "T", val: 80 },
                    { day: "W", val: 45 },
                    { day: "T", val: 95 },
                    { day: "F", val: 35 },
                    { day: "S", val: 75 },
                    { day: "S", val: 65 }
                  ].map((item, idx) => (
                    <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <Box className="study-column" sx={{ height: '70px', width: '8px' }}>
                        <Box 
                          className={`study-column-fill ${idx === 3 ? 'study-column-active' : ''}`} 
                          style={{ height: `${item.val}%` }} 
                        />
                      </Box>
                      <Typography sx={{ fontSize: '0.6rem', color: themeTextSec, fontWeight: 800, mt: 1 }}>{item.day}</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

        </Grid>

        {/* Current assigned active courses list */}
        <Typography variant="caption" sx={{ color: themeTextSec, fontWeight: 900, fontSize: '0.65rem', letterSpacing: '2px', display: 'block', mb: 2 }}>
          📚 ACTIVE TRAINING MODULES
        </Typography>
        <Grid container spacing={2.5} sx={{ mb: 4.5 }}>
          {myCourseIds.length === 0 ? (
            <Grid item xs={12}>
              <Card className={themeCardClass} sx={{ p: 3, textAlign: 'center', borderRadius: '20px' }}>
                <Typography sx={{ fontSize: '0.75rem', color: themeTextSec }}>No courses assigned to your profile yet.</Typography>
              </Card>
            </Grid>
          ) : myCourseIds.map((courseId, index) => {
            // Give mock progress values based on indices for rich details
            const progresses = [75, 40, 90, 15];
            const prog = progresses[index % progresses.length];
            return (
              <Grid item xs={12} sm={6} key={courseId}>
                <Card className={themeCardClass} sx={{ borderRadius: '20px', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 900, color: themeTextColor, letterSpacing: '-0.2px' }}>
                        {getCourseTitle(courseId)}
                      </Typography>
                      <Chip label={`${prog}%`} size="small" sx={{ fontSize: '0.55rem', height: '18px', fontWeight: 900, background: isDark ? 'rgba(249,115,22,0.1)' : 'rgba(11,46,89,0.05)', color: isDark ? '#f97316' : '#0B2E59' }} />
                    </Box>
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={prog} 
                        sx={{ 
                          flexGrow: 1, 
                          height: '4px', 
                          borderRadius: '2px', 
                          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(11,46,89,0.08)',
                          '& .MuiLinearProgress-bar': { backgroundColor: isDark ? '#f97316' : '#0B2E59' }
                        }} 
                      />
                      <Button
                        size="small"
                        onClick={() => setView('courses')}
                        sx={{ 
                          fontSize: '0.6rem', fontWeight: 900, 
                          color: isDark ? '#f97316' : '#0B2E59', 
                          minWidth: 'auto', p: 0,
                          '&:hover': { background: 'transparent', color: '#10b981' }
                        }}
                      >
                        CONTINUE
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Gamified Achievements Badges */}
        <Typography variant="caption" sx={{ color: themeTextSec, fontWeight: 900, fontSize: '0.65rem', letterSpacing: '2px', display: 'block', mb: 2 }}>
          🏆 CORE SYSTEM ACHIEVEMENTS
        </Typography>
        <Card className={themeCardClass} sx={{ borderRadius: '24px', p: 3, mb: 4 }}>
          <Grid container spacing={3} justifyContent="space-around">
            
            <Grid item xs={3} className={`achievement-badge ${hasCourses ? 'unlocked' : ''}`}>
              <Avatar sx={{ width: 44, height: 44, bgcolor: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', border: '1.5px solid rgba(14, 165, 233, 0.3)', mb: 1 }}>🚀</Avatar>
              <Typography sx={{ fontSize: '0.55rem', fontWeight: 900, color: themeTextColor, letterSpacing: '0.5px' }}>ARCHITECT</Typography>
              <Typography sx={{ fontSize: '0.45rem', color: themeTextSec }}>{hasCourses ? 'UNLOCKED' : 'LOCKED'}</Typography>
            </Grid>

            <Grid item xs={3} className={`achievement-badge ${hasLeetcode ? 'unlocked' : ''}`}>
              <Avatar sx={{ width: 44, height: 44, bgcolor: 'rgba(249, 115, 22, 0.1)', color: '#f97316', border: '1.5px solid rgba(249, 115, 22, 0.3)', mb: 1 }}>⚡</Avatar>
              <Typography sx={{ fontSize: '0.55rem', fontWeight: 900, color: themeTextColor, letterSpacing: '0.5px' }}>ALGORITHM</Typography>
              <Typography sx={{ fontSize: '0.45rem', color: themeTextSec }}>{hasLeetcode ? 'UNLOCKED' : 'LOCKED'}</Typography>
            </Grid>

            <Grid item xs={3} className={`achievement-badge ${hasMockPoints ? 'unlocked' : ''}`}>
              <Avatar sx={{ width: 44, height: 44, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1.5px solid rgba(16, 185, 129, 0.3)', mb: 1 }}>🧠</Avatar>
              <Typography sx={{ fontSize: '0.55rem', fontWeight: 900, color: themeTextColor, letterSpacing: '0.5px' }}>TITAN</Typography>
              <Typography sx={{ fontSize: '0.45rem', color: themeTextSec }}>{hasMockPoints ? 'UNLOCKED' : 'LOCKED'}</Typography>
            </Grid>

            <Grid item xs={3} className={`achievement-badge ${hasAttendance ? 'unlocked' : ''}`}>
              <Avatar sx={{ width: 44, height: 44, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1.5px solid rgba(59, 130, 246, 0.3)', mb: 1 }}>🛡️</Avatar>
              <Typography sx={{ fontSize: '0.55rem', fontWeight: 900, color: themeTextColor, letterSpacing: '0.5px' }}>SENTINEL</Typography>
              <Typography sx={{ fontSize: '0.45rem', color: themeTextSec }}>{hasAttendance ? 'UNLOCKED' : 'LOCKED'}</Typography>
            </Grid>

          </Grid>
        </Card>

        {/* Industrial Dossier call to action card */}
        <Card 
          onClick={() => setView('register')}
          className="cyber-card"
          sx={{
            background: isDark ? 'rgba(249, 115, 22, 0.05)' : 'linear-gradient(135deg, rgba(11, 46, 89, 0.05), rgba(249, 115, 22, 0.03))',
            border: `1px solid ${isDark ? '#f97316' : '#0B2E59'}`, 
            cursor: 'pointer', borderRadius: '24px', p: 3, mb: 4,
            position: 'relative', overflow: 'hidden', boxShadow: 'none', transition: 'all 0.3s',
            '&:hover': { transform: 'translateY(-2px)' }
          }}
        >
          <Box sx={{ position: 'absolute', top: -10, right: -10, fontSize: '4.5rem', opacity: 0.05, transform: 'rotate(15deg)' }}>
            📝
          </Box>
          <Typography variant="caption" sx={{ fontSize: '0.6rem', color: isDark ? '#f97316' : '#0B2E59', fontWeight: 900, letterSpacing: '2px' }}>
            ACTION REQUIRED
          </Typography>
          <Typography variant="h6" sx={{ color: themeTextColor, fontWeight: 800, my: 0.8 }}>
            MANIFEST INDUSTRIAL DOSSIER
          </Typography>
          <Typography variant="body2" sx={{ color: themeTextSec, fontSize: '0.72rem', lineHeight: 1.4 }}>
            Update your academic records and secure your identity file to unlock complete platform certifications.
          </Typography>
        </Card>

        {/* Navigation Shortcut Grid */}
        <Typography variant="caption" sx={{ color: themeTextSec, fontWeight: 900, fontSize: '0.65rem', letterSpacing: '2px', display: 'block', mb: 2 }}>
          ⚡ SHORTCUT UPLINKS
        </Typography>
        <Grid container spacing={1.5}>
          {[
            { label: 'ATTENDANCE', emoji: '📅', view: 'attendance' },
            { label: 'PROJECT MATRIX', emoji: '📁', view: 'projects' },
            { label: 'INTERNSHIPS', emoji: '💼', view: 'internships' },
            { label: 'LEADERBOARD', emoji: '🏆', view: 'leaderboard' },
          ].map(item => (
            <Grid item xs={6} key={item.view}>
              <Card 
                onClick={() => setView(item.view)} 
                className={themeCardClass}
                sx={{ 
                  cursor: 'pointer', 
                  borderRadius: '16px', 
                  boxShadow: 'none'
                }}
              >
                <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography sx={{ fontSize: '1.2rem' }}>{item.emoji}</Typography>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 900, color: themeTextColor, letterSpacing: '0.5px' }}>{item.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </>
      )}
    </Box>
  );
}

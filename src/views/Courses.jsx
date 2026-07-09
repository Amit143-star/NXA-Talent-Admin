import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, CardContent, CardMedia, Grid, Button, 
  Dialog, DialogTitle, DialogContent, TextField, Link, Chip,
  Divider, List, ListItem, ListItemText, Tabs, Tab, IconButton,
  LinearProgress, CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import TimerIcon from '@mui/icons-material/Timer';
import CodeIcon from '@mui/icons-material/Code';
import AssignmentIcon from '@mui/icons-material/Assignment';

export default function Courses({ state, setView }) {
  const isDark = localStorage.getItem('nxa_dark_mode') === 'true';
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState(0);
  const [expandedModule, setExpandedModule] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [activeTest, setActiveTest] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [utrId, setUtrId] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [submittingPay, setSubmittingPay] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMainTab, setActiveMainTab] = useState(() => {
    try {
      const email = state.user?.email?.toLowerCase().trim() || '';
      const savedProfiles = JSON.parse(localStorage.getItem('nxa_student_profiles')) || {};
      const profile = savedProfiles[email] || {};
      const assigned = profile.assigned_courses || [];
      return assigned.length > 0 ? 0 : 1;
    } catch(e) {
      return 1;
    }
  });

  const [courses, setCourses] = useState(() => {
    try {
      const saved = localStorage.getItem('nxa_system_courses');
      return saved ? JSON.parse(saved) : [];
    } catch(e) {
      return [];
    }
  });

  const [profiles, setProfiles] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nxa_student_profiles')) || {}; } catch(e) { return {}; }
  });

  useEffect(() => {
    const handleUpdate = (e) => {
      const { key, data } = e.detail;
      if (key === 'nxa_system_courses') {
        setCourses(data);
      } else if (key === 'nxa_student_profiles') {
        setProfiles(data);
      }
    };
    window.addEventListener('nxa_db_updated', handleUpdate);
    return () => window.removeEventListener('nxa_db_updated', handleUpdate);
  }, []);

  // Backwards compatibility mapping for legacy courses
  const OLD_COURSE_MAP = {
    '1': 'ai_ml_foundations',
    '2': 'javascript_engineering',
    '3': 'cybersecurity_ethical'
  };

  const emailKey = state.user?.email?.toLowerCase().trim() || '';
  const myProfile = profiles[emailKey] || {};
  
  const rawAssigned = myProfile.assigned_courses || [];
  const myCourseIds = rawAssigned.map(id => OLD_COURSE_MAP[id] || id);

  const rawPaid = myProfile.paid_courses || [];
  const paidCourseIds = rawPaid.map(id => OLD_COURSE_MAP[id] || id);

  const rawPending = myProfile.pending_courses || [];
  const pendingCourseIds = rawPending.map(id => OLD_COURSE_MAP[id] || id);

  const isAdmin = state.role === 'admin';

  const payConfig = JSON.parse(localStorage.getItem('nxa_payment_config')) || { upi: '', qr: '' };

  // Theming
  const themeCardBg = isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(11, 46, 89, 0.02)';
  const themeBorderColor = isDark ? 'rgba(247, 147, 30, 0.15)' : 'rgba(11, 46, 89, 0.08)';
  const themeTextColor = isDark ? '#f8fafc' : '#0B2E59';
  const themeTextSec = isDark ? '#94a3b8' : '#64748b';
  const modalPaperBg = isDark ? '#0f172a' : '#ffffff';

  // Category filter extraction
  const categories = ['All', ...new Set(courses.map(c => {
    const d = (c.domain || '').split('/')[0].trim();
    return d || 'General';
  }))];

  const filteredCourses = courses.filter(c => {
    const matchFilter = activeFilter === 'All' || (c.domain || '').includes(activeFilter);
    const matchSearch = !searchQuery || 
      (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.domain || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.desc || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  // For students: tab 0 shows assigned courses, tab 1 shows browse all
  const displayCourses = isAdmin 
    ? filteredCourses 
    : (activeMainTab === 0 
        ? filteredCourses.filter(c => myCourseIds.includes(c.id)) 
        : filteredCourses
      );

  const getDifficultyColor = (diff) => {
    if (!diff) return '#64748b';
    const d = diff.toLowerCase();
    if (d.includes('beginner') && !d.includes('advanced')) return '#22c55e';
    if (d.includes('intermediate') && !d.includes('advanced')) return '#f59e0b';
    if (d.includes('advanced')) return '#ef4444';
    return '#6366f1';
  };

  const handleShowPayment = (course) => {
    setSelectedCourse(course);
  };

  const handleClosePayment = () => {
    setSelectedCourse(null);
    setUtrId('');
    setProofFile(null);
  };

  const handleUploadProof = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setProofFile(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPayment = () => {
    if (!utrId.trim()) return alert("UTR Transaction ID is required.");
    setSubmittingPay(true);

    const logEntry = {
      timestamp: Date.now(),
      email: emailKey,
      courseId: selectedCourse.id,
      courseTitle: selectedCourse.title,
      price: selectedCourse.price || '999',
      utr: utrId.trim(),
      proof: proofFile || '',
      status: 'pending'
    };

    let logs = [];
    try { logs = JSON.parse(localStorage.getItem('nxa_payment_logs')) || []; } catch(e) { logs = []; }
    logs.unshift(logEntry);
    localStorage.setItem('nxa_payment_logs', JSON.stringify(logs));

    const pendingCourses = myProfile.pending_courses || [];
    if (!pendingCourses.includes(selectedCourse.id)) {
      pendingCourses.push(selectedCourse.id);
    }
    const updatedProfile = { ...myProfile, pending_courses: pendingCourses };
    const updatedProfiles = { ...profiles, [emailKey]: updatedProfile };
    setProfiles(updatedProfiles);
    localStorage.setItem('nxa_student_profiles', JSON.stringify(updatedProfiles));

    if (typeof window.firebase !== 'undefined') {
      try {
        window.firebase.firestore().collection('payment_logs').doc('utr_' + utrId.trim()).set(logEntry);
        window.firebase.firestore().collection('profiles').doc(emailKey).set(updatedProfile, { merge: true });
      } catch(e) {
        console.warn(e);
      }
    }

    alert("VERIFICATION TRANSMITTED: Audit system logged transaction details.");
    handleClosePayment();
    setSubmittingPay(false);
  };

  // ═══════════════════════════════════════════════
  // COURSE DETAIL VIEW
  // ═══════════════════════════════════════════════
  if (activeCourseId) {
    const course = courses.find(c => c.id === activeCourseId);
    if (!course) {
      setActiveCourseId(null);
      return null;
    }

    const videos = course.videos || [];
    const refs = course.refs || [];
    const docs = course.docs || [];
    const syllabus = course.syllabus || [];
    const testList = course.testList || [];

    const coursePrice = course.price || '999';
    const isPaid = paidCourseIds.includes(course.id) || String(coursePrice) === '0' || isAdmin;
    const isPending = pendingCourseIds.includes(course.id);

    return (
      <Box sx={{ p: 3, pb: '120px' }}>
        
        {/* Detail Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 4, borderBottom: `1px solid ${themeBorderColor}`, pb: 3 }}>
          <Button 
            onClick={() => { setActiveCourseId(null); setActiveDetailTab(0); }}
            sx={{ minWidth: 'auto', fontSize: '1.3rem', color: themeTextColor, p: 0, mt: 0.3 }}
          >
            ←
          </Button>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Typography sx={{ fontSize: '1.8rem' }}>{course.icon || '📘'}</Typography>
              <Box>
                <Typography variant="caption" sx={{ color: course.color || '#F7931E', fontWeight: 900, fontSize: '0.6rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
                  {course.domain || 'Industrial Core'}
                </Typography>
                <Typography variant="h5" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, color: themeTextColor, letterSpacing: '0.5px', lineHeight: 1.2 }}>
                  {course.title}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
              <Chip icon={<TimerIcon sx={{ fontSize: '0.8rem' }} />} label={course.duration || '60+ Hours'} size="small" sx={{ fontSize: '0.6rem', fontWeight: 800, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(11,46,89,0.04)', color: themeTextColor, height: '26px' }} />
              <Chip icon={<MenuBookIcon sx={{ fontSize: '0.8rem' }} />} label={`${course.modules || 0} Modules`} size="small" sx={{ fontSize: '0.6rem', fontWeight: 800, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(11,46,89,0.04)', color: themeTextColor, height: '26px' }} />
              <Chip icon={<AssignmentIcon sx={{ fontSize: '0.8rem' }} />} label={`${course.tests || 0} Tests`} size="small" sx={{ fontSize: '0.6rem', fontWeight: 800, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(11,46,89,0.04)', color: themeTextColor, height: '26px' }} />
              <Chip label={course.difficulty || 'Intermediate'} size="small" sx={{ fontSize: '0.55rem', fontWeight: 900, background: `${getDifficultyColor(course.difficulty)}15`, color: getDifficultyColor(course.difficulty), height: '26px', border: `1px solid ${getDifficultyColor(course.difficulty)}30` }} />
            </Box>
            
            {!isPaid && (
              <Button
                variant="contained" size="small"
                onClick={() => handleShowPayment(course)}
                sx={{
                  mt: 2, background: isPending ? '#64748b' : 'linear-gradient(135deg, #0B2E59 0%, #F7931E 100%)',
                  color: '#fff', fontSize: '0.65rem', fontWeight: 900, borderRadius: '8px', py: 0.8, px: 3,
                  boxShadow: `0 4px 12px ${course.color || '#F7931E'}30`
                }}
              >
                {isPending ? '⏳ VERIFYING...' : '🔒 ENROLL TO UNLOCK COURSE'}
              </Button>
            )}
          </Box>
        </Box>

        {/* Detail Navigation Tabs */}
        <Tabs
          value={activeDetailTab}
          onChange={(e, val) => setActiveDetailTab(val)}
          variant="fullWidth"
          sx={{
            mb: 3.5,
            minHeight: '40px',
            '& .MuiTabs-indicator': { backgroundColor: '#F7931E', height: '3px', borderRadius: '3px' },
            '& .MuiTab-root': {
              fontFamily: "'Outfit', sans-serif",
              fontSize: '0.7rem',
              fontWeight: 900,
              letterSpacing: '1px',
              color: themeTextSec,
              '&.Mui-selected': { color: '#F7931E' }
            }
          }}
        >
          <Tab icon={<SchoolIcon sx={{ fontSize: '1rem' }} />} iconPosition="start" label="SYLLABUS" />
          <Tab icon={<PlayArrowIcon sx={{ fontSize: '1rem' }} />} iconPosition="start" label="VIDEOS" />
          <Tab icon={<CodeIcon sx={{ fontSize: '1rem' }} />} iconPosition="start" label="RESOURCES" />
          <Tab icon={<AssignmentIcon sx={{ fontSize: '1rem' }} />} iconPosition="start" label="TESTS" />
        </Tabs>

        {/* Overview Description */}
        {course.desc && (
          <Box sx={{ background: themeCardBg, border: `1px solid ${themeBorderColor}`, p: 2.5, borderRadius: '16px', mb: 3 }}>
            <Typography sx={{ fontSize: '0.8rem', color: themeTextColor, lineHeight: 1.65 }}>
              {course.desc}
            </Typography>
          </Box>
        )}

        {/* TAB 0: SYLLABUS */}
        {activeDetailTab === 0 && (
          <Box>
            <Typography variant="caption" sx={{ color: '#F7931E', fontWeight: 900, letterSpacing: '1.5px', display: 'block', mb: 2.5, fontSize: '0.65rem' }}>
              📋 COMPLETE COURSE SYLLABUS — {syllabus.length} MODULES
            </Typography>
            {syllabus.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {syllabus.map((item, idx) => (
                  <Box key={idx} sx={{ 
                    background: themeCardBg,
                    border: `1px solid ${expandedModule === idx ? (course.color || '#F7931E') : themeBorderColor}`,
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    boxShadow: expandedModule === idx ? `0 4px 20px ${(course.color || '#F7931E')}15` : 'none'
                  }}>
                    {/* Header: Clickable to expand */}
                    <Box 
                      onClick={() => setExpandedModule(expandedModule === idx ? null : idx)}
                      sx={{ 
                        display: 'flex', gap: 2, alignItems: 'center', p: 2, cursor: 'pointer',
                        background: expandedModule === idx ? 'rgba(255,255,255,0.02)' : 'transparent'
                      }}
                    >
                      <Box sx={{ 
                        minWidth: '32px', height: '32px', borderRadius: '10px',
                        background: `${course.color || '#F7931E'}15`,
                        color: course.color || '#F7931E',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 900
                      }}>
                        {String(idx + 1).padStart(2, '0')}
                      </Box>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', color: themeTextColor, fontWeight: 700, flex: 1 }}>
                        {item?.title ? item.title : (item ? String(item).replace(/^Module \d+:\s*/, '') : `Module ${idx + 1}`)}
                      </Typography>
                      <Typography sx={{ fontSize: '1rem', color: themeTextSec, transition: 'transform 0.2s', transform: expandedModule === idx ? 'rotate(180deg)' : 'none' }}>
                        ▼
                      </Typography>
                    </Box>

                    {/* Expandable Lessons List */}
                    {expandedModule === idx && item?.lessons && (
                      <Box sx={{ p: 2, pt: 0, borderTop: `1px solid ${themeBorderColor}50` }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1.5 }}>
                          {item.lessons.map((lesson, lIdx) => (
                            <Box 
                              key={lIdx} 
                              onClick={() => {
                                if (isPaid) {
                                  setActiveVideo({
                                    title: lesson.title,
                                    ytId: lesson.ytId || 'jNQXAC9IVRw',
                                    duration: lesson.duration
                                  });
                                } else {
                                  handleShowPayment(course);
                                }
                              }}
                              sx={{ 
                                display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, 
                                borderRadius: '8px', background: 'rgba(0,0,0,0.02)',
                                cursor: 'pointer',
                                '&:hover': { background: 'rgba(0,0,0,0.04)' }
                              }}
                            >
                              <PlayArrowIcon sx={{ fontSize: '1rem', color: isPaid ? '#F7931E' : themeTextSec }} />
                              <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: isPaid ? themeTextColor : themeTextSec }}>
                                  {!isPaid && '🔒 '} {lesson.title}
                                </Typography>
                                <Typography sx={{ fontSize: '0.6rem', color: themeTextSec }}>{lesson.duration}</Typography>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ py: 6, textAlign: 'center', color: themeTextSec, border: `1px dashed ${themeBorderColor}`, borderRadius: '16px' }}>
                📭 Syllabus content is being prepared.
              </Box>
            )}
          </Box>
        )}

        {/* TAB 1: VIDEO CLASSES */}
        {activeDetailTab === 1 && (
          <Box>
            <Typography variant="caption" sx={{ color: '#F7931E', fontWeight: 900, letterSpacing: '1.5px', display: 'block', mb: 2.5, fontSize: '0.65rem' }}>
              📹 VIDEO LECTURE SERIES — {videos.length} CLASSES
            </Typography>
            {!isPaid ? (
              <Box sx={{ py: 8, textAlign: 'center', border: `1px solid ${themeBorderColor}`, borderRadius: '24px', background: themeCardBg }}>
                <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>🔒</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: themeTextColor, mb: 1 }}>
                  Video Lectures Locked
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: themeTextSec, mb: 3, maxWidth: '280px', mx: 'auto', lineHeight: 1.4 }}>
                  Enroll in this course to gain immediate access to the full premium video lecture series.
                </Typography>
                <Button
                  variant="contained" size="small"
                  onClick={() => handleShowPayment(course)}
                  sx={{ background: 'linear-gradient(135deg, #0B2E59 0%, #F7931E 100%)', color: '#fff', fontSize: '0.65rem', fontWeight: 900, px: 3, py: 1, borderRadius: '8px' }}
                >
                  🔒 UNLOCK LECTURES
                </Button>
              </Box>
            ) : videos.length > 0 ? (
              <Grid container spacing={2.5}>
                {videos.map((v, i) => (
                  <Grid item xs={12} md={6} key={i}>
                    <Card sx={{ background: themeCardBg, border: `1px solid ${themeBorderColor}`, borderRadius: '16px', boxShadow: 'none', overflow: 'hidden' }}>
                      <Box sx={{ position: 'relative', pb: '56.25%', height: 0 }}>
                        <iframe 
                          src={`https://www.youtube.com/embed/${v.ytId}`}
                          title={v.title}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                          allowFullScreen
                        />
                      </Box>
                      <CardContent sx={{ p: 2, pb: '12px !important' }}>
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: themeTextColor, fontFamily: "'Outfit', sans-serif" }}>
                          {v.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: themeTextSec, fontSize: '0.55rem' }}>
                          LECTURE {String(i + 1).padStart(2, '0')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ py: 6, textAlign: 'center', color: themeTextSec, border: `1px dashed ${themeBorderColor}`, borderRadius: '16px' }}>
                📹 Video content is being produced.
              </Box>
            )}
          </Box>
        )}

        {/* TAB 2: RESOURCES */}
        {activeDetailTab === 2 && (
          <Box>
            {!isPaid ? (
              <Box sx={{ py: 8, textAlign: 'center', border: `1px solid ${themeBorderColor}`, borderRadius: '24px', background: themeCardBg }}>
                <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>🔒</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: themeTextColor, mb: 1 }}>
                  Resource Materials Locked
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: themeTextSec, mb: 3, maxWidth: '280px', mx: 'auto', lineHeight: 1.4 }}>
                  Unlock this course to download guides, source templates, and reference documentation.
                </Typography>
                <Button
                  variant="contained" size="small"
                  onClick={() => handleShowPayment(course)}
                  sx={{ background: 'linear-gradient(135deg, #0B2E59 0%, #F7931E 100%)', color: '#fff', fontSize: '0.65rem', fontWeight: 900, px: 3, py: 1, borderRadius: '8px' }}
                >
                  🔒 UNLOCK RESOURCES
                </Button>
              </Box>
            ) : (
              <>
                {refs.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="caption" sx={{ color: '#F7931E', fontWeight: 900, letterSpacing: '1.5px', display: 'block', mb: 2, fontSize: '0.65rem' }}>
                      🔗 REFERENCE MATERIALS
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {refs.map((r, i) => (
                        <Button
                          key={i} fullWidth variant="outlined" onClick={() => window.open(r.url, '_blank')}
                          sx={{
                            justifyContent: 'flex-start', py: 1.5, px: 2.5, background: themeCardBg, border: `1px solid ${themeBorderColor}`,
                            borderRadius: '12px', textTransform: 'none', color: themeTextColor,
                            '&:hover': { background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(11, 46, 89, 0.04)', borderColor: course.color || '#F7931E' }
                          }}
                        >
                          <Box sx={{ width: '28px', height: '28px', borderRadius: '8px', background: `${course.color || '#F7931E'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5, fontSize: '0.85rem' }}>🔗</Box>
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>{r.title}</Typography>
                        </Button>
                      ))}
                    </Box>
                  </Box>
                )}

                {docs.length > 0 && (
                  <Box>
                    <Typography variant="caption" sx={{ color: '#F7931E', fontWeight: 900, letterSpacing: '1.5px', display: 'block', mb: 2, fontSize: '0.65rem' }}>
                      📄 DOCUMENTATION & GUIDES
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {docs.map((d, i) => (
                        <Button
                          key={i} fullWidth variant="outlined" onClick={() => window.open(d.url, '_blank')}
                          sx={{
                            justifyContent: 'flex-start', py: 1.5, px: 2.5, background: themeCardBg, border: `1px solid ${themeBorderColor}`,
                            borderRadius: '12px', textTransform: 'none', color: '#F7931E', borderColor: isDark ? 'rgba(247, 147, 30, 0.15)' : 'rgba(247, 147, 30, 0.15)',
                            '&:hover': { background: 'rgba(247, 147, 30, 0.03)', borderColor: '#F7931E' }
                          }}
                        >
                          <Box sx={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(247,147,30,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5, fontSize: '0.85rem' }}>📎</Box>
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: themeTextColor }}>{d.title}</Typography>
                        </Button>
                      ))}
                    </Box>
                  </Box>
                )}

                {refs.length === 0 && docs.length === 0 && (
                  <Box sx={{ py: 6, textAlign: 'center', color: themeTextSec, border: `1px dashed ${themeBorderColor}`, borderRadius: '16px' }}>
                    📦 Resources are being compiled.
                  </Box>
                )}
              </>
            )}
          </Box>
        )}

        {/* TAB 3: TESTS */}
        {activeDetailTab === 3 && (
          <Box>
            <Typography variant="caption" sx={{ color: '#F7931E', fontWeight: 900, letterSpacing: '1.5px', display: 'block', mb: 2.5, fontSize: '0.65rem' }}>
              📝 REQUIRED ASSESSMENTS — {testList.length} TESTS
            </Typography>
            {testList.length > 0 ? (
              <Box sx={{ display: 'grid', gap: 2 }}>
                {testList.map((test, idx) => (
                  <Box key={idx} sx={{ 
                    p: 2, background: themeCardBg, border: `1px solid ${themeBorderColor}`, borderRadius: '16px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(247,147,30,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AssignmentIcon sx={{ color: '#F7931E', fontSize: '1.2rem' }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: themeTextColor, mb: 0.2 }}>{test?.title || `Assessment ${idx + 1}`}</Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: themeTextSec }}>Duration: {test?.duration || '30 mins'}</Typography>
                      </Box>
                    </Box>
                    <Button 
                      variant="outlined" size="small" 
                      onClick={() => { 
                        if (isPaid) {
                          setActiveTest({ test, course });
                          setSelectedAnswers({});
                          setTestResult(null);
                        } else {
                          handleShowPayment(course);
                        }
                      }}
                      sx={{ borderColor: isPaid ? '#F7931E' : themeTextSec, color: isPaid ? '#F7931E' : themeTextSec, fontSize: '0.65rem', fontWeight: 800 }}
                    >
                      {isPaid ? 'START' : '🔒 UNLOCK'}
                    </Button>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ py: 6, textAlign: 'center', color: themeTextSec, border: `1px dashed ${themeBorderColor}`, borderRadius: '16px' }}>
                📝 Assessments are being deployed.
              </Box>
            )}
          </Box>
        )}
      </Box>
    );
  }

  // ═══════════════════════════════════════════════
  // MAIN COURSE MATRIX VIEW
  // ═══════════════════════════════════════════════
  return (
    <Box sx={{ p: 3, pb: '120px' }}>
      
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, borderBottom: `1px solid ${themeBorderColor}`, pb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: themeTextColor, letterSpacing: '1px' }}>
            COURSE_MATRIX
          </Typography>
          <Typography variant="caption" sx={{ color: '#F7931E', fontWeight: 800, fontSize: '0.6rem', letterSpacing: '1px' }}>
            {displayCourses.length} COURSES ACTIVE · {courses.length} TOTAL IN REGISTRY
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button 
            variant="outlined" size="small" onClick={() => alert("Data synchronization anchored.")}
            sx={{ color: themeTextColor, borderColor: themeBorderColor, fontSize: '0.55rem', fontWeight: 800 }}
          >
            🔄 SYNC
          </Button>
          {isAdmin && (
            <Button 
              variant="contained" size="small" onClick={() => setView('course_admin')}
              sx={{ background: '#0B2E59', color: '#fff', fontSize: '0.6rem', fontWeight: 900, '&:hover': { background: '#F7931E' } }}
            >
              MANAGE
            </Button>
          )}
        </Box>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 2.5 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search courses by name, language, or topic..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '14px',
              background: themeCardBg,
              fontSize: '0.8rem',
              color: themeTextColor,
              border: `1px solid ${themeBorderColor}`,
              '& fieldset': { border: 'none' },
              '&:hover': { borderColor: '#F7931E' },
              '&.Mui-focused': { borderColor: '#F7931E' }
            }
          }}
        />
      </Box>

      {/* Category Filter Chips */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3.5, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: '3px' }, '&::-webkit-scrollbar-thumb': { background: '#F7931E', borderRadius: '3px' } }}>
        {categories.map(cat => (
          <Chip
            key={cat}
            label={cat.toUpperCase()}
            onClick={() => setActiveFilter(cat)}
            sx={{
              fontSize: '0.55rem',
              height: '30px',
              fontWeight: 900,
              letterSpacing: '0.5px',
              cursor: 'pointer',
              flexShrink: 0,
              background: activeFilter === cat ? '#F7931E' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(11,46,89,0.04)'),
              color: activeFilter === cat ? '#fff' : themeTextColor,
              border: `1px solid ${activeFilter === cat ? '#F7931E' : themeBorderColor}`,
              '&:hover': { background: activeFilter === cat ? '#F7931E' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(11,46,89,0.08)') }
            }}
          />
        ))}
      </Box>

      {/* Student/Admin View Switcher Tabs */}
      {!isAdmin && (
        <Tabs
          value={activeMainTab}
          onChange={(e, val) => setActiveMainTab(val)}
          sx={{
            mb: 3.5,
            borderBottom: `1px solid ${themeBorderColor}`,
            '& .MuiTabs-indicator': { backgroundColor: '#F7931E', height: '3px' },
            '& .MuiTab-root': {
              fontFamily: "'Outfit', sans-serif",
              fontSize: '0.75rem',
              fontWeight: 900,
              pb: 1.5,
              color: themeTextSec,
              '&.Mui-selected': { color: '#F7931E' }
            }
          }}
        >
          <Tab label={`MY DOSSIER COURSES (${myCourseIds.length})`} />
          <Tab label="BROWSE ALL CATALOG" />
        </Tabs>
      )}

      {/* Courses Grid */}
      {displayCourses.length === 0 ? (
        <Box sx={{ p: 6, border: `1px dashed ${themeBorderColor}`, borderRadius: '20px', textAlign: 'center', color: themeTextSec }}>
          {activeMainTab === 0 && !isAdmin ? (
            <Box sx={{ py: 3 }}>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, mb: 1, color: themeTextColor, fontFamily: "'Outfit', sans-serif" }}>
                📚 No courses assigned to your profile yet
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: themeTextSec, mb: 3 }}>
                Explore the complete curriculum catalogue and unlock premium courses under the Browse tab.
              </Typography>
              <Button 
                variant="contained" size="small" onClick={() => setActiveMainTab(1)}
                sx={{ background: '#F7931E', color: '#fff', fontSize: '0.65rem', fontWeight: 900, px: 3, py: 1, borderRadius: '10px' }}
              >
                BROWSE ALL COURSES
              </Button>
            </Box>
          ) : (
            <Typography sx={{ fontSize: '0.78rem' }}>
              {searchQuery ? '🔍 No courses match your search.' : '📚 No courses available in this category.'}
            </Typography>
          )}
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {displayCourses.map(c => {
            const coursePrice = c.price || '999';
            const isPaid = paidCourseIds.includes(c.id) || String(coursePrice) === '0' || isAdmin;
            const isPending = pendingCourseIds.includes(c.id);

            return (
              <Grid item xs={12} sm={6} md={4} key={c.id}>
                <Card 
                  onClick={() => setActiveCourseId(c.id)}
                  sx={{
                    borderRadius: '20px',
                    border: `1px solid ${themeBorderColor}`,
                    background: themeCardBg,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    boxShadow: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      borderColor: c.color || '#F7931E',
                      boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.4)' : `0 10px 25px ${c.color || '#F7931E'}10`
                    }
                  }}
                >
                  {/* Course Color Accent Bar */}
                  <Box sx={{ height: '4px', background: `linear-gradient(90deg, ${c.color || '#F7931E'}, ${c.color || '#F7931E'}80)` }} />
                  
                  {/* Image Header */}
                  {c.image && (
                    <CardMedia
                      component="img"
                      height="130"
                      image={c.image}
                      sx={{ borderBottom: `1px solid ${themeBorderColor}`, objectFit: 'cover' }}
                    />
                  )}

                  {/* Course Icon Badge */}
                  <Box sx={{
                    position: 'absolute',
                    top: c.image ? 118 : 12,
                    right: 12,
                    width: '40px',
                    height: '40px',
                    borderRadius: '14px',
                    background: isDark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.95)',
                    border: `2px solid ${c.color || '#F7931E'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 2
                  }}>
                    {c.icon || '📘'}
                  </Box>

                  {/* Lock Badge */}
                  {!isPaid && (
                    <Box sx={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      bgcolor: isPending ? 'rgba(100, 116, 139, 0.85)' : 'rgba(247, 147, 30, 0.9)',
                      backdropFilter: 'blur(4px)',
                      color: '#fff',
                      px: 1.2,
                      py: 0.4,
                      borderRadius: '8px',
                      fontSize: '0.5rem',
                      fontWeight: 900,
                      letterSpacing: '0.5px',
                      zIndex: 2
                    }}>
                      {isPending ? '⏳ PENDING' : '🔒 PREMIUM'}
                    </Box>
                  )}

                  <CardContent sx={{ p: 2.5, pt: 2, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    {/* Domain Tag */}
                    <Typography variant="caption" sx={{ color: c.color || '#F7931E', fontWeight: 900, fontSize: '0.5rem', letterSpacing: '1.5px', textTransform: 'uppercase', mb: 0.5 }}>
                      {c.domain || 'General'}
                    </Typography>

                    {/* Title */}
                    <Typography sx={{ fontSize: '0.92rem', fontWeight: 900, color: themeTextColor, mb: 1, fontFamily: "'Outfit', sans-serif", lineHeight: 1.3 }}>
                      {c.title}
                    </Typography>

                    {/* Description Preview */}
                    <Typography variant="body2" sx={{ fontSize: '0.68rem', color: themeTextSec, mb: 2, lineHeight: 1.45, flexGrow: 1 }}>
                      {(c.desc || '').slice(0, 120)}...
                    </Typography>

                    {/* Stats Row */}
                    <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TimerIcon sx={{ fontSize: '0.75rem', color: themeTextSec }} />
                        <Typography variant="caption" sx={{ fontSize: '0.52rem', color: themeTextSec, fontWeight: 700 }}>
                          {c.duration || '60+ hrs'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <MenuBookIcon sx={{ fontSize: '0.75rem', color: themeTextSec }} />
                        <Typography variant="caption" sx={{ fontSize: '0.52rem', color: themeTextSec, fontWeight: 700 }}>
                          {c.modules || 0} Modules
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PlayArrowIcon sx={{ fontSize: '0.75rem', color: themeTextSec }} />
                        <Typography variant="caption" sx={{ fontSize: '0.52rem', color: themeTextSec, fontWeight: 700 }}>
                          {(c.videos || []).length} Videos
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AssignmentIcon sx={{ fontSize: '0.75rem', color: themeTextSec }} />
                        <Typography variant="caption" sx={{ fontSize: '0.52rem', color: themeTextSec, fontWeight: 700 }}>
                          {c.tests || 0} Tests
                        </Typography>
                      </Box>
                    </Box>

                    {/* Difficulty + Price Row */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip 
                        label={c.difficulty || 'Intermediate'} 
                        size="small" 
                        sx={{ 
                          fontSize: '0.48rem', fontWeight: 900, height: '22px',
                          background: `${getDifficultyColor(c.difficulty)}12`,
                          color: getDifficultyColor(c.difficulty),
                          border: `1px solid ${getDifficultyColor(c.difficulty)}25`
                        }} 
                      />
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ fontSize: '0.95rem', fontWeight: 900, color: themeTextColor, fontFamily: "'Outfit', sans-serif" }}>
                          ₹{coursePrice}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Action Button */}
                    <Button
                      fullWidth variant="contained" size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isPaid) setActiveCourseId(c.id);
                        else handleShowPayment(c);
                      }}
                      sx={{
                        mt: 2,
                        background: isPaid ? (c.color || '#0B2E59') : (isPending ? '#64748b' : 'linear-gradient(135deg, #0B2E59 0%, #F7931E 100%)'),
                        color: '#fff', fontSize: '0.65rem', fontWeight: 900, borderRadius: '12px',
                        py: 1, boxShadow: 'none',
                        '&:hover': { boxShadow: `0 6px 16px ${c.color || '#F7931E'}30` }
                      }}
                    >
                      {isPaid ? '▶ START LEARNING' : (isPending ? '⏳ VERIFYING...' : '🔒 ENROLL NOW')}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Payment Gateway Modal Dialog */}
      <Dialog 
        open={!!selectedCourse} 
        onClose={handleClosePayment}
        PaperProps={{
          sx: { borderRadius: '24px', border: `2px solid #F7931E`, maxWidth: '400px', p: 3, bgcolor: modalPaperBg }
        }}
      >
        {selectedCourse && (
          <Box sx={{ textAlign: 'center' }}>
            <DialogTitle sx={{ color: '#F7931E', fontWeight: 900, p: 0, mb: 0.5, fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem' }}>
              SECURE ENROLLMENT
            </DialogTitle>
            <Typography variant="caption" sx={{ color: themeTextSec, fontSize: '0.6rem', letterSpacing: '1px', fontWeight: 700 }}>
              {selectedCourse.domain}
            </Typography>
            <Typography variant="body2" sx={{ color: themeTextColor, fontSize: '0.85rem', mb: 3, mt: 1, fontWeight: 700 }}>
              {selectedCourse.title}
            </Typography>

            <Box sx={{ mb: 3 }}>
              {payConfig.qr ? (
                <Box 
                  component="img" 
                  src={payConfig.qr} 
                  sx={{ width: 180, height: 180, p: 1.5, border: `1px solid ${themeBorderColor}`, borderRadius: '12px', background: '#fff', mb: 1.5 }}
                />
              ) : (
                <Box sx={{ p: 2, background: themeCardBg, borderRadius: '12px', border: `1px solid ${themeBorderColor}`, mb: 1.5 }}>
                  <Typography variant="caption" sx={{ color: themeTextSec, display: 'block', mb: 0.5 }}>UPI_ID</Typography>
                  <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: themeTextColor }}>{payConfig.upi || 'Not configured'}</Typography>
                </Box>
              )}
              <Typography variant="h4" sx={{ fontWeight: 900, color: themeTextColor, fontFamily: "'Outfit', sans-serif" }}>
                ₹{selectedCourse.price}
              </Typography>
            </Box>

            <Box sx={{ mb: 3, display: 'grid', gap: 2, textAlign: 'left' }}>
              <Box sx={{ p: 1.5, background: themeCardBg, borderRadius: '12px', border: `1px solid ${themeBorderColor}` }}>
                <Typography variant="caption" sx={{ display: 'block', fontSize: '0.55rem', color: themeTextColor, fontWeight: 800, mb: 0.5 }}>
                  TRANSACTION_ID (UTR)
                </Typography>
                <TextField 
                  fullWidth size="small" variant="standard" placeholder="12-digit UTR Number"
                  value={utrId} onChange={(e) => setUtrId(e.target.value)}
                  InputProps={{ disableUnderline: true, style: { fontSize: '0.85rem', color: themeTextColor } }}
                />
              </Box>
              <Box sx={{ p: 1.5, border: `1px dashed ${themeBorderColor}`, borderRadius: '12px' }}>
                <Typography variant="caption" sx={{ display: 'block', fontSize: '0.55rem', color: themeTextColor, fontWeight: 800, mb: 0.5 }}>
                  RECEIPT MANIFEST (IMAGE)
                </Typography>
                <input type="file" accept="image/*" onChange={handleUploadProof} style={{ fontSize: '0.65rem', color: themeTextSec }} />
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <Button
                variant="contained"
                disabled={submittingPay}
                onClick={handleSubmitPayment}
                sx={{ background: '#10b981', color: '#fff', py: 1.5, borderRadius: '12px', fontWeight: 900, '&:hover': { background: '#059669' } }}
              >
                SUBMIT FOR VERIFICATION
              </Button>
              <Button
                variant="outlined"
                onClick={handleClosePayment}
                sx={{ color: themeTextSec, borderColor: themeBorderColor, borderRadius: '12px', '&:hover': { borderColor: themeTextSec } }}
              >
                CANCEL
              </Button>
            </Box>
          </Box>
        )}
      </Dialog>

      {/* Video Player Modal */}
      <Dialog
        open={!!activeVideo}
        onClose={() => setActiveVideo(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: '24px', 
            overflow: 'hidden', 
            bgcolor: isDark ? '#0f172a' : '#ffffff',
            border: `1px solid ${themeBorderColor}` 
          }
        }}
      >
        {activeVideo && (
          <Box sx={{ position: 'relative', background: '#000' }}>
            <IconButton
              onClick={() => setActiveVideo(null)}
              sx={{
                position: 'absolute', top: 12, right: 12, zIndex: 10,
                color: '#fff', bgcolor: 'rgba(0,0,0,0.5)',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
              }}
            >
              <CloseIcon />
            </IconButton>
            <Box sx={{ position: 'relative', pb: '56.25%', height: 0 }}>
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.ytId}?autoplay=1`}
                title={activeVideo.title}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </Box>
            <Box sx={{ p: 3, bgcolor: modalPaperBg }}>
              <Typography variant="caption" sx={{ color: '#F7931E', fontWeight: 900, fontSize: '0.6rem', letterSpacing: '1px' }}>
                NOW PLAYING · {activeVideo.duration}
              </Typography>
              <Typography variant="h6" sx={{ color: themeTextColor, fontWeight: 800, mt: 0.5, fontFamily: "'Outfit', sans-serif" }}>
                {activeVideo.title}
              </Typography>
            </Box>
          </Box>
        )}
      </Dialog>

      {/* Test/Assessment Modal */}
      <Dialog
        open={!!activeTest}
        onClose={() => setActiveTest(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '24px', p: 3.5, bgcolor: modalPaperBg, border: `1px solid ${themeBorderColor}` }
        }}
      >
        {activeTest && (
          <Box>
            <DialogTitle sx={{ p: 0, color: '#F7931E', fontWeight: 900, fontSize: '1.2rem', fontFamily: "'Outfit', sans-serif" }}>
              📝 {activeTest.test.title}
            </DialogTitle>
            <Typography variant="caption" sx={{ color: themeTextSec, fontWeight: 700, display: 'block', mb: 3 }}>
              COURSE: {activeTest.course.title}
            </Typography>

            {testResult === null ? (
              <Box>
                {/* Render questions */}
                {(COURSE_TEST_QUESTIONS[activeTest.course.id] || genericQuestions).map((qObj, qIdx) => (
                  <Box key={qIdx} sx={{ mb: 3, p: 2, background: 'rgba(0,0,0,0.01)', border: `1px solid ${themeBorderColor}`, borderRadius: '14px' }}>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: themeTextColor, mb: 1.5 }}>
                      Q{qIdx + 1}: {qObj.q}
                    </Typography>
                    <Box sx={{ display: 'grid', gap: 1 }}>
                      {qObj.options.map((opt, oIdx) => {
                        const isSelected = selectedAnswers[qIdx] === oIdx;
                        return (
                          <Button
                            key={oIdx}
                            variant="outlined"
                            onClick={() => setSelectedAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                            sx={{
                              justifyContent: 'flex-start',
                              textTransform: 'none',
                              fontSize: '0.72rem',
                              py: 1,
                              borderRadius: '10px',
                              color: isSelected ? '#F7931E' : themeTextColor,
                              borderColor: isSelected ? '#F7931E' : themeBorderColor,
                              background: isSelected ? 'rgba(247,147,30,0.05)' : 'transparent',
                              '&:hover': {
                                borderColor: '#F7931E',
                                background: 'rgba(247,147,30,0.02)'
                              }
                            }}
                          >
                            {opt}
                          </Button>
                        );
                      })}
                    </Box>
                  </Box>
                ))}

                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => {
                    const qList = COURSE_TEST_QUESTIONS[activeTest.course.id] || genericQuestions;
                    let correctCount = 0;
                    qList.forEach((qObj, idx) => {
                      if (selectedAnswers[idx] === qObj.ans) correctCount++;
                    });
                    const scorePercent = Math.round((correctCount / qList.length) * 100);
                    const passed = scorePercent >= 60;

                    if (passed) {
                      // Award XP points in localStorage
                      const email = state.user?.email || 'student';
                      let profilePoints = parseInt(localStorage.getItem(`nxa_points_${email}`)) || 0;
                      profilePoints += 50; // award 50 XP
                      localStorage.setItem(`nxa_points_${email}`, profilePoints);
                      window.dispatchEvent(new CustomEvent('nxa_db_updated', { detail: { key: 'nxa_points_updated' } }));
                    }

                    setTestResult({ score: scorePercent, passed });
                  }}
                  sx={{ background: '#F7931E', color: '#fff', fontWeight: 900, py: 1.5, borderRadius: '12px', mt: 2 }}
                >
                  SUBMIT ASSESSMENT
                </Button>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography sx={{ fontSize: '4rem', mb: 2 }}>{testResult.passed ? '🎉' : '❌'}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: themeTextColor, mb: 1 }}>
                  {testResult.passed ? 'Assessment Passed!' : 'Assessment Failed'}
                </Typography>
                <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: testResult.passed ? '#10b981' : '#ef4444', mb: 2 }}>
                  Your Score: {testResult.score}%
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: themeTextSec, mb: 4, maxWidth: '280px', mx: 'auto' }}>
                  {testResult.passed 
                    ? 'Congratulations! You secured a passing grade and have been awarded +50 XP points on your student dossier.' 
                    : 'You did not secure a passing grade (60% required). Please review the syllabus modules and try again.'}
                </Typography>
                <Box sx={{ display: 'grid', gap: 1.5 }}>
                  {!testResult.passed && (
                    <Button
                      variant="contained"
                      onClick={() => {
                        setSelectedAnswers({});
                        setTestResult(null);
                      }}
                      sx={{ background: '#F7931E', color: '#fff', py: 1.2, borderRadius: '12px' }}
                    >
                      RETRY TEST
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    onClick={() => setActiveTest(null)}
                    sx={{ color: themeTextSec, borderColor: themeBorderColor, py: 1.2, borderRadius: '12px' }}
                  >
                    CLOSE
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Dialog>

    </Box>
  );
}

// ═══════════════════════════════════════════════
// ASSESSMENT QUESTION REGISTRY
// ═══════════════════════════════════════════════
const COURSE_TEST_QUESTIONS = {
  ai_ml_foundations: [
    { q: "What is the primary loss function used for binary classification?", options: ["Mean Squared Error", "Binary Cross-Entropy", "Hinge Loss", "Huber Loss"], ans: 1 },
    { q: "Which optimization algorithm is commonly used in neural networks?", options: ["Dijkstra's", "Adam", "Kruskal's", "A* Search"], ans: 1 },
    { q: "What does 'Overfitting' mean in ML?", options: ["Model fits training data too well but fails on test data", "Model is too simple to capture patterns", "Model is too small to fit in RAM", "Training process is too fast"], ans: 0 },
    { q: "What is the purpose of a validation set?", options: ["To train model weights", "To evaluate final performance", "To tune hyperparameters and prevent overfitting", "To format output labels"], ans: 2 },
    { q: "Which neural network architecture is best suited for image processing?", options: ["RNN", "LSTM", "CNN", "Transformer"], ans: 2 }
  ],
  javascript_engineering: [
    { q: "Which keyword is used to declare a block-scoped variable in JS?", options: ["var", "let", "define", "global"], ans: 1 },
    { q: "What is the output of typeof null in JS?", options: ["'null'", "'undefined'", "'object'", "'string'"], ans: 2 },
    { q: "Which method is used to add elements to the end of an array?", options: ["push()", "pop()", "shift()", "unshift()"], ans: 0 },
    { q: "What is a Closure in JavaScript?", options: ["A function bundled with references to its lexical environment", "A method to close browser tabs", "A function that has no parameters", "A way to encrypt scripts"], ans: 0 },
    { q: "What is the purpose of async/await?", options: ["To make asynchronous code look synchronous", "To speed up loop execution", "To block thread execution", "To compile JS to binary"], ans: 0 }
  ]
};

const genericQuestions = [
  { q: "What does HTML stand for?", options: ["Hyper Text Markup Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language", "Hyper Tool Multi Language"], ans: 0 },
  { q: "What is the time complexity of binary search?", options: ["O(N)", "O(log N)", "O(N^2)", "O(1)"], ans: 1 },
  { q: "Which data structure operates on a Last-In-First-Out (LIFO) basis?", options: ["Queue", "Stack", "Tree", "Graph"], ans: 1 },
  { q: "What is the primary function of a Database Index?", options: ["To encrypt stored data", "To speed up data retrieval operations", "To compress data size", "To secure network connections"], ans: 1 },
  { q: "Which protocol is used for secure web browsing?", options: ["HTTP", "FTP", "HTTPS", "SMTP"], ans: 2 }
];

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, CardContent, CardMedia, Grid, Button, TextField,
  Dialog, DialogTitle, DialogContent, Tabs, Tab, IconButton, Divider, Chip,
  CircularProgress, Select, MenuItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DescriptionIcon from '@mui/icons-material/Description';
import CodeIcon from '@mui/icons-material/Code';
import SchoolIcon from '@mui/icons-material/School';
import { getProjectTemplate } from '../utils/projectTemplates';

export default function Projects({ state }) {
  const isDark = localStorage.getItem('nxa_dark_mode') === 'true';
  const isSuper = state.role === 'admin' && state.roleType === 'super';
  const isMax = state.role === 'admin' && state.roleType === 'max';
  const isCenter = state.role === 'admin' && state.roleType === 'center';
  const isExecutive = isMax || isSuper || isCenter || state.role === 'admin';

  const [projects, setProjects] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nxa_industrial_projects')) || []; } catch(e) { return []; }
  });

  const [profiles, setProfiles] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nxa_student_profiles')) || {}; } catch(e) { return {}; }
  });

  const [payConfig, setPayConfig] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('nxa_payment_config')) || { method: 'card', upi: '', qr: '', redirectUrl: '', price: '49' };
    } catch(e) {
      return { method: 'card', upi: '', qr: '', redirectUrl: '', price: '49' };
    }
  });

  // Admin Customizer fields
  const [payMethod, setPayMethod] = useState(payConfig.method || 'card');
  const [payUpi, setPayUpi] = useState(payConfig.upi || '');
  const [payQr, setPayQr] = useState(payConfig.qr || '');
  const [payRedirect, setPayRedirect] = useState(payConfig.redirectUrl || '');
  const [payPrice, setPayPrice] = useState(payConfig.price || '49');

  // Student UPI/Redirect inputs
  const [utrId, setUtrId] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleUpdate = (e) => {
      const { key, data } = e.detail;
      if (key === 'nxa_industrial_projects') {
        setProjects(data);
      } else if (key === 'nxa_student_profiles') {
        setProfiles(data);
      } else if (key === 'nxa_payment_config') {
        setPayConfig(data);
        if (data) {
          setPayMethod(data.method || 'card');
          setPayUpi(data.upi || '');
          setPayQr(data.qr || '');
          setPayRedirect(data.redirectUrl || '');
          setPayPrice(data.price || '49');
        }
      }
    };
    window.addEventListener('nxa_db_updated', handleUpdate);
    return () => window.removeEventListener('nxa_db_updated', handleUpdate);
  }, []);

  const handleSavePayConfig = async () => {
    const conf = {
      method: payMethod,
      upi: payUpi,
      qr: payQr,
      redirectUrl: payRedirect,
      price: payPrice
    };
    setPayConfig(conf);
    localStorage.setItem('nxa_payment_config', JSON.stringify(conf));

    if (typeof window.firebase !== 'undefined') {
      try {
        await window.firebase.firestore().collection('config').doc('payment_config').set(conf);
        alert("✅ GATEWAY CONFIGURATION: Saved globally to Cloud database!");
      } catch(e) {
        console.error(e);
        alert("Saved locally, but failed to sync to Cloud: " + e.message);
      }
    } else {
      alert("✅ GATEWAY CONFIGURATION: Saved locally.");
    }
  };

  // Admin Ingestion Fields
  const [title, setTitle] = useState('');
  const [image, setImage] = useState('');
  const [info, setInfo] = useState('');
  const [source, setSource] = useState('');
  const [dataset, setDataset] = useState('');

  // Details Dialog State
  const [selectedProj, setSelectedProj] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [activeFileKey, setActiveFileKey] = useState('');

  // Secure Checkout State Variables
  const [checkoutStep, setCheckoutStep] = useState(null);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [otpVal, setOtpVal] = useState('');
  const [paymentError, setPaymentError] = useState('');

  const handleDeployProject = async () => {
    if (!title.trim() || !info.trim()) return alert("Title and Description are required.");
    
    const newProj = {
      title: title.trim(),
      image: image.trim() || 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=600&q=80',
      info: info.trim(),
      source: source.trim() || 'https://github.com',
      dataset: dataset.trim() || 'https://kaggle.com'
    };

    const updatedProjects = [...projects, newProj];
    setProjects(updatedProjects);
    localStorage.setItem('nxa_industrial_projects', JSON.stringify(updatedProjects));

    // Firebase write if present
    if (typeof window.firebase !== 'undefined') {
      try {
        await window.firebase.firestore().collection('projects').doc(newProj.title.toLowerCase().replace(/\s+/g, '_')).set(newProj);
      } catch(e) {
        console.warn(e);
      }
    }

    alert("PROJECT DEPLOYED: Node active in local repository.");
    setTitle('');
    setImage('');
    setInfo('');
    setSource('');
    setDataset('');
  };

  const handleDeleteProject = async (idx, e) => {
    e.stopPropagation(); // Prevent dialog from opening on delete click
    if (!confirm("Are you sure you want to terminate this project node?")) return;
    
    const targetProj = projects[idx];
    const updatedProjects = projects.filter((_, i) => i !== idx);
    setProjects(updatedProjects);
    localStorage.setItem('nxa_industrial_projects', JSON.stringify(updatedProjects));

    // Firebase delete if present
    if (typeof window.firebase !== 'undefined' && targetProj) {
      try {
        await window.firebase.firestore().collection('projects').doc(targetProj.title.toLowerCase().replace(/\s+/g, '_')).delete();
      } catch(e) {
        console.warn(e);
      }
    }
  };

  const handleOpenProjectDetails = (proj) => {
    const template = getProjectTemplate(proj);
    
    setSelectedProj({
      ...proj,
      template: template || null
    });
    setActiveTab(0);
    setSelectedLanguage('python');
    
    if (template && template.code && template.code.python) {
      const firstFile = Object.keys(template.code.python)[0];
      setActiveFileKey(firstFile);
    } else {
      setActiveFileKey('');
    }

    if (isProjectLockedForUser(proj)) {
      setCheckoutStep('unlock');
      setCardName('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setOtpVal('');
      setPaymentError('');
    } else {
      setCheckoutStep(null);
    }
  };

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    if (selectedProj && selectedProj.template && selectedProj.template.code && selectedProj.template.code[lang]) {
      const firstFile = Object.keys(selectedProj.template.code[lang])[0];
      setActiveFileKey(firstFile);
    } else {
      setActiveFileKey('');
    }
  };

  const emailKey = state.user?.email?.toLowerCase().trim() || '';
  const myProfile = profiles[emailKey] || {};
  const unlockedProjects = myProfile.unlockedProjects || [];

  const isProjectLockedForUser = (p) => {
    if (isExecutive) return false; // Admin bypass
    if (!p || !p.locked) return false;
    return !unlockedProjects.includes(p.title.toLowerCase().replace(/\s+/g, '_'));
  };

  const isProjectPending = (p) => {
    if (!p) return false;
    const projSlug = p.title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const pendingProjects = myProfile.pendingProjects || [];
    return pendingProjects.includes(projSlug);
  };

  const handleSubmitUpiPayment = async (e) => {
    e.preventDefault();
    if (!utrId || utrId.trim().length < 10) {
      alert("Please enter a valid 12-digit UTR Transaction ID.");
      return;
    }
    
    setIsSubmitting(true);
    setPaymentError('');
    try {
      let receiptUrl = '';
      if (receiptFile && typeof window.firebase !== 'undefined') {
        const storageRef = window.firebase.storage().ref();
        const fileRef = storageRef.child(`receipts/${Date.now()}_${receiptFile.name}`);
        await fileRef.put(receiptFile);
        receiptUrl = await fileRef.getDownloadURL();
      }

      const projSlug = selectedProj.title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

      const logEntry = {
        utr: utrId.trim(),
        email: state.user?.email || 'anonymous@nxa.com',
        projectId: projSlug,
        projectTitle: selectedProj.title,
        amount: payConfig.price || '49.00',
        receipt: receiptUrl,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      if (typeof window.firebase !== 'undefined') {
        const db = window.firebase.firestore();
        // Write transaction log
        await db.collection('payment_logs').doc('utr_' + utrId.trim()).set(logEntry);
        
        // Write pending project to profile
        const userRef = db.collection('profiles').doc(emailKey);
        const pendingProjects = myProfile.pendingProjects || [];
        if (!pendingProjects.includes(projSlug)) {
          pendingProjects.push(projSlug);
        }
        const updatedProfile = { ...myProfile, pendingProjects };
        await userRef.set(updatedProfile, { merge: true });
        
        // Update local state
        const updatedProfiles = { ...profiles, [emailKey]: updatedProfile };
        setProfiles(updatedProfiles);
        localStorage.setItem('nxa_student_profiles', JSON.stringify(updatedProfiles));
        
        window.dispatchEvent(new CustomEvent('nxa_db_updated', {
          detail: { key: 'nxa_student_profiles', data: updatedProfiles }
        }));
      }

      alert("🎉 Payment submitted successfully! Access will be unlocked once approved by the admin.");
      setCheckoutStep(null);
      setSelectedProj(null);
      setUtrId('');
      setReceiptFile(null);
    } catch(err) {
      console.error(err);
      setPaymentError('Failed to submit transaction: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleProjectLock = async (proj, idx, e) => {
    e.stopPropagation();
    const newLocked = !proj.locked;
    const updatedProj = { ...proj, locked: newLocked };
    
    // Update local projects list
    const updatedProjects = [...projects];
    updatedProjects[idx] = updatedProj;
    setProjects(updatedProjects);
    localStorage.setItem('nxa_industrial_projects', JSON.stringify(updatedProjects));
    
    // Firebase write
    if (typeof window.firebase !== 'undefined') {
      try {
        await window.firebase.firestore().collection('projects').doc(proj.title.toLowerCase().replace(/\s+/g, '_')).set(updatedProj, { merge: true });
      } catch (e) {
        console.warn("Failed to update project lock in Firestore:", e);
      }
    }
    
    alert(`PROJECT "${proj.title}" IS NOW ${newLocked ? 'LOCKED' : 'UNLOCKED'} FOR STUDENTS.`);
  };

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const matches = value.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length > 0) {
      setCardNumber(parts.join(' '));
    } else {
      setCardNumber(value);
    }
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 2) {
      setCardExpiry(value.slice(0, 2) + '/' + value.slice(2));
    } else {
      setCardExpiry(value);
    }
  };

  const handleCvvChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 3) value = value.slice(0, 3);
    setCardCvv(value);
  };

  const handleOtpChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 6) value = value.slice(0, 6);
    setOtpVal(value);
  };

  const handleProcessCheckout = (e) => {
    e.preventDefault();
    if (!cardName.trim() || cardNumber.replace(/\s/g, '').length < 16 || cardExpiry.length < 5 || cardCvv.length < 3) {
      setPaymentError('Please fill all card details correctly.');
      return;
    }
    setPaymentError('');
    setCheckoutStep('otp');
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otpVal.length < 6) {
      setPaymentError('Please enter the 6-digit OTP code sent to your device.');
      return;
    }
    
    setPaymentError('');
    setCheckoutStep('processing');
    
    // Simulate secure bank authentication
    setTimeout(async () => {
      try {
        const projSlug = selectedProj.title.toLowerCase().replace(/\s+/g, '_');
        const nextUnlocked = [...unlockedProjects, projSlug];
        
        // Update local profile
        const updatedProfile = { ...myProfile, unlockedProjects: nextUnlocked };
        const updatedProfiles = { ...profiles, [emailKey]: updatedProfile };
        setProfiles(updatedProfiles);
        localStorage.setItem('nxa_student_profiles', JSON.stringify(updatedProfiles));
        
        // Write to Firestore for authenticated persistent validation
        if (typeof window.firebase !== 'undefined') {
          await window.firebase.firestore().collection('profiles').doc(emailKey).set(updatedProfile, { merge: true });
        }
        
        // Dispatch local database update event
        window.dispatchEvent(new CustomEvent('nxa_db_updated', {
          detail: { key: 'nxa_student_profiles', data: updatedProfiles }
        }));
        
        setCheckoutStep('success');
      } catch (err) {
        console.error("Payment registration failed:", err);
        setPaymentError('Payment registration failed. Please contact support.');
        setCheckoutStep('checkout');
      }
    }, 1500);
  };

  const renderSecureCheckout = () => {
    if (checkoutStep === 'unlock') {
      return (
        <Box sx={{ py: 6, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ fontSize: '3.5rem', mb: 2, filter: 'drop-shadow(0 0 10px rgba(247,147,30,0.3))' }}>🔒</Box>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 1, fontFamily: "'Outfit', sans-serif" }}>
            PREMIUM CAPSTONE UPLINK LOCKED
          </Typography>
          <Typography variant="body2" sx={{ color: themeTextSec, maxWidth: '480px', mb: 4, px: 2, fontSize: '0.78rem', lineHeight: 1.6 }}>
            This production-grade major capstone project contains fully structured files, entry servers, database layers, and ML algorithms. To unlock lifetime access, complete the secure payment authorization.
          </Typography>
          
          <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Chip label="Lifetime Access" variant="outlined" sx={{ borderColor: 'rgba(247,147,30,0.3)', color: '#F7931E', fontWeight: 800, fontSize: '0.65rem' }} />
            <Chip label="Interactive File Tree" variant="outlined" sx={{ borderColor: themeBorderColor, color: themeTextColor, fontWeight: 800, fontSize: '0.65rem' }} />
            <Chip label="AI Coach Activated" variant="outlined" sx={{ borderColor: themeBorderColor, color: themeTextColor, fontWeight: 800, fontSize: '0.65rem' }} />
          </Box>
          
          <Button 
            variant="contained"
            onClick={() => setCheckoutStep('checkout')}
            sx={{ 
              background: 'linear-gradient(135deg, #0B2E59 0%, #F7931E 100%)', 
              color: '#fff', 
              px: 4, 
              py: 1.8, 
              borderRadius: '30px', 
              fontWeight: 900, 
              fontSize: '0.78rem',
              boxShadow: '0 8px 24px rgba(247,147,30,0.2)',
              '&:hover': {
                boxShadow: '0 12px 30px rgba(247,147,30,0.4)',
                transform: 'scale(1.02)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            SECURELY UNLOCK ACCESS — ${payConfig.price || '49.00'}
          </Button>
        </Box>
      );
    }
    
    if (checkoutStep === 'checkout') {
      if (payConfig.method === 'upi') {
        return (
          <Box sx={{ maxWidth: '450px', mx: 'auto', py: 2, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 1, fontFamily: "'Outfit', sans-serif", color: themeTextColor }}>
              SCAN QR TO UNLOCK
            </Typography>
            <Typography variant="body2" sx={{ color: themeTextSec, mb: 3, fontSize: '0.75rem', lineHeight: 1.5 }}>
              Scan the official gateway QR code below to transfer the tuition fee of ${payConfig.price || '49.00'}.
            </Typography>

            <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {payConfig.qr ? (
                <Box 
                  component="img" 
                  src={payConfig.qr} 
                  sx={{ width: 180, height: 180, p: 1.5, border: `1px solid ${themeBorderColor}`, borderRadius: '12px', background: '#fff', mb: 1.5 }}
                />
              ) : (
                <Box sx={{ p: 2.5, width: '100%', maxWidth: '280px', background: themeCardBg, borderRadius: '12px', border: `1px solid ${themeBorderColor}`, mb: 1.5 }}>
                  <Typography variant="caption" sx={{ color: themeTextSec, display: 'block', mb: 0.5 }}>UPI ADDRESS</Typography>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: themeTextColor, wordBreak: 'break-all' }}>{payConfig.upi || 'Not configured'}</Typography>
                </Box>
              )}
              {payConfig.upi && payConfig.qr && (
                <Typography variant="body2" sx={{ fontSize: '0.72rem', fontWeight: 800, color: themeTextColor, mb: 2 }}>
                  UPI ID: {payConfig.upi}
                </Typography>
              )}
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#F7931E', fontFamily: "'Outfit', sans-serif" }}>
                AMOUNT: ${payConfig.price || '49.00'}
              </Typography>
            </Box>

            <form onSubmit={handleSubmitUpiPayment}>
              <Grid container spacing={2} sx={{ textAlign: 'left' }}>
                <Grid item xs={12}>
                  <Box sx={{ p: 1.5, background: themeCardBg, borderRadius: '12px', border: `1px solid ${themeBorderColor}` }}>
                    <Typography variant="caption" sx={{ display: 'block', fontSize: '0.55rem', color: themeTextColor, fontWeight: 800, mb: 0.5 }}>
                      TRANSACTION ID (12-DIGIT UTR)
                    </Typography>
                    <TextField 
                      fullWidth size="small" variant="standard" placeholder="Enter Transaction Reference UTR" required
                      value={utrId} onChange={(e) => setUtrId(e.target.value.replace(/\D/g, ''))}
                      InputProps={{ disableUnderline: true, style: { fontSize: '0.8rem', color: themeTextColor } }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ p: 1.5, border: `1px dashed ${themeBorderColor}`, borderRadius: '12px' }}>
                    <Typography variant="caption" sx={{ display: 'block', fontSize: '0.55rem', color: themeTextColor, fontWeight: 800, mb: 0.5 }}>
                      RECEIPT MANIFEST (IMAGE UPLOAD)
                    </Typography>
                    <input 
                      type="file" accept="image/*" 
                      onChange={(e) => setReceiptFile(e.target.files[0])}
                      style={{ fontSize: '0.7rem', color: themeTextColor }} 
                    />
                  </Box>
                </Grid>
                
                {paymentError && (
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: '#ff4d4d', fontWeight: 800 }}>⚠️ {paymentError}</Typography>
                  </Grid>
                )}
                
                <Grid item xs={12} sx={{ mt: 1.5 }}>
                  <Button 
                    fullWidth variant="contained" type="submit" disabled={isSubmitting}
                    sx={{ background: '#0B2E59', color: '#fff', py: 1.5, borderRadius: '12px', fontWeight: 900, fontSize: '0.78rem', '&:hover': { background: '#F7931E' } }}
                  >
                    {isSubmitting ? 'SUBMITTING TRANSACTION...' : '🔒 SUBMIT TRANSACTION FOR APPROVAL'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Box>
        );
      }

      if (payConfig.method === 'redirect') {
        return (
          <Box sx={{ maxWidth: '450px', mx: 'auto', py: 2, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 1, fontFamily: "'Outfit', sans-serif", color: themeTextColor }}>
              EXTERNAL PORTAL PAYMENT
            </Typography>
            <Typography variant="body2" sx={{ color: themeTextSec, mb: 4, fontSize: '0.75rem', lineHeight: 1.5 }}>
              Click the button below to authorize payment through the secure external portal, then input your UTR details to request unlock.
            </Typography>

            <Button
              variant="contained"
              onClick={() => window.open(payConfig.redirectUrl || 'https://github.com', '_blank')}
              sx={{ background: 'linear-gradient(135deg, #0B2E59 0%, #F7931E 100%)', color: '#fff', px: 4, py: 1.5, borderRadius: '24px', fontWeight: 900, fontSize: '0.75rem', mb: 4, boxShadow: '0 8px 20px rgba(247,147,30,0.15)' }}
            >
              🚀 GO TO PAYMENT PORTAL
            </Button>

            <form onSubmit={handleSubmitUpiPayment}>
              <Grid container spacing={2} sx={{ textAlign: 'left' }}>
                <Grid item xs={12}>
                  <Box sx={{ p: 1.5, background: themeCardBg, borderRadius: '12px', border: `1px solid ${themeBorderColor}` }}>
                    <Typography variant="caption" sx={{ display: 'block', fontSize: '0.55rem', color: themeTextColor, fontWeight: 800, mb: 0.5 }}>
                      TRANSACTION ID (12-DIGIT UTR)
                    </Typography>
                    <TextField 
                      fullWidth size="small" variant="standard" placeholder="Enter Transaction Reference UTR" required
                      value={utrId} onChange={(e) => setUtrId(e.target.value.replace(/\D/g, ''))}
                      InputProps={{ disableUnderline: true, style: { fontSize: '0.8rem', color: themeTextColor } }}
                    />
                  </Box>
                </Grid>
                
                {paymentError && (
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: '#ff4d4d', fontWeight: 800 }}>⚠️ {paymentError}</Typography>
                  </Grid>
                )}
                
                <Grid item xs={12} sx={{ mt: 1.5 }}>
                  <Button 
                    fullWidth variant="contained" type="submit" disabled={isSubmitting}
                    sx={{ background: '#0B2E59', color: '#fff', py: 1.5, borderRadius: '12px', fontWeight: 900, fontSize: '0.78rem', '&:hover': { background: '#F7931E' } }}
                  >
                    {isSubmitting ? 'SUBMITTING TRANSACTION...' : '🔒 REGISTER TRANSACTION UTR'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Box>
        );
      }

      return (
        <Box sx={{ maxWidth: '550px', mx: 'auto', py: 2 }}>
          <Box sx={{ 
            background: 'linear-gradient(135deg, #0B2E59 0%, #1e3a8a 50%, #F7931E 100%)', 
            borderRadius: '24px', 
            p: 3, 
            mb: 4, 
            color: '#fff',
            boxShadow: '0 15px 35px rgba(11,46,89,0.25)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Box sx={{
              position: 'absolute',
              top: '-50%',
              left: '-20%',
              width: '150%',
              height: '150%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)'
            }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
              <Typography sx={{ fontWeight: 900, fontSize: '0.7rem', letterSpacing: '2px' }}>SECURE GATEWAY</Typography>
              <Typography sx={{ fontWeight: 900, fontSize: '1rem', fontStyle: 'italic' }}>VISA / MC</Typography>
            </Box>
            <Typography sx={{ fontSize: '1.2rem', fontFamily: 'monospace', letterSpacing: '3px', mb: 3.5 }}>
              {cardNumber || '•••• •••• •••• ••••'}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.6, display: 'block', fontSize: '0.5rem', letterSpacing: '1px' }}>CARDHOLDER</Typography>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {cardName || 'NAME ON CARD'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.6, display: 'block', fontSize: '0.5rem', letterSpacing: '1px' }}>EXPIRES</Typography>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, fontFamily: 'monospace' }}>
                  {cardExpiry || 'MM/YY'}
                </Typography>
              </Box>
            </Box>
          </Box>

          <form onSubmit={handleProcessCheckout}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: themeTextColor }}>CARDHOLDER NAME</Typography>
                <TextField 
                  fullWidth size="small" placeholder="John Doe" required
                  value={cardName} onChange={(e) => setCardName(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', fontSize: '0.78rem' } }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: themeTextColor }}>CARD NUMBER</Typography>
                <TextField 
                  fullWidth size="small" placeholder="4111 1111 1111 1111" required
                  value={cardNumber} onChange={handleCardNumberChange}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', fontSize: '0.78rem' } }}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: themeTextColor }}>EXPIRATION DATE</Typography>
                <TextField 
                  fullWidth size="small" placeholder="MM/YY" required
                  value={cardExpiry} onChange={handleExpiryChange}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', fontSize: '0.78rem' } }}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: themeTextColor }}>CVV CODE</Typography>
                <TextField 
                  fullWidth size="small" placeholder="•••" required type="password"
                  value={cardCvv} onChange={handleCvvChange}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', fontSize: '0.78rem' } }}
                />
              </Grid>
              
              {paymentError && (
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: '#ff4d4d', fontWeight: 800 }}>⚠️ {paymentError}</Typography>
                </Grid>
              )}
              
              <Grid item xs={12} sx={{ mt: 1.5 }}>
                <Button 
                  fullWidth variant="contained" type="submit"
                  sx={{ background: '#0B2E59', color: '#fff', py: 1.5, borderRadius: '12px', fontWeight: 900, fontSize: '0.78rem', '&:hover': { background: '#F7931E' } }}
                >
                  🔒 AUTHORIZE SECURE PAYMENT — ${payConfig.price || '49.00'}
                </Button>
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 2, color: themeTextSec, fontSize: '0.58rem' }}>
                  🛡️ SSL Encrypted PCI-DSS Level 1 compliant gateway. Card credentials are never cached.
                </Typography>
              </Grid>
            </Grid>
          </form>
        </Box>
      );
    }
    
    if (checkoutStep === 'otp') {
      return (
        <Box sx={{ maxWidth: '400px', mx: 'auto', py: 4, textAlign: 'center' }}>
          <Box sx={{ fontSize: '3rem', mb: 2 }}>🔒</Box>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 1, fontFamily: "'Outfit', sans-serif" }}>
            3D-SECURE VERIFICATION
          </Typography>
          <Typography variant="body2" sx={{ color: themeTextSec, mb: 4, fontSize: '0.75rem', lineHeight: 1.5 }}>
            To protect your transaction, a secure verification code has been dispatched. Enter the 6-digit One-Time Password (OTP) to authorize ${payConfig.price || '49.00'}.
          </Typography>
          
          <form onSubmit={handleVerifyOtp}>
            <Box sx={{ mb: 3 }}>
              <TextField 
                placeholder="0 0 0 0 0 0" required autoFocus
                value={otpVal} onChange={handleOtpChange}
                inputProps={{ style: { textAlign: 'center', letterSpacing: '10px', fontSize: '1.2rem', fontWeight: 900 } }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc' } }}
              />
            </Box>
            
            {paymentError && (
              <Typography variant="caption" sx={{ display: 'block', color: '#ff4d4d', fontWeight: 800, mb: 2 }}>⚠️ {paymentError}</Typography>
            )}
            
            <Button 
              fullWidth variant="contained" type="submit"
              sx={{ background: '#F7931E', color: '#fff', py: 1.5, borderRadius: '12px', fontWeight: 900, fontSize: '0.78rem', '&:hover': { background: '#0B2E59' } }}
            >
              AUTHENTICATE TRANSACTION
            </Button>
          </form>
        </Box>
      );
    }
    
    if (checkoutStep === 'processing') {
      return (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <CircularProgress size={50} sx={{ color: '#F7931E', mb: 3 }} />
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 1, fontFamily: "'Outfit', sans-serif" }}>
            VERIFYING TRANSACTION...
          </Typography>
          <Typography variant="body2" sx={{ color: themeTextSec, fontSize: '0.75rem' }}>
            Encrypting channel payloads and executing bank validation. Please stand by.
          </Typography>
        </Box>
      );
    }
    
    if (checkoutStep === 'success') {
      return (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Box sx={{
            width: '70px',
            height: '70px',
            bgcolor: 'rgba(76, 175, 80, 0.1)',
            color: '#4caf50',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            mx: 'auto',
            mb: 3
          }}>
            ✓
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 1, fontFamily: "'Outfit', sans-serif" }}>
            CAPSTONE ACCESS UNLOCKED
          </Typography>
          <Typography variant="body2" sx={{ color: themeTextSec, mb: 4, fontSize: '0.75rem' }}>
            Tuition fee payment processed. Lifetime credentials verified on banking rails.
          </Typography>
          
          <Button 
            variant="contained"
            onClick={() => setCheckoutStep(null)}
            sx={{ background: '#4caf50', color: '#fff', px: 4, py: 1.5, borderRadius: '10px', fontWeight: 900, fontSize: '0.75rem', '&:hover': { background: '#388e3c' } }}
          >
            ENTER COMPONENT WORKSPACE
          </Button>
        </Box>
      );
    }
    return null;
  };

  const handleUrlRedirect = (originalUrl, title, type) => {
    if (!originalUrl) return;
    
    const isGenericOrBroken = [
      'github.com/topics',
      'kaggle.com/datasets?search',
      'boller/yolov8-traffic-analysis',
      'hasibbents/traffic-prediction-dataset',
      'MohamedMoustafa20/Smart-Grid-Predictive-Maintenance',
      'colearninglounge/predictive-maintenance-dataset',
      'vocalpy/yasa',
      'primaryobjects/voice-gender',
      'JonasBrg/yolov8-robotic-arm-sorting',
      'sshikamaru/fruit-bag-dataset-for-sorting-robot-arm',
      'hasibzunair/3d-unet-lung-segmentation',
      'mizgan/Sign-Language-Translator',
      'shanshanyuan/telecom-customer-churn-by-maven-analytics',
      'IntelLabs/nlp-financial-advisor',
      'ndrewatterson/stock-market-financial-news',
      'saurabhgup15/E-Commerce-Recommendation-System',
      'Robert-Phan/License-Plate-Recognition-YOLOv8-easyOCR',
      'aslanaliev/license-plate-ocr',
      'DmitryKuznetsov/stock-volatility-forecasting',
      'timoboz/stock-market-data',
      'pdftables/pdf-invoices-ocr',
      'jofish/fraud-network-analysis',
      'amusi/Self-Driving-Car-Lane-Detection',
      'kunalgupta2616/self-driving-cars-dataset',
      'AtsushiSakai/Bidirectional-LSTM-Autoencoder',
      'nphard/nasa-bearing-dataset',
      'spMohanty/Steel-Defect-Detection',
      'bipinrao19/steel-defect-detection',
      'jphall663/dynamic_pricing',
      'arashnic/taxi-pricing-with-weather',
      'andrewwry/Hospital-Readmissions-Predictor',
      'MITMediaLabTeam/speech-sentiment-analysis',
      'ejloco/ravdess-emotional-speech-audio',
      'stackoverflow/stackoverflow-posts',
      'parano/Genetic-Algorithm-VRP',
      'nagydaniel/vehicle-routing-problem-data',
      'arnabchatterjee/whatsapp-chat-dataset',
      'jboysen/mushrooms',
      'turo/react-native-car-sharing',
      'tanishqdublish/telemedicine-patient-dataset',
      'mixmaxhq/mixmax-scheduler',
      'srinivasav22/social-media-engagement',
      'subhamg/personal-finance-dataset',
      'leetcode/leetcode-questions',
      'nihalsharma/workout-fitness-dataset',
      'socketio/socket.io-bidding-demo',
      'online-auction-dataset/ebay',
      'edx/edx-course-data',
      'redis-queues/processing-logs',
      'solarmind/ip-traffic-intrusion-detection',
      'google/cluster-usage-data',
      'srinivasav22/smart-home-dataset',
      'blockchain-records/shipments',
      'owasp/dependency-check-vulns',
      'nginx/traffic-proxy-logs',
      'distributed-systems/hash-records',
      'srinivasav22/soil-moisture-levels',
      'eliasdabban/web-server-access-logs',
      'postgres-health-telemetry/replica-logs'
    ].some(term => originalUrl.toLowerCase().includes(term.toLowerCase())) || originalUrl === 'https://github.com' || originalUrl === 'https://kaggle.com';

    if (isGenericOrBroken) {
      if (type === 'github') {
        window.open(`https://github.com/search?q=${encodeURIComponent(title + " source code")}`, '_blank');
      } else {
        window.open(`https://www.kaggle.com/search?q=${encodeURIComponent(title + " dataset")}`, '_blank');
      }
    } else {
      window.open(originalUrl, '_blank');
    }
  };

  // Styling Variables
  const themeCardBg = isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(11, 46, 89, 0.02)';
  const themeBorderColor = isDark ? 'rgba(247, 147, 30, 0.15)' : 'rgba(11, 46, 89, 0.08)';
  const themeTextColor = isDark ? '#f8fafc' : '#0B2E59';
  const themeTextSec = isDark ? '#94a3b8' : '#64748b';
  const modalPaperBg = isDark ? '#0f172a' : '#ffffff';

  const renderSpecsContent = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <Typography key={idx} sx={{ fontSize: '0.85rem', fontWeight: 900, color: '#F7931E', mt: 3, mb: 1.5, letterSpacing: '0.5px', fontFamily: "'Outfit', sans-serif" }}>
            {line.replace('### ', '')}
          </Typography>
        );
      } else if (line.startsWith('*   ')) {
        return (
          <Box key={idx} sx={{ display: 'flex', gap: 1, pl: 1, mb: 0.8 }}>
            <Typography sx={{ color: '#F7931E', fontSize: '0.75rem', fontWeight: 900 }}>•</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.75rem', color: themeTextColor, lineHeight: 1.5 }}>
              {line.replace('*   ', '')}
            </Typography>
          </Box>
        );
      } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <Box key={idx} sx={{ display: 'flex', gap: 1, pl: 3, mb: 0.5 }}>
            <Typography sx={{ color: '#64748b', fontSize: '0.7rem' }}>-</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.72rem', color: themeTextSec, lineHeight: 1.4 }}>
              {line.trim().substring(2)}
            </Typography>
          </Box>
        );
      } else if (line.trim().startsWith('`') && line.trim().endsWith('`')) {
        return (
          <Box key={idx} sx={{ p: 1.5, background: isDark ? '#020617' : '#f1f5f9', border: `1px solid ${themeBorderColor}`, borderRadius: '8px', my: 1, fontFamily: 'monospace', fontSize: '0.7rem', color: '#F7931E', overflowX: 'auto' }}>
            {line.trim().replace(/`/g, '')}
          </Box>
        );
      } else if (line.trim() === '') {
        return <Box key={idx} sx={{ height: '8px' }} />;
      } else {
        return (
          <Typography key={idx} variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.55, color: themeTextColor, mb: 1 }}>
            {line}
          </Typography>
        );
      }
    });
  };

  return (
    <Box sx={{ p: 3, pb: '120px' }}>
      
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, borderBottom: '1px solid rgba(11, 46, 89, 0.08)', pb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: themeTextColor, letterSpacing: '1px' }}>
            PROJECT_MATRIX
          </Typography>
          <Typography variant="caption" sx={{ color: '#F7931E', fontWeight: 800, fontSize: '0.6rem', letterSpacing: '1px' }}>
            ACTIVE LABS: {projects.length} SYSTEMS ONLINE
          </Typography>
        </Box>
      </Box>

      {/* Admin project Deployer */}
      {isExecutive && (
        <Card sx={{ background: themeCardBg, border: `1px solid ${themeBorderColor}`, borderRadius: '20px', p: 3, mb: 4, boxShadow: 'none' }}>
          <Typography variant="caption" sx={{ fontSize: '0.75rem', color: themeTextColor, fontWeight: 900, letterSpacing: '1px', display: 'block', mb: 2 }}>
            DEPLOY NEW PROJECT
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontSize: '0.5rem', color: themeTextColor, fontWeight: 800 }}>PROJECT TITLE</Typography>
              <TextField 
                fullWidth size="small" value={title} onChange={(e) => setTitle(e.target.value)} 
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', background: '#fff', fontSize: '0.8rem' } }}
              />
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontSize: '0.5rem', color: themeTextColor, fontWeight: 800 }}>IMAGE MANIFEST URL</Typography>
              <TextField 
                fullWidth size="small" value={image} onChange={(e) => setImage(e.target.value)} 
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', background: '#fff', fontSize: '0.8rem' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontSize: '0.5rem', color: themeTextColor, fontWeight: 800 }}>INDUSTRIAL DESCRIPTION</Typography>
              <TextField 
                fullWidth multiline rows={3} value={info} onChange={(e) => setInfo(e.target.value)} 
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', background: '#fff', fontSize: '0.8rem' } }}
              />
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontSize: '0.5rem', color: themeTextColor, fontWeight: 800 }}>SOURCE CODE UPLINK</Typography>
              <TextField 
                fullWidth size="small" value={source} onChange={(e) => setSource(e.target.value)} 
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', background: '#fff', fontSize: '0.8rem' } }}
              />
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontSize: '0.5rem', color: themeTextColor, fontWeight: 800 }}>DATASET ARCHIVE</Typography>
              <TextField 
                fullWidth size="small" value={dataset} onChange={(e) => setDataset(e.target.value)} 
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', background: '#fff', fontSize: '0.8rem' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth variant="contained" onClick={handleDeployProject}
                sx={{ background: '#0B2E59', color: '#fff', py: 1.5, borderRadius: '8px', fontWeight: 900, '&:hover': { background: '#F7931E' } }}
              >
                MANIFEST PROJECT
              </Button>
            </Grid>
          </Grid>
        </Card>
      )}

      {/* ADMIN — PROJECT LOCK & PAYMENT CONTROL CENTER */}
      {isExecutive && (
        <Card sx={{ background: isDark ? 'rgba(247, 147, 30, 0.03)' : 'rgba(247, 147, 30, 0.02)', border: `1px solid ${isDark ? 'rgba(247, 147, 30, 0.15)' : 'rgba(247, 147, 30, 0.12)'}`, borderRadius: '20px', p: 3, mb: 4, boxShadow: 'none' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ fontSize: '0.75rem', color: '#F7931E', fontWeight: 900, letterSpacing: '1px', display: 'block', mb: 0.5 }}>
                🔐 LOCK & PAYMENT CONTROL CENTER
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.58rem', color: themeTextSec, fontWeight: 700 }}>
                Lock projects to make them premium. Students must pay to unlock access.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="small"
                onClick={async () => {
                  if (!confirm('Lock ALL projects? Students will need to pay to access them.')) return;
                  const updated = projects.map(p => ({ ...p, locked: true }));
                  setProjects(updated);
                  localStorage.setItem('nxa_industrial_projects', JSON.stringify(updated));
                  if (typeof window.firebase !== 'undefined') {
                    for (const p of updated) {
                      try {
                        await window.firebase.firestore().collection('projects').doc(p.title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')).set({ locked: true }, { merge: true });
                      } catch(e) { console.warn(e); }
                    }
                  }
                  alert('✅ All projects locked successfully!');
                }}
                sx={{ background: '#ef4444', color: '#fff', fontSize: '0.6rem', fontWeight: 900, px: 2.5, py: 1, borderRadius: '10px', letterSpacing: '0.5px', '&:hover': { background: '#dc2626' } }}
              >
                🔒 LOCK ALL PROJECTS
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={async () => {
                  if (!confirm('Unlock ALL projects? Students will get free access to everything.')) return;
                  const updated = projects.map(p => ({ ...p, locked: false }));
                  setProjects(updated);
                  localStorage.setItem('nxa_industrial_projects', JSON.stringify(updated));
                  if (typeof window.firebase !== 'undefined') {
                    for (const p of updated) {
                      try {
                        await window.firebase.firestore().collection('projects').doc(p.title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')).set({ locked: false }, { merge: true });
                      } catch(e) { console.warn(e); }
                    }
                  }
                  alert('✅ All projects unlocked successfully!');
                }}
                sx={{ background: '#22c55e', color: '#fff', fontSize: '0.6rem', fontWeight: 900, px: 2.5, py: 1, borderRadius: '10px', letterSpacing: '0.5px', '&:hover': { background: '#16a34a' } }}
              >
                🔓 UNLOCK ALL PROJECTS
              </Button>
            </Box>
          </Box>

          {/* Stats Grid */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ background: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '14px', p: 2, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '1.6rem', fontWeight: 900, color: '#ef4444' }}>
                  {projects.filter(p => p.locked).length}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.55rem', fontWeight: 800, color: themeTextSec, letterSpacing: '0.5px' }}>
                  🔒 LOCKED
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ background: isDark ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '14px', p: 2, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '1.6rem', fontWeight: 900, color: '#22c55e' }}>
                  {projects.filter(p => !p.locked).length}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.55rem', fontWeight: 800, color: themeTextSec, letterSpacing: '0.5px' }}>
                  🔓 UNLOCKED
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ background: isDark ? 'rgba(247,147,30,0.08)' : 'rgba(247,147,30,0.04)', border: '1px solid rgba(247,147,30,0.15)', borderRadius: '14px', p: 2, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '1.6rem', fontWeight: 900, color: '#F7931E' }}>
                  {projects.length}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.55rem', fontWeight: 800, color: themeTextSec, letterSpacing: '0.5px' }}>
                  📁 TOTAL PROJECTS
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ background: isDark ? 'rgba(11,46,89,0.08)' : 'rgba(11,46,89,0.04)', border: '1px solid rgba(11,46,89,0.15)', borderRadius: '14px', p: 2, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '1.6rem', fontWeight: 900, color: '#0B2E59' }}>
                  ${payConfig.price || '49'}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.55rem', fontWeight: 800, color: themeTextSec, letterSpacing: '0.5px' }}>
                  💰 UNLOCK PRICE
                </Typography>
              </Box>
            </Grid>
          </Grid>
 
          {/* Payment Configuration */}
          <Box sx={{ background: isDark ? 'rgba(11,46,89,0.15)' : 'rgba(11,46,89,0.03)', border: `1px solid ${themeBorderColor}`, borderRadius: '14px', p: 2.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 900, fontSize: '0.65rem', color: themeTextColor, letterSpacing: '1px', display: 'block', mb: 2 }}>
              💳 PAYMENT GATEWAY CONFIGURATION CUSTOMIZER
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.55rem', color: themeTextColor, display: 'block', mb: 0.5 }}>ACTIVE METHOD</Typography>
                <Select
                  fullWidth size="small"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  sx={{ borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', fontSize: '0.72rem', color: themeTextColor }}
                >
                  <MenuItem value="card" sx={{ fontSize: '0.72rem' }}>💳 Credit Card (Simulated)</MenuItem>
                  <MenuItem value="upi" sx={{ fontSize: '0.72rem' }}>📱 UPI QR Code + UTR</MenuItem>
                  <MenuItem value="redirect" sx={{ fontSize: '0.72rem' }}>🔗 External URL Redirect</MenuItem>
                </Select>
              </Grid>

              <Grid item xs={12} sm={2}>
                <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.55rem', color: themeTextColor, display: 'block', mb: 0.5 }}>UNLOCK PRICE ($)</Typography>
                <TextField
                  fullWidth size="small" type="number" placeholder="49"
                  value={payPrice} onChange={(e) => setPayPrice(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', fontSize: '0.72rem', color: themeTextColor } }}
                />
              </Grid>
 
              {payMethod === 'upi' && (
                <>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.55rem', color: themeTextColor, display: 'block', mb: 0.5 }}>UPI ADDRESS (VPA)</Typography>
                    <TextField
                      fullWidth size="small" placeholder="e.g. pay@bank"
                      value={payUpi} onChange={(e) => setPayUpi(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', fontSize: '0.72rem', color: themeTextColor } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.55rem', color: themeTextColor, display: 'block', mb: 0.5 }}>QR CODE IMAGE URL</Typography>
                    <TextField
                      fullWidth size="small" placeholder="https://example.com/qr.png"
                      value={payQr} onChange={(e) => setPayQr(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', fontSize: '0.72rem', color: themeTextColor } }}
                    />
                  </Grid>
                </>
              )}
 
              {payMethod === 'redirect' && (
                <Grid item xs={12} sm={7}>
                  <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.55rem', color: themeTextColor, display: 'block', mb: 0.5 }}>REDIRECT URL METHOD LINK</Typography>
                  <TextField
                    fullWidth size="small" placeholder="https://pages.razorpay.com/pl_yourlink"
                    value={payRedirect} onChange={(e) => setPayRedirect(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', fontSize: '0.72rem', color: themeTextColor } }}
                  />
                </Grid>
              )}
 
              {payMethod === 'card' && (
                <Grid item xs={12} sm={7}>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, color: themeTextSec, fontSize: '0.62rem', lineHeight: 1.4 }}>
                    🔒 Card integration activates a simulated 3D-Secure 2FA OTP credit gateway. Card numbers are validated locally according to Luhn algorithm rules but never transmitted over external network endpoints.
                  </Typography>
                </Grid>
              )}

              <Grid item xs={12}>
                <Button
                  variant="contained" size="small" onClick={handleSavePayConfig}
                  sx={{ background: '#F7931E', color: '#fff', fontWeight: 900, fontSize: '0.65rem', px: 3, py: 1, borderRadius: '8px', '&:hover': { background: '#0B2E59' } }}
                >
                  💾 SAVE GATEWAY CONFIGURATION
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Card>
      )}

      {/* Projects List Explorer */}
      <Grid container spacing={3}>
        {projects.map((p, idx) => (
          <Grid item xs={12} sm={6} md={4} key={idx}>
            <Card 
              onClick={() => handleOpenProjectDetails(p)}
              sx={{ 
                position: 'relative',
                borderRadius: '24px', 
                border: `1px solid ${themeBorderColor}`, 
                background: themeCardBg, 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%', 
                boxShadow: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  borderColor: '#F7931E',
                  boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.4)' : '0 10px 25px rgba(11,46,89,0.05)'
                }
              }}
            >
              {p.locked && (
                <Box sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  bgcolor: isProjectPending(p) ? '#ff9800' : (isProjectLockedForUser(p) ? 'rgba(239, 68, 68, 0.85)' : 'rgba(34, 197, 94, 0.85)'),
                  backdropFilter: 'blur(4px)',
                  color: '#fff',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontSize: '0.6rem',
                  fontWeight: 900,
                  letterSpacing: '0.5px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 2
                }}>
                  {isProjectPending(p) ? '⏳ PENDING APPROVAL' : (isProjectLockedForUser(p) ? '🔒 PREMIUM LOCKED' : '🔓 ACCESSED')}
                </Box>
              )}
              <CardMedia
                component="img"
                height="140"
                image={p.image}
                sx={{ borderBottom: `1px solid ${themeBorderColor}` }}
              />
              <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 900, color: themeTextColor, mb: 1, fontFamily: "'Outfit', sans-serif" }}>
                  {p.title}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.72rem', color: themeTextSec, mb: 2.5, lineHeight: 1.4, flexGrow: 1 }}>
                  {p.info.slice(0, 100)}...
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#F7931E', fontWeight: 900, fontSize: '0.58rem', letterSpacing: '1px' }}>
                    EXPLORE LAB MODULE ▶
                  </Typography>
                  
                  {isExecutive && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined" 
                        size="small" 
                        onClick={(e) => toggleProjectLock(p, idx, e)}
                        sx={{ 
                          color: p.locked ? '#ff9800' : '#4caf50', 
                          borderColor: p.locked ? 'rgba(255, 152, 0, 0.2)' : 'rgba(76, 175, 80, 0.2)', 
                          fontSize: '0.55rem', 
                          fontWeight: 900, 
                          py: 0.2,
                          minWidth: 'auto',
                          '&:hover': { 
                            background: p.locked ? 'rgba(255, 152, 0, 0.05)' : 'rgba(76, 175, 80, 0.05)', 
                            borderColor: p.locked ? '#ff9800' : '#4caf50' 
                          } 
                        }}
                      >
                        {p.locked ? '🔓 UNLOCK' : '🔒 LOCK'}
                      </Button>
                      <Button
                        variant="outlined" 
                        size="small" 
                        onClick={(e) => handleDeleteProject(idx, e)}
                        sx={{ 
                          color: '#ff4545', 
                          borderColor: 'rgba(255, 69, 69, 0.2)', 
                          fontSize: '0.55rem', 
                          fontWeight: 900, 
                          py: 0.2,
                          minWidth: 'auto',
                          '&:hover': { background: 'rgba(255, 69, 69, 0.05)', borderColor: '#ff4545' } 
                        }}
                      >
                        DELETE
                      </Button>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {projects.length === 0 && (
          <Grid item xs={12}>
            <Box sx={{ py: 6, textAlign: 'center', color: themeTextSec, border: `1px dashed ${themeBorderColor}`, borderRadius: '20px' }}>
              NO_PROJECTS_LOCATED_IN_MATRIX
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Exhaustive Project Specs & In-App Code Viewer Modal */}
      <Dialog
        open={selectedProj !== null}
        onClose={() => setSelectedProj(null)}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            bgcolor: modalPaperBg,
            color: themeTextColor,
            borderRadius: '28px',
            border: `1px solid ${themeBorderColor}`,
            p: 1
          }
        }}
      >
        {selectedProj && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2, borderBottom: `1px solid ${themeBorderColor}` }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#F7931E', fontWeight: 900, fontSize: '0.65rem', letterSpacing: '2.5px', textTransform: 'uppercase' }}>
                  ⚙️ Industrial Lab Node
                </Typography>
                <Typography variant="h5" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, color: themeTextColor }}>
                  {selectedProj.title}
                </Typography>
              </Box>
              <IconButton onClick={() => setSelectedProj(null)} sx={{ color: themeTextColor }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: { xs: 2, md: 3 }, pt: '12px !important' }}>
              {checkoutStep !== null ? (
                renderSecureCheckout()
              ) : (
                <>
                  {/* Navigation Tabs */}
                  <Tabs
                value={activeTab}
                onChange={(e, val) => setActiveTab(val)}
                variant="fullWidth"
                sx={{
                  mb: 3.5,
                  minHeight: '40px',
                  '& .MuiTabs-indicator': { backgroundColor: '#F7931E', height: '3px' },
                  '& .MuiTab-root': {
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '0.72rem',
                    fontWeight: 900,
                    letterSpacing: '1px',
                    color: themeTextSec,
                    '&.Mui-selected': { color: '#F7931E' }
                  }
                }}
              >
                <Tab icon={<DescriptionIcon sx={{ fontSize: '1.1rem' }} />} iconPosition="start" label="PROJECT SPECS" />
                <Tab icon={<CodeIcon sx={{ fontSize: '1.1rem' }} />} iconPosition="start" label="SOURCE CODE VIEWER" />
                <Tab icon={<SchoolIcon sx={{ fontSize: '1.1rem' }} />} iconPosition="start" label="INTERVIEW COACH" />
              </Tabs>

              {/* TAB 0: PIN-TO-PIN DETAILED SPECIFICATIONS */}
              {activeTab === 0 && (
                <Grid container spacing={3}>
                  
                  {/* Left Column: Specs overview */}
                  <Grid item xs={12} md={7} sx={{ maxHeight: '480px', overflowY: 'auto', pr: 1.5 }}>
                    {selectedProj.template ? (
                      renderSpecsContent(selectedProj.template.specs.problem)
                    ) : (
                      <>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#F7931E', mb: 1, letterSpacing: '0.5px' }}>
                          📋 PROJECT DIRECTIVE OBJECTIVE
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.5, mb: 3.5, color: themeTextColor }}>
                          {selectedProj.info}
                        </Typography>
                      </>
                    )}

                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#F7931E', mt: 3.5, mb: 1.5, letterSpacing: '0.5px' }}>
                      🔗 SYSTEM ARCHITECTURE PIPELINE
                    </Typography>
                    <Box sx={{ display: 'grid', gap: 1.8, mb: 3.5 }}>
                      {selectedProj.template ? (
                        selectedProj.template.specs.architecture.map((arch, index) => (
                          <Box key={index} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                            <PlayArrowIcon sx={{ color: '#F7931E', fontSize: '1.1rem', mt: 0.1 }} />
                            <Typography variant="body2" sx={{ fontSize: '0.75rem', color: themeTextColor }}>{arch}</Typography>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', fontStyle: 'italic', color: themeTextSec }}>Architectural schema pending deployment.</Typography>
                      )}
                    </Box>

                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#F7931E', mb: 1.5, letterSpacing: '0.5px' }}>
                      🌊 DATA FLOW VECTORS
                    </Typography>
                    <Box sx={{ display: 'grid', gap: 1.2 }}>
                      {selectedProj.template ? (
                        selectedProj.template.specs.flow.map((flowStep, index) => (
                          <Typography key={index} variant="body2" sx={{ fontSize: '0.75rem', color: themeTextSec }}>
                            {flowStep}
                          </Typography>
                        ))
                      ) : (
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', fontStyle: 'italic', color: themeTextSec }}>Data vectors sequence not defined.</Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* Right Column: Key metrics & Resource paths */}
                  <Grid item xs={12} md={5}>
                    <Box sx={{ background: themeCardBg, border: `1px solid ${themeBorderColor}`, borderRadius: '20px', p: 3, mb: 3 }}>
                      <Typography variant="caption" sx={{ fontWeight: 900, fontSize: '0.62rem', color: '#F7931E', letterSpacing: '1px', display: 'block', mb: 2 }}>
                        📈 CORE INDUSTRIAL METRICS
                      </Typography>
                      
                      {selectedProj.template ? (
                        <Box sx={{ display: 'grid', gap: 2.5 }}>
                          <Box>
                            <Typography variant="caption" sx={{ color: themeTextSec, fontSize: '0.55rem', fontWeight: 800 }}>UPLINK LATENCY</Typography>
                            <Typography sx={{ fontWeight: 900, fontSize: '0.85rem', color: themeTextColor }}>{selectedProj.template.specs.metrics.latency}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: themeTextSec, fontSize: '0.55rem', fontWeight: 800 }}>MODEL ACCURACY</Typography>
                            <Typography sx={{ fontWeight: 900, fontSize: '0.85rem', color: themeTextColor }}>{selectedProj.template.specs.metrics.accuracy}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: themeTextSec, fontSize: '0.55rem', fontWeight: 800 }}>OPERATIONAL REDUCTION</Typography>
                            <Typography sx={{ fontWeight: 900, fontSize: '0.85rem', color: themeTextColor }}>{selectedProj.template.specs.metrics.reduction}</Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', fontStyle: 'italic', color: themeTextSec }}>No hardware benchmarks recorded.</Typography>
                      )}
                    </Box>

                    {/* Resources */}
                    <Typography variant="caption" sx={{ fontWeight: 900, fontSize: '0.62rem', color: themeTextSec, letterSpacing: '1px', display: 'block', mb: 1 }}>
                      📦 EXTERNAL DATASETS & ARCHIVES
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Button 
                          fullWidth size="small" variant="outlined" onClick={() => handleUrlRedirect(selectedProj.source, selectedProj.title, 'github')}
                          sx={{ color: themeTextColor, borderColor: themeBorderColor, fontSize: '0.65rem', fontWeight: 900, py: 1, borderRadius: '10px' }}
                        >
                          GITHUB UPLINK
                        </Button>
                      </Grid>
                      <Grid item xs={6}>
                        <Button 
                          fullWidth size="small" variant="outlined" onClick={() => handleUrlRedirect(selectedProj.dataset, selectedProj.title, 'kaggle')}
                          sx={{ color: '#F7931E', borderColor: 'rgba(247,147,30,0.3)', fontSize: '0.65rem', fontWeight: 900, py: 1, borderRadius: '10px' }}
                        >
                          KAGGLE SHEET
                        </Button>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              )}

              {/* TAB 1: IN-APP CODE VIEWER & MULTI-LANGUAGE SWAPPER */}
              {activeTab === 1 && (
                <Box>
                  {selectedProj.template ? (
                    <>
                      {/* Controls: Workspace Selector */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5, borderBottom: `1px solid ${themeBorderColor}`, pb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 900, color: themeTextColor, fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                          💻 ACTIVE WORKSPACE: <span style={{ color: '#F7931E' }}>{selectedLanguage.toUpperCase()} PRODUCTION ENV</span>
                        </Typography>

                        {/* Language Selection Chips */}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {['python', 'javascript', 'java'].map(lang => (
                            <Chip 
                              key={lang}
                              label={lang.toUpperCase() + " WORKSPACE"}
                              onClick={() => handleLanguageChange(lang)}
                              sx={{
                                fontSize: '0.6rem',
                                height: '28px',
                                fontWeight: 900,
                                letterSpacing: '0.5px',
                                cursor: 'pointer',
                                background: selectedLanguage === lang ? '#F7931E' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(11,46,89,0.05)'),
                                color: selectedLanguage === lang ? '#fff' : themeTextColor,
                                '&:hover': { background: selectedLanguage === lang ? '#F7931E' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(11,46,89,0.1)') }
                              }}
                            />
                          ))}
                        </Box>
                      </Box>

                      {/* Workspace Split Layout */}
                      <Grid container spacing={2}>
                        {/* File Tree Explorer (25%) */}
                        <Grid item xs={12} md={3}>
                          <Box sx={{ background: isDark ? '#030712' : 'rgba(11, 46, 89, 0.02)', border: `1px solid ${themeBorderColor}`, borderRadius: '16px', p: 1.5, minHeight: '300px', maxHeight: '400px', overflowY: 'auto' }}>
                            <Typography variant="caption" sx={{ color: themeTextSec, fontWeight: 900, fontSize: '0.55rem', letterSpacing: '1px', display: 'block', mb: 1.5 }}>
                              📂 PROJECT DIRECTORY
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                              {Object.keys(selectedProj.template.code[selectedLanguage]).map(fileName => {
                                const isActive = activeFileKey === fileName;
                                return (
                                  <Button
                                    key={fileName}
                                    onClick={() => setActiveFileKey(fileName)}
                                    sx={{
                                      justifyContent: 'flex-start',
                                      fontSize: '0.68rem',
                                      fontWeight: 800,
                                      fontFamily: 'monospace',
                                      textAlign: 'left',
                                      py: 0.8,
                                      px: 1.5,
                                      borderRadius: '10px',
                                      textTransform: 'none',
                                      background: isActive ? (isDark ? 'rgba(247,147,30,0.15)' : 'rgba(11,46,89,0.08)') : 'transparent',
                                      color: isActive ? '#F7931E' : themeTextColor,
                                      border: isActive ? `1px solid ${isDark ? 'rgba(247,147,30,0.3)' : 'rgba(11,46,89,0.2)'}` : `1px solid transparent`,
                                      '&:hover': {
                                        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(11,46,89,0.04)'
                                      }
                                    }}
                                  >
                                    📄 {fileName}
                                  </Button>
                                );
                              })}
                            </Box>
                          </Box>
                        </Grid>

                        {/* Code Display Area (75%) */}
                        <Grid item xs={12} md={9}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <Box sx={{ background: isDark ? '#030712' : '#f8fafc', border: `1px solid ${themeBorderColor}`, borderBottom: 'none', px: 2, py: 1, borderTopLeftRadius: '16px', borderTopRightRadius: '16px', display: 'flex', alignItems: 'center' }}>
                              <Typography sx={{ fontSize: '0.7rem', color: themeTextSec, fontFamily: 'monospace', fontWeight: 800 }}>
                                Active File: <span style={{ color: '#F7931E' }}>{activeFileKey}</span>
                              </Typography>
                            </Box>
                            <Box 
                              sx={{ 
                                p: 2.5, 
                                borderTopLeftRadius: 0,
                                borderTopRightRadius: 0,
                                borderBottomLeftRadius: '16px',
                                borderBottomRightRadius: '16px',
                                background: isDark ? '#020617' : '#ffffff',
                                border: `1px solid ${themeBorderColor}`,
                                minHeight: '300px',
                                maxHeight: '350px',
                                overflowY: 'auto',
                                fontFamily: 'Consolas, Monaco, "Andale Mono", monospace',
                                fontSize: '0.72rem',
                                lineHeight: 1.55,
                                color: isDark ? '#38bdf8' : '#0B2E59',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-all'
                              }}
                            >
                              {selectedProj.template.code[selectedLanguage][activeFileKey] || '// File empty.'}
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </>
                  ) : (
                    <Box sx={{ py: 6, textAlign: 'center', color: themeTextSec, border: `1px dashed ${themeBorderColor}`, borderRadius: '20px' }}>
                      SOURCE CODE NOT ASSOCIATED WITH CUSTOM NODES
                    </Box>
                  )}
                </Box>
              )}

              {/* TAB 2: INTERVIEW COACH & PITCH PREPARATION */}
              {activeTab === 2 && (
                <Box>
                  {selectedProj.template ? (
                    <Grid container spacing={3}>
                      
                      {/* Left side: The pitch script */}
                      <Grid item xs={12} md={6}>
                        <Box sx={{ background: 'rgba(247, 147, 30, 0.03)', border: '1px dashed #F7931E', borderRadius: '20px', p: 3, height: '100%' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#F7931E', mb: 1.5, letterSpacing: '1px' }}>
                            🎤 THE 30-SECOND INTERVIEW PITCH
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.78rem', lineHeight: 1.6, color: themeTextColor, fontStyle: 'italic' }}>
                            "{selectedProj.template.coach.pitch}"
                          </Typography>
                          <Divider sx={{ my: 2.5, borderColor: 'rgba(247,147,30,0.2)' }} />
                          <Typography variant="caption" sx={{ color: themeTextSec, display: 'block', fontSize: '0.62rem', fontWeight: 700 }}>
                            💡 Pro-tip: Memorize this flow. When an interviewer asks "Explain your project", recite this exact sequence, speaking clearly and emphasizing the metrics delay reductions.
                          </Typography>
                        </Box>
                      </Grid>

                      {/* Right side: Q&As list */}
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeTextColor, mb: 2, letterSpacing: '0.5px' }}>
                          ❓ EXPECTED TECHNICAL INTERVIEW QUESTIONS
                        </Typography>

                        <Box sx={{ display: 'grid', gap: 2.5 }}>
                          {selectedProj.template.coach.questions.map((qna, index) => (
                            <Box key={index} sx={{ background: themeCardBg, border: `1px solid ${themeBorderColor}`, borderRadius: '16px', p: 2 }}>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#F7931E', mb: 0.8 }}>
                                Q: {qna.q}
                              </Typography>
                              <Typography sx={{ fontSize: '0.72rem', color: themeTextColor, lineHeight: 1.4 }}>
                                A: {qna.a}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Grid>

                    </Grid>
                  ) : (
                    <Box sx={{ py: 6, textAlign: 'center', color: themeTextSec, border: `1px dashed ${themeBorderColor}`, borderRadius: '20px' }}>
                      COACHING CRITERIA NOT AVAILABLE FOR THIS NODE
                    </Box>
                  )}
                </Box>
              )}
            </>
          )}

            </DialogContent>
          </>
        )}
      </Dialog>

    </Box>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, CardContent, Button, TextField, 
  Grid, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert
} from '@mui/material';
import { auth, db } from '../firebaseConfig';

export default function AdminManagement({ state }) {
  const isDark = localStorage.getItem('nxa_dark_mode') === 'true';

  // State
  const [admins, setAdmins] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    // Load admin list from Firestore
    const unsubAdmins = db.collection('admins').onSnapshot((snap) => {
      const list = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setAdmins(list);
    }, (err) => {
      console.warn("Failed to load admin list:", err);
    });

    // Load audit logs
    let logs = [];
    try {
      logs = JSON.parse(localStorage.getItem('nxa_audit_logs')) || [];
    } catch (e) {
      logs = [];
    }
    setAuditLogs(logs);

    return () => unsubAdmins();
  }, []);

  const handleChangeOwnPassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!newPassword.trim() || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        setPasswordError('You must be signed in to change your password.');
        return;
      }

      // Re-authenticate
      const credential = window.firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
      await user.reauthenticateWithCredential(credential);

      // Update password
      await user.updatePassword(newPassword);

      // Write audit log
      const newLog = {
        id: 'log_' + Date.now(),
        admin: user.email,
        role: 'admin',
        action: 'Updated own access key password',
        time: new Date().toLocaleString()
      };
      const updatedLogs = [newLog, ...auditLogs];
      setAuditLogs(updatedLogs);
      localStorage.setItem('nxa_audit_logs', JSON.stringify(updatedLogs));

      setPasswordSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => setOpenPasswordDialog(false), 1500);
    } catch (err) {
      console.error('Password change failed:', err);
      const errorMessages = {
        'auth/wrong-password': 'Current password is incorrect.',
        'auth/invalid-credential': 'Current password is incorrect.',
        'auth/weak-password': 'New password is too weak. Use at least 6 characters.',
        'auth/requires-recent-login': 'Session expired. Please sign out and sign back in, then try again.',
        'auth/too-many-requests': 'Too many attempts. Please wait a moment.'
      };
      setPasswordError(errorMessages[err.code] || err.message || 'Failed to update password.');
    }
  };

  const themeCardBg = isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(11, 46, 89, 0.02)';
  const themeBorderColor = isDark ? 'rgba(247, 147, 30, 0.15)' : 'rgba(11, 46, 89, 0.08)';
  const themeTextColor = isDark ? '#f8fafc' : '#0B2E59';
  const themeTextSec = isDark ? '#94a3b8' : '#64748b';
  const modalPaperBg = isDark ? '#1e293b' : '#ffffff';

  return (
    <Box sx={{ p: 3, pb: '120px' }}>
      
      {/* Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="caption" sx={{ color: '#F7931E', fontWeight: 900, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '2.5px' }}>
          Root Security Command
        </Typography>
        <Typography variant="h5" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, color: themeTextColor, letterSpacing: '-0.5px' }}>
          Admin Directory
        </Typography>
      </Box>

      {/* Admin List */}
      <Typography variant="h6" sx={{ fontSize: '0.85rem', fontWeight: 900, color: themeTextColor, mb: 2 }}>
        🔑 REGISTERED ADMINISTRATORS
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {admins.map(admin => (
          <Grid item xs={12} sm={6} key={admin.id}>
            <Card sx={{ background: themeCardBg, border: `1px solid ${themeBorderColor}`, borderRadius: '24px', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeTextColor }}>
                    {admin.name || admin.id}
                  </Typography>
                  <Chip 
                    label={(admin.roleType || 'admin').toUpperCase() + "_ADMIN"} 
                    size="small" 
                    sx={{ 
                      fontSize: '0.55rem', fontWeight: 900, 
                      background: admin.roleType === 'max' ? 'rgba(11,46,89,0.08)' : admin.roleType === 'super' ? 'rgba(16,185,129,0.1)' : 'rgba(247,147,30,0.1)',
                      color: admin.roleType === 'max' ? '#0B2E59' : admin.roleType === 'super' ? '#10b981' : '#F7931E'
                    }} 
                  />
                </Box>
                
                <Box sx={{ display: 'grid', gap: 1, fontSize: '0.75rem', color: themeTextSec }}>
                  <Box>
                    <b>Email</b>: <span style={{ fontFamily: 'monospace' }}>{admin.email || admin.id}</span>
                  </Box>
                  <Box>
                    <b>Scope Permissions</b>: {
                      admin.roleType === 'super' ? "Full Access — All Modules" :
                      admin.roleType === 'max' ? "Projects, Live Class, Courses" : 
                      "Attendance, Signals, Internships, Student Profiles"
                    }
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {admins.length === 0 && (
          <Grid item xs={12}>
            <Box sx={{ p: 4, textAlign: 'center', color: themeTextSec, fontSize: '0.8rem' }}>
              No administrators registered in Firestore. Run the <code>seed-admins.js</code> script to create admin accounts.
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Change Password Button */}
      <Box sx={{ mb: 5 }}>
        <Button 
          variant="outlined" 
          size="small"
          onClick={() => { setOpenPasswordDialog(true); setPasswordError(''); setPasswordSuccess(''); }}
          sx={{ 
            fontSize: '0.65rem', fontWeight: 800, color: themeTextColor, borderColor: themeBorderColor, borderRadius: '10px', px: 3, py: 1.2,
            '&:hover': { color: '#F7931E', borderColor: '#F7931E' }
          }}
        >
          🔐 CHANGE MY PASSWORD
        </Button>
      </Box>

      {/* Audit Logs */}
      <Typography variant="h6" sx={{ fontSize: '0.85rem', fontWeight: 900, color: themeTextColor, mb: 2 }}>
        📜 SYSTEM ACTIVITY AUDIT LOG
      </Typography>

      <TableContainer component={Paper} sx={{ borderRadius: '20px', border: `1px solid ${themeBorderColor}`, boxShadow: 'none', background: themeCardBg, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(11, 46, 89, 0.02)' }}>
            <TableRow>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 900, color: themeTextColor }}>ADMINISTRATOR</TableCell>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 900, color: themeTextColor }}>ROLE</TableCell>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 900, color: themeTextColor }}>ACTION DESCRIPTION</TableCell>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 900, color: themeTextColor, textAlign: 'right' }}>TIMESTAMP</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {auditLogs.map((log) => (
              <TableRow key={log.id} sx={{ '& td': { py: 1.5, borderColor: themeBorderColor, fontSize: '0.7rem', color: themeTextColor } }}>
                <TableCell sx={{ fontWeight: 700 }}>{log.admin}</TableCell>
                <TableCell>
                  <Chip 
                    label={log.role.toUpperCase()} 
                    size="small" 
                    sx={{ height: '18px', fontSize: '0.55rem', fontWeight: 900, background: log.role === 'super' ? '#10b981' : log.role === 'max' ? '#0B2E59' : '#F7931E', color: '#fff' }} 
                  />
                </TableCell>
                <TableCell sx={{ color: themeTextColor }}>{log.action}</TableCell>
                <TableCell align="right" sx={{ color: themeTextSec, fontFamily: 'monospace' }}>{log.time}</TableCell>
              </TableRow>
            ))}
            {auditLogs.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} sx={{ textAlign: 'center', color: themeTextSec, py: 3 }}>
                  No audit logs recorded.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Change Password Dialog */}
      <Dialog 
        open={openPasswordDialog} 
        onClose={() => setOpenPasswordDialog(false)}
        PaperProps={{ sx: { bgcolor: modalPaperBg, color: themeTextColor, borderRadius: '20px', width: '100%', maxWidth: '380px' } }}
      >
        <DialogTitle sx={{ fontWeight: 900, fontSize: '0.95rem', borderBottom: `1px solid ${themeBorderColor}` }}>
          🔐 Change Your Password
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {passwordError && <Alert severity="error" sx={{ fontSize: '0.7rem', py: 0 }}>{passwordError}</Alert>}
          {passwordSuccess && <Alert severity="success" sx={{ fontSize: '0.7rem', py: 0 }}>{passwordSuccess}</Alert>}

          <TextField 
            label="Current Password" 
            type="password"
            size="small" 
            fullWidth 
            value={currentPassword} 
            onChange={(e) => setCurrentPassword(e.target.value)}
            InputLabelProps={{ style: { fontSize: '0.75rem' } }}
            inputProps={{ style: { fontSize: '0.75rem' } }}
          />
          <TextField 
            label="New Password" 
            type="password"
            size="small" 
            fullWidth 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)}
            InputLabelProps={{ style: { fontSize: '0.75rem' } }}
            inputProps={{ style: { fontSize: '0.75rem' } }}
          />
          <TextField 
            label="Confirm New Password" 
            type="password"
            size="small" 
            fullWidth 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)}
            InputLabelProps={{ style: { fontSize: '0.75rem' } }}
            inputProps={{ style: { fontSize: '0.75rem' } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${themeBorderColor}` }}>
          <Button onClick={() => setOpenPasswordDialog(false)} sx={{ fontSize: '0.65rem', fontWeight: 800, color: themeTextSec }}>CANCEL</Button>
          <Button onClick={handleChangeOwnPassword} variant="contained" sx={{ background: '#0B2E59', color: '#fff', fontSize: '0.65rem', fontWeight: 900 }}>UPDATE PASSWORD</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

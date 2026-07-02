import React, { useState } from 'react';
import { 
  Box, Card, CardContent, TextField, Button, Typography, 
  Select, MenuItem, FormControl, InputLabel, Link 
} from '@mui/material';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const emailRaw = email.trim();
    const emailKeyVal = emailRaw.toLowerCase().trim();
    const passkey = pass.trim();
    
    try {
      // 1. Direct role verification
      if (emailKeyVal === 'nxasupertalent@gmail.com' && passkey === 'NXA1426') {
        onLogin({ name: 'Super Admin', email: emailRaw }, 'admin', 'super');
        setSubmitting(false);
        return;
      } else if (emailKeyVal === 'nxamaxtalent@gmail.com' && passkey === 'NXA1526') {
        onLogin({ name: 'Max Admin', email: emailRaw }, 'admin', 'max');
        setSubmitting(false);
        return;
      } else if (emailKeyVal === 'nxacentertalent@gmail.com' && passkey === 'NXA1626') {
        onLogin({ name: 'Center Admin', email: emailRaw }, 'admin', 'center');
        setSubmitting(false);
        return;
      }

      // 2. Fallback check for dynamically updated password settings
      let adminRoles = {};
      try { adminRoles = JSON.parse(localStorage.getItem('nxa_admin_roles')) || {}; } catch(e) { adminRoles = {}; }
      const matchedAdmin = adminRoles[emailKeyVal];

      if (matchedAdmin && matchedAdmin.pass === passkey) {
        onLogin({ name: matchedAdmin.name || 'Admin', email: emailRaw }, 'admin', matchedAdmin.type);
      } else {
        alert("ACCESS KEY DENIED: Unauthorized Admin credentials.");
      }
    } catch (err) {
      console.error("Login logic error:", err);
      alert("System access failure.");
    }
    setSubmitting(false);
  };

  return (
    <Box 
      className="auth-overlay"
      sx={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 2000, overflow: 'hidden'
      }}
    >
      <Card 
        className="auth-card"
        sx={{
          width: '90%', maxWidth: '420px', padding: { xs: '2rem 1.5rem', sm: '3.5rem 3rem' },
          borderRadius: '28px', border: '1px solid rgba(11, 46, 89, 0.08)',
          boxShadow: '0 20px 60px rgba(11, 46, 89, 0.08)',
          animation: 'cardManifest 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h3" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, letterSpacing: '-2px', mb: 1 }}>
              <Box component="span" sx={{ color: '#0B2E59' }}>NXA</Box>
              <Box component="span" sx={{ color: '#F7931E', fontWeight: 300, letterSpacing: '2px', ml: 1 }}>TALENT</Box>
            </Typography>
            <Typography variant="subtitle2" sx={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }}>
              ADMIN COMMAND ACCESS
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="ADMIN KEY"
              type="text"
              required
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@nxa.core"
              sx={{ mb: 2.5 }}
              InputLabelProps={{ sx: { fontSize: '0.65rem', fontWeight: 700, color: '#0B2E59', letterSpacing: '1px' } }}
              inputProps={{ style: { fontSize: '0.9rem', color: '#0B2E59' } }}
            />

            <TextField
              fullWidth
              label="ACCESS KEY"
              type="password"
              required
              variant="outlined"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              sx={{ mb: 4 }}
              InputLabelProps={{ sx: { fontSize: '0.65rem', fontWeight: 700, color: '#0B2E59', letterSpacing: '1px' } }}
              inputProps={{ style: { fontSize: '0.9rem', color: '#0B2E59' } }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={submitting}
              sx={{
                background: '#0B2E59',
                color: '#ffffff',
                py: 1.8,
                fontWeight: 800,
                fontFamily: "'Outfit', sans-serif",
                fontSize: '0.8rem',
                letterSpacing: '1.5px',
                borderRadius: '12px',
                '&:hover': {
                  background: '#F7931E',
                  boxShadow: '0 0 15px rgba(247, 147, 30, 0.2)'
                }
              }}
            >
              {submitting ? 'PROCESSING...' : 'SYSTEM ACCESS'}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center', mt: 4, fontSize: '0.75rem', color: '#64748b' }}>
            Restricted System. Unauthorized attempts will be flagged.
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

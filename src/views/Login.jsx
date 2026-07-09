import React, { useState } from 'react';
import { 
  Box, Card, CardContent, TextField, Button, Typography, Alert
} from '@mui/material';
import { signIn, getUserRole, signOut } from '../utils/auth';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      // Admin Login via Firebase Auth
      const user = await signIn(email, pass);
      const { role, roleType } = await getUserRole(user);

      if (role !== 'admin') {
        setError("Student access is restricted to the Student Portal.");
        await signOut();
        setSubmitting(false);
        return;
      }

      onLogin(user, 'admin', roleType);
    } catch (err) {
      console.error("Login error:", err);
      
      const errorMessages = {
        'auth/user-not-found': 'No admin account found with this email. Contact the system administrator.',
        'auth/wrong-password': 'Incorrect access key. Please try again.',
        'auth/invalid-credential': 'Invalid credentials. Please try again.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/too-many-requests': 'Too many attempts. Please wait a moment.',
        'auth/network-request-failed': 'Network error. Please check your connection.'
      };
      
      setError(errorMessages[err.code] || err.message || 'Authentication failed. Please try again.');
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
            <Typography variant="subtitle2" sx={{ fontSize: '0.65rem', color: '#ff4545', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>
              ADMIN COMMAND PORTAL
            </Typography>
          </Box>

          {error && (
            <Box sx={{ 
              mb: 2.5, p: 1.5, borderRadius: '10px', 
              background: 'rgba(255, 69, 69, 0.05)', 
              border: '1px solid rgba(255, 69, 69, 0.15)',
              color: '#dc2626', fontSize: '0.75rem', fontWeight: 600
            }}>
              {error}
            </Box>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="ADMIN KEY (EMAIL)"
              type="email"
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
            {submitting ? 'PROCESSING...' : 'AUTHORIZE COMMAND ACCESS'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

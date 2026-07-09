import { auth, db } from '../firebaseConfig';

/**
 * Admin Portal Auth Utility
 */

export const signIn = async (email, password) => {
  const normalizedEmail = email.trim().toLowerCase();
  const credential = await auth.signInWithEmailAndPassword(normalizedEmail, password);
  const user = credential.user;
  
  // Force token refresh to pick up custom claims (role, roleType)
  await user.getIdTokenResult(true);
  return user;
};

export const signOut = async () => {
  await auth.signOut();
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const getUserRole = async (user) => {
  if (!user) return { role: null, roleType: null };

  try {
    const tokenResult = await user.getIdTokenResult();
    if (tokenResult.claims.role === 'admin') {
      return {
        role: 'admin',
        roleType: tokenResult.claims.roleType || null
      };
    }
  } catch (e) {
    console.warn('Failed to read custom claims:', e);
  }

  // Fallback: check Firestore profile
  try {
    const emailKey = user.email.toLowerCase();
    const profileDoc = await db.collection('profiles').doc(emailKey).get();
    if (profileDoc.exists) {
      const data = profileDoc.data();
      return {
        role: data.role || null,
        roleType: data.roleType || null
      };
    }
  } catch (e) {
    console.warn('Failed to read profile for role:', e);
  }

  return { role: null, roleType: null };
};

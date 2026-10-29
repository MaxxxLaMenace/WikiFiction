import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { appUrl, supabase } from './supabase';

interface AuthState {
  user: User | null;
  // Vrai tant que la session existante n'a pas encore été lue.
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, loading: false });

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: !!supabase });

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setState({ user: data.session?.user ?? null, loading: false }));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, loading: false });
    });
    // Après un lien de connexion, retire le code de l'adresse.
    if (new URLSearchParams(window.location.search).has('code')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    }
    return () => data.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

function LoginDialog({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setStatus('sending');
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: appUrl() } });
    if (error) {
      setError(error.message);
      setStatus('error');
    } else {
      setStatus('sent');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="login" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Connexion">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">×</button>
        <h2>Connexion</h2>
        {status === 'sent' ? (
          <p>
            Un lien de connexion a été envoyé à <strong>{email}</strong>. Ouvre-le dans ce navigateur pour retrouver ta collection.
          </p>
        ) : (
          <form onSubmit={submit}>
            <p>Reçois un lien de connexion par e-mail, sans mot de passe. Ta collection actuelle sera ajoutée à ton compte si celui-ci est vide.</p>
            <input
              type="email"
              required
              autoFocus
              placeholder="ton@email.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Adresse e-mail"
            />
            {status === 'error' && <p className="login-error">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
              {status === 'sending' ? 'Envoi…' : 'Recevoir le lien'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function AccountButton() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);

  if (!supabase || loading) return null;

  if (user) {
    return (
      <div className="account">
        <span className="account-email" title={user.email}>{user.email}</span>
        <button type="button" className="account-link" onClick={() => supabase!.auth.signOut()}>Déconnexion</button>
      </div>
    );
  }

  return (
    <>
      <button type="button" className="account-link account-login" onClick={() => setOpen(true)}>Se connecter</button>
      {open && <LoginDialog onClose={() => setOpen(false)} />}
    </>
  );
}

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { z } from 'zod';
import { BrandMark } from '../../components/ui/BrandMark';
import { ApiError } from '../../lib/api';
import { authApi } from './auth.api';
import { sessionKey } from './auth.queries';
import styles from './AuthPage.module.css';

const schema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Use at least 8 characters').max(128),
});
type Values = z.infer<typeof schema>;

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate();
  const cache = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });
  const submit = async (values: Values) => {
    try {
      const result = mode === 'register' ? await authApi.register(values) : await authApi.login(values);
      cache.setQueryData(sessionKey, result);
      navigate(result.user.onboardingCompleted ? '/app' : '/onboarding', { replace: true });
    } catch (error) {
      setError('root', { message: error instanceof ApiError ? error.message : 'We could not connect. Try again.' });
    }
  };
  return (
    <main className={styles.page}>
      <section className={styles.brandPanel}>
        <Link to="/">
          <BrandMark inverted size={58} />
        </Link>
        <div>
          <h1>{mode === 'register' ? 'Start with one thing.' : 'Welcome back.'}</h1>
          <p>
            {mode === 'register'
              ? 'Build what helps. Break what holds you back. Your first step can stay small.'
              : 'Pick up where you left off. Your progress is still here.'}
          </p>
        </div>
        <img src="/brand/patterns/step-grid.svg" alt="" />
      </section>
      <section className={styles.formPanel}>
        <div className={styles.formWrap}>
          <div className={styles.switch}>
            <Link className={mode === 'login' ? styles.selected : undefined} to="/login">
              Log in
            </Link>
            <Link className={mode === 'register' ? styles.selected : undefined} to="/register">
              Register
            </Link>
          </div>
          <p className="eyebrow">{mode === 'register' ? 'Create your account' : 'Continue your progress'}</p>
          <h2>{mode === 'register' ? 'One account. One next step.' : 'Good to see you.'}</h2>
          <form onSubmit={handleSubmit(submit)} noValidate>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                autoComplete="email"
                type="email"
                {...register('email')}
                aria-invalid={!!errors.email}
              />
              {errors.email && <span className="fieldError">{errors.email.message}</span>}
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                type="password"
                {...register('password')}
                aria-invalid={!!errors.password}
              />
              {errors.password && <span className="fieldError">{errors.password.message}</span>}
            </div>
            {errors.root && (
              <div className="statusMessage" role="alert">
                {errors.root.message}
              </div>
            )}
            <button className="raisedPrimary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : mode === 'register' ? 'Create account' : 'Log in'}
            </button>
          </form>
          <p className={styles.terms}>
            {mode === 'register' ? 'Already shaping a habit?' : 'New to Habit Shaper?'}{' '}
            <Link to={mode === 'register' ? '/login' : '/register'}>
              {mode === 'register' ? 'Log in' : 'Create an account'}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

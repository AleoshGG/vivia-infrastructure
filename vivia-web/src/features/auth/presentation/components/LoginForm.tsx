import { useState, type FormEvent } from 'react';

interface LoginFormProps {
  onSubmit: (identifier: string, password: string) => void;
  loading?: boolean;
  error?: string | null;
  success?: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm({ onSubmit, loading = false, error = null, success = false }: LoginFormProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  function handleEmailChange(value: string) {
    setIdentifier(value);
    if (value && !EMAIL_REGEX.test(value)) {
      setEmailError('Formato de correo inválido');
    } else {
      setEmailError(null);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit(identifier, password);
  }

  return (
    <form className="flex flex-col gap-8 items-center w-[440px]" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-2 items-center text-center w-full">
        <h1 className="font-poppins font-semibold text-[32px] text-vivia-dark tracking-[0.3px] m-0">
          Iniciar Sesión
        </h1>
        <p className="font-poppins font-normal text-sm text-[#6b7280] leading-[22px] m-0">
          Bienvenido de vuelta. Ingresa tus datos para continuar.
        </p>
      </div>

      <div className="flex flex-col gap-5 w-full">
        {/* Email */}
        <div className="flex flex-col gap-2 w-full">
          <label htmlFor="identifier" className="font-poppins font-medium text-sm text-vivia-dark">
            Correo Electrónico
          </label>
          <input
            id="identifier"
            type="email"
            placeholder="example@domain.com"
            value={identifier}
            onChange={(e) => handleEmailChange(e.target.value)}
            autoComplete="email"
            disabled={loading}
            className="font-poppins font-normal text-[15px] text-gray-900 placeholder:text-[#9ca3af] bg-white border-[1.5px] border-vivia-dark rounded-[10px] h-[52px] px-[14px] w-full outline-none focus:border-vivia-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {emailError && (
            <p className="font-poppins text-xs text-red-500 m-0 pl-1">{emailError}</p>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2 w-full">
          <label htmlFor="password" className="font-poppins font-medium text-sm text-vivia-dark">
            Contraseña
          </label>
          <div className="relative w-full">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
              className="font-poppins font-normal text-[15px] text-gray-900 placeholder:text-[#9ca3af] bg-white border-[1.5px] border-vivia-dark rounded-[10px] h-[52px] px-[14px] pr-[48px] w-full outline-none focus:border-vivia-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              disabled={loading}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-vivia-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="w-full bg-red-50 border border-red-200 rounded-[10px] px-4 py-3">
          <p className="font-poppins text-sm text-red-600 m-0">{error}</p>
        </div>
      )}

      {success && (
        <div className="w-full bg-green-50 border border-green-200 rounded-[10px] px-4 py-3">
          <p className="font-poppins text-sm text-green-600 m-0">¡Sesión iniciada correctamente!</p>
        </div>
      )}

      <div className="w-full">
        <button
          type="submit"
          disabled={loading}
          className="font-poppins font-medium text-lg text-white bg-vivia-dark hover:bg-vivia-mid transition-colors rounded-[30px] h-14 w-full cursor-pointer border-none disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>
      </div>
    </form>
  );
}

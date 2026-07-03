import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { useLogin } from '../hooks/useLogin';

export function LoginPage() {
  const { login, loading, error, success } = useLogin();
  const navigate = useNavigate();

  useEffect(() => {
    if (success) navigate('/reports', { replace: true });
  }, [success, navigate]);

  return (
    <div className="flex w-screen h-screen overflow-hidden">
      {/* Left panel */}
      <div className="relative w-1/2 h-full bg-vivia-dark overflow-hidden flex items-center justify-center">
        {/* Blobs decorativos */}
        <div
          className="absolute w-[380px] h-[360px] bg-vivia-teal rounded-full opacity-90"
          style={{ bottom: '-80px', left: '-100px' }}
        />
        <div
          className="absolute w-[200px] h-[190px] bg-vivia-mid rounded-full opacity-90"
          style={{ bottom: '-20px', left: '220px' }}
        />
        <div
          className="absolute w-[260px] h-[240px] bg-[#021e2b] rounded-full opacity-90"
          style={{ top: '-60px', right: '-30px' }}
        />
        <div
          className="absolute w-[130px] h-[120px] bg-vivia-teal rounded-full opacity-60"
          style={{ bottom: '60px', right: '20px' }}
        />

        {/* Branding */}
        <div className="relative z-10 flex flex-col items-center gap-6 text-center px-8">
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0">
            <img src="/logo.png" alt="Vivia logo" className="w-14 h-14 object-contain" />
          </div>
          <h2 className="font-poppins font-semibold text-[40px] text-white tracking-[1px] m-0">
            Vivia
          </h2>
          <p className="font-poppins font-normal text-[18px] text-white/80 leading-7 m-0">
            Tu espacio de confianza para<br />encontrar el hogar perfecto
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-1/2 h-full bg-white flex items-center justify-center">
        <LoginForm
          onSubmit={login}
          loading={loading}
          error={error}
          success={success}
        />
      </div>
    </div>
  );
}

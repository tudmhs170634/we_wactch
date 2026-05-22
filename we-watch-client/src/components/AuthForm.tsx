'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { AVATARS } from './AvatarServer';
import { login, register } from '../services/auth';
import { useAuthStore } from '../store/useAuthStore';
import { useRouter, useSearchParams } from 'next/navigation';
import Background from './layout/Background';
import { toast } from 'sonner';

interface AuthFormProps {
  initialMode?: 'login' | 'register';
  avatarNode?: React.ReactNode;
}

const AuthForm: React.FC<AuthFormProps> = ({
  initialMode = 'login',
  avatarNode,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const { login: setAuth, isAuthenticated } = useAuthStore();

  React.useEffect(() => {
    // Xử lý trường hợp đã đăng nhập sẵn
    if (isAuthenticated) {
      // Ưu tiên lấy từ URL, nếu không có thì mặc định về Home
      const target = callbackUrl || '/';

      // Nếu đã ở đúng target (hoặc đang ở login mà target là login) thì không redirect vòng lặp
      if (window.location.pathname !== target) {
        window.location.href = target;
      }
    }
  }, [isAuthenticated, callbackUrl]);

  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('user@gmail.com');
  const [password, setPassword] = useState('123456');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(AVATARS[0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setUsername('');
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isLogin) {
      if (!email || !password) {
        setErrorMsg('Vui lòng nhập đầy đủ email và mật khẩu');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự');
        return;
      }
    } else {
      if (!email || !username || !password) {
        setErrorMsg('Vui lòng nhập đầy đủ thông tin đăng ký');
        return;
      }

      if (password.length < 6) {
        setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự');
        return;
      }
    }

    setIsLoading(true);
    const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      if (isLogin) {
        const res = await login({ email, password });
        console.log('Login response:', res);
        await minLoadingTime;
        setAuth(res.user, res.accessToken);
        toast.success(`Chào mừng trở lại, ${res?.user?.username}!`);

        const destination =
          res.user.role === 'admin' ? '/admin' : callbackUrl || '/';
        // Use window.location.href to ensure full URL with query params (e.g. ?subGroup=) is preserved
        window.location.href = destination;
      } else {
        const res = await register({ email, username, password, avatarUrl });
        console.log('Register response:', res);
        await minLoadingTime;
        setAuth(res.user, res.accessToken);
        toast.success(`Đăng ký thành công! Chào mừng ${res.user.username}`);
        window.location.href = callbackUrl || '/';
      }
    } catch (error: any) {
      await minLoadingTime;
      setErrorMsg(
        error?.response?.data?.message ||
          (isLogin ? 'Đăng nhập thất bại' : 'Đăng ký thất bại')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0A0B] font-sans text-slate-200">
      <Background />
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="relative h-full w-full"
        >
          <div
            className="absolute inset-0 bg-cover bg-center opacity-50"
            style={{
              backgroundImage:
                "url('https://res.cloudinary.com/dzjmyqqdh/image/upload/v1778045436/wewatch/assets/background.webp')",
            }}
          />
        </motion.div>

        <motion.div
          animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute top-[-10%] -left-20 z-0 h-[600px] w-[600px] rounded-full bg-[#C800DF]/15 blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -60, 0], y: [0, 50, 0] }}
          transition={{ duration: 18, repeat: Infinity }}
          className="absolute right-[-10%] -bottom-20 z-0 h-[600px] w-[600px] rounded-full bg-[#E60076]/15 blur-[120px]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`relative z-10 mx-auto w-full px-6 transition-all duration-500 ease-in-out ${isLogin ? 'max-w-md' : 'max-w-4xl'}`}
      >
        <div className="group relative">
          <div className="absolute -inset-[1px] rounded-[32px] bg-gradient-to-r from-[#C800DF]/40 to-[#E60076]/40 opacity-30 blur-md transition duration-500 group-hover:opacity-70" />
          <div className="glass relative overflow-hidden rounded-[32px] border border-white/10 bg-black/60 shadow-2xl backdrop-blur-3xl">
            <div className="flex min-h-[500px] flex-col gap-10 p-10 md:flex-row">
              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, width: 0, x: -20 }}
                    animate={{ opacity: 1, width: '300px', x: 0 }}
                    exit={{ opacity: 0, width: 0, x: -20 }}
                    className="flex hidden flex-shrink-0 flex-col justify-center overflow-hidden border-r border-white/10 pr-10 md:flex"
                  >
                    {avatarNode && React.isValidElement(avatarNode)
                      ? React.cloneElement(
                          avatarNode as React.ReactElement<any>,
                          {
                            selectedAvatar: avatarUrl,
                            onSelect: setAvatarUrl,
                          }
                        )
                      : avatarNode}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
                <AnimatePresence mode="wait">
                  <motion.form
                    key={isLogin ? 'login' : 'register'}
                    initial={{ opacity: 0, x: isLogin ? -30 : 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isLogin ? 30 : -30 }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    <div className="flex flex-row items-center justify-between">
                      <button
                        type="button"
                        onClick={() => router.push('/')}
                        className="text-white/70 hover:text-white"
                      >
                        <ArrowLeft />
                      </button>
                    </div>
                    <div className="mb-10 flex flex-col items-center">
                      <span className="font-sans text-3xl font-black tracking-tighter text-white">
                        WE{' '}
                        <span className="bg-gradient-to-r from-[#C800DF] to-[#E60076] bg-clip-text text-transparent">
                          WATCH
                        </span>
                      </span>
                      <p className="mt-3 text-center text-[15px] font-medium tracking-wide text-white/70">
                        {isLogin
                          ? 'Đăng nhập vào We Watch'
                          : 'Bắt đầu hành trình xem video'}
                      </p>
                    </div>

                    {errorMsg && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center text-sm font-bold text-red-500 shadow-lg"
                      >
                        {errorMsg}
                      </motion.div>
                    )}

                    {!isLogin && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-2"
                      >
                        <div className="group/input relative">
                          <User className="group-focus-within/input:text-primary absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-white/40 transition-colors" />
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Tên hiển thị của bạn"
                            name="username"
                            className="glass focus:border-primary/50 w-full rounded-[20px] py-4 pr-4 pl-12 text-[15px] font-medium text-white placeholder-white/40 transition-all outline-none"
                          />
                        </div>
                      </motion.div>
                    )}

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-2"
                    >
                      <div className="group/input relative">
                        <Mail className="group-focus-within/input:text-primary absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-white/40 transition-colors" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          autoComplete="off"
                          placeholder="Địa chỉ Email"
                          name="email"
                          className="glass focus:border-primary/50 w-full rounded-[20px] bg-transparent py-4 pr-4 pl-12 text-[15px] font-medium text-white placeholder-white/40 transition-all outline-none focus:bg-transparent"
                        />
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-2"
                    >
                      <div className="group/input relative">
                        <Lock className="group-focus-within/input:text-primary absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-white/40 transition-colors" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Mật khẩu"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          name="password"
                          className="glass focus:border-primary/50 w-full rounded-[20px] py-4 pr-12 pl-12 text-[15px] font-medium text-white placeholder-white/40 transition-all outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute top-1/2 right-4 -translate-y-1/2 text-white/40 transition-colors hover:text-white/80"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      {isLogin && (
                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            className="hover:text-primary text-xs font-bold tracking-wide text-white/50 transition-colors"
                          >
                            Quên mật khẩu?
                          </button>
                        </div>
                      )}
                    </motion.div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isLoading}
                      className="group/btn bg-primary relative mt-4 flex w-full items-center justify-center gap-3 overflow-hidden rounded-[20px] py-4 font-black tracking-widest text-white uppercase shadow-[0_0_20px_rgba(200,0,223,0.3)] transition-all hover:shadow-[0_0_30px_rgba(200,0,223,0.5)] disabled:opacity-70"
                    >
                      <span className="relative z-10">
                        {isLogin ? 'Đăng nhập' : 'Đăng ký ngay'}
                      </span>
                      <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
                    </motion.button>
                  </motion.form>
                </AnimatePresence>

                <div className="mt-8 flex items-center justify-center gap-2 border-t border-white/10 pt-8 text-[14px]">
                  <span className="font-medium text-white/50">
                    {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản?'}
                  </span>
                  <button
                    onClick={toggleMode}
                    className="text-primary font-bold tracking-wide transition-colors hover:text-white"
                  >
                    {isLogin ? 'Tạo tài khoản' : 'Đăng nhập ngay'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* WEWATCH Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <div className="relative h-20 w-full overflow-hidden">
              <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{
                  x: ['100%', '0%', '-100%'],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: 0,
                  ease: 'easeInOut',
                }}
                className="flex w-full justify-center"
              >
                <span className="font-sans text-5xl font-black tracking-[0.2em] text-white italic md:text-7xl">
                  WE
                  <span className="bg-gradient-to-r from-[#C800DF] to-[#E60076] bg-clip-text text-transparent">
                    WATCH
                  </span>
                </span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthForm;

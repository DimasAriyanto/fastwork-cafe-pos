import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      // Hardcoded credentials for Owner
      // In a real app, this would be an API call
      if (username === 'owner' && password === 'owner') {
        localStorage.setItem('token', 'dummy-token-owner');
        localStorage.setItem('role', 'OWNER');
        // Redirect to Owner Dashboard
        navigate('/owner/dashboard');
      } else if (username === 'cashier' && password === 'cashier') {
        localStorage.setItem('token', 'dummy-token-cashier');
        localStorage.setItem('role', 'CASHIER');
        // Redirect to Cashier Dashboard
        navigate('/cashier/dashboard');
      } else {
        setError('Username atau password salah');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="flex min-h-screen w-full font-sans bg-gray-50 overflow-hidden">
      {/* Left Wrapper - creates space for floating effect */}
      <div className="hidden md:flex w-[45%] lg:w-1/2 p-6 lg:p-8 relative">
        <div className="w-full h-full bg-gradient-to-br from-[#FE6A36] to-[#FE4E10] rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col justify-between p-12 lg:p-16">
          
          {/* Abstract Motifs */}
          <div className="absolute inset-0 pointer-events-none">
             {/* Diagonal Flow */}
            <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] bg-white opacity-[0.08] rounded-full blur-[80px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-white opacity-[0.06] rounded-full blur-[60px]" />
            
            {/* Hard Shapes for Motif */}
            <div className="absolute top-[20%] right-[-10%] w-[300px] h-[800px] bg-white/10 rotate-[-15deg] rounded-[100px] backdrop-blur-sm transform translate-x-20" />
            <div className="absolute top-[10%] right-[-5%] w-[150px] h-[400px] bg-white/5 rotate-[-15deg] rounded-[100px] backdrop-blur-sm" />
          </div>

          {/* Branding Content */}
          <div className="relative z-10 text-white mt-8">
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight tracking-tight drop-shadow-sm">
              Jagoeng <br />
              <span className="text-white/90">Nusantara</span>
            </h1>
          </div>
          
          <div className="relative z-10 text-white/80 text-sm font-medium tracking-wide">
             © 2026 POS SYSTEM
          </div>
        </div>
      </div>

      {/* Right Side - Login Form (Preserved Logic) */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center items-center p-8 md:p-12">
        <div className="w-full max-w-[400px]">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Login</h2>
            <p className="text-gray-400 text-sm">
              Kelola transaksi dengan mudah menggunakan sistem kasir Jagoeng Nusantara
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl flex items-center gap-3 border border-red-100 animate-fade-in">
                <div className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={20} className="text-gray-400 group-focus-within:text-[#FE6A36] transition-colors" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#FE6A36] focus:border-transparent transition-all outline-none text-sm placeholder-gray-300"
                  placeholder="Masukkan Username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">Kata Sandi</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={20} className="text-gray-400 group-focus-within:text-[#FE6A36] transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#FE6A36] focus:border-transparent transition-all outline-none text-sm placeholder-gray-300"
                  placeholder="Masukkan Kata Sandi"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-lg shadow-[#FE4E10]/20 text-sm font-bold text-white bg-[#FE4E10] hover:bg-[#d63f0a] focus:outline-none focus:ring-4 focus:ring-[#FE4E10]/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 transform active:scale-[0.98] mt-4"
            >
              {isLoading ? 'Memproses...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

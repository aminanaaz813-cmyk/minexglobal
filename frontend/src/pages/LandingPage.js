import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import Marquee from 'react-fast-marquee';
import { TrendingUp, Users, Shield, Zap, Wallet, ArrowRight, Copy, Award, Globe, Lock, Smartphone } from 'lucide-react';
import { membershipAPI } from '@/api';
import { formatCurrency, copyToClipboard } from '@/utils';
import { toast } from 'sonner';

const LandingPage = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);

  React.useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const response = await membershipAPI.getPackages();
      setPackages(response.data);
    } catch (error) {
      console.error('Failed to load packages');
    }
  };

  const cryptoData = [
    { name: 'BTC', price: '$42,850.00', change: '+2.34%', positive: true },
    { name: 'ETH', price: '$2,245.00', change: '+1.89%', positive: true },
    { name: 'USDT', price: '$1.00', change: '+0.01%', positive: true },
    { name: 'BNB', price: '$315.20', change: '-0.52%', positive: false },
    { name: 'SOL', price: '$98.45', change: '+5.67%', positive: true },
    { name: 'XRP', price: '$0.58', change: '+3.21%', positive: true },
    { name: 'ADA', price: '$0.42', change: '+1.45%', positive: true },
    { name: 'DOGE', price: '$0.085', change: '-1.23%', positive: false },
  ];

  const stakingPackages = [
    { tier: 1, range: '$200-499', yield: '1%', supply: '100,000', color: 'from-blue-500 to-cyan-500' },
    { tier: 2, range: '$500-799', yield: '1.3%', supply: '50,000', color: 'from-purple-500 to-pink-500' },
    { tier: 3, range: '$800-1,200', yield: '1.5%', supply: '50,000', color: 'from-orange-500 to-red-500' },
    { tier: 4, range: '$1,200-2,000', yield: '1.8%', supply: '25,000', color: 'from-green-500 to-teal-500' },
    { tier: 5, range: '$2,000-5,000', yield: '2.1%', supply: '10,000', color: 'from-violet-500 to-indigo-500' },
    { tier: 6, range: '$5,000+', yield: '2.5%', supply: '5,000', color: 'from-yellow-500 to-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-[#02040A] overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-2xl border-b border-white/5" data-testid="landing-navbar">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex justify-between items-center h-20">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <img src="https://customer-assets.emergentagent.com/job_a9d66ba7-0c44-4716-b6dc-8595a53033f1/artifacts/pwb3ur38_minxlogo.png" alt="MINEX" className="h-10" />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3 md:space-x-4"
            >
              <Link to="/login" data-testid="nav-login-btn">
                <button className="btn-secondary text-sm md:text-base px-4 md:px-6">Login</button>
              </Link>
              <Link to="/register" data-testid="nav-register-btn">
                <button className="btn-primary text-sm md:text-base px-4 md:px-6">Get Started</button>
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-40 pb-20 md:pb-32 min-h-screen flex items-center overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-purple-950/30 to-[#02040A]"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-40 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 w-full">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-6 md:mb-8"
            >
              <span className="inline-block px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full text-blue-300 text-xs md:text-sm font-bold tracking-wider backdrop-blur-sm">
                🚀 NEXT-GENERATION CRYPTO TRADING PLATFORM
              </span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 md:mb-8 leading-tight"
              data-testid="hero-title"
            >
              <span className="block mb-2 md:mb-4">Unlock Your</span>
              <span className="text-gradient block">
                <TypeAnimation
                  sequence={[
                    'Crypto Fortune',
                    2000,
                    'Financial Freedom',
                    2000,
                    'Passive Income',
                    2000,
                    'Investment Power',
                    2000,
                  ]}
                  wrapper="span"
                  speed={50}
                  repeat={Infinity}
                />
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-8 md:mb-12 max-w-4xl mx-auto leading-relaxed px-4"
              data-testid="hero-subtitle"
            >
              Join the elite crypto trading community with <span className="text-blue-400 font-bold">up to 4.1% daily ROI</span>, multi-level commissions up to <span className="text-purple-400 font-bold">18%</span>, and exclusive staking rewards. Build your empire, earn passive income, and achieve financial independence.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center px-4"
            >
              <Link to="/register" data-testid="hero-start-btn">
                <button className="btn-primary flex items-center gap-2 text-base md:text-lg px-8 md:px-12 py-4 shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all w-full sm:w-auto justify-center">
                  Start Earning Now <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <button 
                onClick={() => document.getElementById('packages').scrollIntoView({ behavior: 'smooth' })} 
                data-testid="hero-packages-btn"
                className="btn-secondary text-base md:text-lg px-8 md:px-12 py-4 w-full sm:w-auto"
              >
                Explore Plans
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mt-16 md:mt-24 max-w-5xl mx-auto"
            >
              <div className="glass glass-hover rounded-xl md:rounded-2xl p-4 md:p-6 text-center group" data-testid="feature-card-roi">
                <div className="p-2 md:p-3 bg-blue-500/10 rounded-xl inline-block mb-2 md:mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-8 h-8 md:w-12 md:h-12 text-blue-400" />
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-1 md:mb-2">4.1%</h3>
                <p className="text-gray-400 text-xs md:text-sm">Daily ROI</p>
              </div>
              <div className="glass glass-hover rounded-xl md:rounded-2xl p-4 md:p-6 text-center group" data-testid="feature-card-levels">
                <div className="p-2 md:p-3 bg-purple-500/10 rounded-xl inline-block mb-2 md:mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8 md:w-12 md:h-12 text-purple-400" />
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-1 md:mb-2">6 Levels</h3>
                <p className="text-gray-400 text-xs md:text-sm">Membership</p>
              </div>
              <div className="glass glass-hover rounded-xl md:rounded-2xl p-4 md:p-6 text-center group" data-testid="feature-card-commission">
                <div className="p-2 md:p-3 bg-green-500/10 rounded-xl inline-block mb-2 md:mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 md:w-12 md:h-12 text-green-400" />
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-1 md:mb-2">18%</h3>
                <p className="text-gray-400 text-xs md:text-sm">Commission</p>
              </div>
              <div className="glass glass-hover rounded-xl md:rounded-2xl p-4 md:p-6 text-center group" data-testid="feature-card-staking">
                <div className="p-2 md:p-3 bg-yellow-500/10 rounded-xl inline-block mb-2 md:mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8 md:w-12 md:h-12 text-yellow-400" />
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-1 md:mb-2">2.5%</h3>
                <p className="text-gray-400 text-xs md:text-sm">Staking</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Crypto Ticker */}
      <section className="py-6 bg-gradient-to-r from-gray-950/50 to-gray-900/50 border-y border-white/5" data-testid="crypto-ticker">
        <Marquee gradient={false} speed={30} className="overflow-hidden">
          {cryptoData.map((crypto, idx) => (
            <div key={idx} className="flex items-center gap-3 mx-8 px-6 py-3 bg-white/5 rounded-lg backdrop-blur-sm">
              <span className="text-white font-bold text-lg">{crypto.name}</span>
              <span className="text-gray-300 font-mono">{crypto.price}</span>
              <span className={`text-sm font-bold ${crypto.positive ? 'text-green-400' : 'text-red-400'}`}>
                {crypto.change}
              </span>
            </div>
          ))}
        </Marquee>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-20"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 md:mb-6">Why Choose <span className="text-gradient">MINEX GLOBAL</span></h2>
            <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">Experience the most advanced crypto trading platform with unmatched features</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              { icon: Award, title: 'Premium Returns', desc: 'Earn up to 1496.5% annualized returns with our 6-tier system', color: 'blue' },
              { icon: Globe, title: 'Global Network', desc: 'Build your worldwide team and earn from their success', color: 'purple' },
              { icon: Lock, title: 'Secure Platform', desc: 'Bank-grade security with multi-layer protection', color: 'green' },
              { icon: Smartphone, title: 'Mobile First', desc: 'Trade anytime, anywhere with full mobile optimization', color: 'yellow' },
              { icon: Wallet, title: 'Instant Payouts', desc: 'Real-time commission distribution and quick withdrawals', color: 'pink' },
              { icon: TrendingUp, title: 'Automated ROI', desc: 'Set it and forget it - earn passive income daily', color: 'indigo' }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass glass-hover rounded-2xl p-6 md:p-8 group cursor-pointer"
              >
                <div className={`p-4 bg-${feature.color}-500/10 rounded-xl inline-block mb-4 group-hover:scale-110 transition-all group-hover:rotate-3`}>
                  <feature.icon className={`w-10 h-10 md:w-12 md:h-12 text-${feature.color}-400`} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 text-sm md:text-base leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section id="packages" className="py-16 md:py-24 relative" data-testid="packages-section">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-20"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 md:mb-6" data-testid="packages-title">
              Investment <span className="text-gradient">Packages</span>
            </h2>
            <p className="text-gray-400 text-base md:text-lg">Choose your path to financial freedom</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {packages.map((pkg, idx) => (
              <motion.div
                key={pkg.package_id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass glass-hover rounded-2xl p-6 md:p-8 relative group overflow-hidden"
                data-testid={`package-level-${pkg.level}`}
              >
                <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-violet-600 text-white px-4 md:px-6 py-2 rounded-bl-2xl rounded-tr-2xl text-xs md:text-sm font-bold">
                  Level {pkg.level}
                </div>
                <div className="mt-8 md:mt-12">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">Tier {pkg.level}</h3>
                  <div className="text-3xl md:text-4xl font-black text-gradient mb-6 md:mb-8">{formatCurrency(pkg.min_investment)}</div>
                  
                  <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-400 text-sm md:text-base">Daily ROI</span>
                      <span className="text-green-400 font-black text-lg md:text-xl">{pkg.daily_roi}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-400 text-sm md:text-base">Annual ROI</span>
                      <span className="text-blue-400 font-black text-lg md:text-xl">{pkg.annual_roi}%</span>
                    </div>
                    {pkg.direct_required > 0 && (
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-400 text-sm md:text-base">Requirements</span>
                        <span className="text-white font-bold text-sm md:text-base">{pkg.direct_required}D / {pkg.indirect_required}I</span>
                      </div>
                    )}
                  </div>

                  {pkg.level >= 2 && (
                    <div className="border-t border-white/10 pt-4 md:pt-6">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 md:mb-4">Commission Rates</p>
                      <div className="grid grid-cols-3 gap-2 md:gap-3">
                        <div className="text-center p-2 md:p-3 bg-blue-500/10 rounded-lg">
                          <div className="text-lg md:text-xl font-black text-blue-400">{pkg.commission_lv_a}%</div>
                          <div className="text-xs text-gray-500 mt-1">Level A</div>
                        </div>
                        <div className="text-center p-2 md:p-3 bg-purple-500/10 rounded-lg">
                          <div className="text-lg md:text-xl font-black text-purple-400">{pkg.commission_lv_b}%</div>
                          <div className="text-xs text-gray-500 mt-1">Level B</div>
                        </div>
                        <div className="text-center p-2 md:p-3 bg-violet-500/10 rounded-lg">
                          <div className="text-lg md:text-xl font-black text-violet-400">{pkg.commission_lv_c}%</div>
                          <div className="text-xs text-gray-500 mt-1">Level C</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Staking Section with Slider */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-[#02040A] to-gray-950/50 overflow-hidden" data-testid="staking-section">
        <div className="max-w-7xl mx-auto px-4 md:px-8 mb-12">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 md:mb-6" data-testid="staking-title">
              Staking <span className="text-gradient">Rewards</span>
            </h2>
            <p className="text-gray-400 text-base md:text-lg">Lock your assets and earn daily yields</p>
          </motion.div>
        </div>

        <Marquee gradient={false} speed={40} direction="right" className="py-4">
          {stakingPackages.map((stake, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className={`mx-4 w-80 glass rounded-2xl p-6 md:p-8 bg-gradient-to-br ${stake.color} bg-opacity-10 hover:scale-105 transition-transform cursor-pointer`}
              data-testid={`staking-tier-${stake.tier}`}
            >
              <div className="flex items-center justify-between mb-4">
                <Wallet className="w-12 h-12 text-white" />
                <div className="text-right">
                  <div className="text-xs text-white/60 uppercase tracking-wide">Tier {stake.tier}</div>
                  <div className="text-2xl font-black text-white">{stake.yield}</div>
                  <div className="text-xs text-white/60">Daily Yield</div>
                </div>
              </div>
              <div className="text-3xl font-black text-white mb-4">{stake.range}</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white/80">
                  <span>Total Supply</span>
                  <span className="font-bold">{stake.supply}</span>
                </div>
                <div className="pt-3 border-t border-white/10">
                  <div className="text-xs text-white/60">Lock Period: 3-30 Days</div>
                </div>
              </div>
            </motion.div>
          ))}
        </Marquee>
      </section>

      {/* Community Star Program */}
      <section className="py-20" data-testid="community-section">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4" data-testid="community-title">
              Community <span className="text-gradient">Star Program</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8">Achieve 28% monthly growth and earn bonus rewards</p>
            <div className="glass rounded-2xl p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <div className="text-4xl font-black text-gradient mb-2">28%</div>
                  <p className="text-gray-400">Monthly Growth Target</p>
                </div>
                <div>
                  <div className="text-4xl font-black text-gradient mb-2">$100-$1,000</div>
                  <p className="text-gray-400">USDT Bonus Rewards</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-6">Achieve 50%+ growth for maximum bonus. Payouts on 30th of every month.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-white/5 py-8 md:py-12" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <img src="https://customer-assets.emergentagent.com/job_a9d66ba7-0c44-4716-b6dc-8595a53033f1/artifacts/pwb3ur38_minxlogo.png" alt="MINEX" className="h-10 mx-auto md:mx-0" />
              <p className="text-gray-500 text-sm mt-2">© 2025 MINEX GLOBAL. All rights reserved.</p>
            </div>
            <div className="flex space-x-6">
              <Link to="/login" className="text-gray-400 hover:text-white transition text-sm md:text-base">Login</Link>
              <Link to="/register" className="text-gray-400 hover:text-white transition text-sm md:text-base">Register</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, CloudRain, Cloud, Search, KeyRound, AlertCircle, Loader2, HelpCircle, X, Languages, Smartphone } from "lucide-react";

// Types
interface WeatherParams {
  lat: number;
  lon: number;
  appid: string;
}

interface CurrentWeather {
  main: { temp: number; feels_like: number; humidity: number };
  weather: [{ id: number; main: string; description: string; icon: string }];
  name: string;
  dt: number;
  sys: { sunrise: number; sunset: number };
}

interface ForecastItem {
  dt: number;
  main: { temp: number };
  weather: [{ id: number; main: string; description: string; icon: string }];
  dt_txt: string;
}

interface ForecastData {
  list: ForecastItem[];
}

export default function WeatherVibe() {
  const [apiKey, setApiKey] = useState<string>("");
  const [inputKey, setInputKey] = useState<string>("");
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [language, setLanguage] = useState<"en" | "vi">("vi");
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validatingKey, setValidatingKey] = useState<boolean>(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  const t = {
    en: {
      accessApi: "Access Weather API",
      enterKeyDesc: "Please enter your OpenWeatherMap API key to continue. It will be saved locally.",
      placeholder: "Enter API Key here...",
      save: "Save Key",
      howToGet: "How to get an API Key",
      step1: "Visit openweathermap.org and create a free account.",
      step2: "Go to 'My API Keys' in your profile menu.",
      step3: "Copy your 'Default' key or generate a new one named 'weather-vibe'.",
      note: "New keys take 30-120 minutes to activate, please wait and try again later.",
      invalidKey: "Invalid API Key. Please enter a valid OpenWeatherMap API Key.",
      fetchError: "Failed to fetch weather data. Please try again.",
      fetching: "Fetching atmosphere...",
      oops: "Oops!",
      tryAgain: "Try Again",
      changeKey: "Change Key",
      feelsLike: "Feels Like",
      humidity: "Humidity",
      forecast5Day: "5-Day Forecast",
      today: "Today"
    },
    vi: {
      accessApi: "Truy cập API Thời tiết",
      enterKeyDesc: "Vui lòng nhập mã API OpenWeatherMap của bạn để tiếp tục. Nó sẽ được lưu cục bộ.",
      placeholder: "Nhập mã API ở đây...",
      save: "Lưu Mã",
      howToGet: "Cách lấy mã API",
      step1: "Truy cập openweathermap.org và tạo tài khoản miễn phí.",
      step2: "Đi tới 'My API Keys' trong menu hồ sơ của bạn.",
      step3: "Sao chép mã 'Default' của bạn hoặc tạo một mã mới tên 'weather-vibe'.",
      note: "Mã mới có thể mất từ 30-120 phút để kích hoạt, vui lòng đợi và thử lại sau.",
      invalidKey: "Mã API không hợp lệ. Vui lòng nhập mã API OpenWeatherMap hợp lệ.",
      fetchError: "Không thể lấy dữ liệu thời tiết. Vui lòng thử lại.",
      fetching: "Đang tải bầu không khí...",
      oops: "Ôi không!",
      tryAgain: "Thử Lại",
      changeKey: "Đổi Mã",
      feelsLike: "Cảm giác như",
      humidity: "Độ ẩm",
      forecast5Day: "Dự báo 5 ngày",
      today: "Hôm nay"
    }
  }[language];

  useEffect(() => {
    const storedKey = localStorage.getItem("openweathermap_api_key");
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  useEffect(() => {
    if (apiKey) {
      fetchWeatherData();
    }
  }, [apiKey, language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === "en" ? "vi" : "en");
  };

  const saveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedKey = inputKey.trim().toLowerCase();
    if (!cleanedKey) return;
    
    setValidatingKey(true);
    setKeyError(null);
    
    try {
      // Do a minimal test call to verify the key
      await axios.get("https://api.openweathermap.org/data/2.5/weather", {
        params: { lat: 51.5074, lon: -0.1278, appid: cleanedKey }, // test with London
        timeout: 5000
      });
      
      // If we reach here, the key is valid
      localStorage.setItem("openweathermap_api_key", cleanedKey);
      setApiKey(cleanedKey);
      setError(null);
      setKeyError(null);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setKeyError(t.invalidKey + " " + t.note);
      } else {
        setKeyError("Network error while validating key. Please check your connection.");
      }
    } finally {
      setValidatingKey(false);
    }
  };

  const handleApiError = (err: any) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("openweathermap_api_key");
      setApiKey("");
      alert(t.invalidKey);
    } else {
      setError(t.fetchError);
    }
  };

  const fetchWeatherData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get location
      const getPosition = () => {
        return new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("Geolocation not supported"));
          } else {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
            });
          }
        });
      };

      let lat = 21.0285; // Hanoi fallback
      let lon = 105.8542;

      try {
        const position = await getPosition();
        lat = position.coords.latitude;
        lon = position.coords.longitude;
      } catch (locErr) {
        console.warn("Geolocation denied or failed, using Hanoi as fallback.");
      }

      const params = {
        lat,
        lon,
        appid: apiKey,
        units: "metric",
        lang: language,
      };

      // Current Weather
      const currentRes = await axios.get<CurrentWeather>(
        "https://api.openweathermap.org/data/2.5/weather",
        { params }
      );
      setCurrentWeather(currentRes.data);

      // 5-Day Forecast
      const forecastRes = await axios.get<ForecastData>(
        "https://api.openweathermap.org/data/2.5/forecast",
        { params }
      );

      // Filter forecast for 1 reading per day (closest to 12:00:00)
      const dailyForecasts = forecastRes.data.list.filter((item) =>
        item.dt_txt.includes("12:00:00")
      );
      
      // If no 12:00:00 items are found (e.g. based on timezone gaps), just pick every 8th item
      const finalForecast = dailyForecasts.length > 0 
        ? dailyForecasts.slice(0, 5) 
        : forecastRes.data.list.filter((_, i) => i % 8 === 0).slice(0, 5);

      setForecast(finalForecast);
    } catch (err: any) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherVibe = (condition: string, isDay: boolean) => {
    const mainCondition = condition.toLowerCase();
    
    if (mainCondition.includes("clear")) {
      return isDay ? "from-blue-400 to-yellow-200 text-slate-800" : "from-slate-900 to-purple-900 text-white";
    }
    if (mainCondition.includes("rain") || mainCondition.includes("drizzle") || mainCondition.includes("thunderstorm")) {
      return "from-slate-700 to-blue-900 text-white";
    }
    if (mainCondition.includes("cloud")) {
      return "from-gray-400 to-slate-600 text-white";
    }
    
    // Default
    return "from-slate-800 to-slate-600 text-white";
  };

  const getWeatherIcon = (condition: string, isDay: boolean, size = 24) => {
    const mainCondition = condition.toLowerCase();
    
    if (mainCondition.includes("clear")) {
      return isDay ? <Sun size={size} className="text-yellow-400" fill="currentColor" /> : <Moon size={size} className="text-blue-100" fill="currentColor" />;
    }
    if (mainCondition.includes("rain") || mainCondition.includes("drizzle") || mainCondition.includes("thunderstorm")) {
      return <CloudRain size={size} className="text-blue-200" />;
    }
    if (mainCondition.includes("cloud")) {
      return <Cloud size={size} className="text-gray-200" />;
    }
    
    return isDay ? <Sun size={size} /> : <Moon size={size} />;
  };

  if (!apiKey) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white overflow-hidden">
        {/* Language Toggle */}
        <div className="absolute top-6 right-6 z-20">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors shadow-lg"
          >
            <Languages size={16} />
            <span>{language === "en" ? "Tiếng Việt" : "English"}</span>
          </button>
        </div>

        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setShowHelp(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-sm rounded-2xl bg-slate-900 p-6 shadow-2xl border border-white/10"
              >
                <button
                  onClick={() => setShowHelp(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <HelpCircle size={22} className="text-blue-400" />
                  {t.howToGet}
                </h2>
                <div className="space-y-4 text-sm text-slate-300">
                  <p>
                    <strong className="text-white">Step 1:</strong> {t.step1}
                  </p>
                  <p>
                    <strong className="text-white">Step 2:</strong> {t.step2}
                  </p>
                  <p>
                    <strong className="text-white">Step 3:</strong> {t.step3}
                  </p>
                  <div className="mt-4 rounded-lg bg-blue-500/10 p-4 border border-blue-500/20 text-blue-200 leading-relaxed">
                    <strong className="block mb-1 text-blue-300">Note:</strong> {t.note}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl border border-white/10 relative z-10"
        >
          <div className="mb-8 flex justify-center">
            <div className="rounded-full bg-blue-500/20 p-4 shrink-0 shadow-[0_0_30px_rgba(59,130,246,0.5)] relative">
               <Smartphone size={24} className="absolute -bottom-2 -right-2 text-blue-300 drop-shadow-md" />
              <KeyRound size={40} className="text-blue-400" />
            </div>
          </div>
          <div className="mb-2 flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-center">{t.accessApi}</h1>
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className="text-slate-400 hover:text-white transition-colors p-1"
              title="Need help?"
            >
              <HelpCircle size={20} />
            </button>
          </div>
          <p className="mb-8 text-center text-sm text-slate-400">
            {t.enterKeyDesc}
          </p>
          
          <form onSubmit={saveApiKey} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  setKeyError(null);
                }}
                disabled={validatingKey}
                placeholder={t.placeholder}
                className={`w-full rounded-xl bg-slate-800/50 px-4 py-3 pl-11 text-white border focus:outline-none focus:ring-1 transition-all font-mono text-sm sm:text-base ${
                  keyError 
                    ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" 
                    : "border-slate-700 focus:border-blue-500 focus:ring-blue-500"
                }`}
                required
              />
              <KeyRound size={18} className={`absolute left-4 top-3.5 ${keyError ? "text-red-400" : "text-slate-400"}`} />
            </div>
            
            <AnimatePresence>
              {keyError && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-200 flex gap-2 items-start">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <p>{keyError}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={validatingKey}
              className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {validatingKey ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Validating...
                </>
              ) : (
                t.save
              )}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Calculate vibe based on current weather
  let vibeClass = "from-slate-900 to-slate-800 text-white"; // default loading
  let isDay = true;
  let conditionName = "Clear";

  if (currentWeather) {
    const now = Math.floor(Date.now() / 1000);
    // Rough estimation of day/night if exact sunrise/sunset not available, but OWM provides it
    isDay = now > currentWeather.sys.sunrise && now < currentWeather.sys.sunset;
    conditionName = currentWeather.weather[0].main;
    vibeClass = getWeatherVibe(conditionName, isDay);
  }

  return (
    <div className={`min-h-screen pb-12 pt-4 sm:pt-8 px-4 sm:px-6 transition-colors duration-1000 bg-gradient-to-br ${vibeClass} font-sans`}>
      {/* Global Language Toggle */}
      {apiKey && (
        <div className="max-w-6xl mx-auto flex justify-end mb-4 sm:mb-8">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 rounded-full bg-black/10 px-4 py-2 text-sm font-medium backdrop-blur-md border border-white/10 hover:bg-black/20 transition-colors shadow-sm"
          >
            <Languages size={16} />
            <span className="hidden sm:inline">{language === "en" ? "Tiếng Việt" : "English"}</span>
            <span className="sm:hidden">{language === "en" ? "VI" : "EN"}</span>
          </button>
        </div>
      )}

      {loading && !currentWeather ? (
        <div className="flex h-[70vh] flex-col items-center justify-center">
          <Loader2 size={48} className="animate-spin text-white/70" />
          <p className="mt-4 font-medium tracking-wide text-white/80">{t.fetching}</p>
        </div>
      ) : error ? (
        <div className="mx-auto mt-10 md:mt-20 max-w-md rounded-2xl bg-red-500/20 p-6 backdrop-blur-md border border-red-500/30 text-center text-white">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-200" />
          <h2 className="mb-2 text-xl font-bold">{t.oops}</h2>
          <p className="mb-6 text-red-100">{error}</p>
          <button 
            onClick={fetchWeatherData}
            className="rounded-lg bg-white/20 px-6 py-2 font-medium hover:bg-white/30 transition-colors"
          >
            {t.tryAgain}
          </button>
        </div>
      ) : currentWeather ? (
        <motion.main 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mx-auto w-full max-w-6xl flex flex-col items-center relative"
        >
          {/* Header */}
          <header className="flex flex-col sm:flex-row items-center sm:items-start justify-between mb-8 sm:mb-16 w-full gap-4 sm:gap-0 max-w-3xl">
            <div className="text-center sm:text-left">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight drop-shadow-sm">{currentWeather.name}</h2>
              <p className="text-base font-medium opacity-80 mt-1 sm:mt-2 capitalize drop-shadow-sm truncate max-w-[250px]">
                {currentWeather.weather[0].description}
              </p>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem("openweathermap_api_key");
                setApiKey("");
              }}
              className="flex items-center gap-2 rounded-full bg-black/10 px-4 py-2 text-sm font-medium backdrop-blur-md hover:bg-black/20 transition-colors border border-white/10"
              title={t.changeKey}
            >
              <KeyRound size={16} />
              <span className="hidden sm:inline">{t.changeKey}</span>
            </button>
          </header>

          {/* Current Weather Display */}
          <section className="mb-12 sm:mb-20 flex flex-col items-center justify-center text-center w-full">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              className="relative mb-4 sm:mb-6 drop-shadow-2xl"
            >
              {getWeatherIcon(conditionName, isDay, window?.innerWidth < 640 ? 120 : 160)}
            </motion.div>
            
            <div className="relative">
              <h1 className="text-7xl sm:text-9xl font-black tracking-tighter drop-shadow-lg scale-110 sm:scale-100">
                {Math.round(currentWeather.main.temp)}°
              </h1>
            </div>
            
            <div className="mt-8 sm:mt-6 flex items-center justify-center gap-4 sm:gap-6 rounded-3xl sm:rounded-full bg-black/10 px-6 sm:px-8 py-4 sm:py-3 backdrop-blur-md border border-white/10 w-full max-w-[320px] sm:max-w-md">
              <div className="flex flex-col flex-1 items-center">
                <span className="text-[10px] sm:text-xs uppercase tracking-wider opacity-70 mb-1 font-semibold">{t.feelsLike}</span>
                <span className="font-bold text-lg sm:text-xl">{Math.round(currentWeather.main.feels_like)}°</span>
              </div>
              <div className="w-px h-10 sm:h-8 bg-white/20" />
              <div className="flex flex-col flex-1 items-center">
                <span className="text-[10px] sm:text-xs uppercase tracking-wider opacity-70 mb-1 font-semibold">{t.humidity}</span>
                <span className="font-bold text-lg sm:text-xl">{currentWeather.main.humidity}%</span>
              </div>
            </div>
          </section>

          {/* 5-Day Forecast */}
          <section className="w-full max-w-4xl mx-auto">
            <h3 className="mb-4 text-xs sm:text-sm font-bold uppercase tracking-widest opacity-80 drop-shadow-sm pl-2 sm:pl-4">{t.forecast5Day}</h3>
            
            <div className="flex w-full gap-3 sm:gap-4 overflow-x-auto pb-6 pt-2 snap-x px-2 scrollbar-hide md:justify-center">
              {forecast.map((item, i) => {
                const date = new Date(item.dt * 1000);
                const dayName = date.toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", { weekday: "short" });
                const fCondition = item.weather[0].main;
                
                return (
                  <motion.div
                    key={item.dt}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex min-w-[100px] sm:min-w-[130px] flex-col items-center justify-between rounded-3xl bg-white/10 p-4 sm:p-5 backdrop-blur-xl border border-white/20 shadow-xl snap-center hover:bg-white/20 transition-colors"
                  >
                    <span className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 capitalize">{i === 0 ? t.today : dayName}</span>
                    <div className="my-2 drop-shadow-md">
                      {getWeatherIcon(fCondition, true, 42)}
                    </div>
                    <span className="mt-3 text-2xl font-bold">{Math.round(item.main.temp)}°</span>
                  </motion.div>
                );
              })}
            </div>
          </section>
        </motion.main>
      ) : null}
    </div>
  );
}

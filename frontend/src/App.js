import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Import shadcn components
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Badge } from './components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import { Separator } from './components/ui/separator';
import { Progress } from './components/ui/progress';
import { 
  Shield, 
  Users, 
  BookOpen, 
  Trophy, 
  AlertTriangle, 
  Phone,
  CloudRain,
  Flame,
  Zap,
  Home,
  LogOut,
  User,
  Settings,
  BarChart3,
  Plus,
  Eye,
  EyeOff,
  Play,
  CheckCircle,
  Clock,
  Award,
  GraduationCap
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://quiz-visibility-fix.preview.emergentagent.com';
const API = `${BACKEND_URL}/api`;

// Set up axios defaults
axios.defaults.baseURL = API;

// Debug logging
console.log('BACKEND_URL:', BACKEND_URL);
console.log('API:', API);
console.log('Axios baseURL:', axios.defaults.baseURL);

// YouTube Video Player Component
const YouTubePlayer = ({ videoUrl, onVideoEnd, className = "" }) => {
  const getYouTubeEmbedUrl = (url) => {
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&\n?#]+)/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}?enablejsapi=1&rel=0` : url;
  };

  const handleVideoEnd = () => {
    if (onVideoEnd) {
      // Simulate video completion after a delay to account for YouTube player behavior
      setTimeout(() => {
        onVideoEnd();
      }, 1000);
    }
  };

  return (
    <div className={`aspect-video ${className}`}>
      <iframe
        width="100%"
        height="100%"
        src={getYouTubeEmbedUrl(videoUrl)}
        title="Educational Video"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="rounded-lg"
        onLoad={handleVideoEnd}
      />
    </div>
  );
};

// Module Card Component
const ModuleCard = ({ module, videoCompleted, quizCompleted, quizScore, onStartModule, onTakeQuiz, userRole }) => {
  const getModuleIcon = (title) => {
    switch (title) {
      case 'Fire Safety': return <Flame className="h-6 w-6" />;
      case 'Earthquake Response': return <Zap className="h-6 w-6" />;
      case 'Flood Preparedness': return <CloudRain className="h-6 w-6" />;
      case 'Emergency Kits': return <Shield className="h-6 w-6" />;
      default: return <BookOpen className="h-6 w-6" />;
    }
  };

  const getModuleColor = (title) => {
    switch (title) {
      case 'Fire Safety': return 'from-red-50 to-red-100 border-red-200';
      case 'Earthquake Response': return 'from-yellow-50 to-yellow-100 border-yellow-200';
      case 'Flood Preparedness': return 'from-blue-50 to-blue-100 border-blue-200';
      case 'Emergency Kits': return 'from-green-50 to-green-100 border-green-200';
      default: return 'from-gray-50 to-gray-100 border-gray-200';
    }
  };

  const getIconColor = (title) => {
    switch (title) {
      case 'Fire Safety': return 'text-red-600';
      case 'Earthquake Response': return 'text-yellow-600';
      case 'Flood Preparedness': return 'text-blue-600';
      case 'Emergency Kits': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className={`p-6 bg-gradient-to-br ${getModuleColor(module.title)} hover:shadow-lg transition-all duration-300`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 bg-white rounded-full ${getIconColor(module.title)}`}>
            {getModuleIcon(module.title)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
            <p className="text-sm text-gray-600">{module.video_duration} min video</p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1">
          {videoCompleted && (
            <div className="flex items-center space-x-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs">Video Complete</span>
            </div>
          )}
          {quizCompleted && (
            <div className="flex items-center space-x-1 text-blue-600">
              <Award className="h-4 w-4" />
              <span className="text-xs">Quiz: {quizScore}/5</span>
            </div>
          )}
        </div>
      </div>
      
      <p className="text-sm text-gray-700 mb-4">{module.description}</p>
      
      <div className="flex space-x-2">
        <Button 
          onClick={() => onStartModule(module)}
          className={userRole === 'student' ? "flex-1" : "w-full"}
          variant={videoCompleted ? "outline" : "default"}
        >
          <Play className="h-4 w-4 mr-2" />
          {videoCompleted ? "Rewatch Video" : "Start Module"}
        </Button>
        
        {/* Quiz functionality only available for students */}
        {userRole === 'student' && (
          <Button 
            onClick={() => onTakeQuiz(module)}
            disabled={!videoCompleted}
            variant={quizCompleted ? "outline" : "default"}
            className="flex-1"
          >
            <GraduationCap className="h-4 w-4 mr-2" />
            {quizCompleted ? "Retake Quiz" : "Take Quiz"}
          </Button>
        )}
      </div>
      
      {userRole === 'student' && !videoCompleted && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          Complete the video to unlock the quiz
        </p>
      )}
      
      {userRole === 'teacher' && (
        <p className="text-xs text-blue-600 mt-2 text-center">
          📊 Teachers can view student quiz progress in "Class Progress" tab
        </p>
      )}
    </Card>
  );
};

// Landing Page Component
const LandingPage = ({ onNavigateToLogin }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-emerald-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="p-4 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full">
                <Shield className="h-16 w-16 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Disaster Preparedness &
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
                {' '}Response Education
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Empowering schools and colleges with comprehensive disaster preparedness training, 
              real-time alerts, and emergency response education to keep our communities safe.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 text-lg font-semibold rounded-full shadow-lg transform transition-all hover:scale-105"
                onClick={onNavigateToLogin}
              >
                Get Started
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg font-semibold rounded-full shadow-lg transform transition-all hover:scale-105"
                onClick={onNavigateToLogin}
              >
                View Emergency Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Comprehensive Safety Education</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform provides all the tools needed for effective disaster preparedness training
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl mb-3 text-gray-900">Interactive Learning</CardTitle>
              <CardDescription className="text-gray-600 leading-relaxed">
                Engaging educational modules with videos covering earthquake safety, fire prevention, flood response, and more
              </CardDescription>
            </Card>

            <Card className="p-6 text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-emerald-50 to-emerald-100">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl mb-3 text-gray-900">Real-time Alerts</CardTitle>
              <CardDescription className="text-gray-600 leading-relaxed">
                Instant emergency notifications and alerts to keep your school community informed and safe
              </CardDescription>
            </Card>

            <Card className="p-6 text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl mb-3 text-gray-900">Progress Tracking</CardTitle>
              <CardDescription className="text-gray-600 leading-relaxed">
                Gamified learning with points, quizzes, and module completion tracking for better engagement
              </CardDescription>
            </Card>

            <Card className="p-6 text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-orange-600 to-orange-700 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl mb-3 text-gray-900">Multi-Role Access</CardTitle>
              <CardDescription className="text-gray-600 leading-relaxed">
                Separate dashboards for administrators, teachers, and students with role-specific features
              </CardDescription>
            </Card>

            <Card className="p-6 text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-red-50 to-red-100">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center">
                <Phone className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl mb-3 text-gray-900">Emergency Contacts</CardTitle>
              <CardDescription className="text-gray-600 leading-relaxed">
                Quick access to essential emergency services and disaster response helplines
              </CardDescription>
            </Card>

            <Card className="p-6 text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-teal-50 to-teal-100">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl mb-3 text-gray-900">Risk Assessment</CardTitle>
              <CardDescription className="text-gray-600 leading-relaxed">
                AI-powered disaster risk analysis for different locations to help plan better responses
              </CardDescription>
            </Card>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="py-20 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">About Our Mission</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-8">
            Our Disaster Preparedness and Response Education System is designed to create safer school environments 
            through comprehensive training, real-time communication, and proactive emergency planning. We believe 
            that education and preparation are the keys to minimizing disaster impacts and saving lives.
          </p>
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Education First</h3>
              <p className="text-gray-600">
                We provide comprehensive educational content covering various disaster scenarios, 
                helping students and staff understand proper response procedures.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Community Safety</h3>
              <p className="text-gray-600">
                Building resilient communities through training, practice drills, and 
                real-time communication systems that connect everyone during emergencies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Login Component
const LoginPage = ({ onLogin, onBackToHome }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('student');

  const defaultCredentials = {
    admin: { username: 'admin', password: 'admin123' },
    teacher: { username: 'teacher1', password: 'teacher123' },
    student: { username: 'student1', password: 'student123' }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    console.log('Login attempt with credentials:', credentials);
    console.log('API endpoint:', `${API}/auth/login`);
    
    try {
      const response = await axios.post('/auth/login', credentials);
      console.log('Login response:', response.data);
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
      onLogin(response.data.user);
      toast.success(`Welcome back, ${response.data.user.full_name}!`);
    } catch (error) {
      console.error('Login error:', error.response || error);
      toast.error('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const useDefaultCredentials = (role) => {
    setCredentials(defaultCredentials[role]);
    setSelectedRole(role);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
            <CardDescription className="text-gray-600">
              Sign in to access your disaster preparedness dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                  required
                  className="h-11"
                  placeholder="Enter your username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                    required
                    className="h-11 pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            
            <Separator />
            
            <div className="space-y-3">
              <p className="text-sm text-center text-gray-600 font-medium">Quick Login (Demo Accounts)</p>
              <div className="grid gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => useDefaultCredentials('admin')}
                  className="w-full text-left justify-start border-red-200 hover:bg-red-50 hover:border-red-300"
                >
                  <Settings className="h-4 w-4 mr-2 text-red-600" />
                  Admin - Full Access
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => useDefaultCredentials('teacher')}
                  className="w-full text-left justify-start border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                >
                  <Users className="h-4 w-4 mr-2 text-blue-600" />
                  Teacher - John Teacher
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => useDefaultCredentials('student')}
                  className="w-full text-left justify-start border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
                >
                  <User className="h-4 w-4 mr-2 text-emerald-600" />
                  Student - Jane Student
                </Button>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              onClick={onBackToHome}
              className="w-full text-gray-600 hover:text-gray-800"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alerts, setAlerts] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [users, setUsers] = useState([]);
  const [modules, setModules] = useState([]);
  const [currentModule, setCurrentModule] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [predictions, setPredictions] = useState([]);
  const [studentsProgress, setStudentsProgress] = useState([]);
  const [classStats, setClassStats] = useState(null);
  const [newAlert, setNewAlert] = useState({
    title: '',
    message: '',
    alert_type: 'general',
    severity: 'medium'
  });
  const [predictionCity, setPredictionCity] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load alerts
      const alertsResponse = await axios.get('/alerts');
      setAlerts(alertsResponse.data);

      // Load user stats
      const statsResponse = await axios.get(`/user-stats/${user.id}`);
      setUserStats(statsResponse.data);

      // Load emergency contacts
      const contactsResponse = await axios.get('/emergency-contacts');
      setEmergencyContacts(contactsResponse.data);

      // Load users (admin only)
      if (user.role === 'admin') {
        const usersResponse = await axios.get('/users');
        setUsers(usersResponse.data);
      }

      // Load modules
      const modulesResponse = await axios.get('/modules');
      setModules(modulesResponse.data);

      // Load predictions
      const predictionsResponse = await axios.get('/predictions');
      setPredictions(predictionsResponse.data);

      // Load students progress for teachers
      if (user.role === 'teacher' || user.role === 'admin') {
        const progressResponse = await axios.get('/teacher/students-progress');
        setStudentsProgress(progressResponse.data.students_progress);
        setClassStats(progressResponse.data.class_statistics);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Error loading dashboard data');
    }
  };

  const handleVideoComplete = async (moduleId) => {
    try {
      await axios.post('/video-completion', {
        module_id: moduleId,
        watch_percentage: 100.0
      });
      toast.success('Video completed! Quiz is now unlocked.');
      loadDashboardData(); // Refresh stats
    } catch (error) {
      console.error('Error recording video completion:', error);
      toast.error('Error recording video completion');
    }
  };

  const handleStartModule = (module) => {
    setCurrentModule(module);
    setActiveTab('modules');
  };

  const handleTakeQuiz = async (module) => {
    try {
      const quizzesResponse = await axios.get(`/quizzes/module/${module.id}`);
      if (quizzesResponse.data.length > 0) {
        setCurrentQuiz(quizzesResponse.data[0]);
        setQuizAnswers({});
        setActiveTab('modules');
      }
    } catch (error) {
      toast.error('Error loading quiz');
    }
  };

  const handleQuizSubmit = async () => {
    if (!currentQuiz) return;

    let score = 0;
    const answers = [];

    currentQuiz.questions.forEach((question, index) => {
      const userAnswer = quizAnswers[index];
      const correct = userAnswer === question.correct;
      if (correct) score++;
      
      answers.push({
        question: question.question,
        user_answer: userAnswer,
        correct_answer: question.correct,
        is_correct: correct
      });
    });

    try {
      await axios.post('/quiz-attempts', {
        quiz_id: currentQuiz.id,
        module_id: currentQuiz.module_id,
        score: score,
        total_questions: currentQuiz.questions.length,
        answers: answers
      });

      toast.success(`Quiz completed! You scored ${score}/${currentQuiz.questions.length} points!`);
      setCurrentQuiz(null);
      setQuizAnswers({});
      loadDashboardData(); // Refresh stats
    } catch (error) {
      toast.error('Error submitting quiz');
    }
  };

  const handleDrillParticipation = async (drillType) => {
    try {
      await axios.post('/drills', {
        drill_type: drillType,
        notes: `Participated in ${drillType} drill`
      });
      toast.success(`${drillType} drill participation recorded!`);
      loadDashboardData(); // Refresh stats
    } catch (error) {
      toast.error('Error recording drill participation');
    }
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/alerts', newAlert);
      setNewAlert({
        title: '',
        message: '',
        alert_type: 'general',
        severity: 'medium'
      });
      toast.success('Alert created successfully!');
      loadDashboardData();
    } catch (error) {
      toast.error('Error creating alert');
    }
  };

  const handlePredictDisaster = async (e) => {
    e.preventDefault();
    if (!predictionCity.trim()) return;

    try {
      const response = await axios.post(`/predict-disaster?city=${encodeURIComponent(predictionCity)}`);
      setPredictions(prev => [response.data, ...prev]);
      setPredictionCity('');
      toast.success('Disaster risk assessment completed!');
    } catch (error) {
      toast.error('Error predicting disaster risk');
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'fire': return <Flame className="h-5 w-5" />;
      case 'earthquake': return <Zap className="h-5 w-5" />;
      case 'flood': return <CloudRain className="h-5 w-5" />;
      default: return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getModuleProgress = (moduleId) => {
    if (!userStats?.module_progress) return { videoCompleted: false, quizCompleted: false, quizScore: 0 };
    
    const progress = userStats.module_progress.find(p => p.module_id === moduleId);
    return {
      videoCompleted: progress?.video_completed || false,
      quizCompleted: progress?.quiz_completed || false,
      quizScore: progress?.quiz_score || 0
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Disaster Preparedness System</h1>
                <p className="text-sm text-gray-600">Welcome, {user.full_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'teacher' ? 'default' : 'secondary'}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
              <Button variant="ghost" onClick={onLogout} className="text-gray-600 hover:text-gray-800">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="drills">Drills</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="prediction">Risk Analysis</TabsTrigger>
            {(user.role === 'teacher' || user.role === 'admin') && (
              <TabsTrigger value="teacher">Class Progress</TabsTrigger>
            )}
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                  <Trophy className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats?.total_points || 0}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Modules Completed</CardTitle>
                  <BookOpen className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {userStats?.completed_modules || 0}/{userStats?.total_modules || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Quizzes Completed</CardTitle>
                  <GraduationCap className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats?.total_quizzes_completed || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{alerts.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Module Progress Overview */}
            {userStats?.module_progress && (
              <Card>
                <CardHeader>
                  <CardTitle>Learning Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userStats.module_progress.map((progress) => (
                      <div key={progress.module_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium">{progress.module_title}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className={`flex items-center space-x-1 ${progress.video_completed ? 'text-green-600' : 'text-gray-400'}`}>
                              <CheckCircle className="h-4 w-4" />
                              <span>Video</span>
                            </span>
                            <span className={`flex items-center space-x-1 ${progress.quiz_completed ? 'text-blue-600' : 'text-gray-400'}`}>
                              <Award className="h-4 w-4" />
                              <span>Quiz {progress.quiz_completed ? `(${progress.quiz_score}/${progress.quiz_total})` : ''}</span>
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const module = modules.find(m => m.id === progress.module_id);
                              if (module) handleStartModule(module);
                            }}
                          >
                            View Module
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active Alerts */}
            {alerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Active Emergency Alerts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {alerts.map((alert) => (
                    <Alert key={alert.id} className={getSeverityColor(alert.severity)}>
                      <div className="flex items-start space-x-3">
                        {getAlertIcon(alert.alert_type)}
                        <div className="flex-1">
                          <AlertTitle className="font-semibold">{alert.title}</AlertTitle>
                          <AlertDescription className="mt-1">{alert.message}</AlertDescription>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline">{alert.alert_type}</Badge>
                            <Badge variant="outline">{alert.severity}</Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(alert.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Admin Panel */}
            {user.role === 'admin' && (
              <Card>
                <CardHeader>
                  <CardTitle>System Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {users.map((u) => (
                      <div key={u.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{u.full_name}</p>
                          <p className="text-sm text-gray-600">{u.email} • {u.username}</p>
                        </div>
                        <Badge variant={u.role === 'admin' ? 'destructive' : u.role === 'teacher' ? 'default' : 'secondary'}>
                          {u.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-6">
            {currentModule && !currentQuiz ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">{currentModule.title}</CardTitle>
                      <CardDescription>{currentModule.description}</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentModule(null)}
                    >
                      Back to Modules
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <YouTubePlayer
                    videoUrl={currentModule.video_url}
                    onVideoEnd={() => handleVideoComplete(currentModule.id)}
                    className="w-full"
                  />
                  
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span className="text-blue-800">
                        Duration: {currentModule.video_duration} minutes
                      </span>
                    </div>
                    
                    {getModuleProgress(currentModule.id).videoCompleted && (
                      <Button 
                        onClick={() => handleTakeQuiz(currentModule)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <GraduationCap className="h-4 w-4 mr-2" />
                        Take Quiz
                      </Button>
                    )}
                  </div>
                  
                  {!getModuleProgress(currentModule.id).videoCompleted && (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-yellow-800 text-sm">
                        📺 Watch the complete video to unlock the quiz for this module.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : currentQuiz ? (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xl font-semibold">{currentQuiz.title}</h4>
                  <Button 
                    variant="outline" 
                    onClick={() => {setCurrentQuiz(null); setQuizAnswers({})}}
                  >
                    Cancel Quiz
                  </Button>
                </div>
                
                <div className="space-y-6">
                  {currentQuiz.questions.map((question, index) => (
                    <div key={index} className="space-y-3 p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium text-lg">{index + 1}. {question.question}</p>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-white rounded transition-colors">
                            <input
                              type="radio"
                              name={`question-${index}`}
                              value={optionIndex}
                              onChange={(e) => setQuizAnswers({...quizAnswers, [index]: parseInt(e.target.value)})}
                              className="form-radio text-blue-600"
                            />
                            <span className="text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex justify-center pt-4">
                    <Button 
                      onClick={handleQuizSubmit} 
                      disabled={Object.keys(quizAnswers).length !== currentQuiz.questions.length}
                      className="bg-green-600 hover:bg-green-700 px-8 py-2"
                    >
                      Submit Quiz
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Learning Modules</h2>
                  <p className="text-gray-600">
                    Complete each module by watching the video and taking the quiz to earn points.
                  </p>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  {modules.map((module) => {
                    const progress = getModuleProgress(module.id);
                    return (
                      <ModuleCard
                        key={module.id}
                        module={module}
                        videoCompleted={progress.videoCompleted}
                        quizCompleted={progress.quizCompleted}
                        quizScore={progress.quizScore}
                        onStartModule={handleStartModule}
                        onTakeQuiz={handleTakeQuiz}
                        userRole={user.role}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Teacher Dashboard Tab */}
          {(user.role === 'teacher' || user.role === 'admin') && (
            <TabsContent value="teacher" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Class Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{classStats?.total_students || 0}</div>
                      <p className="text-sm text-gray-600">Total Students</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{classStats?.average_points || 0}</div>
                      <p className="text-sm text-gray-600">Avg Points</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{classStats?.average_modules_completed || 0}</div>
                      <p className="text-sm text-gray-600">Avg Modules</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{classStats?.average_quizzes_completed || 0}</div>
                      <p className="text-sm text-gray-600">Avg Quizzes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Student Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {studentsProgress.map((student) => (
                      <div key={student.student_id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{student.student_name}</h4>
                            <p className="text-sm text-gray-600">@{student.student_username}</p>
                          </div>
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="text-center">
                              <div className="font-bold text-blue-600">{student.total_points}</div>
                              <div className="text-gray-500">Points</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-green-600">{student.completed_modules}/{student.total_modules}</div>
                              <div className="text-gray-500">Modules</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-purple-600">{student.total_quizzes}</div>
                              <div className="text-gray-500">Quizzes</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid gap-2 md:grid-cols-4">
                          {student.module_progress.map((progress) => (
                            <div key={progress.module_id} className="text-xs bg-gray-50 p-2 rounded">
                              <div className="font-medium">{progress.module_title}</div>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`flex items-center space-x-1 ${progress.video_completed ? 'text-green-600' : 'text-gray-400'}`}>
                                  <CheckCircle className="h-3 w-3" />
                                  <span>Video</span>
                                </span>
                                <span className={`flex items-center space-x-1 ${progress.quiz_completed ? 'text-blue-600' : 'text-gray-400'}`}>
                                  <Award className="h-3 w-3" />
                                  <span>Quiz {progress.quiz_completed ? `(${progress.quiz_score}/${progress.quiz_total})` : ''}</span>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Drills Tab */}
          <TabsContent value="drills" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Emergency Drills</CardTitle>
                <CardDescription>Participate in emergency drills to practice your response skills</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <h3 className="font-semibold text-red-900 mb-2 flex items-center">
                      <Flame className="h-4 w-4 mr-2" />
                      Fire Drill
                    </h3>
                    <p className="text-sm text-red-800 mb-3">
                      Practice evacuation procedures for fire emergencies
                    </p>
                    <Button 
                      onClick={() => handleDrillParticipation('Fire Drill')}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      Mark Participation
                    </Button>
                  </Card>

                  <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                    <h3 className="font-semibold text-yellow-900 mb-2 flex items-center">
                      <Zap className="h-4 w-4 mr-2" />
                      Earthquake Drill
                    </h3>
                    <p className="text-sm text-yellow-800 mb-3">
                      Practice Drop, Cover, and Hold On procedures
                    </p>
                    <Button 
                      onClick={() => handleDrillParticipation('Earthquake Drill')}
                      className="w-full bg-yellow-600 hover:bg-yellow-700"
                    >
                      Mark Participation
                    </Button>
                  </Card>

                  <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                      <CloudRain className="h-4 w-4 mr-2" />
                      Flood Evacuation Drill
                    </h3>
                    <p className="text-sm text-blue-800 mb-3">
                      Practice evacuation to higher ground procedures
                    </p>
                    <Button 
                      onClick={() => handleDrillParticipation('Flood Evacuation Drill')}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Mark Participation
                    </Button>
                  </Card>

                  <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <h3 className="font-semibold text-purple-900 mb-2 flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Lockdown Drill
                    </h3>
                    <p className="text-sm text-purple-800 mb-3">
                      Practice security lockdown procedures
                    </p>
                    <Button 
                      onClick={() => handleDrillParticipation('Lockdown Drill')}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      Mark Participation
                    </Button>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            {user.role === 'admin' && (
              <Card>
                <CardHeader>
                  <CardTitle>Create New Alert</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateAlert} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Alert Title</Label>
                      <Input
                        id="title"
                        value={newAlert.title}
                        onChange={(e) => setNewAlert({...newAlert, title: e.target.value})}
                        placeholder="Enter alert title"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="message">Alert Message</Label>
                      <Input
                        id="message"
                        value={newAlert.message}
                        onChange={(e) => setNewAlert({...newAlert, message: e.target.value})}
                        placeholder="Enter alert message"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="alert_type">Alert Type</Label>
                        <select
                          id="alert_type"
                          value={newAlert.alert_type}
                          onChange={(e) => setNewAlert({...newAlert, alert_type: e.target.value})}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="general">General</option>
                          <option value="fire">Fire</option>
                          <option value="earthquake">Earthquake</option>
                          <option value="flood">Flood</option>
                          <option value="severe_weather">Severe Weather</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="severity">Severity</Label>
                        <select
                          id="severity"
                          value={newAlert.severity}
                          onChange={(e) => setNewAlert({...newAlert, severity: e.target.value})}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>
                    <Button type="submit" className="w-full">
                      Create Alert
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>All Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No active alerts</p>
                ) : (
                  alerts.map((alert) => (
                    <Alert key={alert.id} className={getSeverityColor(alert.severity)}>
                      <div className="flex items-start space-x-3">
                        {getAlertIcon(alert.alert_type)}
                        <div className="flex-1">
                          <AlertTitle className="font-semibold">{alert.title}</AlertTitle>
                          <AlertDescription className="mt-1">{alert.message}</AlertDescription>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline">{alert.alert_type}</Badge>
                            <Badge variant="outline">{alert.severity}</Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(alert.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Alert>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contacts</CardTitle>
                <CardDescription>Important phone numbers for emergency situations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {emergencyContacts.map((contact) => (
                    <Card key={contact.id} className="p-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-red-100 rounded-full">
                          <Phone className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{contact.name}</h3>
                          <p className="text-sm text-gray-600">{contact.type}</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-blue-600 mb-2">{contact.phone}</p>
                      {contact.description && (
                        <p className="text-sm text-gray-600">{contact.description}</p>
                      )}
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Risk Analysis Tab */}
          <TabsContent value="prediction" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Disaster Risk Assessment</CardTitle>
                <CardDescription>Analyze disaster risk for different locations</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePredictDisaster} className="space-y-4 mb-6">
                  <div>
                    <Label htmlFor="city">City/Location</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="city"
                        value={predictionCity}
                        onChange={(e) => setPredictionCity(e.target.value)}
                        placeholder="Enter city name (e.g., San Francisco, Miami, Oklahoma City)"
                        required
                      />
                      <Button type="submit">
                        Analyze Risk
                      </Button>
                    </div>
                  </div>
                </form>

                <div className="space-y-4">
                  {predictions.map((prediction) => (
                    <Card key={prediction.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{prediction.city}</h3>
                          <p className="text-sm text-gray-600">
                            Assessed on {new Date(prediction.predicted_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-red-600">
                            {prediction.risk_percentage.toFixed(1)}%
                          </div>
                          <p className="text-sm text-gray-600">Risk Level</p>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <Progress value={prediction.risk_percentage} className="h-2" />
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium">Potential Disasters:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {prediction.disaster_types.map((type, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium">Risk Factors:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {prediction.factors.map((factor, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for existing auth token
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(JSON.parse(userData));
      setCurrentPage('dashboard');
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setCurrentPage('landing');
    toast.success('Logged out successfully');
  };

  return (
    <div className="App">
      <Toaster />
      {currentPage === 'landing' && (
        <LandingPage onNavigateToLogin={() => setCurrentPage('login')} />
      )}
      {currentPage === 'login' && (
        <LoginPage 
          onLogin={handleLogin} 
          onBackToHome={() => setCurrentPage('landing')} 
        />
      )}
      {currentPage === 'dashboard' && user && (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
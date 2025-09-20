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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Textarea } from './components/ui/textarea';
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
  GraduationCap,
  Edit,
  Trash2,
  Crown,
  Medal,
  Star,
  TrendingUp,
  FileText,
  PlusCircle
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://learnanalytics-1.preview.emergentagent.com';
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

// Quiz Management Component for Teachers
const QuizManager = ({ user, onRefresh }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [modules, setModules] = useState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [newQuiz, setNewQuiz] = useState({
    title: '',
    module_id: '',
    questions: [{ question: '', options: ['', '', '', ''], correct: 0 }]
  });

  useEffect(() => {
    loadQuizzes();
    loadModules();
  }, []);

  const loadQuizzes = async () => {
    try {
      const response = await axios.get('/teacher/quizzes');
      setQuizzes(response.data);
    } catch (error) {
      toast.error('Error loading quizzes');
    }
  };

  const loadModules = async () => {
    try {
      const response = await axios.get('/modules');
      setModules(response.data);
    } catch (error) {
      toast.error('Error loading modules');
    }
  };

  const handleCreateQuiz = async () => {
    try {
      await axios.post('/teacher/quizzes', newQuiz);
      toast.success('Quiz created successfully!');
      setIsCreateDialogOpen(false);
      setNewQuiz({
        title: '',
        module_id: '',
        questions: [{ question: '', options: ['', '', '', ''], correct: 0 }]
      });
      loadQuizzes();
      onRefresh && onRefresh();
    } catch (error) {
      toast.error('Error creating quiz');
    }
  };

  const handleUpdateQuiz = async () => {
    try {
      await axios.put(`/teacher/quizzes/${editingQuiz.id}`, newQuiz);
      toast.success('Quiz updated successfully!');
      setEditingQuiz(null);
      setNewQuiz({
        title: '',
        module_id: '',
        questions: [{ question: '', options: ['', '', '', ''], correct: 0 }]
      });
      loadQuizzes();
      onRefresh && onRefresh();
    } catch (error) {
      toast.error('Error updating quiz');
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        await axios.delete(`/teacher/quizzes/${quizId}`);
        toast.success('Quiz deleted successfully!');
        loadQuizzes();
        onRefresh && onRefresh();
      } catch (error) {
        toast.error('Error deleting quiz');
      }
    }
  };

  const addQuestion = () => {
    setNewQuiz({
      ...newQuiz,
      questions: [...newQuiz.questions, { question: '', options: ['', '', '', ''], correct: 0 }]
    });
  };

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...newQuiz.questions];
    if (field === 'question') {
      updatedQuestions[index].question = value;
    } else if (field.startsWith('option')) {
      const optionIndex = parseInt(field.split('_')[1]);
      updatedQuestions[index].options[optionIndex] = value;
    } else if (field === 'correct') {
      updatedQuestions[index].correct = parseInt(value);
    }
    setNewQuiz({ ...newQuiz, questions: updatedQuestions });
  };

  const removeQuestion = (index) => {
    if (newQuiz.questions.length > 1) {
      const updatedQuestions = newQuiz.questions.filter((_, i) => i !== index);
      setNewQuiz({ ...newQuiz, questions: updatedQuestions });
    }
  };

  const startEdit = (quiz) => {
    setEditingQuiz(quiz);
    setNewQuiz({
      title: quiz.title,
      module_id: quiz.module_id,
      questions: quiz.questions
    });
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quiz Management</h2>
          <p className="text-gray-600">Create and manage quizzes for your students</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Quiz
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}</DialogTitle>
              <DialogDescription>
                {editingQuiz ? 'Update the quiz details below' : 'Create a new quiz for your students'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="quiz-title">Quiz Title</Label>
                <Input
                  id="quiz-title"
                  value={newQuiz.title}
                  onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                  placeholder="Enter quiz title"
                />
              </div>
              
              <div>
                <Label htmlFor="module-select">Associated Module (Optional)</Label>
                <select
                  id="module-select"
                  value={newQuiz.module_id}
                  onChange={(e) => setNewQuiz({ ...newQuiz, module_id: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Standalone Quiz</option>
                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Questions</Label>
                  <Button type="button" onClick={addQuestion} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>
                
                {newQuiz.questions.map((question, qIndex) => (
                  <Card key={qIndex} className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label>Question {qIndex + 1}</Label>
                        {newQuiz.questions.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeQuestion(qIndex)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <Textarea
                        value={question.question}
                        onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                        placeholder="Enter your question"
                        rows={2}
                      />
                      
                      <div className="space-y-2">
                        <Label>Answer Options</Label>
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`correct-${qIndex}`}
                              checked={question.correct === oIndex}
                              onChange={() => updateQuestion(qIndex, 'correct', oIndex)}
                              className="form-radio text-blue-600"
                            />
                            <Input
                              value={option}
                              onChange={(e) => updateQuestion(qIndex, `option_${oIndex}`, e.target.value)}
                              placeholder={`Option ${oIndex + 1}`}
                              className="flex-1"
                            />
                            <span className="text-sm text-gray-500 min-w-[80px]">
                              {question.correct === oIndex ? '(Correct)' : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setEditingQuiz(null);
                  setNewQuiz({
                    title: '',
                    module_id: '',
                    questions: [{ question: '', options: ['', '', '', ''], correct: 0 }]
                  });
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={editingQuiz ? handleUpdateQuiz : handleCreateQuiz}
                disabled={!newQuiz.title || newQuiz.questions.some(q => !q.question || q.options.some(o => !o))}
              >
                {editingQuiz ? 'Update Quiz' : 'Create Quiz'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {quizzes.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Quizzes Yet</h3>
            <p className="text-gray-600 mb-4">Create your first quiz to get started!</p>
          </Card>
        ) : (
          quizzes.map((quiz) => (
            <Card key={quiz.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{quiz.title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <span>{quiz.questions.length} questions</span>
                    <span>
                      {quiz.module_id 
                        ? `Module: ${modules.find(m => m.id === quiz.module_id)?.title || 'Unknown'}` 
                        : 'Standalone Quiz'
                      }
                    </span>
                    <span>Created: {new Date(quiz.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(quiz)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

// Leaderboard Component
const Leaderboard = ({ user }) => {
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const response = await axios.get('/leaderboard');
      setLeaderboardData(response.data);
    } catch (error) {
      toast.error('Error loading leaderboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading leaderboard...</div>;
  }

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400" />;
      case 3: return <Award className="h-6 w-6 text-orange-500" />;
      default: return <Star className="h-6 w-6 text-blue-500" />;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return 'from-yellow-50 to-yellow-100 border-yellow-200';
      case 2: return 'from-gray-50 to-gray-100 border-gray-200';
      case 3: return 'from-orange-50 to-orange-100 border-orange-200';
      default: return 'from-blue-50 to-blue-100 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Leaderboard</h2>
        <p className="text-gray-600">Top performing students based on quiz scores and completion speed</p>
      </div>

      {user.role === 'student' && leaderboardData?.current_user_rank && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">Your Current Rank</h3>
              <p className="text-blue-700">
                Rank #{leaderboardData.current_user_rank} out of {leaderboardData.total_students} students
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {leaderboardData?.leaderboard?.map((student) => (
          <Card key={student.student_id} className={`p-4 bg-gradient-to-r ${getRankColor(student.rank)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {getRankIcon(student.rank)}
                  <span className="text-2xl font-bold text-gray-700">#{student.rank}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{student.student_name}</h3>
                  <p className="text-sm text-gray-600">@{student.student_username}</p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="text-lg font-bold text-gray-900">{student.overall_score} pts</div>
                <div className="text-sm text-gray-600">
                  {student.completed_modules}/{student.total_modules} modules • {student.total_quizzes} quizzes
                </div>
                <div className="text-xs text-gray-500">
                  Speed: {student.completion_speed} modules/day
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {(!leaderboardData?.leaderboard || leaderboardData.leaderboard.length === 0) && (
        <Card className="p-8 text-center">
          <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Rankings Yet</h3>
          <p className="text-gray-600">Complete quizzes to appear on the leaderboard!</p>
        </Card>
      )}
    </div>
  );
};

// Module Card Component (only for students now)
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
          className="flex-1"
          variant={videoCompleted ? "outline" : "default"}
        >
          <Play className="h-4 w-4 mr-2" />
          {videoCompleted ? "Rewatch Video" : "Start Module"}
        </Button>
        
        <Button 
          onClick={() => onTakeQuiz(module)}
          disabled={!videoCompleted}
          variant={quizCompleted ? "outline" : "default"}
          className="flex-1"
        >
          <GraduationCap className="h-4 w-4 mr-2" />
          {quizCompleted ? "Retake Quiz" : "Take Quiz"}
        </Button>
      </div>
      
      {!videoCompleted && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          Complete the video to unlock the quiz
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
  const [teachersProgress, setTeachersProgress] = useState([]);
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

      // Load user stats (only for students)
      if (user.role === 'student') {
        const statsResponse = await axios.get(`/user-stats/${user.id}`);
        setUserStats(statsResponse.data);
      }

      // Load emergency contacts
      const contactsResponse = await axios.get('/emergency-contacts');
      setEmergencyContacts(contactsResponse.data);

      // Load users (admin only)
      if (user.role === 'admin') {
        const usersResponse = await axios.get('/users');
        setUsers(usersResponse.data);
        
        // Load teachers progress for admin
        const teachersResponse = await axios.get('/admin/teachers-progress');
        setTeachersProgress(teachersResponse.data.teachers_progress);
      }

      // Load modules (only for students)
      if (user.role === 'student') {
        const modulesResponse = await axios.get('/modules');
        setModules(modulesResponse.data);
      }

      // Load predictions
      const predictionsResponse = await axios.get('/predictions');
      setPredictions(predictionsResponse.data);

      // Load students progress for teachers and admin
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

  // Define tabs based on user role
  const getTabsForRole = () => {
    switch (user.role) {
      case 'student':
        return [
          { value: 'dashboard', label: 'Dashboard' },
          { value: 'modules', label: 'Learning Modules' },
          { value: 'leaderboard', label: 'Leaderboard' },
          { value: 'alerts', label: 'Alerts' },
          { value: 'contacts', label: 'Emergency Contacts' },
          { value: 'prediction', label: 'Risk Analysis' }
        ];
        
      case 'teacher':
        return [
          { value: 'dashboard', label: 'Dashboard' },
          { value: 'student-progress', label: 'Student Performance' },
          { value: 'quiz-management', label: 'Quiz Management' },
          { value: 'leaderboard', label: 'Leaderboard' },
          { value: 'alerts', label: 'Alerts' },
          { value: 'contacts', label: 'Emergency Contacts' },
          { value: 'prediction', label: 'Risk Analysis' }
        ];
        
      case 'admin':
        return [
          { value: 'dashboard', label: 'Dashboard' },
          { value: 'student-progress', label: 'Student Progress' },
          { value: 'teacher-progress', label: 'Teacher Progress' },
          { value: 'leaderboard', label: 'Leaderboard' },
          { value: 'alerts', label: 'Alerts' },
          { value: 'contacts', label: 'Emergency Contacts' },
          { value: 'prediction', label: 'Risk Analysis' }
        ];
        
      default:
        return [];
    }
  };

  const tabs = getTabsForRole();

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
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {user.role === 'student' && userStats && (
              <>
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
              </>
            )}

            {user.role === 'teacher' && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    <Users className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{classStats?.total_students || 0}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Student Score</CardTitle>
                    <Trophy className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{classStats?.average_overall_score || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Modules Completed</CardTitle>
                    <BookOpen className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{classStats?.average_modules_completed || 0}</div>
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
            )}

            {user.role === 'admin' && (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{users.length}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                      <GraduationCap className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{classStats?.total_students || 0}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
                      <Settings className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{teachersProgress?.length || 0}</div>
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

                {/* System Users */}
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
              </>
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
          </TabsContent>

          {/* Student Learning Modules Tab (Student Only) */}
          {user.role === 'student' && (
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
          )}

          {/* Student Progress Tab (Teacher & Admin) */}
          {(user.role === 'teacher' || user.role === 'admin') && (
            <TabsContent value="student-progress" className="space-y-6">
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
                      <div className="text-2xl font-bold text-orange-600">{classStats?.average_overall_score || 0}</div>
                      <p className="text-sm text-gray-600">Avg Overall Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Student Performance & Rankings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {studentsProgress.map((student) => (
                      <div key={student.student_id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="px-2 py-1">
                                Rank #{student.rank}
                              </Badge>
                              <div>
                                <h4 className="font-semibold">{student.student_name}</h4>
                                <p className="text-sm text-gray-600">@{student.student_username}</p>
                              </div>
                            </div>
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
                            <div className="text-center">
                              <div className="font-bold text-orange-600">{student.overall_score}</div>
                              <div className="text-gray-500">Overall Score</div>
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

          {/* Teacher Progress Tab (Admin Only) */}
          {user.role === 'admin' && (
            <TabsContent value="teacher-progress" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Teacher Activity Overview</CardTitle>
                  <CardDescription>Monitor teacher engagement and content creation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teachersProgress?.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No teacher activity data available</p>
                    ) : (
                      teachersProgress.map((teacher) => (
                        <div key={teacher.teacher_id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">{teacher.teacher_name}</h4>
                              <p className="text-sm text-gray-600">@{teacher.teacher_username}</p>
                            </div>
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="text-center">
                                <div className="font-bold text-blue-600">{teacher.created_quizzes}</div>
                                <div className="text-gray-500">Quizzes Created</div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold text-orange-600">{teacher.created_alerts}</div>
                                <div className="text-gray-500">Alerts Created</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-gray-500">
                                  Joined: {new Date(teacher.account_created).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Recent Quizzes</h5>
                              <div className="space-y-1">
                                {teacher.recent_activity.recent_quizzes.length === 0 ? (
                                  <p className="text-xs text-gray-500">No quizzes created yet</p>
                                ) : (
                                  teacher.recent_activity.recent_quizzes.map((quiz, index) => (
                                    <div key={index} className="text-xs bg-blue-50 p-2 rounded">
                                      <span className="font-medium">{quiz.title}</span>
                                      <span className="text-gray-500 ml-2">
                                        {new Date(quiz.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Recent Alerts</h5>
                              <div className="space-y-1">
                                {teacher.recent_activity.recent_alerts.length === 0 ? (
                                  <p className="text-xs text-gray-500">No alerts created yet</p>
                                ) : (
                                  teacher.recent_activity.recent_alerts.map((alert, index) => (
                                    <div key={index} className="text-xs bg-orange-50 p-2 rounded">
                                      <span className="font-medium">{alert.title}</span>
                                      <span className="text-gray-500 ml-2">
                                        {new Date(alert.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Quiz Management Tab (Teacher Only) */}
          {user.role === 'teacher' && (
            <TabsContent value="quiz-management" className="space-y-6">
              <QuizManager user={user} onRefresh={loadDashboardData} />
            </TabsContent>
          )}

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6">
            <Leaderboard user={user} />
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            {(user.role === 'admin' || user.role === 'teacher') && (
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
                      <Textarea
                        id="message"
                        value={newAlert.message}
                        onChange={(e) => setNewAlert({...newAlert, message: e.target.value})}
                        placeholder="Enter alert message"
                        required
                        rows={3}
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

          {/* Emergency Contacts Tab */}
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
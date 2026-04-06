import { useState, useEffect } from 'react';
import { questionsGroup1And2, questionsGroup3 } from './data/questions';
import { users } from './data/users';
import './index.css';

// Tabbed Statistics Component for the Sidebar
const GlobalStatsSidebar = ({ globalStats, onReset }) => {
  const [activeTab, setActiveTab] = useState('performance'); // performance | activity
  const total = globalStats.correct + globalStats.incorrect;
  const accuracy = Math.round((globalStats.correct / total) * 100) || 0;

  const handleResetClick = () => {
    if (window.confirm('¿Estás seguro de que deseas restablecer todas las estadísticas globales? Esta acción no se puede deshacer.')) {
      onReset();
    }
  };

  return (
    <div className="stats-sidebar">
      <div className="sidebar-header">
         <div className="header-flex">
            <span className="live-pill">EN VIVO</span>
            <button className="btn-reset-mini" onClick={handleResetClick} title="Restablecer Estadísticas">
              <span className="icon">↺</span>
            </button>
         </div>
         <h2>Estadísticas</h2>
      </div>

      <div className="tab-switcher">
        <button 
          className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          Aciertos
        </button>
        <button 
          className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          Participación
        </button>
      </div>
      
      <div className="sidebar-content">
        {activeTab === 'performance' ? (
          <div className="tab-pane fade-in">
            <h3 className="pane-title">Desempeño General</h3>
            <div className="chart-section">
              <div className="chart-bar-container">
                <div className="chart-bar-label">
                  <span>Éxitos</span>
                  <span>{globalStats.correct}</span>
                </div>
                <div className="chart-bar-bg">
                  <div className="chart-bar-fill success" style={{ width: `${accuracy}%` }}></div>
                </div>
              </div>

              <div className="chart-bar-container">
                <div className="chart-bar-label">
                  <span>Errores</span>
                  <span>{globalStats.incorrect}</span>
                </div>
                <div className="chart-bar-bg">
                  <div className="chart-bar-fill danger" style={{ width: `${100 - accuracy}%` }}></div>
                </div>
              </div>
              <p className="precision-text">Precisión del Grupo: <strong>{accuracy}%</strong></p>
            </div>
          </div>
        ) : (
          <div className="tab-pane fade-in">
            <h3 className="pane-title">Actividad del Grupo</h3>
            <div className="metrics-grid">
              <div className="metric-box">
                <span className="metric-label">Participantes</span>
                <span className="metric-value">{globalStats.usersCount}</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Respuestas Totales</span>
                <span className="metric-value">{total}</span>
              </div>
            </div>
          </div>
        )}

        <div className="sidebar-footer">
          <div className="qr-sidebar">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window.location.href)}`} 
              alt="Acceso QR" 
              style={{ width: '100px', height: '100px' }}
            />
            <p>Escanear para participar</p>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [view, setView] = useState('login'); // login | selection | quiz | feedback | result
  const [user, setUser] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });
  const [feedback, setFeedback] = useState(null);

  // Persistence: Tracks ALL participants on this device
  const [globalStats, setGlobalStats] = useState(() => {
    try {
      const saved = localStorage.getItem('quizz_v4_global_stats');
      return saved ? JSON.parse(saved) : { correct: 0, incorrect: 0, usersParticipated: [], usersCount: 0 };
    } catch (e) {
      return { correct: 0, incorrect: 0, usersParticipated: [], usersCount: 0 };
    }
  });

  const handleLogin = () => {
    const foundUser = users.find(u => u.pin.toUpperCase() === pin.toUpperCase());
    if (foundUser) {
      setUser(foundUser);
      setView('selection');
      setError('');
    } else {
      setError('PIN incorrecto. Inténtalo de nuevo.');
    }
  };

  const startQuiz = (group) => {
    const selectedQuestions = group === 1 ? questionsGroup1And2 : questionsGroup3;
    setQuestions(selectedQuestions);
    setScore(0);
    setSessionStats({ correct: 0, incorrect: 0 });
    setCurrentQuestionIdx(0);
    setView('quiz');
  };

  const handleAnswer = (optionId) => {
    const currentQuestion = questions[currentQuestionIdx];
    const isCorrect = optionId === currentQuestion.answer;
    
    // Update local session
    setSessionStats(prev => ({ 
      correct: prev.correct + (isCorrect ? 1 : 0), 
      incorrect: prev.incorrect + (isCorrect ? 0 : 1) 
    }));

    // Update global dashboard (Real-time update)
    const updatedGlobal = {
      correct: globalStats.correct + (isCorrect ? 1 : 0),
      incorrect: globalStats.incorrect + (isCorrect ? 0 : 1),
      usersParticipated: globalStats.usersParticipated.includes(user.name) 
        ? globalStats.usersParticipated 
        : [...globalStats.usersParticipated, user.name],
      usersCount: globalStats.usersParticipated.includes(user.name)
        ? globalStats.usersParticipated.length
        : globalStats.usersParticipated.length + 1
    };
    setGlobalStats(updatedGlobal);
    localStorage.setItem('quizz_v4_global_stats', JSON.stringify(updatedGlobal));

    setFeedback({ isCorrect, selected: optionId });
    if (isCorrect) setScore(score + 1000);
    setView('feedback');
    
    setTimeout(() => {
      if (currentQuestionIdx + 1 < questions.length) {
        setCurrentQuestionIdx(currentQuestionIdx + 1);
        setView('quiz');
      } else {
        setView('result');
      }
    }, 1200);
  };

  const resetGlobalStats = () => {
    const freshStats = { correct: 0, incorrect: 0, usersParticipated: [], usersCount: 0 };
    setGlobalStats(freshStats);
    localStorage.setItem('quizz_v4_global_stats', JSON.stringify(freshStats));
  };

  // Content for the main area based on the view
  const renderMainArea = () => {
    if (view === 'login') {
      return (
        <div className="main-content">
          <span className="login-brand">APROVA</span>
          <h1 className="brand-title">Quizz</h1>
          <p className="subtitle">Ingresa tu PIN corporativo</p>
          <div className="login-form">
            <input 
              type="text" 
              placeholder="PIN (ej. HATM)" 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            {error && <p className="error-text">{error}</p>}
            <button className="btn-primary" onClick={handleLogin}>Entrar</button>
          </div>
          <p className="footer-small">Consulte su dirección con el administrador</p>
        </div>
      );
    }

    if (view === 'selection') {
      return (
        <div className="main-content">
          <h1 className="welcome-text">¡Hola, {user.name.split(' ')[0]}!</h1>
          <p className="subtitle">Selecciona tu batería de preguntas:</p>
          <div className="selection-menu">
            <button className="btn-secondary" onClick={() => startQuiz(1)}>
              Grupos 1 y 2
            </button>
            <button className="btn-secondary" onClick={() => startQuiz(3)}>
              Grupo 3
            </button>
          </div>
        </div>
      );
    }

    if (view === 'quiz' || view === 'feedback') {
      const q = questions[currentQuestionIdx];
      return (
        <div className="main-content quiz-mode">
          <div className="quiz-header">
             <div className="header-top">
                <span className="app-logo">APROVA</span>
                <span className="score-pill">{score} pts</span>
             </div>
             <div className="header-bottom">
                <span className="user-pill">{user.name.split(' ')[0]}</span>
                <span className="question-counter">P {currentQuestionIdx + 1}/{questions.length}</span>
             </div>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-inner" 
              style={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
          
          {view === 'feedback' ? (
            <div className={`feedback-overlay ${feedback.isCorrect ? 'correct' : 'wrong'}`}>
              <div className="feedback-content">
                <h1>{feedback.isCorrect ? '¡CORRECTO!' : 'INCORRECTO'}</h1>
                {!feedback.isCorrect && <p>La respuesta era: {q.options.find(o => o.id === q.answer).text}</p>}
                <div className="feedback-score">{feedback.isCorrect ? '+1000' : '0'}</div>
              </div>
            </div>
          ) : (
            <div className="question-container">
              <div className="question-text">{q.question}</div>
              <div className="options-grid">
                {q.options.map((opt, idx) => (
                  <button 
                    key={opt.id} 
                    className={`option-btn color-${idx}`}
                    onClick={() => handleAnswer(opt.id)}
                  >
                    {opt.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (view === 'result') {
      return (
        <div className="main-content result-mode">
          <h1 className="result-title">Resumen Final</h1>
          <p className="subtitle">Gracias por participar en el Quizz</p>
          <div className="result-summary">
            <div className="session-stats-mini">
              <div className="mini-stat">
                <span className="val">{sessionStats.correct}</span>
                <span className="lab">Acertadas</span>
              </div>
              <div className="divider"></div>
              <div className="mini-stat">
                <span className="val">{sessionStats.incorrect}</span>
                <span className="lab">Nulas</span>
              </div>
            </div>
            <div className="total-score-box">
              PTOS: {score}
            </div>
          </div>
          <div className="single-attempt-badge">Participación registrada</div>
          <p className="footer-note">Sesión guardada para {user.name}</p>
        </div>
      );
    }
  };

  return (
    <div className="app-container">
      <main className="game-area">
        {renderMainArea()}
      </main>
      <GlobalStatsSidebar globalStats={globalStats} onReset={resetGlobalStats} />
    </div>
  );
}

export default App;

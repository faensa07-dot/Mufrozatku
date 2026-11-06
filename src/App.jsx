import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, Award, BookOpen, Check, CheckCircle2, ChevronDown, ChevronRight,
  CircleHelp, Clock3, Gamepad2, GraduationCap, Home, House, Library, Medal,
  Menu, NotebookPen, Play, RefreshCw, Search, Sparkles, Star, Target, Trophy,
  UserRound, Volume2, X, XCircle
} from 'lucide-react';
import { api } from './api';

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
const fallbackCategoryNames = {
  kelas: 'Benda di Kelas', rumah: 'Benda di Rumah', perpustakaan: 'Benda di Perpustakaan'
};

function speakArabic(text) {
  if (!('speechSynthesis' in window)) {
    alert('Browser ini belum mendukung fitur suara.');
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ar-SA';
  utterance.rate = 0.78;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function App() {
  const [view, setView] = useState('home');
  const [categories, setCategories] = useState([]);
  const [vocabulary, setVocabulary] = useState([]);
  const [studentName, setStudentName] = useState(() => localStorage.getItem('mufradat-student') || '');
  const [nameDraft, setNameDraft] = useState('');
  const [showNameModal, setShowNameModal] = useState(!localStorage.getItem('mufradat-student'));
  const [selectedCategory, setSelectedCategory] = useState('kelas');
  const [searchTerm, setSearchTerm] = useState('');
  const [apiOnline, setApiOnline] = useState(false);
  const [apiMessage, setApiMessage] = useState('Menghubungkan ke server...');
  const [stats, setStats] = useState({ categories: 3, vocabulary: 24, attempts: 0, students: 0, averageScore: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [history, setHistory] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Matching game state
  const [matchItems, setMatchItems] = useState([]);
  const [matchWords, setMatchWords] = useState([]);
  const [selectedPicture, setSelectedPicture] = useState(null);
  const [matchedItems, setMatchedItems] = useState([]);
  const [wrongWord, setWrongWord] = useState(null);
  const [matchFeedback, setMatchFeedback] = useState('Pilih gambar, lalu pilih pasangan kata Arabnya.');
  const [matchFinished, setMatchFinished] = useState(false);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState('');

  const currentCategory = categories.find((category) => category.id === selectedCategory);
  const categoryVocabulary = useMemo(
    () => vocabulary.filter((item) => item.category === selectedCategory),
    [vocabulary, selectedCategory]
  );
  const filteredVocabulary = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase('id');
    if (!term) return categoryVocabulary;
    return categoryVocabulary.filter((item) =>
      [item.meaning, item.latin, item.arabic].some((value) => value.toLocaleLowerCase('id').includes(term))
    );
  }, [categoryVocabulary, searchTerm]);

  const refreshOverview = useCallback(async (name = studentName) => {
    try {
      const [nextStats, nextLeaders, nextHistory] = await Promise.all([
        api.stats(), api.leaderboard(5), name ? api.scores(name) : Promise.resolve([])
      ]);
      setStats(nextStats);
      setLeaderboard(nextLeaders);
      setHistory(nextHistory);
    } catch (error) {
      setApiMessage(error.message || 'Server belum terhubung.');
    }
  }, [studentName]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [health, nextCategories, nextVocabulary] = await Promise.all([
          api.health(), api.categories(), api.vocabulary()
        ]);
        if (!active) return;
        setCategories(nextCategories);
        setVocabulary(nextVocabulary);
        setApiOnline(true);
        setApiMessage(health.message || 'Server tersambung');
        if (nextCategories.length && !nextCategories.some((item) => item.id === selectedCategory)) {
          setSelectedCategory(nextCategories[0].id);
        }
      } catch (error) {
        if (!active) return;
        setApiOnline(false);
        setApiMessage(error.message || 'Backend belum aktif. Jalankan server terlebih dahulu.');
      }
    }
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (studentName) refreshOverview(studentName);
  }, [studentName, refreshOverview]);

  const changeView = (nextView) => {
    setView(nextView);
    setMobileMenuOpen(false);
    if (nextView === 'hasil' && studentName) refreshOverview(studentName);
  };

  const saveStudentName = (event) => {
    event?.preventDefault();
    const cleanName = nameDraft.trim().slice(0, 40);
    if (!cleanName) return;
    localStorage.setItem('mufradat-student', cleanName);
    setStudentName(cleanName);
    setShowNameModal(false);
    setNameDraft('');
  };

  const saveScore = async ({ score, total, mode, category }) => {
    const payload = {
      studentName: studentName || 'Siswa',
      score,
      total,
      mode,
      category: fallbackCategoryNames[category] || category || 'Semua Materi'
    };
    const localRecord = {
      ...payload,
      percentage: Math.round((score / total) * 100),
      createdAt: new Date().toISOString(),
      id: `local-${Date.now()}`
    };
    setLastResult(localRecord);
    try {
      const saved = await api.saveScore(payload);
      setLastResult(saved);
      await refreshOverview(studentName);
    } catch {
      const localHistory = JSON.parse(localStorage.getItem('mufradat-history') || '[]');
      const nextHistory = [localRecord, ...localHistory].slice(0, 20);
      localStorage.setItem('mufradat-history', JSON.stringify(nextHistory));
      setHistory(nextHistory);
    }
  };

  const startMatching = (categoryId = selectedCategory) => {
    const pool = vocabulary.filter((item) => item.category === categoryId);
    if (pool.length < 2) return;
    const picked = shuffle(pool).slice(0, Math.min(5, pool.length));
    setSelectedCategory(categoryId);
    setMatchItems(picked);
    setMatchWords(shuffle(picked));
    setSelectedPicture(null);
    setMatchedItems([]);
    setWrongWord(null);
    setMatchFinished(false);
    setMatchFeedback('Pilih gambar, lalu pilih pasangan kata Arabnya.');
  };

  const chooseMatchWord = (item) => {
    if (!selectedPicture) {
      setMatchFeedback('Pilih salah satu gambar terlebih dahulu, ya!');
      return;
    }
    if (selectedPicture === item.id) {
      const nextMatched = [...matchedItems, item.id];
      setMatchedItems(nextMatched);
      setSelectedPicture(null);
      setWrongWord(null);
      setMatchFeedback('Hebat! Pasanganmu benar. ⭐');
      if (nextMatched.length === matchItems.length) {
        setMatchFinished(true);
        saveScore({ score: nextMatched.length, total: matchItems.length, mode: 'Menjodohkan', category: selectedCategory });
      }
    } else {
      setWrongWord(item.id);
      setMatchFeedback('Belum cocok. Coba perhatikan gambarnya lagi!');
      window.setTimeout(() => {
        setWrongWord(null);
        setSelectedPicture(null);
        setMatchFeedback('Ayo coba pasangan yang lain!');
      }, 750);
    }
  };

  const startQuiz = (categoryId = selectedCategory) => {
    const pool = vocabulary.filter((item) => item.category === categoryId);
    if (pool.length < 4) return;
    const questions = shuffle(pool).slice(0, Math.min(5, pool.length)).map((item) => {
      const distractors = shuffle(pool.filter((option) => option.id !== item.id)).slice(0, 3);
      return { answer: item, options: shuffle([item, ...distractors]) };
    });
    setSelectedCategory(categoryId);
    setQuizQuestions(questions);
    setQuizIndex(0);
    setQuizSelected(null);
    setQuizScore(0);
    setQuizFinished(false);
    setQuizFeedback('');
  };

  const answerQuiz = (option) => {
    if (quizSelected || !quizQuestions[quizIndex]) return;
    const correct = option.id === quizQuestions[quizIndex].answer.id;
    const nextScore = quizScore + (correct ? 1 : 0);
    setQuizSelected(option.id);
    setQuizFeedback(correct ? 'Benar sekali! Kamu hebat! 🎉' : `Belum tepat. Jawabannya ${quizQuestions[quizIndex].answer.meaning}.`);
    if (correct) setQuizScore(nextScore);
  };

  const nextQuizQuestion = () => {
    const nextIndex = quizIndex + 1;
    if (nextIndex >= quizQuestions.length) {
      setQuizFinished(true);
      saveScore({ score: quizScore, total: quizQuestions.length, mode: 'Kuis', category: selectedCategory });
      return;
    }
    setQuizIndex(nextIndex);
    setQuizSelected(null);
    setQuizFeedback('');
  };

  const navItems = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'materi', label: 'Materi Mufradat', icon: BookOpen },
    { id: 'matching', label: 'Menjodohkan', icon: Gamepad2 },
    { id: 'quiz', label: 'Kuis', icon: CircleHelp },
    { id: 'hasil', label: 'Hasil Belajar', icon: Trophy }
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><BookOpen size={25} strokeWidth={2.6} /></div>
          <div><strong>Mufradat<span>Ceria</span></strong><small>Belajar sambil bermain</small></div>
          <button className="icon-button close-menu" onClick={() => setMobileMenuOpen(false)} aria-label="Tutup menu"><X size={19} /></button>
        </div>
        <div className="sidebar-label">MENU UTAMA</div>
        <nav className="side-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => changeView(item.id)}>
                <Icon size={19} /><span>{item.label}</span>{view === item.id && <span className="nav-active-dot" />}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom-card">
          <div className="mini-stars">✦ ✧ ✦</div>
          <strong>Terus semangat!</strong>
          <p>Satu kosakata baru adalah satu langkah hebat.</p>
          <div className="progress-track"><span style={{ width: `${Math.min(100, Math.round((history.length / 5) * 100))}%` }} /></div>
          <small>{history.length} aktivitas tersimpan</small>
        </div>
        <div className="sidebar-footer"><span className={`status-dot ${apiOnline ? 'online' : ''}`} />{apiOnline ? 'Server tersambung' : 'Menunggu server'}</div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu-button" onClick={() => setMobileMenuOpen(true)} aria-label="Buka menu"><Menu size={22} /></button>
            <div><div className="eyebrow">MEDIA PEMBELAJARAN BAHASA ARAB</div><div className="topbar-title">Ayo belajar hal baru hari ini!</div></div>
          </div>
          <button className="student-chip" onClick={() => { setNameDraft(studentName); setShowNameModal(true); }}>
            <span className="student-avatar"><UserRound size={18} /></span>
            <span className="student-chip-text"><small>Halo,</small><strong>{studentName || 'Teman Belajar'}</strong></span>
            <ChevronDown size={16} />
          </button>
        </header>

        <div className="content-wrap">
          {!apiOnline && <div className="connection-notice"><span className="status-dot" />{apiMessage} Pastikan backend dijalankan dengan <code>npm run server</code>.</div>}
          {view === 'home' && (
            <HomeView
              studentName={studentName}
              categories={categories}
              stats={stats}
              leaderboard={leaderboard}
              history={history}
              onSelectCategory={(id) => { setSelectedCategory(id); changeView('materi'); }}
              onStartMatching={() => { startMatching(selectedCategory); changeView('matching'); }}
              onStartQuiz={() => { startQuiz(selectedCategory); changeView('quiz'); }}
              onNavigate={changeView}
            />
          )}

          {view === 'materi' && (
            <section className="page-section">
              <PageHeading eyebrow="RUANG BELAJAR" title="Yuk, kenali kosakata!" subtitle="Pilih tempat dan pelajari nama benda dalam Bahasa Arab." icon={<BookOpen size={22} />} />
              <CategoryTabs categories={categories} selected={selectedCategory} onChange={(id) => { setSelectedCategory(id); setSearchTerm(''); }} />
              <div className="lesson-intro">
                <div><span className="lesson-kicker">SEKARANG BELAJAR</span><h2>{currentCategory?.name || 'Materi Mufradat'}</h2><p>{currentCategory?.description}</p></div>
                <div className="lesson-arabic" dir="rtl">{currentCategory?.arabic}</div>
              </div>
              <div className="section-toolbar"><div><strong>Daftar kosakata</strong><span>{filteredVocabulary.length} kata untuk dipelajari</span></div><label className="search-box"><Search size={16} /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Cari kosakata..." /></label></div>
              <div className="vocab-grid">
                {filteredVocabulary.map((item, index) => <VocabularyCard key={item.id} item={item} index={index} />)}
              </div>
              {!filteredVocabulary.length && <div className="empty-state">Kosakata tidak ditemukan. Coba kata pencarian lain, ya.</div>}
              <div className="lesson-action-row"><button className="primary-button" onClick={() => { startMatching(selectedCategory); changeView('matching'); }}>Latihan menjodohkan <ArrowRight size={17} /></button><button className="soft-button" onClick={() => { startQuiz(selectedCategory); changeView('quiz'); }}>Coba kuis <Target size={17} /></button></div>
            </section>
          )}

          {view === 'matching' && (
            <section className="page-section">
              <PageHeading eyebrow="PERMAINAN EDUKASI" title="Pasangkan, yuk!" subtitle="Cocokkan gambar benda dengan kosakata Bahasa Arab yang tepat." icon={<Gamepad2 size={22} />} />
              <div className="game-toolbar"><CategorySelect categories={categories} selected={selectedCategory} onChange={(id) => startMatching(id)} /><div className="game-counter"><Star size={17} fill="currentColor" /> {matchedItems.length} / {matchItems.length || 5} pasangan benar</div></div>
              {matchItems.length === 0 ? <div className="game-start-card"><div className="game-start-emoji">🧩</div><h2>Siap bermain?</h2><p>Pilih kategori, lalu mulai permainan menjodohkan.</p><button className="primary-button" onClick={() => startMatching(selectedCategory)}>Mulai permainan <Play size={17} fill="currentColor" /></button></div> : matchFinished ? (
                <div className="game-complete-card"><div className="celebration-icon">🏆</div><span className="success-pill"><CheckCircle2 size={15} /> SEMUA PASANGAN BENAR</span><h2>Masya Allah, hebat!</h2><p>Kamu berhasil memasangkan {matchItems.length} kosakata dengan tepat.</p><div className="complete-score"><strong>{matchItems.length}/{matchItems.length}</strong><span>Pasangan benar</span></div><div className="button-row center"><button className="primary-button" onClick={() => startMatching(selectedCategory)}>Main lagi <RefreshCw size={17} /></button><button className="soft-button" onClick={() => changeView('hasil')}>Lihat hasil <Trophy size={17} /></button></div></div>
              ) : (
                <>
                  <div className="matching-instructions"><span className="instruction-number">1</span> Pilih gambar <span className="instruction-arrow">→</span><span className="instruction-number">2</span> Pilih kata Arab yang cocok</div>
                  <div className="matching-board">
                    <div className="matching-column"><div className="column-heading"><span>GAMBAR BENDA</span><small>Pilih satu gambar</small></div>{matchItems.map((item) => <button key={item.id} disabled={matchedItems.includes(item.id)} className={`match-picture-card ${selectedPicture === item.id ? 'selected' : ''} ${matchedItems.includes(item.id) ? 'matched' : ''}`} onClick={() => { setSelectedPicture(item.id); setMatchFeedback('Sekarang pilih kata Arab di sebelah kanan.'); }}><span className="match-emoji">{item.emoji}</span><span className="match-meaning">{matchedItems.includes(item.id) ? item.meaning : 'Pilih gambar'}</span>{matchedItems.includes(item.id) && <CheckCircle2 size={18} />}</button>)}</div>
                    <div className="matching-column"><div className="column-heading"><span>KOSAKATA ARAB</span><small>Pilih pasangan kata</small></div>{matchWords.map((item) => <button key={item.id} disabled={matchedItems.includes(item.id)} className={`match-word-card ${wrongWord === item.id ? 'wrong' : ''} ${matchedItems.includes(item.id) ? 'matched' : ''}`} onClick={() => chooseMatchWord(item)}><span dir="rtl">{item.arabic}</span>{matchedItems.includes(item.id) && <CheckCircle2 size={18} />}{wrongWord === item.id && <XCircle size={18} />}</button>)}</div>
                  </div>
                  <div className={`match-feedback ${wrongWord ? 'feedback-wrong' : matchedItems.length ? 'feedback-good' : ''}`}>{wrongWord ? <XCircle size={18} /> : <Sparkles size={18} />}{matchFeedback}</div>
                  <div className="game-bottom-row"><button className="text-button" onClick={() => startMatching(selectedCategory)}><RefreshCw size={16} /> Acak ulang permainan</button><button className="soft-button" onClick={() => changeView('materi')}>Pelajari materi dulu</button></div>
                </>
              )}
            </section>
          )}

          {view === 'quiz' && (
            <section className="page-section">
              <PageHeading eyebrow="UJI PEMAHAMAN" title="Tantangan pintar!" subtitle="Jawab pertanyaan dengan memilih arti kosakata yang benar." icon={<CircleHelp size={22} />} />
              <div className="game-toolbar"><CategorySelect categories={categories} selected={selectedCategory} onChange={(id) => startQuiz(id)} /><div className="game-counter"><Target size={17} /> 5 pertanyaan</div></div>
              {!quizQuestions.length ? <div className="game-start-card"><div className="game-start-emoji">🎯</div><h2>Uji kemampuanmu!</h2><p>Ada lima pertanyaan seru untuk menguji ingatan kosakatamu.</p><button className="primary-button" onClick={() => startQuiz(selectedCategory)}>Mulai kuis <Play size={17} fill="currentColor" /></button></div> : quizFinished ? (
                <div className="game-complete-card"><div className="celebration-icon">🎉</div><span className="success-pill"><Award size={15} /> KUIS SELESAI</span><h2>Kamu sudah berusaha hebat!</h2><p>Terus berlatih agar semakin lancar mengingat kosakata Bahasa Arab.</p><div className="complete-score"><strong>{quizScore}/{quizQuestions.length}</strong><span>Jawaban benar</span></div><div className="result-progress"><span style={{ width: `${(quizScore / quizQuestions.length) * 100}%` }} /></div><div className="button-row center"><button className="primary-button" onClick={() => startQuiz(selectedCategory)}>Ulangi kuis <RefreshCw size={17} /></button><button className="soft-button" onClick={() => changeView('hasil')}>Lihat hasil <Trophy size={17} /></button></div></div>
              ) : (
                <div className="quiz-card"><div className="quiz-topline"><span>PERTANYAAN {quizIndex + 1} DARI {quizQuestions.length}</span><span className="quiz-score"><Star size={15} fill="currentColor" /> {quizScore} benar</span></div><div className="quiz-progress">{quizQuestions.map((_, index) => <span key={index} className={index <= quizIndex ? 'filled' : ''} />)}</div><div className="quiz-question-art">{quizQuestions[quizIndex].answer.emoji}</div><p className="quiz-prompt">Apa arti kosakata Bahasa Arab berikut?</p><div className="quiz-arabic" dir="rtl">{quizQuestions[quizIndex].answer.arabic}</div><div className="quiz-latin">{quizQuestions[quizIndex].answer.latin}</div><div className="quiz-options">{quizQuestions[quizIndex].options.map((option, index) => { const isCorrect = option.id === quizQuestions[quizIndex].answer.id; const isSelected = quizSelected === option.id; return <button key={option.id} disabled={!!quizSelected} className={`quiz-option ${quizSelected && isCorrect ? 'correct' : ''} ${isSelected && !isCorrect ? 'incorrect' : ''}`} onClick={() => answerQuiz(option)}><span className="option-letter">{String.fromCharCode(65 + index)}</span>{option.meaning}{quizSelected && isCorrect && <CheckCircle2 size={18} />}{isSelected && !isCorrect && <XCircle size={18} />}</button>; })}</div>{quizFeedback && <div className={`quiz-feedback ${quizSelected === quizQuestions[quizIndex].answer.id ? 'feedback-good' : 'feedback-wrong'}`}>{quizFeedback}</div>}<div className="quiz-footer"><span><Clock3 size={15} /> Santai saja, tidak perlu terburu-buru.</span>{quizSelected && <button className="primary-button" onClick={nextQuizQuestion}>{quizIndex === quizQuestions.length - 1 ? 'Lihat hasil' : 'Pertanyaan berikutnya'} <ArrowRight size={16} /></button>}</div></div>
              )}
            </section>
          )}

          {view === 'hasil' && (
            <section className="page-section">
              <PageHeading eyebrow="PERKEMBANGAN BELAJAR" title="Perjalanan hebatmu!" subtitle="Lihat hasil latihan dan terus tingkatkan kemampuanmu." icon={<Trophy size={22} />} />
              <div className="result-summary-grid"><div className="result-summary-card highlight"><span className="summary-icon"><Trophy size={20} /></span><small>Aktivitas tersimpan</small><strong>{history.length}</strong><span>kali latihan</span></div><div className="result-summary-card"><span className="summary-icon mint-icon"><Target size={20} /></span><small>Rata-rata nilai</small><strong>{history.length ? Math.round(history.reduce((sum, item) => sum + (item.percentage || 0), 0) / history.length) : 0}<em>/100</em></strong><span>dari latihanmu</span></div><div className="result-summary-card"><span className="summary-icon lilac-icon"><Star size={20} /></span><small>Nilai terbaik</small><strong>{history.length ? Math.max(...history.map((item) => item.percentage || 0)) : 0}<em>/100</em></strong><span>terus pertahankan!</span></div></div>
              <div className="history-panel"><div className="panel-heading"><div><h3>Riwayat latihan</h3><p>Hasil latihan terbaru akan muncul di sini.</p></div><span className="history-count">{history.length} aktivitas</span></div>{history.length ? <div className="history-list">{history.map((item) => <div className="history-row" key={item.id}><div className="history-icon">{item.mode === 'Kuis' ? '🎯' : '🧩'}</div><div className="history-info"><strong>{item.mode}</strong><span>{item.category} · {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div><div className="history-score"><strong>{item.percentage}%</strong><span>{item.score}/{item.total} benar</span></div></div>)}</div> : <div className="empty-state"><div>🌱</div><strong>Belum ada riwayat belajar</strong><p>Yuk mulai belajar atau bermain untuk mengisi catatan prestasimu.</p><button className="primary-button" onClick={() => changeView('materi')}>Mulai belajar <ArrowRight size={16} /></button></div>}</div>
              <div className="leaderboard-panel"><div className="panel-heading"><div><h3><Medal size={19} /> Papan peringkat</h3><p>Teman-teman dengan nilai terbaik.</p></div></div>{leaderboard.length ? leaderboard.map((item, index) => <div className="leader-row" key={item.id}><span className={`leader-rank rank-${index + 1}`}>{index + 1}</span><span className="leader-avatar">{item.studentName.slice(0, 1).toUpperCase()}</span><strong>{item.studentName}</strong><span className="leader-points">{item.percentage} poin</span></div>) : <div className="leader-empty">Belum ada nilai. Jadilah yang pertama!</div>}</div>
            </section>
          )}
          <footer className="page-footer"><span>© 2026 Mufradat Ceria</span><span>Dibuat untuk belajar Bahasa Arab dengan gembira <span className="footer-heart">♥</span></span></footer>
        </div>
      </main>

      {showNameModal && <div className="modal-backdrop"><form className="name-modal" onSubmit={saveStudentName}><button type="button" className="modal-close" onClick={() => { if (studentName) setShowNameModal(false); }} aria-label="Tutup">{studentName && <X size={18} />}</button><div className="modal-mascot">👋</div><span className="modal-kicker">SELAMAT DATANG DI MUFRADAT CERIA</span><h2>Halo, teman belajar!</h2><p>Siapa namamu? Masukkan nama agar hasil belajarmu bisa dicatat.</p><label className="name-input-label">Nama siswa<input autoFocus value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} placeholder="Tulis namamu di sini..." maxLength={40} /></label><button className="primary-button full-button" type="submit" disabled={!nameDraft.trim()}>Mulai belajar <ArrowRight size={17} /></button><small className="privacy-note">Nama hanya digunakan untuk menampilkan hasil belajar.</small></form></div>}
    </div>
  );
}

function PageHeading({ eyebrow, title, subtitle, icon }) {
  return <div className="page-heading"><div className="heading-icon">{icon}</div><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div></div>;
}

function CategoryTabs({ categories, selected, onChange }) {
  return <div className="category-tabs">{categories.map((category) => <button key={category.id} onClick={() => onChange(category.id)} className={selected === category.id ? 'active' : ''}><span>{category.emoji}</span>{category.name}</button>)}</div>;
}

function CategorySelect({ categories, selected, onChange }) {
  return <label className="category-select"><span>Kategori:</span><select value={selected} onChange={(event) => onChange(event.target.value)}>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select><ChevronDown size={15} /></label>;
}

function VocabularyCard({ item, index }) {
  return <article className="vocab-card" style={{ '--card-delay': `${index * 45}ms` }}><div className="vocab-card-top"><span className="vocab-number">{String(index + 1).padStart(2, '0')}</span><button className="sound-button" onClick={() => speakArabic(item.arabic)} aria-label={`Dengarkan ${item.meaning}`}><Volume2 size={17} /></button></div><div className="vocab-illustration"><span>{item.emoji}</span><i className="sparkle sparkle-one">✦</i><i className="sparkle sparkle-two">✧</i></div><div className="vocab-arabic" dir="rtl">{item.arabic}</div><div className="vocab-latin">{item.latin}</div><div className="vocab-divider" /><div className="vocab-meaning">{item.meaning}</div><div className="vocab-example">{item.example}</div></article>;
}

function HomeView({ studentName, categories, stats, leaderboard, history, onSelectCategory, onStartMatching, onStartQuiz, onNavigate }) {
  return <>
    <section className="welcome-hero"><div className="hero-copy"><div className="hero-badge"><Sparkles size={14} /> BELAJAR JADI MENYENANGKAN</div><div className="hero-arabic" dir="rtl">مَرْحَبًا يَا صَدِيقِي!</div><h1>Hai, {studentName || 'Teman'}!<br /><span>Siap berpetualang?</span></h1><p>Yuk, kenali benda-benda di sekitarmu dalam Bahasa Arab. Belajar sedikit demi sedikit, lama-lama jadi bisa!</p><button className="hero-button" onClick={() => onNavigate('materi')}>Mulai belajar <ArrowRight size={18} /></button><div className="hero-footnote"><span><CheckCircle2 size={15} /> Materi mudah dipahami</span><span><Star size={15} /> Belajar sambil bermain</span></div></div><div className="hero-art"><div className="hero-sun" /><div className="hero-cloud cloud-one" /><div className="hero-cloud cloud-two" /><div className="hero-book">📚</div><div className="hero-pencil">✏️</div><div className="hero-plant">🌱</div><div className="hero-character">🧑‍🎓</div><div className="hero-floating-note note-one">اَلْعَرَبِيَّةُ</div><div className="hero-floating-note note-two">⭐</div></div></section>
    <div className="quick-stats"><div className="quick-stat"><span className="quick-stat-icon orange"><BookOpen size={19} /></span><div><strong>{stats.categories || categories.length || 3}</strong><small>Topik belajar</small></div></div><div className="quick-stat"><span className="quick-stat-icon green"><NotebookPen size={19} /></span><div><strong>{stats.vocabulary || 24}</strong><small>Kosakata tersedia</small></div></div><div className="quick-stat"><span className="quick-stat-icon purple"><Trophy size={19} /></span><div><strong>{history.length}</strong><small>Latihan selesai</small></div></div><div className="quick-stat"><span className="quick-stat-icon blue"><Star size={19} /></span><div><strong>{history.length ? Math.max(...history.map((item) => item.percentage || 0)) : 0}</strong><small>Nilai terbaik</small></div></div></div>
    <section className="home-section"><div className="section-title-row"><div><div className="eyebrow">PILIH PETUALANGANMU</div><h2>Mau belajar di mana?</h2><p>Pilih tema untuk mulai mengenal kosakata baru.</p></div><button className="link-button" onClick={() => onNavigate('materi')}>Lihat semua <ChevronRight size={17} /></button></div><div className="topic-grid">{categories.map((category, index) => <button key={category.id} className={`topic-card topic-${category.color || ['peach', 'mint', 'lavender'][index % 3]}`} onClick={() => onSelectCategory(category.id)}><div className="topic-illustration"><span>{category.emoji}</span><i>✦</i></div><div className="topic-info"><span className="topic-count">{category.id === 'kelas' ? '8 KOSAKATA' : category.id === 'rumah' ? '8 KOSAKATA' : '8 KOSAKATA'}</span><h3>{category.name}</h3><p>{category.description}</p><span className="topic-arabic" dir="rtl">{category.arabic}</span></div><span className="topic-arrow"><ArrowRight size={17} /></span></button>)}</div></section>
    <section className="home-bottom-grid"><div className="activity-card"><div className="section-title-row compact"><div><div className="eyebrow">ASAH KEMAMPUAN</div><h2>Belajar sambil bermain</h2><p>Pilih permainan favoritmu.</p></div></div><div className="activity-options"><button className="activity-option match-option" onClick={onStartMatching}><span className="activity-emoji">🧩</span><span><strong>Menjodohkan</strong><small>Cocokkan gambar dan kata Arab</small></span><ChevronRight size={18} /></button><button className="activity-option quiz-option" onClick={onStartQuiz}><span className="activity-emoji">🎯</span><span><strong>Kuis pintar</strong><small>Uji ingatan kosakatamu</small></span><ChevronRight size={18} /></button></div></div><div className="mini-leaderboard"><div className="panel-heading"><div><div className="eyebrow">TEMAN BERPRESTASI</div><h3><Trophy size={18} /> Papan peringkat</h3></div><button className="icon-button" onClick={() => onNavigate('hasil')} aria-label="Lihat peringkat"><ArrowRight size={17} /></button></div>{leaderboard.length ? leaderboard.slice(0, 3).map((item, index) => <div className="leader-row" key={item.id}><span className={`leader-rank rank-${index + 1}`}>{index + 1}</span><span className="leader-avatar">{item.studentName.slice(0, 1).toUpperCase()}</span><strong>{item.studentName}</strong><span className="leader-points">{item.percentage}</span></div>) : <div className="leader-empty">Papan peringkat akan terisi setelah ada siswa menyelesaikan latihan.</div>}</div></section>
    <div className="encouragement-strip"><span className="encouragement-icon">🌟</span><div><strong>Setiap hari adalah kesempatan untuk belajar!</strong><p>Jangan takut salah, karena dari mencoba kita menjadi lebih pintar.</p></div><span className="encouragement-arabic" dir="rtl">اِجْتَهِدْ وَتَعَلَّمْ</span></div>
  </>;
}

export default App;

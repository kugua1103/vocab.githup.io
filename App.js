/* global __firebase_config, __app_id, __initial_auth_token */
import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  addDoc,
  deleteDoc,
  increment, 
  collection, 
  updateDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { 
  Volume2, 
  CheckCircle, 
  XCircle, 
  Trophy, 
  ArrowRight, 
  RefreshCw, 
  Layers,
  Zap,
  BookOpen,
  Plus,
  Search,
  Library,
  Trash2,
  Loader2,
  Save,
  Settings,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Sparkles, // ✨ New Icon for AI features
  BrainCircuit,
  MessageSquareQuote
} from 'lucide-react';

// --- Configuration & Constants ---

// Gemini API Key (Environment provided)
const apiKey = ""; 

// 默认单词数量
const DEFAULT_SESSION_LENGTH = 20;

// 基础词库 (扩充版 CET-4/6)
const BASE_VOCAB_LIST = [
  // --- CET-4 Samples ---
  { id: 'c4_1', term: 'Abandon', translation: 'v. 抛弃，放弃', phonetic: '/əˈbændən/', sentence: 'He abandoned his car in the snow.', sentenceTrans: '他在雪地里抛弃了他的车。', level: 'cet4' },
  { id: 'c4_2', term: 'Ability', translation: 'n. 能力', phonetic: '/əˈbɪləti/', sentence: 'She has the ability to learn quickly.', sentenceTrans: '她有快速学习的能力。', level: 'cet4' },
  { id: 'c4_3', term: 'Absolute', translation: 'adj. 绝对的', phonetic: '/ˈæbsəluːt/', sentence: 'I have absolute confidence in her.', sentenceTrans: '我对她有绝对的信心。', level: 'cet4' },
  { id: 'c4_4', term: 'Academic', translation: 'adj. 学术的', phonetic: '/ˌækəˈdemɪk/', sentence: 'The university has high academic standards.', sentenceTrans: '这所大学有很高的学术标准。', level: 'cet4' },
  { id: 'c4_5', term: 'Acceptable', translation: 'adj. 可接受的', phonetic: '/əkˈseptəbl/', sentence: 'Is this solution acceptable to you?', sentenceTrans: '这个方案你能接受吗？', level: 'cet4' },
  { id: 'c4_6', term: 'Access', translation: 'n. 通道；入口', phonetic: '/ˈækses/', sentence: 'The only access to the village is by boat.', sentenceTrans: '进入这个村庄的唯一通道是坐船。', level: 'cet4' },
  { id: 'c4_7', term: 'Account', translation: 'n. 账户；描述', phonetic: '/əˈkaʊnt/', sentence: 'I opened a bank account.', sentenceTrans: '我开了一个银行账户。', level: 'cet4' },
  { id: 'c4_8', term: 'Acquire', translation: 'v. 获得', phonetic: '/əˈkwaɪər/', sentence: 'She acquired a good knowledge of English.', sentenceTrans: '她获得了很好的英语知识。', level: 'cet4' },
  { id: 'c4_9', term: 'Active', translation: 'adj. 活跃的', phonetic: '/ˈæktɪv/', sentence: 'He is an active member of the club.', sentenceTrans: '他是俱乐部的活跃成员。', level: 'cet4' },
  { id: 'c4_10', term: 'Adapt', translation: 'v. 适应', phonetic: '/əˈdæpt/', sentence: 'It took time to adapt to the new environment.', sentenceTrans: '适应新环境花了一些时间。', level: 'cet4' },
  { id: 'c4_11', term: 'Balance', translation: 'n. 平衡', phonetic: '/ˈbæləns/', sentence: 'Try to keep your balance.', sentenceTrans: '试着保持平衡。', level: 'cet4' },
  { id: 'c4_12', term: 'Barrier', translation: 'n. 障碍', phonetic: '/ˈbæriər/', sentence: 'Language implies a barrier to communication.', sentenceTrans: '语言意味着交流的障碍。', level: 'cet4' },
  { id: 'c4_13', term: 'Benefit', translation: 'n. 利益', phonetic: '/ˈbenɪfɪt/', sentence: 'The project will be of great benefit to the region.', sentenceTrans: '该项目将对该地区大有裨益。', level: 'cet4' },
  { id: 'c4_14', term: 'Boundary', translation: 'n. 边界', phonetic: '/ˈbaʊndri/', sentence: 'The river marks the boundary between the two countries.', sentenceTrans: '这条河标志着两国之间的边界。', level: 'cet4' },
  { id: 'c4_15', term: 'Candidate', translation: 'n. 候选人', phonetic: '/ˈkændɪdət/', sentence: 'He is a candidate for the presidency.', sentenceTrans: '他是总统职位的候选人。', level: 'cet4' },
  { id: 'c4_16', term: 'Capture', translation: 'v. 捕获', phonetic: '/ˈkæptʃər/', sentence: 'The police captured the thief.', sentenceTrans: '警察抓住了小偷。', level: 'cet4' },
  { id: 'c4_17', term: 'Casual', translation: 'adj. 随意的', phonetic: '/ˈkæʒuəl/', sentence: 'She wore casual clothes.', sentenceTrans: '她穿着便装。', level: 'cet4' },
  { id: 'c4_18', term: 'Ceremony', translation: 'n. 典礼', phonetic: '/ˈserəməni/', sentence: 'The wedding ceremony was beautiful.', sentenceTrans: '婚礼仪式很美。', level: 'cet4' },
  { id: 'c4_19', term: 'Challenge', translation: 'n. 挑战', phonetic: '/ˈtʃælɪndʒ/', sentence: 'It was a challenge to finish the work on time.', sentenceTrans: '按时完成工作是一个挑战。', level: 'cet4' },
  { id: 'c4_20', term: 'Character', translation: 'n. 性格；角色', phonetic: '/ˈkærəktər/', sentence: 'He has a strong character.', sentenceTrans: '他性格坚强。', level: 'cet4' },
  { id: 'c4_21', term: 'Decline', translation: 'v. 下降；拒绝', phonetic: '/dɪˈklaɪn/', sentence: 'Profits have declined this year.', sentenceTrans: '今年利润下降了。', level: 'cet4' },
  { id: 'c4_22', term: 'Defeat', translation: 'v. 击败', phonetic: '/dɪˈfiːt/', sentence: 'They defeated the enemy.', sentenceTrans: '他们击败了敌人。', level: 'cet4' },
  { id: 'c4_23', term: 'Delay', translation: 'v. 推迟', phonetic: '/dɪˈleɪ/', sentence: 'The flight was delayed due to bad weather.', sentenceTrans: '航班因恶劣天气延误。', level: 'cet4' },
  { id: 'c4_24', term: 'Demand', translation: 'n. 需求', phonetic: '/dɪˈmɑːnd/', sentence: 'There is a high demand for organic food.', sentenceTrans: '有机食品的需求量很大。', level: 'cet4' },
  { id: 'c4_25', term: 'Deserve', translation: 'v. 值得', phonetic: '/dɪˈzɜːrv/', sentence: 'You deserve a rest.', sentenceTrans: '你应该休息一下。', level: 'cet4' },
  
  // --- CET-6 Samples ---
  { id: 'c6_1', term: 'Abnormal', translation: 'adj. 反常的', phonetic: '/æbˈnɔːml/', sentence: 'Abnormal weather conditions caused the flood.', sentenceTrans: '反常的天气条件导致了洪水。', level: 'cet6' },
  { id: 'c6_2', term: 'Abolish', translation: 'v. 废除', phonetic: '/əˈbɒlɪʃ/', sentence: 'Slavery was abolished in the US in 1865.', sentenceTrans: '美国于1865年废除了奴隶制。', level: 'cet6' },
  { id: 'c6_3', term: 'Abrupt', translation: 'adj. 突然的', phonetic: '/əˈbrʌpt/', sentence: 'The meeting came to an abrupt end.', sentenceTrans: '会议突然结束了。', level: 'cet6' },
  { id: 'c6_4', term: 'Absurd', translation: 'adj. 荒谬的', phonetic: '/əbˈsɜːd/', sentence: 'That is an absurd idea.', sentenceTrans: '那是一个荒谬的主意。', level: 'cet6' },
  { id: 'c6_5', term: 'Abundance', translation: 'n. 丰富', phonetic: '/əˈbʌndəns/', sentence: 'There is an abundance of food.', sentenceTrans: '有丰富的食物。', level: 'cet6' },
  { id: 'c6_6', term: 'Accelerate', translation: 'v. 加速', phonetic: '/əkˈseləreɪt/', sentence: 'The car accelerated quickly.', sentenceTrans: '汽车加速很快。', level: 'cet6' },
  { id: 'c6_7', term: 'Accessory', translation: 'n. 配件', phonetic: '/əkˈsesəri/', sentence: 'She bought some accessories for her dress.', sentenceTrans: '她为她的裙子买了一些配饰。', level: 'cet6' },
  { id: 'c6_8', term: 'Accommodate', translation: 'v. 容纳；适应', phonetic: '/əˈkɒmədeɪt/', sentence: 'The hotel can accommodate 500 guests.', sentenceTrans: '这家酒店可容纳500位客人。', level: 'cet6' },
  { id: 'c6_9', term: 'Accord', translation: 'n. 一致；协议', phonetic: '/əˈkɔːd/', sentence: 'They signed a peace accord.', sentenceTrans: '他们签署了和平协议。', level: 'cet6' },
  { id: 'c6_10', term: 'Accumulate', translation: 'v. 积累', phonetic: '/əˈkjuːmjəleɪt/', sentence: 'Dust accumulated on the furniture.', sentenceTrans: '家具上积了灰尘。', level: 'cet6' },
  { id: 'c6_11', term: 'Ambiguous', translation: 'adj. 模棱两可的', phonetic: '/æmˈbɪɡjuəs/', sentence: 'The instructions were ambiguous.', sentenceTrans: '说明书模棱两可。', level: 'cet6' },
  { id: 'c6_12', term: 'Ambitious', translation: 'adj. 有野心的', phonetic: '/æmˈbɪʃəs/', sentence: 'He is an ambitious young lawyer.', sentenceTrans: '他是一位有野心的年轻律师。', level: 'cet6' },
  { id: 'c6_13', term: 'Ample', translation: 'adj. 充足的', phonetic: '/ˈæmpl/', sentence: 'There is ample room for everyone.', sentenceTrans: '这里有足够的空间容纳每个人。', level: 'cet6' },
  { id: 'c6_14', term: 'Analogy', translation: 'n. 类比', phonetic: '/əˈnælədʒi/', sentence: 'He drew an analogy between the brain and a computer.', sentenceTrans: '他将大脑和电脑进行了类比。', level: 'cet6' },
  { id: 'c6_15', term: 'Anticipate', translation: 'v. 预期', phonetic: '/ænˈtɪsɪpeɪt/', sentence: 'We anticipate a large crowd.', sentenceTrans: '我们预计会有很多人。', level: 'cet6' },
  { id: 'c6_16', term: 'Apparent', translation: 'adj. 明显的', phonetic: '/əˈpærənt/', sentence: 'It became apparent that she was ill.', sentenceTrans: '很明显她病了。', level: 'cet6' },
  { id: 'c6_17', term: 'Appeal', translation: 'v. 呼吁；吸引', phonetic: '/əˈpiːl/', sentence: 'The idea appealed to him.', sentenceTrans: '这个主意吸引了他。', level: 'cet6' },
  { id: 'c6_18', term: 'Applaud', translation: 'v. 鼓掌', phonetic: '/əˈplɔːd/', sentence: 'The audience applauded loudly.', sentenceTrans: '观众热烈鼓掌。', level: 'cet6' },
  { id: 'c6_19', term: 'Appreciate', translation: 'v. 欣赏；感激', phonetic: '/əˈpriːʃieɪt/', sentence: 'I appreciate your help.', sentenceTrans: '我感激你的帮助。', level: 'cet6' },
  { id: 'c6_20', term: 'Approach', translation: 'n. 方法；途径', phonetic: '/əˈprəʊtʃ/', sentence: 'We need a new approach to the problem.', sentenceTrans: '我们需要一种解决这个问题的新方法。', level: 'cet6' },
  { id: 'c6_21', term: 'Bewilder', translation: 'v. 使迷惑', phonetic: '/bɪˈwɪldər/', sentence: 'She was bewildered by his sudden anger.', sentenceTrans: '她被他突然的愤怒搞糊涂了。', level: 'cet6' },
  { id: 'c6_22', term: 'Bleak', translation: 'adj. 荒凉的；暗淡的', phonetic: '/bliːk/', sentence: 'The future looks bleak.', sentenceTrans: '未来看起来很暗淡。', level: 'cet6' },
  { id: 'c6_23', term: 'Blunt', translation: 'adj. 钝的；直率的', phonetic: '/blʌnt/', sentence: 'He is very blunt about his feelings.', sentenceTrans: '他直言不讳地表达自己的感受。', level: 'cet6' },
  { id: 'c6_24', term: 'Bold', translation: 'adj. 大胆的', phonetic: '/bəʊld/', sentence: 'It was a bold move.', sentenceTrans: '这是一个大胆的举动。', level: 'cet6' },
  { id: 'c6_25', term: 'Bound', translation: 'adj. 一定的；受约束的', phonetic: '/baʊnd/', sentence: 'You are bound to succeed.', sentenceTrans: '你一定会成功。', level: 'cet6' }
];

// --- Firebase Setup ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-vocab-app';

// --- Utils ---
const generateOptions = (correctTrans, allWords) => {
  const others = allWords.filter(w => w.translation !== correctTrans);
  const shuffledOthers = [...others].sort(() => Math.random() - 0.5).slice(0, 3);
  const options = [correctTrans, ...shuffledOthers.map(w => w.translation)];
  return options.sort(() => Math.random() - 0.5);
};

// --- Gemini API Helper ---
const callGemini = async (prompt, isJson = false) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: isJson 
            ? { responseMimeType: "application/json" } 
            : undefined
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (isJson) {
      return JSON.parse(text);
    }
    return text;
  } catch (error) {
    console.error("Gemini call failed:", error);
    throw error;
  }
};

// --- Components ---

const OptionCard = ({ text, onClick, status, disabled }) => {
  let borderClass = "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50";
  let icon = null;

  if (status === 'correct') {
    borderClass = "border-green-500 bg-green-50 text-green-700 ring-2 ring-green-200";
    icon = <CheckCircle className="w-5 h-5 text-green-600 absolute right-3" />;
  } else if (status === 'wrong') {
    borderClass = "border-red-500 bg-red-50 text-red-700 opacity-80";
    icon = <XCircle className="w-5 h-5 text-red-600 absolute right-3" />;
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative w-full p-4 rounded-xl border-2 transition-all duration-200 shadow-sm active:scale-95 flex items-center justify-center min-h-[72px] ${borderClass}`}
    >
      <span className="text-lg font-bold tracking-wide">{text}</span>
      {icon}
    </button>
  );
};

// 3. Main App Component
export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [gameState, setGameState] = useState('start');
  
  // Game Settings & State
  const [selectedDifficulty, setSelectedDifficulty] = useState('cet4');
  const [sessionLimit, setSessionLimit] = useState(DEFAULT_SESSION_LENGTH);
  const [gameList, setGameList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedbackState, setFeedbackState] = useState(null);
  const [isReviewMode, setIsReviewMode] = useState(false);

  // User Data
  const [userData, setUserData] = useState({ totalLearned: 0, mistakes: [] });
  const [customWords, setCustomWords] = useState([]); 

  // Add Word Form State
  const [isAddingWord, setIsAddingWord] = useState(false);
  const [newWordTerm, setNewWordTerm] = useState('');
  const [newWordData, setNewWordData] = useState(null);
  const [newWordLoading, setNewWordLoading] = useState(false);
  const [manualTranslation, setManualTranslation] = useState('');

  // AI Feature States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState(null);

  // --- Auth & Data Loading ---
  useEffect(() => {
    const initAuth = async () => {
      const initialToken = typeof window !== 'undefined' ? window['__initial_auth_token'] : undefined;
      if (initialToken) {
        await signInWithCustomToken(auth, initialToken);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const progressRef = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'vocab_data'), 'progress');
    const unsubProgress = onSnapshot(progressRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData({ 
          totalLearned: data.totalLearned || 0,
          mistakes: data.mistakes || [] 
        });
      } else {
        setDoc(progressRef, { totalLearned: 0, mistakes: [] });
      }
    });

    const customWordsQuery = query(
      collection(db, 'artifacts', appId, 'users', user.uid, 'custom_words'), 
      orderBy('createdAt', 'desc')
    );
    
    const unsubCustom = onSnapshot(customWordsQuery, (snapshot) => {
      const words = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomWords(words);
    });

    return () => {
      unsubProgress();
      unsubCustom();
    };
  }, [user]);

  // --- API / Logic ---

  const fetchWordData = async (useAI = false) => {
    if (!newWordTerm.trim()) return;
    setNewWordLoading(true);
    setNewWordData(null);
    setManualTranslation('');

    try {
      if (useAI) {
        // ✨ Gemini API Call for Smart Add
        const prompt = `Generate a JSON object for the English word '${newWordTerm}' suitable for a vocabulary app (CET-4/6 level). 
        Fields required: 
        - translation (Chinese definition, concise, e.g. "n. 意外发现珍宝的运气")
        - phonetic (IPA string, e.g. "/ˌserənˈdɪpəti/")
        - sentence (English example sentence)
        - sentenceTrans (Chinese translation of the sentence)
        Only return the JSON.`;
        
        const aiData = await callGemini(prompt, true);
        setNewWordData({
          term: newWordTerm,
          phonetic: aiData.phonetic || '',
          sentence: aiData.sentence || '',
          sentenceTrans: aiData.sentenceTrans || ''
        });
        setManualTranslation(aiData.translation || '');

      } else {
        // Regular Dictionary API
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${newWordTerm.trim()}`);
        if (res.ok) {
          const data = await res.json();
          const entry = data[0];
          const phonetic = entry.phonetic || (entry.phonetics.find((p) => p.text)?.text) || '';
          let sentence = '';
          entry.meanings.forEach((m) => {
            if (!sentence) {
              const def = m.definitions.find((d) => d.example);
              if (def) sentence = def.example;
            }
          });

          setNewWordData({
            term: entry.word,
            phonetic: phonetic,
            sentence: sentence || `This is a sample sentence for ${entry.word}.`,
            sentenceTrans: '(暂无例句翻译)'
          });
        } else {
          // Fallback to manual
          setNewWordData({
            term: newWordTerm,
            phonetic: '',
            sentence: '',
            sentenceTrans: ''
          });
        }
      }
    } catch (e) {
      console.error("Fetch Error", e);
      // Fallback
      setNewWordData({
        term: newWordTerm,
        phonetic: '',
        sentence: '',
        sentenceTrans: ''
      });
    } finally {
      setNewWordLoading(false);
    }
  };

  const getAiExplanation = async (word) => {
    setAiLoading(true);
    setAiExplanation(null);
    try {
      // ✨ Gemini API Call for Deep Dive
      const prompt = `Explain the English word '${word}' for a Chinese student preparing for CET-4/6 exams. 
      Please provide:
      1. A short Etymology (词源) or origin story if interesting.
      2. A Mnemonic aid (助记口诀) to help memorize it.
      3. Two common collocations (固定搭配).
      Format nicely with emojis. Keep it concise.`;
      
      const text = await callGemini(prompt, false);
      setAiExplanation(text);
    } catch (e) {
      setAiExplanation("AI 解析服务暂时不可用，请稍后再试。");
    } finally {
      setAiLoading(false);
    }
  };

  const saveCustomWord = async () => {
    if (!user || !newWordData || !manualTranslation.trim()) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_words'), {
        term: newWordData.term,
        translation: manualTranslation,
        phonetic: newWordData.phonetic,
        sentence: newWordData.sentence,
        sentenceTrans: newWordData.sentenceTrans,
        level: 'custom',
        createdAt: serverTimestamp()
      });
      setIsAddingWord(false);
      setNewWordTerm('');
      setNewWordData(null);
      setManualTranslation('');
    } catch (e) {
      console.error("Save custom word failed", e);
    }
  };

  const deleteCustomWord = async (id) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_words', id));
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  // --- Game Flow Logic ---

  const startGame = (mode) => {
    let rawList = [];
    const fullPool = [...BASE_VOCAB_LIST, ...customWords];

    if (mode === 'review') {
      setIsReviewMode(true);
      rawList = fullPool.filter(w => userData.mistakes.includes(w.id));
    } else {
      setIsReviewMode(false);
      const difficultyWords = fullPool.filter(w => w.level === selectedDifficulty);
      let mixIn = [];
      if (customWords.length > 0) {
         mixIn = customWords.sort(() => Math.random() - 0.5).slice(0, 5); 
      }
      const combined = [...difficultyWords, ...mixIn].filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i);
      rawList = combined.length === 0 ? fullPool : combined;
    }

    const shuffled = rawList.sort(() => Math.random() - 0.5).slice(0, sessionLimit);

    const processedList = shuffled.map(item => {
      const distractors = fullPool
        .filter(w => w.translation !== item.translation)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.translation);
      
      const mixedOptions = [...distractors, item.translation].sort(() => Math.random() - 0.5);
      const newCorrectIndex = mixedOptions.indexOf(item.translation);

      return {
        ...item,
        options: mixedOptions,
        correctIndex: newCorrectIndex
      };
    });

    setGameList(processedList);
    setCurrentIndex(0);
    setScore(0);
    setFeedbackState(null);
    setAiExplanation(null); // Reset AI explanation
    setGameState('playing');
  };

  const handleNextCard = async () => {
    setFeedbackState(null);
    setAiExplanation(null); // Reset
    if (currentIndex < gameList.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      if (!isReviewMode && user) {
         await updateDoc(doc(collection(db, 'artifacts', appId, 'users', user.uid, 'vocab_data'), 'progress'), {
          totalLearned: increment(gameList.length)
        });
      }
      setGameState('result');
    }
  };

  const handlePrevCard = () => {
    if (currentIndex > 0) {
      setFeedbackState(null);
      setAiExplanation(null); // Reset
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleOptionClick = async (optionIndex) => {
    if (feedbackState) return; 
    
    const currentWord = gameList[currentIndex];
    const isCorrect = optionIndex === currentWord.correctIndex;
    setFeedbackState({ selected: optionIndex, isCorrect });

    if (isCorrect) {
      setScore(s => s + 1);
      if (isReviewMode && user) {
        await updateDoc(doc(collection(db, 'artifacts', appId, 'users', user.uid, 'vocab_data'), 'progress'), {
          mistakes: arrayRemove(currentWord.id)
        });
      }
      setTimeout(() => {
        handleNextCard();
      }, 800);
    } else {
      if (user) {
        await updateDoc(doc(collection(db, 'artifacts', appId, 'users', user.uid, 'vocab_data'), 'progress'), {
          mistakes: arrayUnion(currentWord.id)
        });
      }
    }
  };

  // --- Views ---

  if (isAddingWord) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <header className="p-4 border-b flex items-center">
          <button onClick={() => setIsAddingWord(false)} className="text-slate-500 mr-4">取消</button>
          <h1 className="text-lg font-bold">添加生词</h1>
        </header>
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">单词 (English)</label>
            <div className="flex gap-2">
              <input 
                value={newWordTerm}
                onChange={e => setNewWordTerm(e.target.value)}
                className="flex-1 p-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                placeholder="例如: Serendipity"
              />
              {/* Standard Search */}
              <button 
                onClick={() => fetchWordData(false)}
                disabled={newWordLoading || !newWordTerm}
                className="bg-slate-100 text-slate-600 p-3 rounded-xl disabled:opacity-50 hover:bg-slate-200"
                title="普通查词"
              >
                <Search className="w-5 h-5" />
              </button>
              {/* ✨ AI Smart Search */}
              <button 
                onClick={() => fetchWordData(true)}
                disabled={newWordLoading || !newWordTerm}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-xl disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
                title="AI 智能填词"
              >
                {newWordLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> 提示：点击紫色按钮使用 AI 自动生成例句和释义
            </p>
          </div>

          {newWordData && (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                   <h3 className="text-xl font-bold text-blue-900">{newWordData.term}</h3>
                   <span className="text-sm font-mono text-blue-500">{newWordData.phonetic}</span>
                </div>
                <p className="text-blue-700 text-sm italic">"{newWordData.sentence}"</p>
                {newWordData.sentenceTrans && <p className="text-blue-500 text-xs mt-1">{newWordData.sentenceTrans}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">中文释义 (必填)</label>
                <input 
                  value={manualTranslation}
                  onChange={e => setManualTranslation(e.target.value)}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-green-500 outline-none"
                  placeholder="例如: n. 机缘巧合"
                />
              </div>

              <button 
                onClick={saveCustomWord}
                disabled={!manualTranslation.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 mt-8"
              >
                <Save className="w-5 h-5" />
                <span>保存到生词本</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const renderLibrary = () => (
    <div className="flex-1 overflow-y-auto p-4 pb-24 bg-slate-50">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">我的词库</h2>
        <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-slate-500 shadow-sm border border-slate-200">
          {customWords.length} 词
        </span>
      </div>

      {customWords.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Library className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p>还没有添加生词</p>
          <button 
            onClick={() => setIsAddingWord(true)}
            className="mt-4 text-blue-600 font-bold text-sm"
          >
            立即添加第一个
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {customWords.map(word => (
            <div key={word.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center group">
              <div>
                <div className="font-bold text-slate-800">{word.term}</div>
                <div className="text-sm text-slate-500">{word.translation}</div>
              </div>
              <button 
                onClick={() => deleteCustomWord(word.id)}
                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <button 
        onClick={() => setIsAddingWord(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 rounded-full shadow-xl shadow-blue-200 flex items-center justify-center text-white hover:bg-blue-700 active:scale-95 transition-all z-20"
      >
        <Plus className="w-8 h-8" />
      </button>
    </div>
  );

  const renderHome = () => (
    <div className="flex-1 overflow-y-auto p-6 pb-24 bg-white">
       <div className="text-center space-y-2 mb-8 mt-4">
          <div className="bg-blue-50 w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-sm">
            <Layers className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">VocabSlash 3.2</h1>
          <p className="text-slate-500 text-sm">✨ 现已集成 Gemini AI 助教</p>
        </div>

        {userData.mistakes.length > 0 && (
            <button
            onClick={() => startGame('review')}
            className="w-full mb-6 p-4 bg-orange-50 border-2 border-orange-200 rounded-xl flex items-center justify-between group hover:bg-orange-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg group-hover:bg-white transition-colors">
                  <BookOpen className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-orange-800">错题复习</div>
                  <div className="text-xs text-orange-600">待消灭: {userData.mistakes.length} 词</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-orange-400" />
            </button>
        )}

        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">每次挑战词数</h3>
            <span className="text-sm font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">{sessionLimit}</span>
          </div>
          <input 
            type="range" 
            min="5" 
            max="50" 
            step="5"
            value={sessionLimit} 
            onChange={(e) => setSessionLimit(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>5</span>
            <span>25</span>
            <span>50</span>
          </div>
        </div>

        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">选择难度</h3>
        <div className="space-y-3 mb-8">
          {[
            { id: 'cet4', label: '英语四级 (CET-4)', desc: '核心 4000 词' },
            { id: 'cet6', label: '英语六级 (CET-6)', desc: '进阶 6000 词' }
          ].map((diff) => (
            <button
              key={diff.id}
              onClick={() => setSelectedDifficulty(diff.id)}
              className={`w-full p-4 rounded-xl border-2 text-left relative transition-all ${
                selectedDifficulty === diff.id 
                  ? 'border-slate-800 bg-slate-50 ring-1 ring-slate-200' 
                  : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-800">{diff.label}</div>
                  <div className="text-xs text-slate-500">{diff.desc}</div>
                </div>
                {selectedDifficulty === diff.id && <CheckCircle className="w-5 h-5 text-slate-800" />}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => startGame('normal')}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-8 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <span>开始挑战</span>
          <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
        </button>
    </div>
  );

  const renderPlaying = () => {
    const currentWord = gameList[currentIndex];
    if (!currentWord) return <div className="p-8 text-center">Loading...</div>;
    const progress = ((currentIndex) / gameList.length) * 100;
    
    // Show Nav Buttons and AI Help ONLY if answered (feedbackState not null)
    const hasAnswered = feedbackState !== null;

    return (
      <div className="h-full flex flex-col bg-white">
        <div className="h-1.5 bg-slate-100">
          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        
        <div className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full relative overflow-y-auto">
           <div className="flex justify-between items-center mb-6">
             <span className="text-xs font-bold text-slate-400 uppercase">
               {isReviewMode ? 'REVIEW' : (currentWord.level === 'custom' ? 'CUSTOM' : currentWord.level.toUpperCase())}
             </span>
             <span className="text-xs font-bold text-slate-400">{currentIndex + 1} / {gameList.length}</span>
           </div>

           <div className="flex-1 flex flex-col items-center justify-center min-h-[160px] mb-4">
             <h2 className="text-4xl font-extrabold text-slate-900 mb-3 text-center">{currentWord.term}</h2>
             
             <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-sm text-slate-600 mb-6">
               <Volume2 className="w-4 h-4" />
               <span className="font-mono">{currentWord.phonetic || '/.../'}</span>
             </div>

             <div className={`transition-all duration-300 w-full text-center space-y-2 ${feedbackState ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 invisible'}`}>
                <div className="text-xl font-bold text-blue-600">{currentWord.translation}</div>
                <p className="text-slate-500 italic text-sm">"{currentWord.sentence}"</p>
                {/* ✨ AI Help Button */}
                {!aiExplanation && (
                  <button 
                    onClick={() => getAiExplanation(currentWord.term)}
                    disabled={aiLoading}
                    className="mt-2 text-purple-600 text-xs font-bold flex items-center justify-center gap-1 mx-auto hover:bg-purple-50 px-2 py-1 rounded transition-colors"
                  >
                    {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {aiLoading ? 'AI 思考中...' : 'AI 深度解析 (助记/词源)'}
                  </button>
                )}
             </div>

             {/* ✨ AI Content Area */}
             {aiExplanation && (
               <div className="mt-4 bg-purple-50 p-4 rounded-xl text-left w-full text-sm text-purple-900 border border-purple-100 animate-in fade-in zoom-in slide-in-from-bottom-2">
                 <div className="flex items-center gap-2 mb-2 font-bold text-purple-700">
                   <BrainCircuit className="w-4 h-4" /> AI 学习助手
                 </div>
                 <div className="whitespace-pre-wrap leading-relaxed opacity-90">{aiExplanation}</div>
               </div>
             )}
           </div>

           <div className="space-y-3 mb-20">
             {currentWord.options.map((opt, idx) => {
               let status = 'default';
               if (feedbackState) {
                 if (feedbackState.isCorrect && idx === feedbackState.selected) status = 'correct';
                 else if (!feedbackState.isCorrect && idx === feedbackState.selected) status = 'wrong';
                 else if (!feedbackState.isCorrect && idx === currentWord.correctIndex) status = 'correct'; 
               }
               return (
                 <OptionCard 
                    key={idx} 
                    text={opt} 
                    status={status}
                    disabled={feedbackState !== null}
                    onClick={() => handleOptionClick(idx)}
                 />
               );
             })}
           </div>

           {/* Navigation Controls for Wrong Answers OR if user wants to pause */}
           {hasAnswered && !feedbackState.isCorrect && (
             <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 flex gap-4 animate-in slide-in-from-bottom-2 z-10">
               <button 
                 onClick={handlePrevCard}
                 disabled={currentIndex === 0}
                 className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
               >
                 <ChevronLeft className="w-4 h-4" /> 上一题
               </button>
               <button 
                 onClick={handleNextCard}
                 className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2"
               >
                 下一题 <ChevronRight className="w-4 h-4" />
               </button>
             </div>
           )}
        </div>
      </div>
    );
  };

  const renderResult = () => (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-white text-center">
      <div className="bg-green-100 p-6 rounded-full mb-6">
        <Trophy className="w-12 h-12 text-green-600" />
      </div>
      <h2 className="text-3xl font-bold text-slate-900 mb-2">完成挑战!</h2>
      <p className="text-slate-500 mb-8">本次正确率 {Math.round((score/gameList.length)*100)}%</p>
      
      <button 
        onClick={() => setGameState('start')}
        className="w-full max-w-xs bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg"
      >
        <RefreshCw className="w-5 h-5 inline-block mr-2" />
        返回主页
      </button>
    </div>
  );

  if (gameState === 'playing') return renderPlaying();
  if (gameState === 'result') return renderResult();

  return (
    <div className="h-screen bg-slate-100 flex justify-center font-sans text-slate-900">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col relative overflow-hidden">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'library' && renderLibrary()}

        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around p-2 pb-4 z-10">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Zap className={`w-6 h-6 ${activeTab === 'home' ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-bold mt-1">挑战</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('library')}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${activeTab === 'library' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Library className={`w-6 h-6 ${activeTab === 'library' ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-bold mt-1">词库</span>
          </button>
        </div>
      </div>
    </div>
  );
}
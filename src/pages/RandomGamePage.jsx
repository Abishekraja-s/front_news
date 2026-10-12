import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FeatureIcon } from '../features/FeatureIcons';

const GAMES = [
  {
    id: 'memory',
    title: 'Memory Match',
    titleTamil: 'நினைவு விளையாட்டு',
    emoji: '🧠',
    chip: 'bg-violet-600 text-white shadow-violet-200',
    idle: 'bg-violet-50 text-violet-800 ring-violet-200',
  },
  {
    id: 'tictactoe',
    title: 'Tic Tac Toe',
    titleTamil: 'எக்ஸ் ஓ',
    emoji: '⭕',
    chip: 'bg-cyan-600 text-white shadow-cyan-200',
    idle: 'bg-cyan-50 text-cyan-800 ring-cyan-200',
  },
  {
    id: 'scramble',
    title: 'Word Scramble',
    titleTamil: 'சொல் புதிர்',
    emoji: '🔤',
    chip: 'bg-amber-500 text-white shadow-amber-200',
    idle: 'bg-amber-50 text-amber-900 ring-amber-200',
  },
];

const PAIRS = [
  { id: 'rain', emoji: '🌧️', label: 'மழை', face: 'from-sky-400 to-blue-600' },
  { id: 'cricket', emoji: '🏏', label: 'கிரிக்கெட்', face: 'from-emerald-400 to-teal-600' },
  { id: 'cinema', emoji: '🎬', label: 'சினிமா', face: 'from-fuchsia-400 to-pink-600' },
  { id: 'metro', emoji: '🚇', label: 'மெட்ரோ', face: 'from-indigo-400 to-violet-600' },
  { id: 'gold', emoji: '🥇', label: 'தங்கம்', face: 'from-amber-300 to-orange-500' },
  { id: 'vote', emoji: '🗳️', label: 'தேர்தல்', face: 'from-rose-400 to-red-600' },
];

const WORDS = [
  { word: 'CHENNAI', hint: 'Capital of Tamil Nadu' },
  { word: 'METRO', hint: 'City rail' },
  { word: 'GOLD', hint: 'Precious metal' },
  { word: 'INDIA', hint: 'Our country' },
  { word: 'NEWS', hint: 'What you read here' },
  { word: 'TAMIL', hint: 'Language' },
  { word: 'NIFTY', hint: 'Stock index' },
  { word: 'MONSOON', hint: 'Rainy season' },
];

const TILE_COLORS = [
  'bg-rose-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-pink-500',
  'bg-orange-500',
  'bg-teal-500',
];

const shuffle = (arr) => {
  const next = [...arr];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const pickGame = () => GAMES[Math.floor(Math.random() * GAMES.length)].id;

const MemoryGame = () => {
  const [cards, setCards] = useState([]);
  const [open, setOpen] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [lock, setLock] = useState(false);

  const deal = () => {
    const deck = shuffle(
      PAIRS.flatMap((p) => [
        { uid: `${p.id}-a`, pair: p.id, ...p },
        { uid: `${p.id}-b`, pair: p.id, ...p },
      ])
    );
    setCards(deck);
    setOpen([]);
    setMatched([]);
    setMoves(0);
    setLock(false);
  };

  useEffect(() => {
    deal();
  }, []);

  const won = matched.length === PAIRS.length;

  const flip = (uid) => {
    if (lock || won) return;
    const card = cards.find((c) => c.uid === uid);
    if (!card || open.includes(uid) || matched.includes(card.pair)) return;
    const next = [...open, uid];
    setOpen(next);
    if (next.length < 2) return;
    setMoves((m) => m + 1);
    const [a, b] = next.map((id) => cards.find((c) => c.uid === id));
    if (a.pair === b.pair) {
      setMatched((m) => [...m, a.pair]);
      setOpen([]);
      return;
    }
    setLock(true);
    setTimeout(() => {
      setOpen([]);
      setLock(false);
    }, 700);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 text-violet-800 px-3 py-1 text-xs font-bold">
            Moves {moves}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold">
            {matched.length}/{PAIRS.length} pairs
          </span>
        </div>
        <button
          type="button"
          className="rounded-full bg-violet-600 text-white text-xs font-bold px-4 py-2 shadow-md shadow-violet-200 hover:bg-violet-500"
          onClick={deal}
        >
          New round
        </button>
      </div>
      <div className="h-1.5 rounded-full bg-violet-100 mb-5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-emerald-400 transition-all"
          style={{ width: `${(matched.length / PAIRS.length) * 100}%` }}
        />
      </div>
      {won && (
        <p className="mb-4 text-sm font-bold text-emerald-800 bg-emerald-100 ring-1 ring-emerald-200 rounded-2xl px-4 py-3">
          Super! All pairs matched in {moves} moves.
        </p>
      )}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 w-full max-w-2xl mx-auto">
        {cards.map((card) => {
          const show = open.includes(card.uid) || matched.includes(card.pair);
          const done = matched.includes(card.pair);
          return (
            <button
              key={card.uid}
              type="button"
              onClick={() => flip(card.uid)}
              className={`relative h-20 sm:h-28 rounded-2xl overflow-hidden shadow-md transition-transform hover:-translate-y-0.5 ${
                show ? `bg-gradient-to-br ${card.face} text-white` : 'bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 text-white'
              } ${done ? 'ring-2 ring-white scale-[0.98] opacity-95' : ''}`}
            >
              {show ? (
                <span className="flex flex-col items-center justify-center h-full gap-0.5 px-1">
                  <span className="text-2xl sm:text-3xl drop-shadow">{card.emoji}</span>
                  <span className="text-[10px] sm:text-[11px] font-tamil leading-relaxed font-semibold">{card.label}</span>
                </span>
              ) : (
                <span className="flex flex-col items-center justify-center h-full">
                  <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg font-black">?</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const winnerOf = (board) => {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  if (board.every(Boolean)) return 'draw';
  return null;
};

const cpuMove = (board) => {
  const empty = board.map((v, i) => (v ? null : i)).filter((i) => i != null);
  for (const mark of ['O', 'X']) {
    for (const i of empty) {
      const next = [...board];
      next[i] = mark;
      if (winnerOf(next) === mark) return i;
    }
  }
  if (empty.includes(4)) return 4;
  return empty[Math.floor(Math.random() * empty.length)];
};

const TicTacToe = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState('X');
  const result = winnerOf(board);

  const reset = () => {
    setBoard(Array(9).fill(null));
    setTurn('X');
  };

  useEffect(() => {
    if (turn !== 'O' || result) return;
    const t = setTimeout(() => {
      setBoard((prev) => {
        if (winnerOf(prev)) return prev;
        const i = cpuMove(prev);
        if (i == null) return prev;
        const next = [...prev];
        next[i] = 'O';
        return next;
      });
      setTurn('X');
    }, 380);
    return () => clearTimeout(t);
  }, [turn, result]);

  const play = (i) => {
    if (result || turn !== 'X' || board[i]) return;
    const next = [...board];
    next[i] = 'X';
    setBoard(next);
    setTurn('O');
  };

  const status =
    result === 'X'
      ? { text: 'You win!', cls: 'bg-emerald-100 text-emerald-800' }
      : result === 'O'
        ? { text: 'Computer wins', cls: 'bg-rose-100 text-rose-800' }
        : result === 'draw'
          ? { text: 'Draw', cls: 'bg-amber-100 text-amber-800' }
          : turn === 'X'
            ? { text: 'Your turn — X', cls: 'bg-pink-100 text-pink-800' }
            : { text: 'Computer thinking…', cls: 'bg-cyan-100 text-cyan-800' };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${status.cls}`}>{status.text}</span>
        <button
          type="button"
          className="rounded-full bg-cyan-600 text-white text-xs font-bold px-4 py-2 shadow-md shadow-cyan-200 hover:bg-cyan-500"
          onClick={reset}
        >
          New game
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto p-3 rounded-[1.75rem] bg-gradient-to-br from-cyan-500 via-sky-500 to-indigo-500 shadow-lg">
        {board.map((cell, i) => (
          <button
            key={i}
            type="button"
            onClick={() => play(i)}
            className="aspect-square rounded-2xl bg-white/95 text-4xl font-black shadow-inner hover:bg-white"
          >
            {cell === 'X' && <span className="text-pink-500">✕</span>}
            {cell === 'O' && <span className="text-cyan-500">○</span>}
          </button>
        ))}
      </div>
      <div className="flex justify-center gap-4 mt-4 text-xs font-bold">
        <span className="text-pink-600">You = ✕</span>
        <span className="text-cyan-600">CPU = ○</span>
      </div>
    </div>
  );
};

const WordScramble = () => {
  const [round, setRound] = useState(() => WORDS[Math.floor(Math.random() * WORDS.length)]);
  const [guess, setGuess] = useState('');
  const [status, setStatus] = useState('');

  const letters = useMemo(() => {
    let s = round.word;
    let out = s;
    let guard = 0;
    while (out === s && guard < 12) {
      out = shuffle(s.split('')).join('');
      guard += 1;
    }
    return out.split('');
  }, [round]);

  const next = () => {
    setRound(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setGuess('');
    setStatus('');
  };

  const check = (e) => {
    e.preventDefault();
    if (guess.trim().toUpperCase() === round.word) setStatus('correct');
    else setStatus('wrong');
  };

  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-widest text-amber-700">Unscramble the word</p>
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {letters.map((ch, i) => (
          <span
            key={`${ch}-${i}`}
            className={`w-11 h-12 sm:w-12 sm:h-14 rounded-2xl ${TILE_COLORS[i % TILE_COLORS.length]} text-white text-xl sm:text-2xl font-black flex items-center justify-center shadow-md`}
          >
            {ch}
          </span>
        ))}
      </div>
      <p className="mt-4 inline-flex rounded-full bg-amber-100 text-amber-900 text-xs font-semibold px-3 py-1.5">
        Hint: {round.hint}
      </p>
      <form onSubmit={check} className="mt-5 flex flex-col sm:flex-row gap-2">
        <input
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          className="flex-1 rounded-2xl border-2 border-amber-200 bg-white px-4 py-3 text-sm uppercase tracking-widest font-bold text-slate-800 focus:outline-none focus:border-amber-400"
          placeholder="Type the word"
          autoComplete="off"
        />
        <button type="submit" className="rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-3 shadow-md shadow-amber-200">
          Check
        </button>
        <button
          type="button"
          className="rounded-2xl bg-orange-100 text-orange-800 font-bold px-4 py-3"
          onClick={next}
        >
          Next word
        </button>
      </form>
      {status === 'correct' && (
        <p className="mt-4 text-sm font-bold text-emerald-800 bg-emerald-100 rounded-2xl px-4 py-3">
          Correct — {round.word}
        </p>
      )}
      {status === 'wrong' && (
        <p className="mt-4 text-sm font-bold text-rose-800 bg-rose-100 rounded-2xl px-4 py-3">Try again</p>
      )}
    </div>
  );
};

const RandomGamePage = () => {
  const [game, setGame] = useState(pickGame);
  const current = GAMES.find((g) => g.id === game) || GAMES[0];

  return (
    <>
      <Helmet>
        <title>Random Game | The Great India News</title>
      </Helmet>
      <div className="relative overflow-hidden bg-gradient-to-br from-fuchsia-600 via-violet-600 to-sky-500 text-white">
        <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-amber-300/30 blur-2xl" />
        <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-pink-400/30 blur-2xl" />
        <div className="container-news py-7 sm:py-10 relative">
          <Link to="/explore" className="text-xs font-semibold text-white/85 hover:text-white">
            ← Explore All Features
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <span className="w-14 h-14 rounded-3xl bg-white text-pink-600 flex items-center justify-center shadow-lg text-2xl">
              <FeatureIcon name="game" className="w-7 h-7" />
            </span>
            <div>
              <h1 className="text-3xl sm:text-4xl font-headline font-bold">Random Game</h1>
              <p className="text-base font-tamil leading-relaxed mt-1 text-white/95">விளையாட்டு</p>
            </div>
          </div>
          <p className="text-sm text-white/85 mt-3 max-w-xl">
            Colourful mini-games — match pairs, play XO, or unscramble a word.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-b from-violet-50 via-white to-amber-50 min-h-[50vh]">
        <div className="container-news py-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {GAMES.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGame(g.id)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold ring-1 shadow-sm ${
                  game === g.id ? `${g.chip} ring-transparent` : `${g.idle}`
                }`}
              >
                <span>{g.emoji}</span>
                {g.title}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setGame(pickGame())}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-md"
            >
              🎲 Shuffle
            </button>
          </div>

          <div className="rounded-[1.75rem] bg-white p-5 sm:p-7 shadow-lg ring-1 ring-violet-100 overflow-visible">
            <div className="flex items-start gap-3 mb-5">
              <span className="text-2xl">{current.emoji}</span>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{current.title}</h2>
                <p className="text-sm text-slate-600 font-tamil leading-relaxed mt-0.5">{current.titleTamil}</p>
              </div>
            </div>
            {game === 'memory' && <MemoryGame />}
            {game === 'tictactoe' && <TicTacToe />}
            {game === 'scramble' && <WordScramble />}
          </div>
        </div>
      </div>
    </>
  );
};

export default RandomGamePage;

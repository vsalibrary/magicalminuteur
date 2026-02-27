import { useState, useCallback, useMemo, useEffect } from 'react'
import { RippleButton } from './ui/RippleButton'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { ScoreHistory } from './ScoreHistory'

const ANIMALS = ['Eagles', 'Tigers', 'Pandas', 'Lions', 'Foxes', 'Wolves', 'Hawks', 'Bears', 'Owls', 'Sharks']
const FRUITS = ['Mangoes', 'Kiwis', 'Lychees', 'Papayas', 'Loquats', 'Jackfruits', 'Rambutans', 'Durians', 'Longans', 'Starfruits']

// 12 regular rounds + 4 bonus rounds.
// primary alternates: odd rounds = Team A, even rounds = Team B.
const ROUNDS = [
  { id: 'r1',  label: 'Round 1',  primary: 'a' },
  { id: 'r2',  label: 'Round 2',  primary: 'b' },
  { id: 'r3',  label: 'Round 3',  primary: 'a' },
  { id: 'r4',  label: 'Round 4',  primary: 'b' },
  { id: 'r5',  label: 'Round 5',  primary: 'a' },
  { id: 'r6',  label: 'Round 6',  primary: 'b' },
  { id: 'r7',  label: 'Round 7',  primary: 'a' },
  { id: 'r8',  label: 'Round 8',  primary: 'b' },
  { id: 'r9',  label: 'Round 9',  primary: 'a' },
  { id: 'r10', label: 'Round 10', primary: 'b' },
  { id: 'r11', label: 'Round 11', primary: 'a' },
  { id: 'r12', label: 'Round 12', primary: 'b' },
  { id: 'b1',  label: 'Bonus 1',  primary: 'a', bonus: true },
  { id: 'b2',  label: 'Bonus 2',  primary: 'b', bonus: true },
  { id: 'b3',  label: 'Bonus 3',  primary: 'a', bonus: true },
  { id: 'b4',  label: 'Bonus 4',  primary: 'b', bonus: true },
]

// cell: { primary: null|2|3|'wrong', passover: null|2|'wrong' }
// primary  = primary team's result for this round
// passover = the OTHER team's passover result (only used when primary === 'wrong')
function initCells() {
  const cells = {}
  ROUNDS.forEach(r => { cells[r.id] = { primary: null, passover: null } })
  return cells
}

function totalScores(cells) {
  let scoreA = 0, scoreB = 0
  ROUNDS.forEach(round => {
    const { primary, passover } = cells[round.id]
    if (round.primary === 'a') {
      if (primary === 2 || primary === 3) scoreA += primary
      if (primary === 'wrong' && passover === 2) scoreB += 2
    } else {
      if (primary === 2 || primary === 3) scoreB += primary
      if (primary === 'wrong' && passover === 2) scoreA += 2
    }
  })
  return { scoreA, scoreB }
}

// Primary attempt: +3 (author+title), +2 (title only), ✗ (wrong → opens passover)
function PrimaryCell({ value, onChange }) {
  return (
    <div className="flex gap-0.5 justify-center">
      <button
        onClick={() => onChange(value === 3 ? null : 3)}
        className={`score-btn ${value === 3 ? 'score-btn-active' : ''}`}
      >+3</button>
      <button
        onClick={() => onChange(value === 2 ? null : 2)}
        className={`score-btn ${value === 2 ? 'score-btn-active' : ''}`}
      >+2</button>
      <button
        onClick={() => onChange(value === 'wrong' ? null : 'wrong')}
        className={`score-btn ${value === 'wrong' ? 'score-btn-wrong' : ''}`}
      >✗</button>
    </div>
  )
}

// Passover: only unlocked when primary team got it wrong.
// team: 'a'|'b' — which team is RECEIVING the passover points (styled in their colour).
function PassoverCell({ value, enabled, onChange, team }) {
  const activeClass = team === 'a' ? 'score-btn-active' : 'score-btn-warn'
  const locked = !enabled && value === null
  return (
    <div className={`flex gap-0.5 justify-center ${locked ? 'opacity-20' : ''}`}>
      <button
        onClick={() => enabled ? onChange(value === 2 ? null : 2) : undefined}
        disabled={!enabled}
        className={`score-btn ${value === 2 ? activeClass : ''} ${!enabled ? 'cursor-default' : ''}`}
      >+2</button>
      <button
        onClick={() => enabled ? onChange(value === 'wrong' ? null : 'wrong') : undefined}
        disabled={!enabled}
        className={`score-btn ${value === 'wrong' ? 'score-btn-wrong' : ''} ${!enabled ? 'cursor-default' : ''}`}
      >✗</button>
    </div>
  )
}

const PAGE_SIZE = 4
const TOTAL_PAGES = Math.ceil(ROUNDS.length / PAGE_SIZE)

export function Scoresheet({ user, games, saveGame }) {
  const [teamA, setTeamA] = useState('Team A')
  const [teamB, setTeamB] = useState('Team B')
  const [cells, setCells] = useState(initCells)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [saveToast, setSaveToast] = useState(false)
  const [page, setPage] = useState(0)

  const { scoreA, scoreB } = totalScores(cells)

  const activeRound = useMemo(() => {
    for (const round of ROUNDS) {
      const { primary, passover } = cells[round.id]
      if (primary === null || (primary === 'wrong' && passover === null)) return round.id
    }
    return null
  }, [cells])

  useEffect(() => {
    if (!activeRound) return
    const idx = ROUNDS.findIndex(r => r.id === activeRound)
    const targetPage = Math.floor(idx / PAGE_SIZE)
    setPage(targetPage)
  }, [activeRound])

  const updateRound = useCallback((roundId, field, value) => {
    setCells(prev => {
      const updated = { ...prev[roundId], [field]: value }
      // Changing primary away from 'wrong' clears any passover already recorded
      if (field === 'primary' && value !== 'wrong') {
        updated.passover = null
      }
      return { ...prev, [roundId]: updated }
    })
  }, [])

  const handleReset = () => {
    setCells(initCells())
    setShowResetConfirm(false)
  }

  const handleSave = async () => {
    await saveGame({ teamA, teamB, scoreA, scoreB })
    setSaveToast(true)
    setTimeout(() => setSaveToast(false), 2500)
  }

  const randomName = (arr) => arr[Math.floor(Math.random() * arr.length)]

  const renderRoundRow = (round) => {
    const { primary, passover } = cells[round.id]
    const isActive = activeRound === round.id
    const isComplete = (primary === 2 || primary === 3) || (primary === 'wrong' && passover !== null)
    const isPrimaryA = round.primary === 'a'
    const passoverAvailable = primary === 'wrong'

    // Determine which team's cell to highlight as "currently answering"
    // Flow is always: primary team first, then passover team if primary got it wrong
    let aHighlight = false
    let bHighlight = false
    if (isActive) {
      if (primary === null) {
        // Primary team is up
        if (isPrimaryA) aHighlight = true
        else bHighlight = true
      } else if (primary === 'wrong' && passover === null) {
        // Passover team is up (B gets passover in A-primary rounds, A gets it in B-primary rounds)
        if (isPrimaryA) bHighlight = true
        else aHighlight = true
      }
    }

    return (
      <tr
        key={round.id}
        className="border-b border-subtle transition-colors"
        style={isActive ? { backgroundColor: 'rgba(91,79,232,0.05)' } : undefined}
      >
        {/* Round label + active indicator */}
        <td className="py-1.5 pr-1 text-xs whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0 transition-all"
              style={
                isComplete
                  ? { backgroundColor: '#5b4fe8', border: 'none' }
                  : isActive
                    ? { backgroundColor: 'transparent', border: '2px solid #5b4fe8' }
                    : { backgroundColor: 'transparent', border: '1px solid var(--color-border)' }
              }
            />
            <span className="text-muted font-medium">{round.label}</span>
            {/* Badge showing which team is primary this round */}
            <span className={`text-[9px] font-bold px-1 py-0.5 rounded leading-none ${isPrimaryA ? 'text-accent bg-accent/15' : 'text-warn bg-warn/15'}`}>
              {isPrimaryA ? 'A' : 'B'}
            </span>
          </div>
        </td>

        {/* Team A cell */}
        <td
          className="py-1 px-0.5 transition-colors rounded-sm"
          style={aHighlight ? { backgroundColor: 'rgba(91,79,232,0.14)' } : undefined}
        >
          {isPrimaryA ? (
            <PrimaryCell
              value={primary}
              onChange={v => updateRound(round.id, 'primary', v)}
            />
          ) : (
            <PassoverCell
              value={passover}
              enabled={passoverAvailable}
              onChange={v => updateRound(round.id, 'passover', v)}
              team="a"
            />
          )}
        </td>

        {/* Team B cell */}
        <td
          className="py-1 px-0.5 transition-colors rounded-sm"
          style={bHighlight ? { backgroundColor: 'rgba(251,191,36,0.14)' } : undefined}
        >
          {!isPrimaryA ? (
            <PrimaryCell
              value={primary}
              onChange={v => updateRound(round.id, 'primary', v)}
            />
          ) : (
            <PassoverCell
              value={passover}
              enabled={passoverAvailable}
              onChange={v => updateRound(round.id, 'passover', v)}
              team="b"
            />
          )}
        </td>
      </tr>
    )
  }

  return (
    <div className="card p-4 md:p-6 flex flex-col gap-5">
      <h2 className="section-label">Scoresheet</h2>

      {/* Team name inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted uppercase tracking-wide">Team A</label>
          <div className="flex gap-1">
            <input
              value={teamA}
              onChange={(e) => setTeamA(e.target.value)}
              className="flex-1 bg-subtle border border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
              style={{ color: 'var(--color-text)' }}
            />
            <button onClick={() => setTeamA(randomName(ANIMALS))} className="btn btn-ghost text-xs px-2" title="Random name">↺</button>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted uppercase tracking-wide">Team B</label>
          <div className="flex gap-1">
            <input
              value={teamB}
              onChange={(e) => setTeamB(e.target.value)}
              className="flex-1 bg-subtle border border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
              style={{ color: 'var(--color-text)' }}
            />
            <button onClick={() => setTeamB(randomName(FRUITS))} className="btn btn-ghost text-xs px-2" title="Random name">↺</button>
          </div>
        </div>
      </div>

      {/* Score totals */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <div className="text-xs text-muted mb-1 truncate">{teamA}</div>
          <div className="text-4xl font-display font-bold text-accent">{scoreA}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xs text-muted mb-1 truncate">{teamB}</div>
          <div className="text-4xl font-display font-bold text-warn">{scoreB}</div>
        </div>
      </div>

      {/* Legend */}
      <div className="text-[10px] text-muted flex flex-wrap gap-x-4 gap-y-0.5">
        <span><span className="text-accent font-semibold">+3</span> author + title</span>
        <span><span className="text-accent font-semibold">+2</span> title only</span>
        <span><span className="text-danger font-semibold">✗</span> wrong → passover</span>
        <span><span className="text-success font-semibold">+2</span> passover correct</span>
      </div>

      {/* Score table */}
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-sm min-w-[340px]">
          <thead>
            <tr className="border-b border-subtle">
              <th className="text-left py-2 pr-2 text-muted font-medium text-xs">Round</th>
              <th className="py-2 text-accent text-xs font-medium truncate max-w-[100px]">{teamA}</th>
              <th className="py-2 text-warn text-xs font-medium truncate max-w-[100px]">{teamB}</th>
            </tr>
          </thead>
          <tbody>
            {ROUNDS.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE).map(renderRoundRow)}
          </tbody>
        </table>
      </div>

      {/* Page navigation */}
      <div className="flex items-center justify-between">
        <RippleButton
          className="btn btn-ghost text-sm"
          onClick={() => setPage(p => p - 1)}
          disabled={page === 0}
        >← Prev</RippleButton>
        <span className="text-xs text-muted">
          {page < TOTAL_PAGES - 1 ? `Rounds ${page * PAGE_SIZE + 1}–${page * PAGE_SIZE + PAGE_SIZE}` : 'Bonus Rounds'}
        </span>
        <RippleButton
          className="btn btn-ghost text-sm"
          onClick={() => setPage(p => p + 1)}
          disabled={page === TOTAL_PAGES - 1}
        >Next →</RippleButton>
      </div>

      {/* Actions */}
      <div className="flex gap-3 items-center justify-between">
        <RippleButton className="btn btn-ghost text-sm" onClick={() => setShowResetConfirm(true)}>
          Reset Scores
        </RippleButton>
        {user && (
          <div className="flex items-center gap-2">
            {saveToast && <span className="text-success text-sm animate-pulse">Saved!</span>}
            <RippleButton className="btn btn-primary text-sm" onClick={handleSave}>
              Save Game
            </RippleButton>
          </div>
        )}
      </div>

      {user && <ScoreHistory games={games} />}

      {showResetConfirm && (
        <ConfirmDialog
          message="Reset all scores? This cannot be undone."
          onConfirm={handleReset}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  )
}

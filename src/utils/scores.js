export const ROUNDS = [
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

export function totalScores(cells) {
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

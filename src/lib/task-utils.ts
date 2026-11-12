import type { TaskItem } from '@/types/coydash'

export interface UserIdentity {
  id?: string | null
  name?: string | null
  email?: string | null
}

/**
 * Verifica se o usuário informado está marcado como responsável na tarefa.
 * Suporta checagem em `task.assignees` (array de strings com nomes/emails/IDs)
 * e `task.assignee_name` (string separada por vírgulas).
 */
export function isTaskAssignedToUser(
  task: TaskItem,
  user?: UserIdentity | null
): boolean {
  if (!user) return false

  const userName = (user.name || '').trim().toLowerCase()
  const userEmail = (user.email || '').trim().toLowerCase()
  const userId = (user.id || '').trim().toLowerCase()

  // Se não houver dados do usuário, não há como atribuir
  if (!userName && !userEmail && !userId) return false

  const matches = (raw?: string | null) => {
    if (!raw) return false
    const str = raw.trim().toLowerCase()
    if (!str) return false

    // Match por e-mail exato ou substring de e-mail
    if (userEmail && (str === userEmail || str.includes(userEmail) || userEmail.includes(str))) {
      return true
    }

    // Match por ID exato
    if (userId && str === userId) {
      return true
    }

    // Match por nome
    if (userName) {
      if (str === userName) return true
      if (str.includes(userName) || userName.includes(str)) return true

      // Checagem de primeiro e último nome
      const uParts = userName.split(/\s+/).filter(Boolean)
      const sParts = str.split(/\s+/).filter(Boolean)
      if (uParts.length > 0 && sParts.length > 0) {
        if (uParts[0] === sParts[0]) {
          // Se qualquer um dos lados for apenas o primeiro nome (ex: "Felipe")
          if (uParts.length === 1 || sParts.length === 1) return true
          // Se ambos tiverem sobrenome, compara o último sobrenome
          if (uParts[uParts.length - 1] === sParts[sParts.length - 1]) return true
        }
      }
    }

    return false
  }

  // 1. Checa array assignees
  if (Array.isArray(task.assignees) && task.assignees.length > 0) {
    if (task.assignees.some((a) => matches(a))) return true
  }

  // 2. Checa string assignee_name (pode conter múltiplos nomes separados por vírgula)
  if (task.assignee_name) {
    const list = task.assignee_name.split(',').map((s) => s.trim())
    if (list.some((n) => matches(n))) return true
  }

  return false
}

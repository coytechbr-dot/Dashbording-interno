import type { TaskFolderItem, TaskListItem } from '@/types/coydash'

export interface TaskStoreMinimal {
  taskFolders: TaskFolderItem[]
  taskLists: TaskListItem[]
  createTaskFolder: (name: string, icon?: string) => Promise<string | null>
  createTaskList: (folderId: string, name: string, icon?: string) => Promise<string | null>
  refreshFromDatabase?: (orgId?: string) => Promise<void>
}

/**
 * Garante que uma pasta e sua lista correspondente existam no workspace,
 * criando-as caso ainda não tenham sido provisionadas.
 */
export async function ensureFolderAndList(
  store: TaskStoreMinimal,
  folderName: string,
  listName: string,
  folderIcon = 'Folder',
  listIcon = 'CheckSquare'
): Promise<string | null> {
  // 1. Verificar se a lista já existe
  const existingList = store.taskLists.find(
    (l) => l.name.trim().toLowerCase() === listName.trim().toLowerCase()
  )
  if (existingList) {
    return existingList.id
  }

  // 2. Localizar ou criar a pasta correspondente
  let folder = store.taskFolders.find(
    (f) => f.name.trim().toLowerCase() === folderName.trim().toLowerCase()
  )

  let folderId = folder?.id
  if (!folderId) {
    const resId = await store.createTaskFolder(folderName, folderIcon)
    folderId = resId || undefined
  }

  // 3. Fallback: se ainda não encontrou id, pega a primeira pasta existente
  if (!folderId && store.taskFolders.length > 0) {
    folderId = store.taskFolders[0].id
  }

  if (folderId) {
    const newListId = await store.createTaskList(folderId, listName, listIcon)
    if (newListId) {
      return newListId
    }
  }

  // Retorna qualquer lista existente como última salvaguarda
  return store.taskLists[0]?.id || null
}

/**
 * Helper direto para a lista 'Ordens de Serviço' (Projeto 'Clientes - Tarefas')
 */
export async function ensureOrdensDeServicoList(store: TaskStoreMinimal): Promise<string | null> {
  return ensureFolderAndList(store, 'Clientes - Tarefas', 'Ordens de Serviço', 'FolderKanban', 'CheckSquare')
}

/**
 * Helper direto para a lista 'Proposta Comercial' (Projeto 'Leads - Tarefas')
 */
export async function ensurePropostaComercialList(store: TaskStoreMinimal): Promise<string | null> {
  return ensureFolderAndList(store, 'Leads - Tarefas', 'Proposta Comercial', 'Users', 'FileSignature')
}


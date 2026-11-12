'use client'

import { useParams } from 'next/navigation'
import { TasksWorkspaceView } from '@/components/tasks/tasks-workspace-view'

export default function ListaSetorPage() {
  const params = useParams<{ listId: string }>()
  return <TasksWorkspaceView listId={params?.listId} />
}


'use client'

import React, { useState, useMemo, useRef } from 'react'
import {
  Folder,
  Briefcase,
  Scale,
  Megaphone,
  Target,
  DollarSign,
  Code,
  Headphones,
  List,
  FileText,
  Rocket,
  Shield,
  Sparkles,
  Flame,
  CheckSquare,
  Kanban,
  Clock,
  Calendar,
  Users,
  Building,
  Package,
  Compass,
  BarChart3,
  TrendingUp,
  Zap,
  Layers,
  Tag,
  Heart,
  Star,
  Inbox,
  Mail,
  MessageSquare,
  Globe,
  Settings,
  PenTool,
  Camera,
  Video,
  ShoppingBag,
  CreditCard,
  Award,
  ShieldCheck,
  CheckCircle2,
  Bookmark,
  Flag,
  Pin,
  ClipboardList,
  Terminal,
  Cpu,
  Database,
  Server,
  Laptop,
  Smartphone,
  Bot,
  Bug,
  GitBranch,
  MessageCircle,
  Send,
  Share2,
  Radio,
  Bell,
  Palette,
  Music,
  Scissors,
  Wand2,
  Truck,
  Store,
  MapPin,
  Navigation,
  Archive,
  Activity,
  FolderKanban,
  FileSignature,
  FolderPlus,
  FolderOpen,
  FolderArchive,
  FileCheck,
  FileSpreadsheet,
  CheckCheck,
  ListTodo,
  LayoutList,
  ClipboardCheck,
  Users2,
  UserPlus,
  Milestone,
  Search,
  X,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Smile,
  Shapes,
  type LucideIcon,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// ==========================================
// CATÁLOGO DE ÍCONES LUCIDE SUPORTADOS
// ==========================================
export const AVAILABLE_ICONS: Record<string, LucideIcon> = {
  Folder,
  Briefcase,
  Scale,
  Megaphone,
  Target,
  DollarSign,
  Code,
  Headphones,
  List,
  FileText,
  Rocket,
  Shield,
  Sparkles,
  Flame,
  CheckSquare,
  Kanban,
  Clock,
  Calendar,
  Users,
  Building,
  Package,
  Compass,
  BarChart3,
  TrendingUp,
  Zap,
  Layers,
  Tag,
  Heart,
  Star,
  Inbox,
  Mail,
  MessageSquare,
  Globe,
  Settings,
  PenTool,
  Camera,
  Video,
  ShoppingBag,
  CreditCard,
  Award,
  ShieldCheck,
  CheckCircle2,
  Bookmark,
  Flag,
  Pin,
  ClipboardList,
  Terminal,
  Cpu,
  Database,
  Server,
  Laptop,
  Smartphone,
  Bot,
  Bug,
  GitBranch,
  MessageCircle,
  Send,
  Share2,
  Radio,
  Bell,
  Palette,
  Music,
  Scissors,
  Wand2,
  Truck,
  Store,
  MapPin,
  Navigation,
  Archive,
  Activity,
  FolderKanban,
  FileSignature,
  FolderPlus,
  FolderOpen,
  FolderArchive,
  FileCheck,
  FileSpreadsheet,
  CheckCheck,
  ListTodo,
  LayoutList,
  ClipboardCheck,
  Users2,
  UserPlus,
  Milestone,
}

export interface IconDefinition {
  key: string
  label: string
  category: string
  keywords: string[]
}

export const ICON_CATALOG: IconDefinition[] = [
  // Negócios & Projetos
  { key: 'Folder', label: 'Pasta', category: 'Projetos', keywords: ['pasta', 'folder', 'geral', 'projeto', 'arquivo'] },
  { key: 'FolderKanban', label: 'Projetos Kanban', category: 'Projetos', keywords: ['projetos', 'pasta', 'kanban', 'tarefas'] },
  { key: 'FolderPlus', label: 'Nova Pasta', category: 'Projetos', keywords: ['pasta', 'novo', 'adicionar'] },
  { key: 'FolderOpen', label: 'Pasta Aberta', category: 'Projetos', keywords: ['pasta', 'aberta', 'arquivos'] },
  { key: 'Briefcase', label: 'Comercial', category: 'Projetos', keywords: ['comercial', 'trabalho', 'vendas', 'negocios', 'maleta'] },
  { key: 'Scale', label: 'Jurídico', category: 'Projetos', keywords: ['juridico', 'direito', 'balanca', 'leis', 'contratos'] },
  { key: 'Building', label: 'Empresa', category: 'Projetos', keywords: ['empresa', 'predio', 'corporativo', 'cliente'] },
  { key: 'Target', label: 'Metas / Tráfego', category: 'Projetos', keywords: ['alvo', 'meta', 'trafego', 'anuncios', 'ads'] },
  { key: 'DollarSign', label: 'Financeiro', category: 'Projetos', keywords: ['financeiro', 'dinheiro', 'pagamentos', 'receita'] },
  { key: 'Wallet', label: 'Carteira', category: 'Projetos', keywords: ['carteira', 'saldo', 'financeiro'] },
  { key: 'CreditCard', label: 'Cobrança', category: 'Projetos', keywords: ['cartao', 'cobranca', 'faturamento', 'banco'] },
  { key: 'TrendingUp', label: 'Crescimento', category: 'Projetos', keywords: ['crescimento', 'alta', 'vendas', 'grafico', 'scale'] },
  { key: 'BarChart3', label: 'Métricas / Dados', category: 'Projetos', keywords: ['metricas', 'grafico', 'dados', 'analytics', 'relatorio'] },
  { key: 'Award', label: 'Sucesso', category: 'Projetos', keywords: ['premio', 'sucesso', 'conquista', 'qualidade'] },
  { key: 'ShieldCheck', label: 'Conformidade', category: 'Projetos', keywords: ['seguranca', 'auditoria', 'conformidade', 'aprovado'] },

  // Gestão de Tarefas
  { key: 'List', label: 'Lista', category: 'Tarefas', keywords: ['lista', 'tarefas', 'itens', 'to-do'] },
  { key: 'FileSignature', label: 'Proposta / Assinatura', category: 'Tarefas', keywords: ['proposta', 'contrato', 'assinatura', 'comercial', 'leads', 'documento'] },
  { key: 'CheckSquare', label: 'Checklist', category: 'Tarefas', keywords: ['checklist', 'afazeres', 'concluido', 'demandas'] },
  { key: 'CheckCircle2', label: 'Concluído', category: 'Tarefas', keywords: ['check', 'finalizado', 'sucesso', 'feito'] },
  { key: 'CheckCheck', label: 'Duplo Check', category: 'Tarefas', keywords: ['check', 'concluido', 'entregue'] },
  { key: 'Kanban', label: 'Quadro Kanban', category: 'Tarefas', keywords: ['kanban', 'quadro', 'fluxo', 'etapas', 'colunas'] },
  { key: 'Milestone', label: 'Fases / Etapas', category: 'Tarefas', keywords: ['fase', 'etapa', 'marco', 'milestone'] },
  { key: 'Calendar', label: 'Calendário', category: 'Tarefas', keywords: ['calendario', 'agenda', 'prazos', 'datas'] },
  { key: 'Clock', label: 'Horários / Tempo', category: 'Tarefas', keywords: ['relogio', 'tempo', 'horas', 'prazos', 'urgente'] },
  { key: 'Layers', label: 'Camadas', category: 'Tarefas', keywords: ['camadas', 'subtarefas', 'niveis', 'estrutura'] },
  { key: 'FileText', label: 'Documentos', category: 'Tarefas', keywords: ['documento', 'briefing', 'proposta', 'texto'] },
  { key: 'FileCheck', label: 'Documento Validado', category: 'Tarefas', keywords: ['documento', 'aprovado', 'check'] },
  { key: 'ClipboardList', label: 'Demandas', category: 'Tarefas', keywords: ['prancheta', 'demandas', 'chamados', 'requisitos'] },
  { key: 'ListTodo', label: 'Lista de Afazeres', category: 'Tarefas', keywords: ['lista', 'afazeres', 'tarefas'] },
  { key: 'LayoutList', label: 'Visualização Lista', category: 'Tarefas', keywords: ['lista', 'layout', 'itens'] },
  { key: 'Tag', label: 'Etiquetas', category: 'Tarefas', keywords: ['tag', 'etiqueta', 'categoria', 'rotulo'] },
  { key: 'Bookmark', label: 'Marcador', category: 'Tarefas', keywords: ['marcador', 'salvo', 'favorito'] },
  { key: 'Flag', label: 'Prioridade', category: 'Tarefas', keywords: ['bandeira', 'prioridade', 'urgencia'] },
  { key: 'Pin', label: 'Fixado', category: 'Tarefas', keywords: ['fixado', 'alfinete', 'destaque'] },

  // Tecnologia & Inovação
  { key: 'Code', label: 'Desenvolvimento', category: 'Tecnologia', keywords: ['codigo', 'dev', 'programacao', 'tech', 'software'] },
  { key: 'Terminal', label: 'Console / CLI', category: 'Tecnologia', keywords: ['terminal', 'console', 'script', 'automacao'] },
  { key: 'Cpu', label: 'Hardware / Core', category: 'Tecnologia', keywords: ['cpu', 'processador', 'performance', 'tecnologia'] },
  { key: 'Database', label: 'Banco de Dados', category: 'Tecnologia', keywords: ['banco', 'database', 'dados', 'sql', 'storage'] },
  { key: 'Server', label: 'Servidor / Cloud', category: 'Tecnologia', keywords: ['servidor', 'cloud', 'hospedagem', 'infra'] },
  { key: 'Globe', label: 'Web / Site', category: 'Tecnologia', keywords: ['globo', 'site', 'web', 'landing page', 'internet'] },
  { key: 'Bot', label: 'Agente IA', category: 'Tecnologia', keywords: ['robo', 'agente', 'ia', 'inteligencia', 'automacao'] },
  { key: 'Sparkles', label: 'Inteligência Artificial', category: 'Tecnologia', keywords: ['brilho', 'ia', 'ai', 'especial', 'magia'] },
  { key: 'Zap', label: 'Automação / Raio', category: 'Tecnologia', keywords: ['raio', 'velocidade', 'automacao', 'fluxo'] },
  { key: 'Bug', label: 'Correções / Bugs', category: 'Tecnologia', keywords: ['bug', 'correcao', 'erro', 'suporte'] },
  { key: 'GitBranch', label: 'Versões / Ramificação', category: 'Tecnologia', keywords: ['git', 'branch', 'versao', 'fluxo'] },
  { key: 'Smartphone', label: 'Mobile / App', category: 'Tecnologia', keywords: ['celular', 'mobile', 'app', 'aplicativo', 'whatsapp'] },
  { key: 'Laptop', label: 'Computador', category: 'Tecnologia', keywords: ['notebook', 'computador', 'trabalho', 'pc'] },

  // Marketing & Comunicação
  { key: 'Megaphone', label: 'Marketing', category: 'Marketing', keywords: ['marketing', 'anuncios', 'comunicacao', 'megafone', 'campanha'] },
  { key: 'Rocket', label: 'Lançamentos', category: 'Marketing', keywords: ['foguete', 'lancamento', 'onboarding', 'growth'] },
  { key: 'Flame', label: 'Urgente / Hot', category: 'Marketing', keywords: ['fogo', 'urgente', 'quente', 'destaque', 'alta prioridade'] },
  { key: 'Star', label: 'Destaque', category: 'Marketing', keywords: ['estrela', 'favorito', 'destaque', 'nota'] },
  { key: 'Heart', label: 'Engajamento', category: 'Marketing', keywords: ['coracao', 'cliente', 'satisfacao', 'nps'] },
  { key: 'Users', label: 'Equipe / Membros', category: 'Marketing', keywords: ['equipe', 'time', 'pessoas', 'colaboradores'] },
  { key: 'Headphones', label: 'Atendimento / CS', category: 'Marketing', keywords: ['fone', 'suporte', 'atendimento', 'sac', 'ajuda'] },
  { key: 'MessageSquare', label: 'Conversas / Chat', category: 'Marketing', keywords: ['mensagem', 'conversa', 'chat', 'comentarios'] },
  { key: 'MessageCircle', label: 'WhatsApp', category: 'Marketing', keywords: ['whatsapp', 'conversa', 'balao'] },
  { key: 'Mail', label: 'E-mail / News', category: 'Marketing', keywords: ['email', 'correio', 'mensagem', 'newsletter'] },
  { key: 'Bell', label: 'Notificações', category: 'Marketing', keywords: ['sino', 'alerta', 'notificacao', 'aviso'] },
  { key: 'Radio', label: 'Transmissão', category: 'Marketing', keywords: ['radio', 'transmissao', 'live', 'comunicado'] },

  // Criativo & Mídia
  { key: 'Palette', label: 'Design & Cores', category: 'Criativo', keywords: ['paleta', 'design', 'arte', 'cores', 'layout'] },
  { key: 'PenTool', label: 'Criação Visual', category: 'Criativo', keywords: ['caneta', 'vetor', 'ilustracao', 'design'] },
  { key: 'Camera', label: 'Fotografia', category: 'Criativo', keywords: ['camera', 'foto', 'ensaio', 'imagem'] },
  { key: 'Video', label: 'Audiovisual', category: 'Criativo', keywords: ['video', 'reels', 'youtube', 'edicao'] },
  { key: 'Music', label: 'Áudio / Jingles', category: 'Criativo', keywords: ['musica', 'audio', 'som', 'podcast'] },
  { key: 'Wand2', label: 'Mágico / Edição', category: 'Criativo', keywords: ['varinha', 'efeito', 'retoque', 'magica'] },

  // Operações & Logística
  { key: 'Package', label: 'Produtos / Entregas', category: 'Operações', keywords: ['pacote', 'entrega', 'produto', 'caixa'] },
  { key: 'ShoppingBag', label: 'E-commerce', category: 'Operações', keywords: ['sacola', 'loja', 'compras', 'vendas'] },
  { key: 'Store', label: 'Varejo / Loja', category: 'Operações', keywords: ['loja', 'comercio', 'filial'] },
  { key: 'Truck', label: 'Logística / Envio', category: 'Operações', keywords: ['caminhao', 'transporte', 'envio', 'frete'] },
  { key: 'Compass', label: 'Estratégia / Jornada', category: 'Operações', keywords: ['bussola', 'estrategia', 'direcao', 'guia'] },
  { key: 'MapPin', label: 'Localização', category: 'Operações', keywords: ['mapa', 'local', 'cidade', 'unidade'] },
  { key: 'Archive', label: 'Arquivo Histórico', category: 'Operações', keywords: ['arquivo', 'historico', 'guardado'] },
  { key: 'Shield', label: 'Segurança', category: 'Operações', keywords: ['escudo', 'protecao', 'privacidade'] },
  { key: 'Settings', label: 'Configurações', category: 'Operações', keywords: ['engrenagem', 'ajustes', 'configuracoes'] },
]

// ==========================================
// CATÁLOGO DE EMOJIS CATEGORIZADOS
// ==========================================
export interface EmojiDefinition {
  char: string
  label: string
  keywords: string[]
}

export const EMOJI_CATALOG: EmojiDefinition[] = [
  // Pastas & Trabalho
  { char: '📁', label: 'Pasta Fechada', keywords: ['pasta', 'arquivo', 'documentos', 'folder'] },
  { char: '📂', label: 'Pasta Aberta', keywords: ['pasta', 'aberta', 'arquivos'] },
  { char: '💼', label: 'Maleta de Trabalho', keywords: ['maleta', 'trabalho', 'comercial', 'negocios', 'empresa'] },
  { char: '📊', label: 'Gráfico de Barras', keywords: ['grafico', 'metricas', 'dados', 'relatorio'] },
  { char: '📈', label: 'Gráfico Crescente', keywords: ['crescimento', 'alta', 'vendas', 'sucesso'] },
  { char: '📉', label: 'Gráfico Decrescente', keywords: ['queda', 'churn', 'analise'] },
  { char: '💰', label: 'Saco de Dinheiro', keywords: ['dinheiro', 'financeiro', 'lucro', 'receita'] },
  { char: '💵', label: 'Nota de Dinheiro', keywords: ['dinheiro', 'dolar', 'pagamento'] },
  { char: '💳', label: 'Cartão de Crédito', keywords: ['cartao', 'cobranca', 'banco'] },
  { char: '⚖️', label: 'Balança da Justiça', keywords: ['balanca', 'juridico', 'leis', 'advogado', 'contrato'] },
  { char: '🏢', label: 'Prédio Corporativo', keywords: ['empresa', 'predio', 'escritorio', 'sede'] },
  { char: '🤝', label: 'Aperto de Mão', keywords: ['parceria', 'acordo', 'negociacao', 'vendas'] },
  { char: '👥', label: 'Equipe / Grupo', keywords: ['pessoas', 'equipe', 'time', 'clientes'] },
  { char: '🎯', label: 'Alvo com Flecha', keywords: ['alvo', 'meta', 'trafego', 'foco', 'estrategia'] },
  { char: '🏆', label: 'Troféu', keywords: ['trofeu', 'vitoria', 'campeao', 'conquista'] },

  // Ação & Prioridade
  { char: '🚀', label: 'Foguete', keywords: ['foguete', 'lancamento', 'onboarding', 'rapido', 'agilidade'] },
  { char: '🔥', label: 'Fogo / Hot', keywords: ['fogo', 'urgente', 'quente', 'prioridade', 'alta'] },
  { char: '⚡', label: 'Raio de Energia', keywords: ['raio', 'eletrico', 'rapido', 'automacao'] },
  { char: '💡', label: 'Lâmpada / Ideia', keywords: ['lampada', 'ideia', 'criatividade', 'inovacao'] },
  { char: '✨', label: 'Brilho / IA', keywords: ['brilho', 'ia', 'especial', 'destaque', 'magica'] },
  { char: '⭐', label: 'Estrela', keywords: ['estrela', 'favorito', 'destaque', 'top'] },
  { char: '🚨', label: 'Sirene de Alerta', keywords: ['alerta', 'urgente', 'emergencia', 'sirene'] },
  { char: '⚠️', label: 'Aviso', keywords: ['aviso', 'cuidado', 'atencao'] },
  { char: '✅', label: 'Check Verde', keywords: ['check', 'concluido', 'feito', 'aprovado'] },
  { char: '❌', label: 'X Vermelho', keywords: ['cancelado', 'erro', 'bloqueado'] },
  { char: '⏳', label: 'Ampulheta', keywords: ['ampulheta', 'espera', 'tempo', 'prazo'] },
  { char: '⏰', label: 'Despertador', keywords: ['relogio', 'horario', 'prazo', 'alarme'] },
  { char: '📅', label: 'Calendário', keywords: ['calendario', 'agenda', 'data', 'reuniao'] },
  { char: '📌', label: 'Alfinete', keywords: ['alfinete', 'fixado', 'marcado', 'lembrete'] },
  { char: '📝', label: 'Anotação', keywords: ['briefing', 'nota', 'rascunho', 'texto'] },
  { char: '📋', label: 'Prancheta', keywords: ['checklist', 'demandas', 'tarefas'] },

  // Mídia, TI & Comunicação
  { char: '📢', label: 'Megafone', keywords: ['megafone', 'marketing', 'anuncios', 'comunicado'] },
  { char: '📣', label: 'Corneta de Torcida', keywords: ['corneta', 'aviso', 'campanha'] },
  { char: '🤖', label: 'Robô IA', keywords: ['robo', 'bot', 'agente', 'ia', 'automacao'] },
  { char: '💻', label: 'Notebook', keywords: ['computador', 'programacao', 'dev', 'tecnologia'] },
  { char: '📱', label: 'Smartphone', keywords: ['celular', 'mobile', 'whatsapp', 'app'] },
  { char: '🌐', label: 'Globo com Meridianos', keywords: ['globo', 'internet', 'site', 'web'] },
  { char: '🔒', label: 'Cadeado Fechado', keywords: ['cadeado', 'seguranca', 'privado', 'confidencial'] },
  { char: '🎨', label: 'Paleta de Pintura', keywords: ['paleta', 'design', 'artes', 'criacao'] },
  { char: '🎬', label: 'Claquete de Cinema', keywords: ['claquete', 'video', 'audiovisual', 'cinema'] },
  { char: '📸', label: 'Câmera Fotográfica', keywords: ['camera', 'foto', 'ensaio'] },
  { char: '🎧', label: 'Headphones', keywords: ['fone', 'atendimento', 'suporte', 'cs', 'audio'] },
  { char: '💬', label: 'Balão de Conversa', keywords: ['chat', 'mensagem', 'conversa', 'whatsapp'] },
  { char: '📦', label: 'Pacote de Entrega', keywords: ['caixa', 'produto', 'entrega', 'envio'] },
  { char: '🛒', label: 'Carrinho de Compras', keywords: ['carrinho', 'loja', 'ecommerce', 'vendas'] },
  { char: '☕', label: 'Café', keywords: ['cafe', 'pausa', 'reuniao', 'escritorio'] },
  { char: '💙', label: 'Coração Azul', keywords: ['coracao', 'azul', 'coytech', 'marca'] },
  { char: '❤️', label: 'Coração Vermelho', keywords: ['coracao', 'amor', 'favorito'] },
  { char: '🟢', label: 'Círculo Verde', keywords: ['verde', 'ativo', 'rodando', 'ok'] },
  { char: '🟡', label: 'Círculo Amarelo', keywords: ['amarelo', 'pausa', 'revisao', 'alerta'] },
  { char: '🔴', label: 'Círculo Vermelho', keywords: ['vermelho', 'parado', 'bloqueado', 'urgente'] },
  { char: '🟣', label: 'Círculo Roxo', keywords: ['roxo', 'especial', 'vip', 'premium'] },
]

// ==========================================
// COMPONENTE: RENDERIZADOR UNIVERSAL DE ÍCONES
// ==========================================
export function CoyIconRenderer({
  icon,
  fallback = Folder,
  className = 'w-3.5 h-3.5',
  style,
}: {
  icon?: string | null
  fallback?: LucideIcon
  className?: string
  style?: React.CSSProperties
}) {
  const FallbackComp = fallback

  if (!icon || !icon.trim()) {
    return <FallbackComp className={`${className} shrink-0`} strokeWidth={1.6} style={style} />
  }

  const cleanIcon = icon.trim()

  // 1. Imagem (Data URL ou URL externa)
  if (
    cleanIcon.startsWith('data:image/') ||
    cleanIcon.startsWith('http://') ||
    cleanIcon.startsWith('https://') ||
    cleanIcon.startsWith('/')
  ) {
    return (
      <img
        src={cleanIcon}
        alt=""
        className={`${className} object-cover rounded-[3px] shrink-0 select-none`}
        style={style}
        loading="lazy"
      />
    )
  }

  // 2. Ícone Lucide do Catálogo
  const LucideComp = AVAILABLE_ICONS[cleanIcon]
  if (LucideComp) {
    return <LucideComp className={`${className} shrink-0`} strokeWidth={1.6} style={style} />
  }

  // 3. Se for uma palavra / identificador de código ASCII (ex: 'FolderKanban', 'FileSignature', etc.)
  // e NÃO estiver no catálogo de ícones, NUNCA renderizar como texto! Usar o Fallback!
  const isAsciiIdentifier = /^[A-Za-z0-9_\-\s]+$/.test(cleanIcon)
  if (isAsciiIdentifier) {
    return <FallbackComp className={`${className} shrink-0`} strokeWidth={1.6} style={style} />
  }

  // 4. Emoji Unicode genuíno
  return (
    <span
      className={`inline-flex items-center justify-center leading-none shrink-0 select-none overflow-hidden ${className}`}
      style={{ fontSize: '1.1em', lineHeight: 1, ...style }}
    >
      {cleanIcon}
    </span>
  )
}

// ==========================================
// COMPONENTE: POPOVER / MINI BALÃO DE ESCOLHA
// ==========================================
interface CoyIconPickerPopoverProps {
  currentIcon?: string
  defaultIcon?: string
  onSelect: (newIcon: string) => Promise<void> | void
  disabled?: boolean
  align?: 'start' | 'center' | 'end'
  side?: 'bottom' | 'right' | 'top' | 'left'
  title?: string
  triggerClassName?: string
  children?: React.ReactNode
}

export function CoyIconPickerPopover({
  currentIcon,
  defaultIcon = 'Folder',
  onSelect,
  disabled = false,
  align = 'start',
  side = 'bottom',
  title = 'Alterar ícone',
  triggerClassName = '',
  children,
}: CoyIconPickerPopoverProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'icons' | 'emojis' | 'upload'>('icons')
  const [searchQuery, setSearchQuery] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [customImagePreview, setCustomImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filtragem dos Ícones
  const filteredIcons = useMemo(() => {
    if (!searchQuery.trim()) return ICON_CATALOG
    const q = searchQuery.toLowerCase().trim()
    return ICON_CATALOG.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.key.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords.some((kw) => kw.toLowerCase().includes(q))
    )
  }, [searchQuery])

  // Filtragem dos Emojis
  const filteredEmojis = useMemo(() => {
    if (!searchQuery.trim()) return EMOJI_CATALOG
    const q = searchQuery.toLowerCase().trim()
    return EMOJI_CATALOG.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.char.includes(q) ||
        item.keywords.some((kw) => kw.toLowerCase().includes(q))
    )
  }, [searchQuery])

  // Processar Seleção de Arquivo e otimizar para Canvas 64x64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP, SVG).')
      return
    }

    setIsUploading(true)
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        // Redimensionar para tamanho ideal de ícone (máximo 64x64) para garantir payload ultra leve
        const canvas = document.createElement('canvas')
        const MAX_SIZE = 64
        canvas.width = MAX_SIZE
        canvas.height = MAX_SIZE
        const ctx = canvas.getContext('2d')

        if (ctx) {
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'

          // Manter proporção e recortar centralizado (cover)
          const scale = Math.max(MAX_SIZE / img.width, MAX_SIZE / img.height)
          const x = (MAX_SIZE - img.width * scale) / 2
          const y = (MAX_SIZE - img.height * scale) / 2
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale)

          const dataUrl = canvas.toDataURL('image/webp', 0.88)
          setCustomImagePreview(dataUrl)
        }
        setIsUploading(false)
      }
      img.onerror = () => {
        setIsUploading(false)
        alert('Não foi possível processar a imagem.')
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleApplyCustomImage = async () => {
    if (!customImagePreview) return
    await onSelect(customImagePreview)
    setOpen(false)
    setCustomImagePreview(null)
  }

  const handleApplyUrl = async () => {
    if (!imageUrlInput.trim()) return
    await onSelect(imageUrlInput.trim())
    setOpen(false)
    setImageUrlInput('')
  }

  const handleSelectIcon = async (iconKey: string) => {
    await onSelect(iconKey)
    setOpen(false)
  }

  const handleSelectEmoji = async (emojiChar: string) => {
    await onSelect(emojiChar)
    setOpen(false)
  }

  const handleResetDefault = async () => {
    await onSelect(defaultIcon)
    setOpen(false)
  }

  const fallbackLucide = AVAILABLE_ICONS[defaultIcon] || Folder

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger
        disabled={disabled}
        render={(props) => {
          if (children) {
            return (
              <span
                {...props}
                className={triggerClassName}
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  if (!disabled) {
                    props.onClick?.(e)
                  }
                }}
              >
                {children}
              </span>
            )
          }

          return (
            <button
              {...props}
              type="button"
              disabled={disabled}
              title={disabled ? undefined : title}
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                if (!disabled) {
                  props.onClick?.(e)
                }
              }}
              className={`p-1 rounded-[6px] hover:bg-[var(--surface)] hover:ring-1 hover:ring-[#0066FF]/40 text-[#0066FF] transition-all cursor-pointer flex items-center justify-center shrink-0 ${triggerClassName}`}
            >
              <CoyIconRenderer
                icon={currentIcon || defaultIcon}
                fallback={fallbackLucide}
                className="w-3.5 h-3.5"
              />
            </button>
          )
        }}
      />

      <PopoverContent
        align={align}
        side={side}
        sideOffset={6}
        className="w-[324px] p-0 bg-[var(--surface)] border border-[var(--line2)] rounded-[14px] shadow-2xl overflow-hidden z-[110]"
      >
        {/* CABEÇALHO DO MINI BALÃO */}
        <div className="p-3 pb-2 border-b border-[var(--line2)] bg-[var(--bg)]/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[6px] bg-[#0066FF]/15 text-[#0066FF] flex items-center justify-center">
              <CoyIconRenderer
                icon={currentIcon || defaultIcon}
                fallback={fallbackLucide}
                className="w-3.5 h-3.5"
              />
            </div>
            <span className="text-[12px] font-bold text-[var(--fg)] tracking-tight">
              {title}
            </span>
          </div>

          {currentIcon && currentIcon !== defaultIcon && (
            <button
              type="button"
              onClick={handleResetDefault}
              className="flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-[10.5px] font-medium text-[var(--ds-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
              title="Restaurar ícone padrão"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Padrão</span>
            </button>
          )}
        </div>

        {/* CAMPO DE BUSCA INSTANTÂNEA */}
        <div className="p-2.5 pb-1.5">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-[var(--ds-muted)] pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar ícones ou emojis..."
              className="w-full h-8 pl-8 pr-7 bg-[var(--bg)] border border-[var(--line2)] rounded-[8px] text-[12px] text-[var(--fg)] placeholder:text-[var(--ds-muted)] outline-none focus:border-[#0066FF] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS (ÍCONES | EMOJIS | CARREGAR IMAGEM) */}
        <div className="flex items-center border-b border-[var(--line2)] px-2 bg-[var(--bg)]/20">
          <button
            type="button"
            onClick={() => setActiveTab('icons')}
            className={`flex-1 py-1.5 text-[11px] font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'icons'
                ? 'border-[#0066FF] text-[#0066FF]'
                : 'border-transparent text-[var(--ds-muted)] hover:text-[var(--fg)]'
            }`}
          >
            <Shapes className="w-3 h-3" />
            <span>Ícones</span>
            <span className="text-[9.5px] opacity-60">({filteredIcons.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('emojis')}
            className={`flex-1 py-1.5 text-[11px] font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'emojis'
                ? 'border-[#0066FF] text-[#0066FF]'
                : 'border-transparent text-[var(--ds-muted)] hover:text-[var(--fg)]'
            }`}
          >
            <Smile className="w-3 h-3" />
            <span>Emojis</span>
            <span className="text-[9.5px] opacity-60">({filteredEmojis.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-1.5 text-[11px] font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'border-[#0066FF] text-[#0066FF]'
                : 'border-transparent text-[var(--ds-muted)] hover:text-[var(--fg)]'
            }`}
          >
            <Upload className="w-3 h-3" />
            <span>Imagem</span>
          </button>
        </div>

        {/* CONTEÚDO DAS ABAS */}
        <div className="p-2">
          {/* ABA 1: ÍCONES LUCIDE */}
          {activeTab === 'icons' && (
            <div className="max-h-[220px] overflow-y-auto no-scrollbar">
              {filteredIcons.length === 0 ? (
                <div className="py-8 text-center text-[11.5px] text-[var(--ds-muted)]">
                  Nenhum ícone encontrado para &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                <div className="grid grid-cols-6 gap-1.5">
                  {filteredIcons.map((item) => {
                    const Comp = AVAILABLE_ICONS[item.key]
                    if (!Comp) return null
                    const isSelected = currentIcon === item.key

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleSelectIcon(item.key)}
                        title={item.label}
                        className={`h-9 rounded-[8px] flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0066FF]/20 text-[#0066FF] ring-2 ring-[#0066FF]'
                            : 'hover:bg-[var(--ds-hover)] text-[var(--fg)] hover:text-[#0066FF]'
                        }`}
                      >
                        <Comp className="w-4 h-4 shrink-0" strokeWidth={1.7} />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ABA 2: EMOJIS */}
          {activeTab === 'emojis' && (
            <div className="max-h-[220px] overflow-y-auto no-scrollbar">
              {filteredEmojis.length === 0 ? (
                <div className="py-8 text-center text-[11.5px] text-[var(--ds-muted)]">
                  Nenhum emoji encontrado para &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {filteredEmojis.map((item) => {
                    const isSelected = currentIcon === item.char

                    return (
                      <button
                        key={item.char}
                        type="button"
                        onClick={() => handleSelectEmoji(item.char)}
                        title={item.label}
                        className={`h-8 rounded-[7px] flex items-center justify-center text-[16px] transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0066FF]/20 ring-2 ring-[#0066FF]'
                            : 'hover:bg-[var(--ds-hover)]'
                        }`}
                      >
                        {item.char}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ABA 3: CARREGAR IMAGEM */}
          {activeTab === 'upload' && (
            <div className="flex flex-col gap-3 py-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Área de Clique para Upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[var(--line2)] hover:border-[#0066FF] hover:bg-[#0066FF]/5 rounded-[10px] p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--line2)] flex items-center justify-center text-[#0066FF]">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11.5px] font-semibold text-[var(--fg)]">
                    {isUploading ? 'Processando imagem...' : 'Clique para enviar imagem'}
                  </div>
                  <div className="text-[10px] text-[var(--ds-muted)]">
                    PNG, JPG, WebP ou SVG (otimização automática)
                  </div>
                </div>
              </div>

              {/* Preview de Imagem Carregada */}
              {customImagePreview && (
                <div className="flex items-center justify-between p-2 rounded-[8px] bg-[var(--bg)] border border-[var(--line2)]">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={customImagePreview}
                      alt="Prévia"
                      className="w-8 h-8 rounded-[6px] object-cover border border-[var(--line2)]"
                    />
                    <div className="text-[11px] text-[var(--fg)] font-medium truncate">
                      Imagem pronta
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCustomImagePreview(null)}
                      className="p-1 text-[var(--ds-muted)] hover:text-[var(--fg)] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyCustomImage}
                      className="px-2.5 py-1 rounded-[6px] bg-[#0066FF] hover:bg-[#0052CC] text-white text-[10.5px] font-semibold cursor-pointer transition-colors"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}

              {/* Ou Colar URL de Imagem */}
              <div className="flex flex-col gap-1.5 pt-1 border-t border-[var(--line2)]">
                <span className="text-[10.5px] font-medium text-[var(--ds-muted)]">
                  Ou cole uma URL de imagem web:
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://exemplo.com/icone.png"
                    className="flex-1 h-7 px-2 bg-[var(--bg)] border border-[var(--line2)] rounded-[6px] text-[11px] text-[var(--fg)] placeholder:text-[var(--ds-muted)] outline-none focus:border-[#0066FF]"
                  />
                  <button
                    type="button"
                    disabled={!imageUrlInput.trim()}
                    onClick={handleApplyUrl}
                    className="h-7 px-2.5 rounded-[6px] bg-[var(--surface)] hover:bg-[#0066FF] hover:text-white border border-[var(--line2)] hover:border-[#0066FF] text-[11px] font-medium text-[var(--fg)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Usar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

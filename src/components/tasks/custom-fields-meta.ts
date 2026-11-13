import {
  Type,
  AlignLeft,
  Hash,
  Link as LinkIcon,
  ListFilter,
  CheckSquare,
  Calendar as CalendarIcon,
  User,
  FileText,
} from 'lucide-react'
import type { CustomFieldGroup, CustomFieldGroupFieldTemplate, CustomFieldType } from '@/types/coydash'

export const FIELD_TYPES_META: {
  type: CustomFieldType
  label: string
  hint: string
  icon: React.ElementType
}[] = [
  { type: 'text', label: 'Texto Curto', hint: 'Nome, código ou protocolo', icon: Type },
  { type: 'textarea', label: 'Texto Longo', hint: 'Observações e detalhes', icon: AlignLeft },
  { type: 'number', label: 'Número / Valor', hint: 'Quantidade, meta ou R$', icon: Hash },
  { type: 'select', label: 'Seleção / Tags', hint: 'Opções com cores customizadas', icon: ListFilter },
  { type: 'date', label: 'Data', hint: 'Entrega ou marco específico', icon: CalendarIcon },
  { type: 'user', label: 'Responsável', hint: 'Membro específico da equipe', icon: User },
  { type: 'url', label: 'Link / URL', hint: 'Drive, Figma ou referência', icon: LinkIcon },
  { type: 'checkbox', label: 'Caixa de Seleção', hint: 'Sim/Não ou validação', icon: CheckSquare },
  { type: 'file', label: 'Arquivo / Drive', hint: 'Caminho de documento', icon: FileText },
]

export const OPTION_PALETTE = [
  '#0066FF',
  '#38BDF8',
  '#2F9E5A',
  '#E8C14A',
  '#8F7DFF',
  '#EC4899',
  '#64748B',
]

export const COVER_GALLERY: { id: string; url: string; label: string }[] = [
  { id: 'coytech', url: '/images/custom-field-banner.jpg', label: 'Abstrato Grafite & Laranja' },
  { id: 'traffic', url: '/images/tpl-traffic.jpg', label: 'Tráfego & Performance' },
  { id: 'tech', url: '/images/tpl-tech.jpg', label: 'Engenharia & Tech' },
  { id: 'qa', url: '/images/tpl-qa.jpg', label: 'Auditoria & QA' },
  { id: 'finance', url: '/images/tpl-finance.jpg', label: 'Finanças & Metas' },
]

export interface IndividualFieldTemplate {
  id: string
  category: string
  cover_image: string
  template: CustomFieldGroupFieldTemplate
}

export const INDIVIDUAL_FIELD_TEMPLATES: IndividualFieldTemplate[] = [
  {
    id: 'tpl-field-canal',
    category: 'Tráfego Pago',
    cover_image: '/images/tpl-traffic.jpg',
    template: {
      name: 'Canal de Veiculação',
      type: 'select',
      description: 'Plataforma principal de mídia paga da campanha.',
      options: [
        { label: 'Meta Ads', color: '#38BDF8' },
        { label: 'Google Ads', color: '#E8C14A' },
        { label: 'TikTok Ads', color: '#EC4899' },
        { label: 'LinkedIn Ads', color: '#8F7DFF' },
      ],
    },
  },
  {
    id: 'tpl-field-criativos',
    category: 'Criativos',
    cover_image: '/images/custom-field-banner.jpg',
    template: {
      name: 'Pasta de Criativos',
      type: 'url',
      description: 'Link direto da pasta no Drive ou Figma com peças aprovadas.',
    },
  },
  {
    id: 'tpl-field-ambiente',
    category: 'Engenharia Tech',
    cover_image: '/images/tpl-tech.jpg',
    template: {
      name: 'Ambiente de Deploy',
      type: 'select',
      description: 'Define em qual estágio a entrega técnica está rodando.',
      options: [
        { label: 'Desenvolvimento', color: '#64748B' },
        { label: 'Homologação (Staging)', color: '#E8C14A' },
        { label: 'Produção', color: '#2F9E5A' },
      ],
      is_required: true,
    },
  },
  {
    id: 'tpl-field-pr',
    category: 'Engenharia Tech',
    cover_image: '/images/tpl-tech.jpg',
    template: {
      name: 'Link do Repositório / PR',
      type: 'url',
      description: 'URL do Pull Request ou branch para revisão de código.',
    },
  },
  {
    id: 'tpl-field-qa-status',
    category: 'QA & Auditoria',
    cover_image: '/images/tpl-qa.jpg',
    template: {
      name: 'Status de Aprovação QA',
      type: 'select',
      description: 'Validação técnica ou visual antes do envio ao cliente.',
      options: [
        { label: 'Aguardando QA', color: '#E8C14A' },
        { label: 'Ajustes Necessários', color: '#0066FF' },
        { label: 'Aprovado', color: '#2F9E5A' },
      ],
      is_required: true,
    },
  },
  {
    id: 'tpl-field-budget',
    category: 'Financeiro & Metas',
    cover_image: '/images/tpl-finance.jpg',
    template: {
      name: 'Investimento Previsto (R$)',
      type: 'number',
      description: 'Valor orçado ou teto financeiro alocado nesta entrega.',
    },
  },
  {
    id: 'tpl-field-aprovador',
    category: 'Gestão',
    cover_image: '/images/custom-field-banner.jpg',
    template: {
      name: 'Revisor Responsável',
      type: 'user',
      description: 'Membro encarregado pela aprovação final desta tarefa.',
    },
  },
  {
    id: 'tpl-field-homologado',
    category: 'QA & Auditoria',
    cover_image: '/images/tpl-qa.jpg',
    template: {
      name: 'Validado em Produção',
      type: 'checkbox',
      description: 'Confirma que o entregável foi testado após publicação.',
    },
  },
]

export const SYSTEM_GROUP_TEMPLATES: CustomFieldGroup[] = [
  {
    id: 'sys-group-traffic',
    name: 'Tráfego Pago & Performance',
    description: 'Campos essenciais para gestão de campanhas, verba, ROAS e pasta de criativos.',
    cover_image: '/images/tpl-traffic.jpg',
    is_system_template: true,
    fields: [
      {
        name: 'Canal de Veiculação',
        type: 'select',
        description: 'Plataforma de anúncios ativa',
        options: [
          { label: 'Meta Ads', color: '#38BDF8' },
          { label: 'Google Ads', color: '#E8C14A' },
          { label: 'TikTok Ads', color: '#EC4899' },
        ],
      },
      {
        name: 'Verba Alocada (R$)',
        type: 'number',
        description: 'Investimento previsto para o ciclo',
        is_required: true,
      },
      {
        name: 'Pasta de Criativos',
        type: 'url',
        description: 'URL com peças e copies da campanha',
      },
      {
        name: 'Gestor Responsável',
        type: 'user',
        description: 'Especialista de mídia alocado',
      },
    ],
  },
  {
    id: 'sys-group-tech',
    name: 'Engenharia, IA & Automações',
    description: 'Estrutura para sprints técnicos, integrações n8n, APIs e validações de ambiente.',
    cover_image: '/images/tpl-tech.jpg',
    is_system_template: true,
    fields: [
      {
        name: 'Ambiente',
        type: 'select',
        description: 'Estágio atual da implementação',
        options: [
          { label: 'Sandbox', color: '#64748B' },
          { label: 'Staging', color: '#E8C14A' },
          { label: 'Produção', color: '#2F9E5A' },
        ],
        is_required: true,
      },
      {
        name: 'Endpoint / Repositório',
        type: 'url',
        description: 'Link do Git, webhook ou workflow n8n',
      },
      {
        name: 'Notas Técnicas',
        type: 'textarea',
        description: 'Dependências, tokens ou instruções de deploy',
      },
      {
        name: 'Deploy Verificado',
        type: 'checkbox',
        description: 'Checklist técnico concluído sem erros',
      },
    ],
  },
  {
    id: 'sys-group-qa',
    name: 'QA, Revisão & Aprovação',
    description: 'Controle de qualidade para validar entregas antes de liberar para o cliente.',
    cover_image: '/images/tpl-qa.jpg',
    is_system_template: true,
    fields: [
      {
        name: 'Status de Aprovação QA',
        type: 'select',
        options: [
          { label: 'Aguardando QA', color: '#E8C14A' },
          { label: 'Reprovado', color: '#0066FF' },
          { label: 'Aprovado', color: '#2F9E5A' },
        ],
        is_required: true,
      },
      {
        name: 'Revisor Final',
        type: 'user',
      },
      {
        name: 'Evidência / Documento',
        type: 'file',
        description: 'Link de relatório, vídeo Loom ou print de teste',
      },
    ],
  },
  {
    id: 'sys-group-finance',
    name: 'Comercial, Escopo & Bônus',
    description: 'Rastreamento financeiro de OS, faturamento, valores contratuais e datas de fechamento.',
    cover_image: '/images/tpl-finance.jpg',
    is_system_template: true,
    fields: [
      {
        name: 'Valor do Contrato / OS (R$)',
        type: 'number',
        is_required: true,
      },
      {
        name: 'Centro de Custo',
        type: 'select',
        options: [
          { label: 'Operação Recorrente', color: '#38BDF8' },
          { label: 'Projeto Pontual', color: '#8F7DFF' },
          { label: 'Expansão / Upsell', color: '#2F9E5A' },
        ],
      },
      {
        name: 'Previsão de Faturamento',
        type: 'date',
      },
      {
        name: 'Faturado & Conferido',
        type: 'checkbox',
      },
    ],
  },
]

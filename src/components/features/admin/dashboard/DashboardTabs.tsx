interface DashboardTabsProps {
  activeTab: 'projetos' | 'professores' | 'alunos'
  onTabChange: (tab: 'projetos' | 'professores' | 'alunos') => void
}

const TABS = [
  { id: 'projetos' as const, label: 'Projetos' },
  { id: 'professores' as const, label: 'Professores' },
  { id: 'alunos' as const, label: 'Alunos' },
]

export function DashboardTabs({ activeTab, onTabChange }: DashboardTabsProps) {
  return (
    <div className="mb-4 sm:mb-6 flex gap-3 sm:gap-6 border-b border-gray-200 overflow-x-auto">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`py-2 px-1 text-sm sm:text-base font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === tab.id
              ? 'border-black text-black'
              : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

import { DashboardHeader } from './header'
import { DashboardSidebar } from './sidebar'
import { StatsCards } from './stats-cards'
import { EntriesExitsChart } from './entries-exits-chart'
import { MonthlyOverviewChart } from './monthly-overview-chart'
import { ExpirationTable } from './expiration-table'
import { ExpiredItemsTable } from './expired-items-table'
import { RecentMovementsTable } from './recent-movements-table'
import { CategoryDistributionChart } from './category-distribution-chart'
import { DashboardMovimentacoesPage } from './movimentacoes-page'
import { DashboardOperadoresPage } from './operadores-page'
import { DashboardRelatoriosPage } from './relatorios-page.tsx'
import { usePathname } from '@/lib/next-navigation'

function DashboardOverviewContent() {
  return (
    <div className="space-y-6">
      <StatsCards />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <EntriesExitsChart />
        <MonthlyOverviewChart />
        <CategoryDistributionChart />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ExpirationTable />
        <ExpiredItemsTable />
      </div>

      <RecentMovementsTable />
    </div>
  )
}

export function DashboardPage() {
  const pathname = usePathname()

  let content
  if (pathname === '/dashboard/movimentacoes') {
    content = <DashboardMovimentacoesPage />
  } else if (pathname === '/dashboard/operadores') {
    content = <DashboardOperadoresPage />
  } else if (pathname === '/dashboard/relatorios') {
    content = <DashboardRelatoriosPage />
  } else {
    content = <DashboardOverviewContent />
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <DashboardSidebar />
        <div className="flex flex-1 flex-col">
          <DashboardHeader />
          <main className="flex-1 bg-muted/30 px-4 py-6 md:px-6">
            {content}
          </main>
        </div>
      </div>
    </div>
  )
}

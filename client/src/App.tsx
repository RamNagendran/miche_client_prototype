import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { App as AntApp, ConfigProvider } from 'antd'
import enGB from 'antd/locale/en_GB'
import dayjs from 'dayjs'
import 'dayjs/locale/en-gb'
import { theme } from './theme/theme'
import { AppProvider, can, useApp } from './context/AppContext'
import AppLayout from './layout/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import OperatorHome from './pages/OperatorHome'
import PurchasesList from './pages/purchases/PurchasesList'
import NewPurchase from './pages/purchases/NewPurchase'
import WarehousesOverview from './pages/warehouses/WarehousesOverview'
import WarehouseDetail from './pages/warehouses/WarehouseDetail'
import ProductionList from './pages/production/ProductionList'
import NewProduction from './pages/production/NewProduction'
import OutputStockOverview from './pages/output/OutputStockOverview'
import FactoryDetail from './pages/output/FactoryDetail'
import SalesList from './pages/sales/SalesList'
import NewSale from './pages/sales/NewSale'
import Finance from './pages/Finance'
import Records from './pages/Records'
import Settings from './pages/Settings'
import type { ReactElement } from 'react'

dayjs.locale('en-gb')

function Protected() {
  const { role } = useApp()
  if (!role) return <Navigate to="/login" replace />
  return <AppLayout />
}

function Home() {
  const { role } = useApp()
  return role === 'operator' ? <OperatorHome /> : <Dashboard />
}

function Guard({ allow, children }: { allow: keyof ReturnType<typeof can>; children: ReactElement }) {
  const { role } = useApp()
  return can(role)[allow] ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <ConfigProvider theme={theme} locale={enGB}>
      <AntApp>
        <AppProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<Protected />}>
                <Route index element={<Home />} />
                <Route path="purchases" element={<PurchasesList />} />
                <Route path="purchases/new" element={<Guard allow="enterData"><NewPurchase /></Guard>} />
                <Route path="purchases/review/:id" element={<Guard allow="enterData"><NewPurchase /></Guard>} />
                <Route path="warehouses" element={<WarehousesOverview />} />
                <Route path="warehouses/:id" element={<WarehouseDetail />} />
                <Route path="production" element={<ProductionList />} />
                <Route path="production/new" element={<Guard allow="enterData"><NewProduction /></Guard>} />
                <Route path="output-stock" element={<OutputStockOverview />} />
                <Route path="factories/:id" element={<FactoryDetail />} />
                <Route path="sales" element={<SalesList />} />
                <Route path="sales/new" element={<Guard allow="enterData"><NewSale /></Guard>} />
                <Route path="finance" element={<Guard allow="viewFinance"><Finance /></Guard>} />
                <Route path="records" element={<Guard allow="viewRecords"><Records /></Guard>} />
                <Route path="settings" element={<Guard allow="manageSettings"><Settings /></Guard>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </AntApp>
    </ConfigProvider>
  )
}

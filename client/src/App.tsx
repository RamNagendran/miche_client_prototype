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
import CeoWelcome from './pages/CeoWelcome'
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

/** The CEO's first screen after sign-in. It sits outside the main layout, so it has no side menu. */
function CeoOnly() {
  const { role } = useApp()
  if (!role) return <Navigate to="/login" replace />
  return role === 'ceo' ? <CeoWelcome /> : <Navigate to="/" replace />
}

function Guard({ allow, children }: { allow: keyof ReturnType<typeof can>; children: ReactElement }) {
  const { role } = useApp()
  return can(role)[allow] ? children : <Navigate to="/" replace />
}

// 2. PDF text layer: for digital PDFs made in Tally, Busy, Zoho and similar
// Most supplier bills sent as PDFs contain real text, not a picture, so they can be read exactly, character for character.
// Tools: pdfplumber or PyMuPDF for text with positions; Camelot or Tabula for tables.
// invoice2data is an open-source Python library built for this job. You write one small YAML template per supplier (regex rules for invoice number, quantity, rate, vehicle number and so on).
// A rubber business usually buys from a fairly fixed set of suppliers, so templates suit it well. Five to fifteen suppliers means five to fifteen templates.

// 3. OCR: only for scanned or photographed bills
// Tesseract is the classic open-source OCR, runs fully offline, and works on a CPU.
// PaddleOCR is noticeably more accurate on Indian invoices. Technically it's a machine-learning model, but it runs entirely on your server and sends nothing anywhere.
// The text it produces goes through the same supplier templates as step 2.
// Handwritten bills can't be read reliably. They fall back to manual entry.


export default function App() {
  return (
    <ConfigProvider theme={theme} locale={enGB}>
      <AntApp>
        <AppProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/welcome" element={<CeoOnly />} />
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

import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Shell from './components/Shell'
import Dashboard from './pages/Dashboard'
import PlannedPage from './pages/PlannedPage'
import ClassicalLab from './pages/lab/ClassicalLab'
import { allLeaves } from './data/nav'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Dashboard />} />
          <Route path="/lab/classical" element={<ClassicalLab />} />
          {allLeaves.filter(l => l.path !== '/' && l.path !== '/lab/classical').map(l => (
            <Route key={l.path} path={l.path} element={<PlannedPage />} />
          ))}
          <Route path="*" element={<PlannedPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

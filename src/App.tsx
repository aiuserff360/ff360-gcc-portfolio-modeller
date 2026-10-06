import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './store/AppContext'
import Layout from './components/Layout'
import PortfolioCapture from './pages/PortfolioCapture'
import EntityList from './pages/EntityList'
import ProjectForm from './pages/forms/ProjectForm'
import ApplicationForm from './pages/forms/ApplicationForm'
import RoleForm from './pages/forms/RoleForm'
import WorkforceForm from './pages/forms/WorkforceForm'
import AssessmentHub from './pages/AssessmentHub'
import AssessmentWizard from './pages/AssessmentWizard'
import OpportunityMap from './pages/OpportunityMap'
import Reports from './pages/Reports'
import SettingsPage from './pages/SettingsPage'
import FootprintDesigner from './pages/FootprintDesigner'
import ScenarioModeller from './pages/ScenarioModeller'
import TransitionPlanner from './pages/TransitionPlanner'
import ExecutiveView from './pages/ExecutiveView'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<PortfolioCapture />} />
            <Route path="projects" element={<EntityList type="project" />} />
            <Route path="projects/new" element={<ProjectForm key="new-project" />} />
            <Route path="projects/:id" element={<ProjectForm />} />
            <Route path="applications" element={<EntityList type="application" />} />
            <Route path="applications/new" element={<ApplicationForm key="new-application" />} />
            <Route path="applications/:id" element={<ApplicationForm />} />
            <Route path="roles" element={<EntityList type="role" />} />
            <Route path="roles/new" element={<RoleForm key="new-role" />} />
            <Route path="roles/:id" element={<RoleForm />} />
            <Route path="workforce" element={<EntityList type="workforce" />} />
            <Route path="workforce/new" element={<WorkforceForm key="new-workforce" />} />
            <Route path="workforce/:id" element={<WorkforceForm />} />
            <Route path="assessment" element={<AssessmentHub />} />
            <Route path="assessment/:id" element={<AssessmentWizard />} />
            <Route path="assessment/:id/:sectionId" element={<AssessmentWizard />} />
            <Route path="opportunity-map" element={<OpportunityMap />} />
            <Route path="reports" element={<Reports />} />
            <Route path="footprint-designer" element={<FootprintDesigner />} />
            <Route path="scenario-modeller" element={<ScenarioModeller />} />
            <Route path="scenario-modeller/:id" element={<ScenarioModeller />} />
            <Route path="transition-planner" element={<TransitionPlanner />} />
            <Route path="executive-view" element={<ExecutiveView />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}

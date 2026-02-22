import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import IssueListPage from './pages/IssueListPage.jsx';
import IssueDetailPage from './pages/IssueDetailPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="issues" element={<IssueListPage />} />
        <Route path="issues/:issueNumber" element={<IssueDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

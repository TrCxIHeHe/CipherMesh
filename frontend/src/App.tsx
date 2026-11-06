import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Shell from './components/Shell'
import Dashboard from './pages/Dashboard'
import ClassicalLab from './pages/lab/ClassicalLab'
import DESLab from './pages/lab/DESLab'
import {
  AsymmetricAuthLab,
  AuditEventsLab,
  AuthLab,
  BenchmarkLab,
  CALab,
  DHLab,
  DKIMLab,
  DocsPage,
  ECCLab,
  EmailThreatsLab,
  ESPInspectorLab,
  FileEncryptionPage,
  HashingLab,
  HistoryPage,
  IKESimulator,
  IPSecPolicyLab,
  KerberosLab,
  KeyManagementLab,
  PGPLab,
  PKIExplorer,
  RNGLab,
  RsaLab,
  SecureMessagingPage,
  SecurityAssociationsLab,
  SettingsPage,
  SMIMELab,
  TLSInspector,
  WebSecurityLab,
  X509Lab,
  IntegrityReportsLab,
} from './pages/AcademicPages'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Dashboard />} />
          <Route path="/lab/classical" element={<ClassicalLab />} />
          <Route path="/lab/des" element={<DESLab />} />
          <Route path="/lab/rsa" element={<RsaLab />} />
          <Route path="/lab/rng" element={<RNGLab />} />
          <Route path="/lab/dh" element={<DHLab />} />
          <Route path="/lab/ecc" element={<ECCLab />} />
          <Route path="/trust/hashing" element={<HashingLab />} />
          <Route path="/trust/keys" element={<KeyManagementLab />} />
          <Route path="/trust/ca" element={<CALab />} />
          <Route path="/trust/x509" element={<X509Lab />} />
          <Route path="/trust/pki" element={<PKIExplorer />} />
          <Route path="/identity/auth" element={<AuthLab />} />
          <Route path="/identity/kerberos" element={<KerberosLab />} />
          <Route path="/identity/asymmetric" element={<AsymmetricAuthLab />} />
          <Route path="/transport/tls" element={<TLSInspector />} />
          <Route path="/transport/web" element={<WebSecurityLab />} />
          <Route path="/email/pgp" element={<PGPLab />} />
          <Route path="/email/smime" element={<SMIMELab />} />
          <Route path="/email/dkim" element={<DKIMLab />} />
          <Route path="/email/threats" element={<EmailThreatsLab />} />
          <Route path="/network/policy" element={<IPSecPolicyLab />} />
          <Route path="/network/sa" element={<SecurityAssociationsLab />} />
          <Route path="/network/esp" element={<ESPInspectorLab />} />
          <Route path="/network/ike" element={<IKESimulator />} />
          <Route path="/analytics/audit" element={<AuditEventsLab />} />
          <Route path="/analytics/bench" element={<BenchmarkLab />} />
          <Route path="/analytics/integrity" element={<IntegrityReportsLab />} />
          <Route path="/secure/messaging" element={<SecureMessagingPage />} />
          <Route path="/secure/files" element={<FileEncryptionPage />} />
          <Route path="/secure/history" element={<HistoryPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

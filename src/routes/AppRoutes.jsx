import { Routes, Route, Navigate } from 'react-router-dom'

import { AppLayout } from '../components/layout/AppLayout'
import { AdminLayout } from '../components/layout/AdminLayout'
import { PlataformaLayout } from '../components/layout/PlataformaLayout'

import PlataformaDashboard from '../pages/plataforma/Dashboard'
import Clientes from '../pages/plataforma/Clientes'
import NovoCliente from '../pages/plataforma/NovoCliente'
import ClienteDetalhe from '../pages/plataforma/ClienteDetalhe'
import EadCursos from '../pages/plataforma/ead/Cursos'
import EadCursoEditor from '../pages/plataforma/ead/CursoEditor'
import EadCursoEmpresas from '../pages/plataforma/ead/CursoEmpresas'
import EadTestes from '../pages/plataforma/ead/Testes'
import EadCursoResultados from '../pages/plataforma/ead/CursoResultados'

import Login from '../pages/auth/Login'
import AdminLogin from '../pages/auth/AdminLogin'
import Cadastro from '../pages/auth/Cadastro'
import ConviteColaborador from '../pages/auth/ConviteColaborador'
import Landing from '../pages/site/Landing'

import Home from '../pages/app/Home'
import CheckIn from '../pages/app/CheckIn'
import Pesquisas from '../pages/app/Pesquisas'
import PesquisaDetalhe from '../pages/app/PesquisaDetalhe'
import Comunicados from '../pages/app/Comunicados'
import Escuta from '../pages/app/Escuta'
import Perfil from '../pages/app/Perfil'
import Ead from '../pages/app/Ead'
import EadCurso from '../pages/app/EadCurso'

import Dashboard from '../pages/admin/Dashboard'
import Riscos from '../pages/admin/Riscos'
import PesquisasAdmin from '../pages/admin/Pesquisas'
import NovaPesquisa from '../pages/admin/NovaPesquisa'
import Relatorios from '../pages/admin/Relatorios'
import Colaboradores from '../pages/admin/Colaboradores'
import Empresas from '../pages/admin/Empresas'
import Configuracoes from '../pages/admin/Configuracoes'
import ComunicadosAdmin from '../pages/admin/Comunicados'
import CheckIns from '../pages/admin/CheckIns'
import CanalEscuta from '../pages/admin/CanalEscuta'
import Nr1Admin from '../pages/admin/Nr1'
import Nr1Nova from '../pages/admin/Nr1Nova'
import Nr1Resultados from '../pages/admin/Nr1Resultados'
import Nr1Benchmark from '../pages/admin/Nr1Benchmark'
import AvaliacaoNr1 from '../pages/nr1/Avaliacao'
import EmBreve from '../pages/admin/EmBreve'
import EadCursosAdmin from '../pages/admin/ead/Cursos'
import EadCursoVisualizar from '../pages/admin/ead/CursoVisualizar'
import EadCursoResultadosAdmin from '../pages/admin/ead/CursoResultados'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/cadastro" element={<Navigate to="/admin/login" replace />} />
      <Route path="/convite/:token" element={<ConviteColaborador />} />

      <Route path="/avaliacao/nr1/:codigo" element={<AvaliacaoNr1 />} />

      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="checkin" element={<CheckIn />} />
        <Route path="pesquisas" element={<Pesquisas />} />
        <Route path="pesquisas/:id" element={<PesquisaDetalhe />} />
        <Route path="comunicados" element={<Comunicados />} />
        <Route path="escuta" element={<Escuta />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="ead" element={<Ead />} />
        <Route path="ead/:id" element={<EadCurso />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="riscos" element={<Riscos />} />
        <Route path="pesquisas" element={<PesquisasAdmin />} />
        <Route path="pesquisas/nova" element={<NovaPesquisa />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="colaboradores" element={<Navigate to="/admin/empresas" replace />} />
        <Route path="empresas" element={<Empresas />} />
        <Route path="configuracoes" element={<Configuracoes />} />
        <Route path="checkins" element={<CheckIns />} />
        <Route path="escuta" element={<CanalEscuta />} />
        <Route path="nr1" element={<Nr1Admin />} />
        <Route path="nr1/nova" element={<Nr1Nova />} />
        <Route path="nr1/benchmark" element={<Nr1Benchmark />} />
        <Route path="nr1/:id/resultados" element={<Nr1Resultados />} />
        <Route path="feedback" element={<EmBreve modulo="Feedback 360" />} />
        <Route path="pdi" element={<EmBreve modulo="Plano de Desenvolvimento Individual (PDI)" />} />
        <Route path="ead/cursos" element={<EadCursosAdmin />} />
        <Route path="ead/cursos/:id/visualizar" element={<EadCursoVisualizar />} />
        <Route path="ead/cursos/:id/resultados" element={<EadCursoResultadosAdmin />} />
      </Route>

      <Route path="/plataforma" element={<PlataformaLayout />}>
        <Route index element={<PlataformaDashboard />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="clientes/novo" element={<NovoCliente />} />
        <Route path="clientes/:id" element={<ClienteDetalhe />} />
        <Route path="ead/cursos" element={<EadCursos />} />
        <Route path="ead/cursos/:id" element={<EadCursoEditor />} />
        <Route path="ead/cursos/:id/empresas" element={<EadCursoEmpresas />} />
        <Route path="ead/cursos/:id/testes" element={<EadTestes />} />
        <Route path="ead/cursos/:id/resultados" element={<EadCursoResultados />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

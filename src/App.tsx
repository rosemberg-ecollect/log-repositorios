import { useEffect, useState } from 'react'

import Nav from './components/Nav'
import Footer from './components/Footer'
import SearchFilters from './components/SearchFilters'
import ResultsTable, { type MergeCommit } from './components/ResultsTable'
import LoginButton from './components/LoginButton'
import ecollectLogo from './assets/ecollect.svg'
import './App.css'

function App() {
  const [merges, setMerges] = useState<MergeCommit[]>([]);
  const [loading, setLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branches, setBranches] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [resultFilter, setResultFilter] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<{ login: string; name: string } | null>(null);
  const repositories = ['plus', 'erpagent', 'bankagent', 'connector'];
  const [query, setQuery] = useState<{
    repository: string;
    branch: string;
    startDate: string;
    endDate: string;
  } | null>(null);

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch('/auth/session');
        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();
        setUser(data.user ?? null);
      } catch {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    void checkSession();
  }, []);

  async function handleGithubLogin() {
    window.location.href = '/auth/github';
  }

  async function handleLogout() {
    await fetch('/auth/logout', { method: 'POST' });
    setUser(null);
    setBranches([]);
    setMerges([]);
    setQuery(null);
  }

  const normalizedResultFilter = resultFilter.trim().toLocaleLowerCase();
  const filteredMerges = normalizedResultFilter
    ? merges.filter((item) => (
      item.commit.message.toLocaleLowerCase().includes(normalizedResultFilter)
      || item.commit.author.name.toLocaleLowerCase().includes(normalizedResultFilter)
      || item.tags.some((tag) => tag.toLocaleLowerCase().includes(normalizedResultFilter))
    ))
    : merges;

  async function fetchMerges(repository: string, branch: string, startDate: string, endDate: string) {
    setLoading(true);
    setError(null);
    setQuery({ repository, branch, startDate, endDate });
    try {
        const params = new URLSearchParams({ sha: branch, per_page: '100' });
        if (startDate) params.set('since', `${startDate}T00:00:00Z`);
        if (endDate) params.set('until', `${endDate}T23:59:59Z`);

        const [response, tagsResponse] = await Promise.all([
          fetch(`/api/repos/${repository}/commits?${params.toString()}`),
          fetch(`/api/repos/${repository}/tags?per_page=100`),
        ]);

        if (!response.ok) {
          throw new Error(`Error en la petición: ${response.statusText}`);
        }
        if (!tagsResponse.ok) {
          throw new Error(`Error al cargar tags: ${tagsResponse.statusText}`);
        }

        const data: Array<MergeCommit & { parents: unknown[] }> = await response.json();
        const tagsData: Array<{ name: string; commit: { sha: string } }> = await tagsResponse.json();
        const tagsByCommit = new Map<string, string[]>();

        tagsData.forEach((tag) => {
          const commitTags = tagsByCommit.get(tag.commit.sha) ?? [];
          commitTags.push(tag.name);
          tagsByCommit.set(tag.commit.sha, commitTags);
        });

        // LA MAGIA: Filtramos solo los commits que son Merges (tienen más de 1 padre)
        const mergeCommits = data
          .filter((commitItem) => (
            commitItem.parents.length > 0
            && commitItem.commit.author.name !== 'github-actions[bot]'
          ))
          .map((commitItem) => ({
            ...commitItem,
            tags: tagsByCommit.get(commitItem.sha) ?? [],
          }));

        setMerges(mergeCommits);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  async function fetchBranches(repository: string) {
    setBranchesLoading(true);
    setBranches([]);
    setError(null);
    setQuery(null);
    setMerges([]);

    try {
      const response = await fetch(`/api/repos/${repository}/branches?per_page=100`);

      if (!response.ok) {
        throw new Error(`Error al cargar ramas: ${response.statusText}`);
      }

      const data: Array<{ name: string }> = await response.json();
      setBranches(data.map((branch) => branch.name));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setBranchesLoading(false);
    }
  }

  if (authLoading) {
    return (
      <>
        <Nav logo={<img src={ecollectLogo} alt="Ecollect" />} />
        <main className="p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
          <p className="text-gray-600">Verificando sesión...</p>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Nav logo={<img src={ecollectLogo} alt="Ecollect" />} />
      <main className="p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
        {!user ? (
          <div style={{ display: 'grid', placeItems: 'center', minHeight: '40vh' }}>
            <div style={{ textAlign: 'center', display: 'grid', gap: '1rem' }}>
              <h2 style={{ margin: 0 }}>Acceso requerido</h2>
              <p style={{ margin: 0, color: '#4b5563' }}>
                Ingresa con tu cuenta de GitHub para consultar repositorios privados.
              </p>
              <LoginButton onLogin={handleGithubLogin} />
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700 }}>Bienvenido, {user.name || user.login}</p>
              </div>
              <button type="button" onClick={handleLogout} style={{ padding: '0.5rem 0.9rem', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
                Cerrar sesión
              </button>
            </div>

            <SearchFilters
              repositories={repositories}
              branches={branches}
              onSearch={fetchMerges}
              onRepositoryChange={fetchBranches}
              onResultFilterChange={setResultFilter}
              loading={loading}
              branchesLoading={branchesLoading}
            />

            {loading && <p className="text-gray-500 font-semibold">Cargando reportes...</p>}

            {!loading && error && (
              <div className="p-4 bg-red-100 text-red-700 rounded-md">
                <h2 className="font-bold">Error de conexión:</h2>
                <p>{error}</p>
              </div>
            )}

            {!loading && !error && !query ? (
              <p className="text-gray-600">Selecciona una aplicación y una rama para consultar sus merges.</p>
            ) : !loading && !error && filteredMerges.length === 0 ? (
              <p className="text-gray-600">
                {normalizedResultFilter
                  ? 'No se encontraron coincidencias para el filtro.'
                  : 'No se encontraron merges recientes en esta rama.'}
              </p>
            ) : (
              !loading && !error && <ResultsTable merges={filteredMerges} />
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );

}

export default App

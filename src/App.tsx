import { useState } from 'react'

import Nav from './components/Nav'
import Footer from './components/Footer'
import SearchFilters from './components/SearchFilters'
import ResultsTable, { type MergeCommit } from './components/ResultsTable'
import ecollectLogo from './assets/ecollect.svg'
import './App.css'

function App() {
  const [merges, setMerges] = useState<MergeCommit[]>([]);
  const [loading, setLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branches, setBranches] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [resultFilter, setResultFilter] = useState('');
  const repositories = ['plus', 'erpagent', 'bankagent', 'connector'];
  const [query, setQuery] = useState<{
    repository: string;
    branch: string;
    startDate: string;
    endDate: string;
  } | null>(null);

  const owner = import.meta.env.VITE_GITHUB_OWNER;
  const token = import.meta.env.VITE_GITHUB_TOKEN;
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

        const headers = {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        };
        const [response, tagsResponse] = await Promise.all([
          fetch(`https://api.github.com/repos/${owner}/${repository}/commits?${params.toString()}`, { headers }),
          fetch(`https://api.github.com/repos/${owner}/${repository}/tags?per_page=100`, { headers }),
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
          .filter((commitItem) => commitItem.parents.length > 0)
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
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repository}/branches?per_page=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

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

  return (
    <>
      <Nav logo={<img src={ecollectLogo} alt="Ecollect" />} />
      <main className="p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
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
      </main>
      <Footer />
    </>
  );

}

export default App

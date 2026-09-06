import { useEffect, useState } from 'react'

import './ResultsTable.css'

export type MergeCommit = {
  sha: string
  html_url: string
  tags: string[]
  commit: {
    message: string
    author: {
      name: string
      date: string
    }
  }
}

type ResultsTableProps = {
  merges: MergeCommit[]
}

function escapeCsvValue(value: string) {
  return `"${value.replace(/"/g, '""')}"`
}

function ResultsTable({ merges }: ResultsTableProps) {
  const pageSize = 25
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(merges.length / pageSize)
  const firstItemIndex = (currentPage - 1) * pageSize
  const visibleMerges = merges.slice(firstItemIndex, firstItemIndex + pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [merges])

  function downloadCsv() {
    const headers = ['Tags', 'Mensaje', 'Integrado por', 'Fecha']
    const rows = merges.map((item) => [
      item.tags.join(', '),
      item.commit.message.split('\n')[0],
      item.commit.author.name,
      new Date(item.commit.author.date).toLocaleString('es-ES'),
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => escapeCsvValue(value)).join(','))
      .join('\r\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'reporte-merges.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="results-table-container">
      <div className="results-table-actions">
        <button type="button" className="results-table__download" onClick={downloadCsv}>
          Descargar CSV
        </button>
      </div>
      <div className="results-table-wrapper">
        <table className="results-table">
          <caption>Listado de merges recientes</caption>
          <thead>
            <tr>
              <th scope="col">Commit</th>
              <th scope="col">Tags</th>
              <th scope="col">Mensaje</th>
              <th scope="col">In-geniero</th>
              <th scope="col">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {visibleMerges.map((item) => (
              <tr key={item.sha}>
                <td data-label="Commit">
                  <a
                    href={item.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="results-table__commit-link"
                  >
                    {item.sha.substring(0, 7)}
                  </a>
                </td>
                <td data-label="Tags">
                  <div className="results-table__tags">
                    {item.tags.length > 0 ? item.tags.map((tag) => (
                      <span className="results-table__tag" key={tag}>{tag}</span>
                    )) : <span className="results-table__no-tag">Sin tag</span>}
                  </div>
                </td>
                <td className="results-table__message" data-label="Mensaje">
                  {item.commit.message.split('\n')[0]}
                </td>
                <td data-label="Integrado por">
                  <span className="results-table__author">
                    <span className="results-table__avatar" aria-hidden="true">
                      {item.commit.author.name.charAt(0).toUpperCase()}
                    </span>
                    <strong>{item.commit.author.name}</strong>
                  </span>
                </td>
                <td data-label="Fecha" className="results-table__date">
                  {new Date(item.commit.author.date).toLocaleDateString('es-ES', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <nav className="results-pagination" aria-label="Paginación de resultados">
          <button
            type="button"
            className="results-pagination__button"
            onClick={() => setCurrentPage((page) => page - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </button>
          <span className="results-pagination__status" aria-live="polite">
            Página {currentPage} de {totalPages}
          </span>
          <button
            type="button"
            className="results-pagination__button"
            onClick={() => setCurrentPage((page) => page + 1)}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </button>
        </nav>
      )}
    </div>
  )
}

export default ResultsTable
import { useState, type FormEvent } from 'react'

import './SearchFilters.css'

type SearchFiltersProps = {
  repositories: string[]
  branches: string[]
  onSearch: (repository: string, branch: string, startDate: string, endDate: string) => void
  onRepositoryChange: (repository: string) => void
  onResultFilterChange: (value: string) => void
  loading?: boolean
  branchesLoading?: boolean
}

function SearchFilters({
  repositories,
  branches,
  onSearch,
  onRepositoryChange,
  onResultFilterChange,
  loading = false,
  branchesLoading = false,
}: SearchFiltersProps) {
  const [repository, setRepository] = useState('')
  const [branch, setBranch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [resultFilter, setResultFilter] = useState('')
  const [dateError, setDateError] = useState('')

  function handleRepositoryChange(value: string) {
    setRepository(value)
    setBranch('')
    setResultFilter('')
    onResultFilterChange('')
    onRepositoryChange(value)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (startDate && endDate && startDate > endDate) {
      setDateError('La fecha inicial debe ser anterior a la fecha final.')
      return
    }

    setDateError('')
    onSearch(repository, branch, startDate, endDate)
  }

  return (
    <form className="search-filters" onSubmit={handleSubmit}>
      <label className="search-filter">
        <span>Aplicación</span>
        <select value={repository} onChange={(event) => handleRepositoryChange(event.target.value)}>
          <option value="">Selecciona una aplicación</option>
          {repositories.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>

      <label className="search-filter">
        <span>Rama</span>
        <select
          value={branch}
          onChange={(event) => setBranch(event.target.value)}
          disabled={!repository || branchesLoading}
        >
          <option value="">
            {branchesLoading ? 'Cargando ramas...' : 'Selecciona una rama'}
          </option>
          {branches.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>

      <label className="search-filter">
        <span>Fecha desde</span>
        <input
          type="date"
          value={startDate}
          max={endDate || undefined}
          onChange={(event) => setStartDate(event.target.value)}
        />
      </label>

      <label className="search-filter">
        <span>Fecha hasta</span>
        <input
          type="date"
          value={endDate}
          min={startDate || undefined}
          onChange={(event) => setEndDate(event.target.value)}
        />
      </label>

      {dateError && <p className="search-filters__error" role="alert">{dateError}</p>}

      <button className="search-filters__submit" type="submit" disabled={loading || branchesLoading || !repository || !branch}>
        {loading ? 'Consultando...' : 'Consultar'}
      </button>

      <label className="search-filter search-filter--results">
        <span>Filtrar resultados</span>
        <input
          type="search"
          value={resultFilter}
          placeholder="Mensaje, ingeniero o tag"
          onChange={(event) => {
            setResultFilter(event.target.value)
            onResultFilterChange(event.target.value)
          }}
          aria-label="Filtrar por mensaje, ingeniero o tag"
        />
      </label>
    </form>
  )
}

export default SearchFilters
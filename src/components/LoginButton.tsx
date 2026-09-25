type LoginButtonProps = {
  onLogin: () => void
  loading?: boolean
}

function LoginButton({ onLogin, loading = false }: LoginButtonProps) {
  return (
    <button
      type="button"
      onClick={onLogin}
      disabled={loading}
      style={{
        padding: '0.75rem 1.25rem',
        border: 'none',
        borderRadius: '10px',
        background: '#111827',
        color: '#fff',
        fontWeight: 700,
        cursor: loading ? 'not-allowed' : 'pointer',
      }}
    >
      {loading ? 'Conectando...' : 'Ingresar con GitHub'}
    </button>
  )
}

export default LoginButton

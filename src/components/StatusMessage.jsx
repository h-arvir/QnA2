import { AlertTriangle, Info, CheckCircle } from 'lucide-react'

const StatusMessage = ({ message, type = 'info', className = '' }) => {
  if (!message) return null

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertTriangle size={20} />
      case 'success':
        return <CheckCircle size={20} />
      case 'info':
      default:
        return <Info size={20} />
    }
  }

  const getMessageClass = () => {
    switch (type) {
      case 'error':
        return 'error-message'
      case 'success':
        return 'status-message success'
      case 'info':
      default:
        return 'status-message info'
    }
  }

  if (type === 'error') {
    return (
      <div className={`error-message ${className}`}>
        <div className="error-icon">
          {getIcon()}
        </div>
        <div className="error-content">
          <h3>Processing Error</h3>
          <p>{message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${getMessageClass()} ${className}`}>
      <div className="status-icon">
        {getIcon()}
      </div>
      <p>{message}</p>
    </div>
  )
}

export default StatusMessage
const Sidebar = ({ activeSection, onSectionChange, navigationItems }) => {
  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">PDF Q&A</h1>
        <p className="sidebar-subtitle">Extract & Analyze</p>
      </div>
      
      <div className="nav-items" data-active={activeSection}>
        {navigationItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => onSectionChange(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

export default Sidebar
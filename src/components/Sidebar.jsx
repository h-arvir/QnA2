import React from 'react'
import { FileText, Key, Database } from 'lucide-react'

const Sidebar = ({ activeSection, onSectionChange, navigationItems }) => {
  // Function to render the appropriate icon based on iconName
  const renderIcon = (iconName) => {
    switch (iconName) {
      case 'FileText':
        return <FileText size={20} />;
      case 'Key':
        return <Key size={20} />;
      case 'Database':
        return <Database size={20} />;
      default:
        return null;
    }
  };

  return (
    <nav className="sidebar">
      <div  className="sidebar-header">
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
            <span className="nav-icon">{renderIcon(item.iconName)}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

export default Sidebar
import React from 'react'

export function StatCard({ title, value, subtitle, tone = 'default' }) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <span className="stat-title">{title}</span>
      <strong className="stat-value">{value}</strong>
      {subtitle ? <span className="stat-subtitle">{subtitle}</span> : null}
    </article>
  )
}

export function SectionCard({ id, title, description, actions, children, footer, bleed = false }) {
  return (
    <section id={id} className={`section-card${bleed ? ' section-bleed' : ''}`}>
      <header className="section-heading">
        <div>
          <h3>{title}</h3>
          {description ? <p className="section-description">{description}</p> : null}
        </div>
        {actions ? <div className="section-actions">{actions}</div> : null}
      </header>
      <div className="section-body">{children}</div>
      {footer ? <footer className="section-footer">{footer}</footer> : null}
    </section>
  )
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action || null}
    </div>
  )
}

export default function DashboardLayout({ user, roleLabel, navItems = [], hero, children, footer }) {
  const handleNavClick = (target) => (event) => {
    event.preventDefault()
    if (!target) return
    if (typeof document === 'undefined') return
    const el = document.getElementById(target)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const displayName = user?.nombre || user?.name || user?.email || 'Usuario'

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-menu">
        <div className="menu-brand">
          <div className="menu-logo">SI</div>
          <div className="menu-meta">
            <span className="menu-eyebrow">{roleLabel}</span>
            <strong className="menu-name">{displayName}</strong>
          </div>
        </div>
        {navItems.length ? (
          <nav className="menu-nav">
            {navItems.map((item) => (
              <a
                key={item.id || item.target || item.label}
                href={`#${item.target || item.id}`}
                className="menu-link"
                onClick={handleNavClick(item.target || item.id)}
              >
                <span>{item.label}</span>
                {item.badge ? <span className="menu-badge">{item.badge}</span> : null}
              </a>
            ))}
          </nav>
        ) : null}
      </aside>
      <main className="dashboard-main">
        {hero ? <div className="dashboard-hero">{hero}</div> : null}
        <div className="dashboard-content">{children}</div>
        {footer ? <footer className="dashboard-footer">{footer}</footer> : null}
      </main>
    </div>
  )
}

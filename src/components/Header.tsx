interface HeaderProps {
  buildTime: string
}

export default function Header({ buildTime }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-title">
          <span className="header-icon">✦</span>
          <h1>Dev Daily Digest</h1>
        </div>
        <p className="header-sub">前端工程師的每日開發者精選</p>
      </div>
      <footer className="footer">
        最後更新：{buildTime}
      </footer>
    </header>
  )
}

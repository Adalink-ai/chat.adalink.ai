export function LoginFooter({ isMobile = false }: { isMobile?: boolean }) {
  return (
    <div className="flex flex-col gap-2 text-xs text-primary-foreground/60">
      <div className="flex items-center gap-2">
        <span>© 2024 AdaLink</span>
        {isMobile && <span>•</span>}
      </div>
      {isMobile && (
        <div className="flex items-center gap-2">
          <span>Termos de uso</span>
          <span>•</span>
          <span>Privacidade</span>
        </div>
      )}
    </div>
  )
}
import { Github, ExternalLink } from 'lucide-react'

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <a
            href="https://github.com/aaronmolina"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <Github className="h-3 w-3" />
            <span>GitHub</span>
          </a>
          <span className="text-muted-foreground/50">•</span>
          <a
            href="https://aaronmolina.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <span>Website</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </footer>
  )
}

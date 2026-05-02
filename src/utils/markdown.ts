function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function inlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, '<img src="$2" alt="$1" />')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
}

function imageHtml(value: string) {
  const match = /^<img\s+([^>]+)>$/.exec(value)
  if (!match) {
    return ''
  }

  const src = /src=["']([^"']+)["']/.exec(match[1])?.[1] || ''
  const alt = /alt=["']([^"']*)["']/.exec(match[1])?.[1] || ''
  const storageId = /data-storage-id=["'](\d+)["']/.exec(match[1])?.[1] || ''
  const width = /width:\s*([0-9.]+%|[0-9.]+px)/.exec(match[1])?.[1] || ''

  if (!/^https?:\/\//.test(src) && !src.startsWith('/')) {
    return ''
  }

  const style = width ? ` style="width: ${width};"` : ''
  const storageAttribute = storageId ? ` data-storage-id="${storageId}"` : ''
  return `<figure class="markdown-image"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"${storageAttribute}${style} /></figure>`
}

export function markdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const html: string[] = []
  let paragraph: string[] = []
  let listType: 'ul' | 'ol' | null = null
  let inCodeBlock = false
  let codeLines: string[] = []

  function flushParagraph() {
    if (!paragraph.length) {
      return
    }
    html.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`)
    paragraph = []
  }

  function closeList() {
    if (!listType) {
      return
    }
    html.push(`</${listType}>`)
    listType = null
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const trimmed = line.trim()

    if (trimmed.startsWith('```')) {
      flushParagraph()
      closeList()
      if (inCodeBlock) {
        html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
        codeLines = []
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeLines.push(rawLine)
      continue
    }

    if (!trimmed) {
      flushParagraph()
      closeList()
      continue
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(trimmed)
    if (heading) {
      flushParagraph()
      closeList()
      const level = heading[1].length
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`)
      continue
    }

    const image = imageHtml(trimmed)
    if (image) {
      flushParagraph()
      closeList()
      html.push(image)
      continue
    }

    const quote = /^>\s+(.+)$/.exec(trimmed)
    if (quote) {
      flushParagraph()
      closeList()
      html.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`)
      continue
    }

    const unordered = /^[-*]\s+(.+)$/.exec(trimmed)
    if (unordered) {
      flushParagraph()
      if (listType !== 'ul') {
        closeList()
        listType = 'ul'
        html.push('<ul>')
      }
      html.push(`<li>${inlineMarkdown(unordered[1])}</li>`)
      continue
    }

    const ordered = /^\d+\.\s+(.+)$/.exec(trimmed)
    if (ordered) {
      flushParagraph()
      if (listType !== 'ol') {
        closeList()
        listType = 'ol'
        html.push('<ol>')
      }
      html.push(`<li>${inlineMarkdown(ordered[1])}</li>`)
      continue
    }

    closeList()
    paragraph.push(trimmed)
  }

  if (inCodeBlock) {
    html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
  }
  flushParagraph()
  closeList()

  return html.join('\n')
}

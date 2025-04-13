import React from "react"

/**
 * HTMLコンテンツを安全に表示するコンポーネント
 * 危険なタグやイベントハンドラを除去して表示します
 */
export function SafeHTML({ html, className }: { html: string, className?: string }) {
  // HTMLタグを含むかどうかチェック
  const hasHTMLTags = /<[a-z][\s\S]*>/i.test(html)
  
  // HTMLタグを含まない場合はそのまま表示
  if (!hasHTMLTags) {
    return <span className={className}>{html}</span>
  }
  
  // 危険なタグとイベントハンドラを除去
  const sanitizedHTML = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/javascript:/gi, '')
  
  // 安全なHTMLを表示
  return (
    <div 
      className={className} 
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }} 
    />
  )
} 
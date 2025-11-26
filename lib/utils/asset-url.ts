/**
 * Utilitário para gerar URLs de assets usando CloudFront
 */

const CLOUDFRONT_BASE_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_BASE_URL || ''

/**
 * Converte caminho relativo para URL completa do CloudFront
 * @param relativePath Caminho relativo (ex: /uploads/assistents/images/file.jpg)
 * @returns URL completa do CloudFront ou null
 */
export function getAssetUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null
  
  // Se já for uma URL completa, retorna como está
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath
  }
  
  // Se for asset interno (/assets/...), retorna como está
  if (relativePath.startsWith('/assets/')) {
    return relativePath
  }
  
  // Remove barras duplicadas no início
  const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`
  
  // Se não tiver URL do CloudFront configurada, retorna o path relativo
  if (!CLOUDFRONT_BASE_URL) {
    return cleanPath
  }
  
  const finalUrl = `${CLOUDFRONT_BASE_URL}${cleanPath}`
  return finalUrl
}

/**
 * Verifica se uma URL é do S3 antigo (para migração)
 */
export function isLegacyS3Url(url: string): boolean {
  return url.includes('s3.amazonaws.com') || url.includes('gptcorp-s3')
}

/**
 * Extrai o path relativo de uma URL completa do S3
 */
export function extractRelativePath(s3Url: string): string {
  try {
    const url = new URL(s3Url)
    return url.pathname
  } catch {
    return s3Url
  }
}


"use client"

interface PrintTemplateProps {
  reimbursement: any
}

export function EvidencePhotosTemplate({ reimbursement }: PrintTemplateProps) {
  const items = reimbursement.reimbursement_items || []
  
  // Extract all unique evidence URLs
  const allEvidenceUrls = items.reduce((acc: string[], item: any) => {
    if (item.evidence_urls && Array.isArray(item.evidence_urls)) {
      item.evidence_urls.forEach((url: string) => {
        if (!acc.includes(url)) {
          acc.push(url)
        }
      })
    }
    return acc
  }, [])

  if (allEvidenceUrls.length === 0) {
    return null; // Don't render anything if there are no evidence photos
  }

  // Split into chunks of 2 (for 2 columns per page or just a 2-column grid)
  // Actually, we can just use CSS Grid to automatically flow them into 2 columns.
  // CSS Grid with break-inside-avoid helps prevent images breaking across pages.

  return (
    <>
      <div className="print:block hidden break-before-page" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', background: '#fff', fontFamily: 'Arial, sans-serif', padding: '20mm' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', marginBottom: '24px', color: '#333' }}>
          Lampiran Bukti Fisik / Barang
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {allEvidenceUrls.map((url: string, index: number) => (
            <div key={index} style={{ breakInside: 'avoid', marginBottom: '20px' }}>
              <div style={{ border: '1px solid #ddd', padding: '8px', borderRadius: '8px', background: '#f9f9f9' }}>
                <img 
                  src={url} 
                  alt={`Bukti ${index + 1}`} 
                  style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'contain' }}
                  crossOrigin="anonymous" 
                />
              </div>
              <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', color: '#666' }}>
                Lampiran {index + 1}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

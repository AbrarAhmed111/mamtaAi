'use client'

import { Download, ExternalLink, FileText } from 'lucide-react'
import { PEDIATRIC_VITALS_REFERENCE, PEDIATRIC_VITALS_REFERENCE_ANCHOR } from '@/lib/oximeter/pediatric-vitals-reference'

export default function PediatricVitalsReferenceSection() {
  const { title, description, pdfUrl, attribution } = PEDIATRIC_VITALS_REFERENCE

  return (
    <section
      id={PEDIATRIC_VITALS_REFERENCE_ANCHOR}
      className="scroll-mt-24 rounded-3xl border border-pink-100/90 bg-gradient-to-br from-white via-pink-50/25 to-purple-50/30 p-5 shadow-sm shadow-pink-100/20 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-pink-100 bg-white text-rose-600 shadow-sm transition hover:border-pink-200 hover:bg-pink-50 hover:shadow-md"
            aria-label={`View ${title} PDF`}
          >
            <FileText className="h-7 w-7" strokeWidth={2} />
          </a>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">{description}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-gray-500">{attribution}</p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-pink-200/40 transition hover:from-pink-700 hover:to-rose-700"
          >
            <ExternalLink className="h-4 w-4" strokeWidth={2.2} />
            View PDF
          </a>
          <a
            href={pdfUrl}
            download="MamtaAI-Pediatric-Vital-Signs-Reference-Chart.pdf"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-semibold text-pink-700 transition hover:bg-pink-50"
          >
            <Download className="h-4 w-4" strokeWidth={2.2} />
            Download
          </a>
        </div>
      </div>
    </section>
  )
}

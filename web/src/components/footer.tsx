import Link from 'next/link'

import { SOCIAL_LINK_CLASS } from '@/lib/constants'

export function Footer() {
  return (
    <section className="mt-[30px] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-[#686868] text-[11px] font-sans font-normal leading-[14px] tracking-[-0.24px] mb-[13px]">
        Social
      </h2>
      <div className="flex items-center gap-[6px] mb-[56px]">
        <Link href="https://instagram.com/other.dev" className={SOCIAL_LINK_CLASS}>
          Instagram
        </Link>
        <Link
          href="https://linkedin.com/company/theotherdev/"
          target="_blank"
          rel="noopener noreferrer"
          className={SOCIAL_LINK_CLASS}
        >
          LinkedIn
        </Link>
        <Link
          href="https://wa.me/923156893331?text=Hi!%20I%20found%20you%20through%20otherdev.com%20and%20would%20love%20to%20discuss%20a%20project."
          target="_blank"
          rel="noopener noreferrer"
          className={SOCIAL_LINK_CLASS}
        >
          WhatsApp
        </Link>
      </div>

      <p className="text-[#686868] text-[11px] font-sans font-normal leading-[14px] tracking-[-0.24px]">
        © other dev
      </p>
    </section>
  )
}

/** @jsxImportSource react */
import { qwikify$ } from '@builder.io/qwik-react'

function FooterComponent() {
  return (
    <section className="mt-[30px]">
      <h2 className="text-[#686868] text-[11px] font-twk font-normal leading-[14px] tracking-[-0.24px] mb-[13px]">
        Social
      </h2>
      <div className="flex items-center gap-[6px] mb-[56px]">
        <a
          href="https://instagram.com/other.dev"
          className="h-[21px] px-1.5 bg-neutral-200 rounded-md flex items-center justify-center text-[#686868] text-[10px] font-twk font-normal leading-[14px] tracking-[-0.24px] hover:bg-neutral-300 transition-colors"
        >
          Instagram
        </a>
        <a
          href="https://linkedin.com/company/theotherdev/"
          target="_blank"
          rel="noopener noreferrer"
          className="h-[21px] px-1.5 bg-neutral-200 rounded-md flex items-center justify-center text-[#686868] text-[10px] font-twk font-normal leading-[14px] tracking-[-0.24px] hover:bg-neutral-300 transition-colors"
        >
          LinkedIn
        </a>
        <a
          href="https://wa.me/923156893331?text=Hi!%20I%20found%20you%20through%20otherdev.com%20and%20would%20love%20to%20discuss%20a%20project."
          target="_blank"
          rel="noopener noreferrer"
          className="h-[21px] px-1.5 bg-neutral-200 rounded-md flex items-center justify-center text-[#686868] text-[10px] font-twk font-normal leading-[14px] tracking-[-0.24px] hover:bg-neutral-300 transition-colors"
        >
          WhatsApp
        </a>
      </div>

      <p className="text-[#686868] text-[11px] font-twk font-normal leading-[14px] tracking-[-0.24px]">
        © other dev
      </p>
    </section>
  )
}

export const Footer = qwikify$(FooterComponent)
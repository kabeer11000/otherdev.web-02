"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ContactDialog } from "@/components/contact-dialog";

const navItemVariants = cva(
  "flex items-center justify-center rounded-md backdrop-blur-sm bg-stone-200/70 text-[11px] font-normal leading-tight transition-colors hover:text-foreground",
  {
    variants: {
      size: {
        brand: "h-7 w-[75px]",
        default: "h-7 w-[75px]",
        mobile: "h-7 w-[52px]",
        mobileWide: "h-7 w-[62px]",
        icon: "h-7 w-7",
      },
      active: {
        true: "text-foreground",
        false: "text-muted-foreground",
      },
    },
    defaultVariants: {
      size: "default",
      active: false,
    },
  },
);

type NavItemVariantProps = VariantProps<typeof navItemVariants>;

interface NavigationProps {
  variant?: "default" | "ai";
}

export function Navigation({ variant = "default" }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const pathname = usePathname();
  const isAIVariant = variant === "ai";

  useEffect(() => {
    const saved = sessionStorage.getItem("mobileMenuOpen");
    if (saved === "true") {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem("mobileMenuOpen", isOpen.toString());
  }, [isOpen]);

  const handleContactClick = () => {
    setContactDialogOpen(true);
  };

  return (
    <nav className="fixed top-[15px] left-0 right-0 z-[60] px-3 pointer-events-none">
      {/* Mobile Navigation (or AI variant) */}
      <div className={cn("flex items-center gap-[6px] w-full pointer-events-auto relative z-50", isAIVariant ? "" : "sm:hidden")}>
        {/* Hamburger/X Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          data-slot="nav-item"
          className={cn(
            navItemVariants({ size: "icon" }),
            "text-foreground",
          )}
          aria-label="Toggle menu"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="x-icon"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                <X size={16} strokeWidth={1.5} />
              </motion.div>
            ) : (
              <motion.div
                key="menu-icon"
                initial={{ opacity: 0, rotate: 90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -90 }}
                transition={{ duration: 0.2 }}
              >
                <Menu size={16} strokeWidth={1.5} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        <AnimatePresence mode="wait">
          {!isOpen && (
            <motion.div
              key="otherdev-pill"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Link
                href="/"
                data-slot="nav-item"
                className={cn(
                  navItemVariants({ size: "brand", active: pathname === "/" }),
                )}
              >
                Other dev
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              key="menu-open"
              className="flex items-center gap-1.5 flex-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <Link
                  href="/work"
                  data-slot="nav-item"
                  className={cn(
                    navItemVariants({
                      size: "mobile",
                      active: pathname?.startsWith("/work"),
                    }),
                  )}
                >
                  Work
                </Link>
              </motion.div>
              {/* <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
              >
                <Link
                  href="/audio"
                  data-slot="nav-item"
                  className={cn(
                    navItemVariants({
                      size: "mobile",
                      active: pathname?.startsWith("/audio"),
                    }),
                  )}
                >
                  audio
                </Link>
              </motion.div> */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <Link
                  href="/about"
                  data-slot="nav-item"
                  className={cn(
                    navItemVariants({
                      size: "mobile",
                      active: pathname?.startsWith("/about"),
                    }),
                  )}
                >
                  About
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25, duration: 0.3 }}
              >
                <Link
                  href="/otherdevloom"
                  data-slot="nav-item"
                  className={cn(
                    navItemVariants({
                      size: "mobile",
                      active: pathname?.startsWith("/otherdevloom"),
                    }),
                  )}
                >
                  Ai
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.27, duration: 0.3 }}
              >
                <button
                  onClick={handleContactClick}
                  data-slot="nav-item"
                  className={cn(
                    navItemVariants({ size: "mobileWide", active: false }),
                  )}
                >
                  Contact
                </button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.32, duration: 0.3 }}
              >
                <Link
                  href="https://wa.me/923156893331?text=Hi!%20I%20found%20you%20through%20otherdev.com%20and%20would%20love%20to%20discuss%20a%20project."
                  target="_blank"
                  rel="noopener noreferrer"
                  data-slot="nav-item"
                  className={cn(
                    navItemVariants({ size: "mobileWide", active: false }),
                  )}
                >
                  Whatsapp
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tablet/Desktop Navigation */}
      {!isAIVariant && (
      <div className="hidden sm:flex items-center gap-1.5 pointer-events-auto">
        <Link
          href="/"
          data-slot="nav-item"
          className={cn(
            navItemVariants({ size: "brand", active: pathname === "/" }),
          )}
        >
          Other dev
        </Link>
        <Link
          href="/work"
          data-slot="nav-item"
          className={cn(
            navItemVariants({
              size: "default",
              active: pathname?.startsWith("/work"),
            }),
          )}
        >
          Work
        </Link>
        {/* <Link
          href="/audio"
          data-slot="nav-item"
          className={cn(
            navItemVariants({
              size: "default",
              active: pathname?.startsWith("/audio"),
            }),
          )}
        >
          audio
        </Link> */}
        <Link
          href="/about"
          data-slot="nav-item"
          className={cn(
            navItemVariants({
              size: "default",
              active: pathname?.startsWith("/about"),
            }),
          )}
        >
          About
        </Link>
        <Link
          href="/otherdevloom"
          data-slot="nav-item"
          className={cn(
            navItemVariants({
              size: "default",
              active: pathname?.startsWith("/otherdevloom"),
            }),
          )}
        >
          Ai
        </Link>
        <button
          onClick={handleContactClick}
          data-slot="nav-item"
          className={cn(navItemVariants({ size: "default", active: false }))}
        >
          Contact
        </button>
        <Link
          href="https://wa.me/923156893331?text=Hi!%20I%20found%20you%20through%20otherdev.com%20and%20would%20love%20to%20discuss%20a%20project."
          target="_blank"
          rel="noopener noreferrer"
          data-slot="nav-item"
          className={cn(navItemVariants({ size: "default", active: false }))}
        >
          Whatsapp
        </Link>
      </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div className={cn("fixed inset-0 z-30 -backdrop-blur-lg pointer-events-none", isAIVariant ? "" : "sm:hidden")} />
      )}

      {/* Contact Dialog */}
      <ContactDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
      />
    </nav>
  );
}

export { navItemVariants };

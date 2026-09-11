"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { MenuIcon, XIcon, LayoutDashboardIcon, ExternalLinkIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const PLANES_PERSONALIZADOS_URL = "https://dashboard-plan-personalizado.vercel.app/";

export function SideMenu() {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger
        aria-label="Abrir menú"
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-transparent text-foreground transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <MenuIcon className="size-5" />
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className={cn(
            "fixed inset-0 z-50 bg-black/60 duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
          )}
        />
        <DialogPrimitive.Popup
          className={cn(
            "fixed top-0 left-0 z-50 flex h-full w-72 max-w-[85vw] flex-col gap-6 border-r border-border bg-card p-5 shadow-xl outline-hidden duration-150",
            "data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left"
          )}
        >
          <div className="flex items-center justify-between">
            <DialogPrimitive.Title className="font-heading text-lg font-bold text-foreground">
              Dashboards
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Cerrar menú"
              className="rounded-md p-1 text-muted-foreground opacity-70 transition-opacity hover:bg-muted hover:opacity-100 focus:outline-none"
            >
              <XIcon className="size-4" />
            </DialogPrimitive.Close>
          </div>

          <nav className="flex flex-col gap-2">
            <DialogPrimitive.Close
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <LayoutDashboardIcon className="size-4" />
              SAC
            </DialogPrimitive.Close>

            <a
              href={PLANES_PERSONALIZADOS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <ExternalLinkIcon className="size-4" />
              Planes personalizados
            </a>
          </nav>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

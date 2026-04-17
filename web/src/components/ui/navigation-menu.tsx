'use client'

import { NavigationMenu } from '@base-ui/react/navigation-menu'
import { cva } from 'class-variance-authority'
import { ChevronDownIcon } from 'lucide-react'
import type * as React from 'react'

import { cn } from '@/lib/utils'

function NavigationMenuRoot({
  className,
  children,
  viewport = true,
  ...props
}: React.ComponentProps<typeof NavigationMenu.Root> & {
  viewport?: boolean
}) {
  return (
    <NavigationMenu.Root
      data-slot="navigation-menu"
      data-viewport={viewport}
      className={cn(
        'group/navigation-menu relative flex max-w-max flex-1 items-center justify-center',
        className
      )}
      {...props}
    >
      {children}
      {viewport && <NavigationMenuViewport />}
    </NavigationMenu.Root>
  )
}

function NavigationMenuList({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenu.List>) {
  return (
    <NavigationMenu.List
      data-slot="navigation-menu-list"
      className={cn('group flex flex-1 list-none items-center justify-center gap-1', className)}
      {...props}
    />
  )
}

function NavigationMenuItemComponent({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenu.Item>) {
  return (
    <NavigationMenu.Item
      data-slot="navigation-menu-item"
      className={cn('relative', className)}
      {...props}
    />
  )
}

const navigationMenuTriggerStyle = cva(
  'group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 data-[open]:hover:bg-accent data-[open]:text-accent-foreground data-[open]:focus:bg-accent data-[open]:bg-accent/50 focus-visible:ring-ring/50 outline-none transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1'
)

function NavigationMenuTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof NavigationMenu.Trigger>) {
  return (
    <NavigationMenu.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(navigationMenuTriggerStyle(), 'group', className)}
      {...props}
    >
      {children}{' '}
      <ChevronDownIcon
        className="relative top-[1px] ml-1 size-3 transition duration-300 group-data-[open]:rotate-180"
        aria-hidden="true"
      />
    </NavigationMenu.Trigger>
  )
}

function NavigationMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenu.Content>) {
  return (
    <NavigationMenu.Content
      data-slot="navigation-menu-content"
      className={cn(
        'data-[open]:animate-in data-[closed]:animate-out data-[open]:fade-in data-[closed]:fade-out top-0 left-0 w-full p-2 pr-2.5 md:absolute md:w-auto',
        'group-data-[viewport=false]/navigation-menu:bg-popover group-data-[viewport=false]/navigation-menu:text-popover-foreground group-data-[viewport=false]/navigation-menu:data-[open]:animate-in group-data-[viewport=false]/navigation-menu:data-[closed]:animate-out group-data-[viewport=false]/navigation-menu:data-[closed]:zoom-out-95 group-data-[viewport=false]/navigation-menu:data-[open]:zoom-in-95 group-data-[viewport=false]/navigation-menu:data-[open]:fade-in-0 group-data-[viewport=false]/navigation-menu:data-[closed]:fade-out-0 group-data-[viewport=false]/navigation-menu:top-full group-data-[viewport=false]/navigation-menu:mt-1.5 group-data-[viewport=false]/navigation-menu:overflow-hidden group-data-[viewport=false]/navigation-menu:rounded-md group-data-[viewport=false]/navigation-menu:border group-data-[viewport=false]/navigation-menu:shadow group-data-[viewport=false]/navigation-menu:duration-200 **:data-[slot=navigation-menu-link]:focus:ring-0 **:data-[slot=navigation-menu-link]:focus:outline-none',
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuViewport({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenu.Viewport>) {
  return (
    <NavigationMenu.Portal>
      <NavigationMenu.Positioner className="absolute top-full left-0 isolate z-50 flex justify-center">
        <NavigationMenu.Popup>
          <NavigationMenu.Viewport
            data-slot="navigation-menu-viewport"
            className={cn(
              'origin-top-center bg-popover text-popover-foreground data-[open]:animate-in data-[closed]:animate-out data-[closed]:zoom-out-95 data-[open]:zoom-in-90 relative mt-1.5 h-auto w-full overflow-hidden rounded-md border shadow md:w-auto',
              className
            )}
            {...props}
          />
        </NavigationMenu.Popup>
      </NavigationMenu.Positioner>
    </NavigationMenu.Portal>
  )
}

function NavigationMenuLink({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenu.Link>) {
  return (
    <NavigationMenu.Link
      data-slot="navigation-menu-link"
      className={cn(
        "data-[active]:focus:bg-accent data-[active]:hover:bg-accent data-[active]:bg-accent/50 data-[active]:text-accent-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus-visible:ring-ring/50 [&_svg:not([class*='text-'])]:text-muted-foreground flex flex-col gap-1 rounded-sm p-2 text-sm transition-all outline-none focus-visible:ring-[3px] focus-visible:outline-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuIndicator({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenu.Arrow>) {
  return (
    <NavigationMenu.Arrow
      data-slot="navigation-menu-indicator"
      className={cn(
        'data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out data-[open]:fade-in top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden',
        className
      )}
      {...props}
    >
      <div className="bg-border relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm shadow-md" />
    </NavigationMenu.Arrow>
  )
}

export {
  NavigationMenuRoot as NavigationMenu,
  NavigationMenuList,
  NavigationMenuItemComponent as NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
}

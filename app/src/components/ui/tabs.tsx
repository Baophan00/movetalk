import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '../../lib/utils'

export const Tabs = TabsPrimitive.Root

export function TabsList({ className, ...props }: TabsPrimitive.TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn('no-scrollbar flex gap-1.5 overflow-x-auto rounded-2xl border border-line bg-surface p-1.5', className)}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }: TabsPrimitive.TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'relative whitespace-nowrap rounded-xl px-3.5 py-2 text-[13px] font-semibold text-muted transition-colors',
        'hover:text-ink data-[state=active]:bg-primary-soft data-[state=active]:text-primary focus-ring',
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }: TabsPrimitive.TabsContentProps) {
  return <TabsPrimitive.Content className={cn('focus-ring', className)} {...props} />
}

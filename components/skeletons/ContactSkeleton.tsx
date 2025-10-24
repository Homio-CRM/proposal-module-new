import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface ContactSkeletonProps {
  title: string
  showIcon?: boolean
}

export function ContactSkeleton({ title, showIcon = true }: ContactSkeletonProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {showIcon && <Skeleton className="h-5 w-5" />}
          <Skeleton className="h-6 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

import { StatsCard } from '../StatsCard'
import { Truck } from 'lucide-react'

export default function StatsCardExample() {
  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard title="Active Trips" value="3" icon={Truck} />
    </div>
  )
}

import { CrateCounter } from '../CrateCounter'

export default function CrateCounterExample() {
  return (
    <div className="p-8 max-w-md">
      <CrateCounter initialCount={100} />
    </div>
  )
}

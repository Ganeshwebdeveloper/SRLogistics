import { MapView } from '../MapView'

export default function MapViewExample() {
  const drivers = [
    {
      id: "1",
      name: "John Smith",
      position: [40.7128, -74.0060] as [number, number],
      truckNumber: "TRK-001",
    },
    {
      id: "2",
      name: "Sarah Johnson",
      position: [40.7580, -73.9855] as [number, number],
      truckNumber: "TRK-002",
    },
  ];

  return (
    <div className="p-8">
      <MapView drivers={drivers} />
    </div>
  )
}

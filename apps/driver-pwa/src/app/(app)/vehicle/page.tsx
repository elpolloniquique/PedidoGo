import { Alert } from '@pedidosgo/ui';
import { VehicleForm } from '@/components/driver/vehicle-form';
import {
  canEditApplication,
  getDriverVehicles,
  requireDriver,
  VEHICLE_TYPE_LABELS,
} from '@/lib/driver';

export default async function VehiclePage() {
  const { driver } = await requireDriver();
  const vehicles = await getDriverVehicles(driver.id);
  const editable = canEditApplication(driver.status);

  return (
    <div className="space-y-6 rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Vehículo</h2>
        <p className="mt-1 text-sm text-slate-600">
          Registra el vehículo que usarás para las entregas.
        </p>
      </div>

      {vehicles.length > 0 ? (
        <Alert variant="info">
          Actual: {VEHICLE_TYPE_LABELS[vehicles[0]?.vehicleType ?? ''] ?? vehicles[0]?.vehicleType}{' '}
          {vehicles[0]?.brand} {vehicles[0]?.model} · {vehicles[0]?.licensePlate}
        </Alert>
      ) : null}

      {editable ? (
        <VehicleForm vehicles={vehicles} />
      ) : (
        <Alert variant="info">No puedes editar el vehículo en el estado actual.</Alert>
      )}
    </div>
  );
}

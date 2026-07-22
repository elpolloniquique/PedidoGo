/** Roles del sistema (Fase 0 / 2) */
export type UserRole =
  | 'super_admin'
  | 'platform_admin'
  | 'merchant_owner'
  | 'merchant_admin'
  | 'merchant_operator'
  | 'driver'
  | 'customer'
  | 'support_agent';

/** Estados de solicitud del repartidor */
export type DriverApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'changes_required'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'blocked'
  | 'expired';

/** Tipos de vehículo */
export type VehicleType =
  | 'motorcycle'
  | 'car'
  | 'bicycle'
  | 'electric_bicycle'
  | 'scooter'
  | 'walking'
  | 'other';

/** Modo de despacho de delivery */
export type DeliveryDispatchMode = 'automatic' | 'manual';

export type DispatchModeOverride = 'inherit' | 'automatic' | 'manual';

/** Estados principales del delivery */
export type DeliveryStatus =
  | 'created'
  | 'waiting_dispatch'
  | 'searching_driver'
  | 'receiving_offers'
  | 'driver_selected'
  | 'driver_heading_to_store'
  | 'driver_near_store'
  | 'driver_arrived_store'
  | 'order_preparing'
  | 'order_ready'
  | 'order_picked_up'
  | 'heading_to_customer'
  | 'driver_near_customer'
  | 'driver_arrived_customer'
  | 'delivery_verification'
  | 'delivered'
  | 'cancelled'
  | 'incident'
  | 'failed_delivery'
  | 'returned';

/** Disponibilidad del repartidor */
export type DriverAvailabilityStatus = 'available' | 'busy' | 'offline';

export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type AppSettingKeys =
  | 'app_name'
  | 'app_short_name'
  | 'app_description'
  | 'app_logo_url'
  | 'app_primary_color'
  | 'app_secondary_color'
  | 'app_support_email'
  | 'app_support_phone'
  | 'app_domain';

export type {
  Json,
  AppSettingRow,
  MerchantRow,
  BranchRow,
  DriverRow,
  OrderRow,
} from './database';

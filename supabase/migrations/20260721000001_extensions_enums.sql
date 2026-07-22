-- PedidosGo Fase 2: extensiones y tipos enumerados
-- Reversible: ver 20260721009999_down.sql (manual)

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- Estados de solicitud del repartidor
CREATE TYPE public.driver_application_status AS ENUM (
  'draft',
  'submitted',
  'under_review',
  'changes_required',
  'approved',
  'rejected',
  'suspended',
  'blocked',
  'expired'
);

CREATE TYPE public.vehicle_type AS ENUM (
  'motorcycle',
  'car',
  'bicycle',
  'electric_bicycle',
  'scooter',
  'walking',
  'other'
);

CREATE TYPE public.delivery_dispatch_mode AS ENUM ('automatic', 'manual');

CREATE TYPE public.dispatch_mode_override AS ENUM ('inherit', 'automatic', 'manual');

CREATE TYPE public.delivery_status AS ENUM (
  'created',
  'waiting_dispatch',
  'searching_driver',
  'receiving_offers',
  'driver_selected',
  'driver_heading_to_store',
  'driver_near_store',
  'driver_arrived_store',
  'order_preparing',
  'order_ready',
  'order_picked_up',
  'heading_to_customer',
  'driver_near_customer',
  'driver_arrived_customer',
  'delivery_verification',
  'delivered',
  'cancelled',
  'incident',
  'failed_delivery',
  'returned'
);

CREATE TYPE public.driver_availability_status AS ENUM ('available', 'busy', 'offline');

CREATE TYPE public.order_status AS ENUM (
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled'
);

CREATE TYPE public.payment_method AS ENUM (
  'cash',
  'card',
  'transfer',
  'other'
);

CREATE TYPE public.payment_status AS ENUM (
  'pending',
  'paid',
  'failed',
  'refunded'
);

CREATE TYPE public.merchant_user_role AS ENUM (
  'owner',
  'admin',
  'operator'
);

CREATE TYPE public.document_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'expired'
);

CREATE TYPE public.notification_type AS ENUM (
  'info',
  'order',
  'delivery',
  'offer',
  'payment',
  'system',
  'support'
);

CREATE TYPE public.ticket_status AS ENUM (
  'open',
  'in_progress',
  'resolved',
  'closed'
);

CREATE TYPE public.wallet_transaction_type AS ENUM (
  'earning',
  'commission',
  'payment',
  'adjustment',
  'bonus',
  'penalty'
);

CREATE TYPE public.auto_selection_strategy AS ENUM (
  'first_accepted',
  'nearest_driver',
  'best_rating',
  'lowest_price',
  'fastest_arrival',
  'balanced_score'
);

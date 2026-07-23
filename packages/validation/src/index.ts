import { z } from 'zod';

/** Esquemas de validación RapideX */

export const emailSchema = z.string().trim().email('Correo no válido');

export const phoneSchema = z
  .string()
  .trim()
  .min(8, 'Teléfono demasiado corto')
  .max(20, 'Teléfono demasiado largo');

export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña es demasiado larga');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
    firstName: z.string().trim().min(2, 'Ingresa tu nombre'),
    lastName: z.string().trim().min(2, 'Ingresa tu apellido'),
    phone: z
      .string()
      .trim()
      .refine((value) => value === '' || (value.length >= 8 && value.length <= 20), {
        message: 'Teléfono no válido',
      }),
    intendedRole: z.enum(['driver', 'merchant_owner', 'customer']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const updatePasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(2, 'Ingresa tu nombre'),
  lastName: z.string().trim().min(2, 'Ingresa tu apellido'),
  phone: z
    .string()
    .trim()
    .refine((value) => value === '' || (value.length >= 8 && value.length <= 20), {
      message: 'Teléfono no válido',
    }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const driverPersonalSchema = z.object({
  rut: z.string().trim().min(8, 'RUT inválido').max(20),
  birthDate: z.string().min(1, 'Ingresa tu fecha de nacimiento'),
  region: z.string().trim().min(2, 'Ingresa la región'),
  city: z.string().trim().min(2, 'Ingresa la ciudad'),
  commune: z.string().trim().min(2, 'Ingresa la comuna'),
  addressLine: z.string().trim().min(5, 'Ingresa tu dirección'),
  emergencyContactName: z.string().trim().min(2, 'Contacto de emergencia'),
  emergencyContactPhone: phoneSchema,
});

export type DriverPersonalInput = z.infer<typeof driverPersonalSchema>;

export const vehicleTypeSchema = z.enum([
  'motorcycle',
  'car',
  'bicycle',
  'electric_bicycle',
  'scooter',
  'walking',
  'other',
]);

export const driverVehicleSchema = z.object({
  vehicleType: vehicleTypeSchema,
  brand: z.string().trim().min(1, 'Marca requerida'),
  model: z.string().trim().min(1, 'Modelo requerido'),
  year: z.coerce.number().int().min(1980).max(2100),
  color: z.string().trim().min(1, 'Color requerido'),
  licensePlate: z.string().trim().min(3, 'Patente requerida').max(15),
  capacity: z.string().trim().optional(),
});

export type DriverVehicleInput = z.infer<typeof driverVehicleSchema>;

export const driverDocumentTypeSchema = z.enum([
  'id_front',
  'id_back',
  'license',
  'circulation_permit',
  'mandatory_insurance',
  'technical_review',
  'other',
]);

export type DriverDocumentType = z.infer<typeof driverDocumentTypeSchema>;

export const geoPointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const deliveryDispatchModeSchema = z.enum(['automatic', 'manual']);

export const reviewDriverActionSchema = z.enum([
  'approve',
  'reject',
  'changes_required',
  'under_review',
]);

export const merchantUpdateSchema = z.object({
  name: z.string().trim().min(2, 'Nombre del comercio'),
  legalName: z.string().trim().optional(),
  email: z.string().trim().email('Correo no válido').optional().or(z.literal('')),
  phone: z
    .string()
    .trim()
    .refine((value) => value === '' || (value.length >= 8 && value.length <= 20), {
      message: 'Teléfono no válido',
    }),
  websiteUrl: z.string().trim().url('URL no válida').optional().or(z.literal('')),
});

export type MerchantUpdateInput = z.infer<typeof merchantUpdateSchema>;

export const branchUpsertSchema = z.object({
  name: z.string().trim().min(2, 'Nombre de sucursal'),
  code: z.string().trim().max(30).optional(),
  addressLine: z.string().trim().min(5, 'Dirección requerida'),
  city: z.string().trim().min(2),
  commune: z.string().trim().min(2),
  region: z.string().trim().optional(),
  phone: z
    .string()
    .trim()
    .refine((value) => value === '' || (value.length >= 8 && value.length <= 20), {
      message: 'Teléfono no válido',
    }),
  isActive: z.coerce.boolean().optional(),
});

export type BranchUpsertInput = z.infer<typeof branchUpsertSchema>;

export const branchSettingsSchema = z.object({
  deliveryDispatchMode: deliveryDispatchModeSchema,
  autoSelectionStrategy: z.enum([
    'first_accepted',
    'nearest_driver',
    'best_rating',
    'lowest_price',
    'fastest_arrival',
    'balanced_score',
  ]),
  defaultSearchRadiusKm: z.coerce.number().min(1).max(50),
  offerTimeoutSeconds: z.coerce.number().int().min(30).max(900),
  allowDriverOffers: z.coerce.boolean(),
  allowFixedFare: z.coerce.boolean(),
});

export type BranchSettingsInput = z.infer<typeof branchSettingsSchema>;

export const branchHourSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  opensAt: z.string().min(4),
  closesAt: z.string().min(4),
  isClosed: z.coerce.boolean(),
});

export const branchHoursSchema = z.array(branchHourSchema).length(7);

export const merchantUserInviteSchema = z.object({
  email: emailSchema,
  role: z.enum(['admin', 'operator']),
  branchId: z.string().uuid().optional().or(z.literal('')),
});

export type MerchantUserInviteInput = z.infer<typeof merchantUserInviteSchema>;

export const orderStatusSchema = z.enum([
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
]);

export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const paymentMethodSchema = z.enum(['cash', 'card', 'transfer', 'other']);

export const orderItemSchema = z.object({
  productName: z.string().trim().min(1, 'Nombre del producto'),
  quantity: z.coerce.number().positive('Cantidad inválida'),
  unitPrice: z.coerce.number().min(0, 'Precio inválido'),
  notes: z.string().trim().optional(),
});

export const createOrderSchema = z.object({
  branchId: z.string().uuid('Sucursal requerida'),
  customerName: z.string().trim().min(2, 'Nombre del cliente'),
  customerPhone: phoneSchema,
  deliveryAddress: z.string().trim().min(5, 'Dirección de entrega'),
  deliveryCommune: z.string().trim().min(2, 'Comuna'),
  deliveryCity: z.string().trim().min(2, 'Ciudad'),
  deliveryApartment: z.string().trim().optional(),
  deliveryReferences: z.string().trim().optional(),
  paymentMethod: paymentMethodSchema.default('cash'),
  amountToCollect: z.coerce.number().min(0).default(0),
  deliveryFee: z.coerce.number().min(0).default(0),
  fixedFare: z.coerce.number().min(0).optional(),
  notes: z.string().trim().optional(),
  publish: z.coerce.boolean().optional(),
  items: z.array(orderItemSchema).min(1, 'Agrega al menos un ítem'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const deliveryOfferSchema = z.object({
  deliveryRequestId: z.string().uuid(),
  offeredPrice: z.coerce.number().positive('Ingresa un precio'),
  estimatedMinutes: z.coerce.number().int().min(1).max(240).optional(),
  message: z.string().trim().max(300).optional(),
});

export type DeliveryOfferInput = z.infer<typeof deliveryOfferSchema>;

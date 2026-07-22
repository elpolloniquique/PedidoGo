import { Alert } from '@pedidosgo/ui';
import { DocumentUploadForm } from '@/components/driver/document-upload-form';
import {
  canEditApplication,
  DOCUMENT_TYPE_LABELS,
  getDriverDocuments,
  requireDriver,
} from '@/lib/driver';

export default async function DocumentsPage() {
  const { driver } = await requireDriver();
  const documents = await getDriverDocuments(driver.id);
  const editable = canEditApplication(driver.status);

  return (
    <div className="space-y-6 rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Documentos</h2>
        <p className="mt-1 text-sm text-slate-600">
          Sube cédula, licencia y demás documentos. Se guardan en Storage privado.
        </p>
      </div>

      {editable ? <DocumentUploadForm /> : (
        <Alert variant="info">No puedes subir documentos en el estado actual.</Alert>
      )}

      <div className="space-y-2">
        <h3 className="font-medium text-slate-800">Documentos cargados</h3>
        {documents.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no hay documentos.</p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
            {documents.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span>{DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentType}</span>
                <span className="text-slate-500">{doc.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

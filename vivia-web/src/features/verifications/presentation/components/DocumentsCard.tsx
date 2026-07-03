import type { LessorDocument } from '../../domain/entities/LessorDocument';

function formatDocumentType(documentType: string): string {
  const withSpaces = documentType.replace(/_/g, ' ').toLowerCase();
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

function formatUploadedAt(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

interface DocumentsCardProps {
  documents: LessorDocument[];
}

export function DocumentsCard({ documents }: DocumentsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-[0px_2px_8px_0px_rgba(0,0,0,0.06)] p-6">
      <h2 className="font-poppins font-semibold text-[14px] text-vivia-dark">Documentos de Identidad</h2>
      <p className="font-poppins text-[11px] text-[#6f7e88] mt-1">Haz clic en una imagen para ampliar</p>

      <div className="h-px bg-[#e6eaed] my-4" />

      {documents.length === 0 && (
        <p className="font-poppins text-[12px] text-[#6f7e88] text-center py-10">
          Este arrendador no tiene documentos subidos.
        </p>
      )}

      <div className="flex flex-col gap-6">
        {documents.map((doc) => (
          <div key={doc.id}>
            <p className="font-poppins font-medium text-[11px] text-[#6f7e88] uppercase">
              {formatDocumentType(doc.documentType)}
            </p>
            <div className="mt-2 rounded-lg bg-[#f0f6f7] border-[1.5px] border-dashed border-[#e6eaed] p-2 flex items-center justify-center">
              <img
                src={doc.uri}
                alt={formatDocumentType(doc.documentType)}
                className="max-h-[280px] w-full object-contain rounded"
              />
            </div>
            <p className="font-poppins text-[10px] text-[#6f7e88] mt-1.5">
              Subido: {formatUploadedAt(doc.uploadedAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

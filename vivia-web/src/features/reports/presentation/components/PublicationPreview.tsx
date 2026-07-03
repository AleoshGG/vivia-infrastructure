import { useState } from 'react';
import type { ReportedProperty } from '../../domain/entities/ReportedProperty';

interface PublicationPreviewProps {
  property: ReportedProperty;
  onClose: () => void;
}

function formatPrice(amount: number): string {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
}

export function PublicationPreview({ property, onClose }: PublicationPreviewProps) {
  const { content, contentMedia } = property;
  const images = contentMedia.filter((m) => m.type === 'IMAGE');
  const [activeImage, setActiveImage] = useState(0);

  const hero = images[activeImage] ?? images[0];
  const thumbs = images.slice(0, 3);
  const extraCount = images.length - 3;
  const lessor = content.lessor;
  const lessorFullName = lessor ? `${lessor.name} ${lessor.paternalSurname}`.trim() : '';
  const addressLine = `${content.address.street} #${content.address.exteriorNumber} ${content.address.neighborhood.name}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-[rgba(4,54,74,0.6)] flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="relative w-[390px] max-h-[88vh] bg-white rounded-[20px] overflow-y-auto overflow-x-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero */}
        <div className="relative h-[300px] bg-[#d6dce5]">
          {hero ? (
            <img src={hero.url} alt={content.title} className="size-full object-cover" />
          ) : (
            <div className="size-full flex items-center justify-center">
              <p className="font-poppins text-[12px] text-[#6f7e88]">Sin imágenes</p>
            </div>
          )}

          <div className="absolute top-4 inset-x-5 flex items-center justify-between">
            <button
              onClick={onClose}
              className="size-9 rounded-full bg-white/85 flex items-center justify-center cursor-pointer hover:bg-white"
              aria-label="Cerrar publicación"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#191d31" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full bg-white/85 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill={content.like ? '#ef4949' : 'none'} stroke={content.like ? '#ef4949' : '#191d31'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
            </div>
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-1.5">
              {images.slice(0, 5).map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`h-2 rounded-full cursor-pointer transition-all ${i === activeImage ? 'w-8 bg-[#0095ff]' : 'w-2 bg-white'}`}
                  aria-label={`Imagen ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="px-5 py-6 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h3 className="font-poppins font-bold text-[24px] leading-[1.2] text-vivia-dark">
              {content.title}
            </h3>
            <span className="self-start px-2.5 py-1.5 rounded-[20px] bg-[rgba(0,149,255,0.04)] font-poppins font-semibold text-[10px] text-[#0095ff] uppercase">
              {content.propertyType.name}
            </span>
            <p className="font-poppins font-bold text-[20px] text-vivia-dark">
              {formatPrice(content.listedPrice)}
            </p>

            <div className="flex items-center gap-5 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="p-3 rounded-full bg-[rgba(0,97,255,0.04)] flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0095ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 9V5a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v4" /><path d="M2 11h20v8H2z" /><path d="M6 11V8h5v3" /><path d="M13 11V8h5v3" />
                  </svg>
                </span>
                <p className="font-poppins font-medium text-[14px] text-[#191d31]">
                  {content.bedrooms} habitaciones
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="p-3 rounded-full bg-[rgba(0,97,255,0.04)] flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0095ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5v-2H4" /><path d="M8 5 6 7" />
                  </svg>
                </span>
                <p className="font-poppins font-medium text-[14px] text-[#191d31]">
                  {content.bathrooms} baños
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="p-3 rounded-full bg-[rgba(0,97,255,0.04)] flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0095ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                </span>
                <p className="font-poppins font-medium text-[14px] text-[#191d31]">
                  {content.areaM2} m²
                </p>
              </div>
            </div>
          </div>

          <div className="h-px bg-[#e6eaed]" />

          {lessor && (
          <div className="flex flex-col gap-4">
            <h4 className="font-poppins font-semibold text-[20px] text-[#191d31]">Agente</h4>
            <div className="flex items-center gap-4">
              {lessor.photoUrl ? (
                <img
                  src={lessor.photoUrl}
                  alt={lessorFullName}
                  className="size-[60px] rounded-full object-cover"
                />
              ) : (
                <div className="size-[60px] rounded-full bg-vivia-mid flex items-center justify-center">
                  <span className="font-poppins font-semibold text-[20px] text-white">
                    {lessorFullName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-poppins font-semibold text-[18px] text-[#191d31] truncate">
                  {lessorFullName}
                </p>
                <p className="font-poppins font-medium text-[14px] text-[#666876]">Dueño</p>
              </div>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0095ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
          </div>
          )}

          <div className="flex flex-col gap-3">
            <h4 className="font-poppins font-semibold text-[20px] text-[#191d31]">Descripción</h4>
            <p className="font-poppins text-[16px] leading-[1.7] text-[#666876]">
              {content.description}
            </p>
          </div>

          {thumbs.length > 0 && (
            <div className="flex flex-col gap-4">
              <h4 className="font-poppins font-semibold text-[20px] text-[#191d31]">
                Imágenes y videos
              </h4>
              <div className="flex items-start justify-between gap-2">
                {thumbs.map((img, i) => (
                  <div key={img.id} className="relative size-[110px] rounded-[10px] overflow-hidden">
                    <img src={img.url} alt="" className="size-full object-cover" />
                    {i === 2 && extraCount > 0 && (
                      <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                        <span className="font-poppins font-bold text-[20px] text-white">
                          {extraCount}+
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 pb-2">
            <h4 className="font-poppins font-semibold text-[20px] text-[#191d31]">Ubicación</h4>
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#0095ff">
                <path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 11.5 7.35 11.8a1 1 0 0 0 1.3 0C13 21.5 20 15.4 20 10a8 8 0 0 0-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
              </svg>
              <p className="font-poppins font-medium text-[14px] text-[#666876] tracking-[0.2px]">
                {addressLine}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

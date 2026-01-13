import { Mail, Phone, MapPin, Clock, Truck, Calendar, User, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { TEXTS } from '@/content/texts';

interface Solicitud {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  zona: string;
  experiencia?: string;
  tipoVehiculo?: string;
  caracteristicasVehiculo?: string;
  fechaInicio?: string;
  horarioDisponible?: string;
  autonomo?: string;
  comentarios?: string;
  fecha: string;
  estado: string;
  leido: boolean;
}

interface SolicitudesViewProps {
  solicitudes: Solicitud[];
  loadingSolicitudes: boolean;
  onActualizarSolicitud: (id: string, cambios: { estado?: string; leido?: boolean }) => void;
  onActualizar: () => void;
}

export function SolicitudesView({ solicitudes, loadingSolicitudes, onActualizarSolicitud, onActualizar }: SolicitudesViewProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-black flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#00C9CE]/20 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#00C9CE]" />
            </div>
            {TEXTS.admin.solicitudes.title}
          </h1>
          <p className="text-gray-600">
            {TEXTS.admin.solicitudes.summary.totalPrefix} {solicitudes.length} {TEXTS.admin.solicitudes.summary.requestsLabel} • {TEXTS.admin.solicitudes.summary.pendingPrefix} {solicitudes.filter(s => s.estado === 'pendiente').length}
          </p>
        </div>
        <Button onClick={onActualizar} variant="outline" disabled={loadingSolicitudes}>
          {loadingSolicitudes ? TEXTS.admin.solicitudes.actions.loading : TEXTS.admin.solicitudes.actions.refresh}
        </Button>
      </div>

      {loadingSolicitudes ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <p className="text-gray-500">{TEXTS.admin.solicitudes.states.loadingTitle}</p>
        </div>
      ) : solicitudes.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-black text-xl mb-2">{TEXTS.admin.solicitudes.states.emptyTitle}</h3>
          <p className="text-gray-500">{TEXTS.admin.solicitudes.states.emptySubtitle}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {solicitudes.map((solicitud) => (
            <div key={solicitud.id} className={`bg-white rounded-xl p-6 shadow-sm border-2 transition-all ${
              !solicitud.leido ? 'border-[#00C9CE]' : 'border-gray-200'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#00C9CE]/10 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-[#00C9CE]" />
                  </div>
                  <div>
                    <h3 className="text-lg" style={{ color: '#000935', fontFamily: 'REM, sans-serif', fontWeight: 500 }}>
                      {solicitud.nombre}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(solicitud.fecha).toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select 
                    value={solicitud.estado} 
                    onValueChange={(value) => onActualizarSolicitud(solicitud.id, { estado: value, leido: true })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">{TEXTS.admin.solicitudes.status.pending}</SelectItem>
                      <SelectItem value="revisado">{TEXTS.admin.solicitudes.status.reviewed}</SelectItem>
                      <SelectItem value="aceptado">{TEXTS.admin.solicitudes.status.accepted}</SelectItem>
                      <SelectItem value="rechazado">{TEXTS.admin.solicitudes.status.rejected}</SelectItem>
                    </SelectContent>
                  </Select>
                  {!solicitud.leido && (
                    <Button
                      onClick={() => onActualizarSolicitud(solicitud.id, { leido: true })}
                      size="sm"
                      variant="outline"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{solicitud.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{solicitud.telefono}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{solicitud.direccion}</span>
                </div>
              </div>

              {(solicitud.caracteristicasVehiculo || solicitud.comentarios) && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {solicitud.caracteristicasVehiculo && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{TEXTS.admin.solicitudes.labels.vehicleFeatures}</p>
                      <p className="text-sm text-gray-700">{solicitud.caracteristicasVehiculo}</p>
                    </div>
                  )}
                  {solicitud.comentarios && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{TEXTS.admin.solicitudes.labels.comments}</p>
                      <p className="text-sm text-gray-700">{solicitud.comentarios}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import { Mail, Phone, User, Copy, Ban, CheckCircle, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner@2.0.3';
import { TEXTS } from '@/content/texts';

interface Mensajero {
  codigo: string;
  nombre: string;
  email: string;
  telefono: string;
  fechaRegistro: string;
  activo: boolean;
}

interface MensajerosViewProps {
  mensajeros: Mensajero[];
  loadingMensajeros: boolean;
  onActualizar: () => void;
  onToggleActivo: (codigo: string, activo: boolean) => void;
}

export function MensajerosView({ mensajeros, loadingMensajeros, onActualizar, onToggleActivo }: MensajerosViewProps) {
  const handleCopyCodigo = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    toast.success(TEXTS.admin.mensajeros.toasts.codeCopied);
  };

  const handleExportToCSV = () => {
    if (mensajeros.length === 0) {
      toast.error(TEXTS.admin.mensajeros.toasts.noDataToExport);
      return;
    }

    try {
      // Preparar datos CSV con punto y coma como separador (formato europeo/Excel)
      const headers = [
        TEXTS.admin.mensajeros.csv.headers.code,
        TEXTS.admin.mensajeros.csv.headers.name,
        TEXTS.admin.mensajeros.csv.headers.email,
        TEXTS.admin.mensajeros.csv.headers.phone,
        TEXTS.admin.mensajeros.csv.headers.registrationDate,
        TEXTS.admin.mensajeros.csv.headers.status
      ];
      const rows = mensajeros.map(m => [
        m.codigo,
        m.nombre,
        m.email,
        m.telefono,
        new Date(m.fechaRegistro).toLocaleDateString('es-ES'),
        m.activo ? TEXTS.admin.mensajeros.status.active : TEXTS.admin.mensajeros.status.blocked
      ]);

      // Crear contenido CSV
      const csvHeaderLine = headers.join(';');
      const csvDataLines = rows.map(row => row.map(cell => `"${cell}"`).join(';'));
      const csvContent = [csvHeaderLine, ...csvDataLines].join('\n');

      // Añadir BOM para que Excel reconozca UTF-8
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Crear enlace de descarga
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Nombre de archivo con fecha
      const fecha = new Date().toISOString().split('T')[0];
      link.download = `ONUS_Mensajeros_${fecha}.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`${mensajeros.length} ${TEXTS.admin.mensajeros.toasts.exportSuccess}`);
    } catch (error) {
      console.error('Error exportando CSV:', error);
      toast.error(TEXTS.admin.mensajeros.toasts.exportError);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-black flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#00C9CE]/20 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-[#00C9CE]" />
            </div>
            {TEXTS.admin.mensajeros.title}
          </h1>
          <p className="text-gray-600">
            {TEXTS.admin.mensajeros.summary.totalPrefix} {mensajeros.length} {TEXTS.admin.mensajeros.summary.couriersLabel}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleExportToCSV} 
            variant="outline"
            disabled={mensajeros.length === 0}
            className="border-[#00C9CE] text-[#00C9CE] hover:bg-[#00C9CE] hover:text-white transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            {TEXTS.admin.mensajeros.actions.exportCSV}
          </Button>
          <Button onClick={onActualizar} variant="outline" disabled={loadingMensajeros}>
            {loadingMensajeros ? TEXTS.admin.mensajeros.actions.loading : TEXTS.admin.mensajeros.actions.refresh}
          </Button>
        </div>
      </div>

      {loadingMensajeros ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <p className="text-gray-500">{TEXTS.admin.mensajeros.states.loadingTitle}</p>
        </div>
      ) : mensajeros.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-black text-xl mb-2">{TEXTS.admin.mensajeros.states.emptyTitle}</h3>
          <p className="text-gray-500">{TEXTS.admin.mensajeros.states.emptySubtitle}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {mensajeros.map((mensajero) => (
            <div key={mensajero.codigo} className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#00C9CE]/10 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-[#00C9CE]" />
                  </div>
                  <div>
                    <h3 className="text-lg" style={{ color: '#000935', fontFamily: 'REM, sans-serif', fontWeight: 500 }}>
                      {mensajero.nombre}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {TEXTS.admin.mensajeros.labels.code} <span className="font-mono text-[#00C9CE]">{mensajero.codigo}</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      {TEXTS.admin.mensajeros.labels.registered} {new Date(mensajero.fechaRegistro).toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs ${
                  mensajero.activo 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {mensajero.activo ? TEXTS.admin.mensajeros.status.active : TEXTS.admin.mensajeros.status.blocked}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{mensajero.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{mensajero.telefono}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => handleCopyCodigo(mensajero.codigo)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {TEXTS.admin.mensajeros.actions.copyCode}
                </Button>
                <Button
                  onClick={() => onToggleActivo(mensajero.codigo, !mensajero.activo)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  style={{
                    borderColor: mensajero.activo ? '#ef4444' : '#10b981',
                    color: mensajero.activo ? '#ef4444' : '#10b981'
                  }}
                >
                  {mensajero.activo ? (
                    <>
                      <Ban className="w-4 h-4 mr-2" />
                      {TEXTS.admin.mensajeros.actions.blockAccess}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {TEXTS.admin.mensajeros.actions.activateAccess}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
